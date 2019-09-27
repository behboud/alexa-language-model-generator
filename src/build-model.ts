import { readFileSync } from 'fs'
import * as peg from 'pegjs'
import { resolve } from 'path'
import { constantCase } from 'change-case'
import {
  Locale,
  SmapiInteractionModel,
  IIntentAndTypeGrammar,
  SmapiLanguageModelIntent,
  SmapiSlotTypes,
  InvocationName,
  IDialog,
  SmapiModelPrompt,
  SmapiModelPromptVariation,
  SmapiDialog,
  SmapiDialogIntents,
  IDialogEntry,
  SmapiDialogSlotsPromptType,
  SmapiDialogSlots
} from './index.d'
import { sha1 } from 'object-hash'

export const languageModelParser = (): peg.Parser => {
  try {
    const absolutePath = resolve(__dirname, 'languagemodel.pegjs')
    return peg.generate(readFileSync(absolutePath, 'utf8'))
  } catch (error) {
    throw new Error(error.message)
  }
}

Object.defineProperty(Array.prototype, 'flat', {
  value: function(depth: number = 1) {
    return this.reduce(function(flat: any, toFlatten: any) {
      return flat.concat(
        Array.isArray(toFlatten) && depth - 1 ? toFlatten.flat(depth - 1) : toFlatten
      )
    }, [])
  }
})

const isString = (str: string | object) => typeof str === 'string' || str instanceof String

export const buildModelForLocale = (
  invocations: InvocationName,
  locale: Locale,
  intentsFromGrammar: IIntentAndTypeGrammar,
  typesFromGrammar: IIntentAndTypeGrammar
): SmapiInteractionModel => {
  const { intents, prompts, dialog } = buildSampleUtterances(
    intentsFromGrammar,
    locale,
    typesFromGrammar
  )
  if (intents.length === 0) {
    throw new Error(`No intents defined for locale ${locale}`)
  }
  const customTypes = buildCustomTypes(typesFromGrammar, locale)
  if (invocations[locale] === undefined) {
    throw new Error('No invocation name defined for locale ' + locale)
  }
  const interactionModel: SmapiInteractionModel = {
    interactionModel: {
      languageModel: {
        invocationName: invocations[locale],
        intents: [...intents],
        types: [...customTypes]
      }
    }
  }
  if (prompts && dialog && prompts.length > 0) {
    interactionModel.interactionModel['prompts'] = prompts
  }
  if (dialog && dialog.intents.length > 0) {
    interactionModel.interactionModel['dialog'] = dialog
  }
  return interactionModel
}

function buildSampleUtterances(
  intentFromGrammar: IIntentAndTypeGrammar,
  locale: Locale,
  typesFromGrammar: IIntentAndTypeGrammar
): { intents: SmapiLanguageModelIntent[]; prompts?: SmapiModelPrompt[]; dialog?: SmapiDialog } {
  const prompts: SmapiModelPrompt[] = []
  const dialog: SmapiDialog = { intents: [], delegationStrategy: 'ALWAYS' }
  const intents = Object.keys(intentFromGrammar).map(intentName => {
    const intent: SmapiLanguageModelIntent = {
      name: intentName,
      samples: [],
      slots: []
    }
    if (!intentFromGrammar[intentName] || !intentFromGrammar[intentName][locale]) {
      // AMAZON built-ins do not require sample utterances
      if (intentName.startsWith('AMAZON')) {
        return intent
      }
      throw new Error(`No utterances defined for ${locale} inside intent ${intentName}`)
    }

    const utteranceArray = intentFromGrammar[intentName][locale]
    return utteranceArray
      .map(sampleUtteranceRaw => {
        if (typeof sampleUtteranceRaw === 'string') {
          return parseAndBuildSampleUtterancesFromGrammar(sampleUtteranceRaw, typesFromGrammar)
        } else {
          // this contains dialog
          // extract it from the object key
          const text = Object.keys(sampleUtteranceRaw)[0]
          const samplesForDialogs = parseAndBuildSampleUtterancesFromGrammar(text, typesFromGrammar)
          // any dialog features used?
          const filterDialogFeature = (x: object) =>
            Object.entries(x).filter(d => d[0].startsWith('+'))

          // dialog features can be set at intent level for all locales or per language level
          const dialogFeatures = filterDialogFeature(intentFromGrammar[intentName])

          // delegation strategy
          const delegate = dialogFeatures.find(s => s[0].includes('delegat'))
          if (delegate && delegate.length > 0) {
            dialog.delegationStrategy = ['yes', true].includes(delegate.pop())
              ? 'ALWAYS'
              : 'SKILL_RESPONSE'
          }

          const confirmationRequired = dialogFeatures.find(s => s[0].includes('confirm'))
          if (confirmationRequired) {
            const rawPrompts: string[] = confirmationRequired.pop()
            const variationsFromConfirmation = extractVariationsFromPrompts(
              rawPrompts,
              typesFromGrammar
            )
            // add prompts to the interaction model part of prompts
            const confirmationPrompt: SmapiModelPrompt = {
              id: `Confirm.Intent.${sha1(intentName)}`,
              variations: variationsFromConfirmation
            }
            prompts.push(confirmationPrompt)
          }
          // build dialog delegation
          const dialogIntent: SmapiDialogIntents = {
            name: intentName,
            confirmationRequired: confirmationRequired !== undefined,
            prompts: confirmationRequired
              ? {
                  confirmation: `Confirm.Intent.${sha1(intentName)}`
                }
              : {},
            slots: []
          }
          dialog.intents.push(dialogIntent)
          // build samples for slots that have dialog delegates
          Object.keys(sampleUtteranceRaw)
            .filter(slotName => sampleUtteranceRaw[slotName] !== null)
            .forEach(slotName => {
              const slotObject = sampleUtteranceRaw[slotName]
              if (slotObject && slotObject.samples) {
                slotObject.samples.forEach(sample => {
                  const slotSamples = parseAndBuildSampleUtterancesFromGrammar(
                    sample,
                    typesFromGrammar
                  )
                  const matchingSlot = samplesForDialogs.slots!.find(slot => slot.name === slotName)

                  if (
                    matchingSlot &&
                    slotSamples &&
                    slotSamples.slots &&
                    slotSamples.slots.length > 0 &&
                    samplesForDialogs &&
                    samplesForDialogs.slots &&
                    samplesForDialogs.slots.length > 0
                  ) {
                    // replace the exmpty slot samples array with the one we built
                    samplesForDialogs.slots[
                      samplesForDialogs.slots.findIndex(slot => slot.name === matchingSlot.name)
                    ].samples = slotSamples.samples
                  }
                })
                const slotPrompts: SmapiDialogSlotsPromptType = {}
                const promptVariations = extractVariations(slotObject.prompts, typesFromGrammar)
                if (slotObject.confirm) {
                  const confirmVariations = extractVariations(slotObject.confirm, typesFromGrammar)
                  prompts.push({
                    id: `Confirm.Slot.${sha1(slotName)}`,
                    variations: confirmVariations
                  })
                  slotPrompts['confirmation'] = `Confirm.Slot.${sha1(slotName)}`
                }
                prompts.push({
                  id: `Elicit.Slot.${sha1(slotName)}`,
                  variations: promptVariations
                })
                slotPrompts['elicitation'] = `Elicit.Slot.${sha1(slotName)}`
                if (!samplesForDialogs.slots!.find(slot => slot.name === slotName)) {
                  console.error('Unable to match slot name: ' + slotName)
                }
                dialogIntent.slots!.push({
                  name: slotName,
                  type: samplesForDialogs.slots!.find(slot => slot.name === slotName)!.type,
                  confirmationRequired: !!slotObject.confirm,
                  elicitationRequired: slotObject.prompts.length > 0,
                  prompts: slotPrompts
                })
              }
            })
          // add rest of dialog slots
          const restOfDialogIntentSlots = samplesForDialogs
            .slots!.filter(slot => !Object.keys(sampleUtteranceRaw).includes(slot.name))
            .forEach(slot => {
              dialogIntent.slots!.push({
                name: slot.name,
                type: slot.type,
                confirmationRequired: false,
                elicitationRequired: false,
                prompts: {}
              })
            })
          return samplesForDialogs
        }
      })
      .reduce(
        (aggr: SmapiLanguageModelIntent, { samples, slots }) => {
          samples = (samples || []).concat(aggr.samples || [])
          return (aggr = {
            ...aggr,
            samples: [...samples],
            slots: aggr.slots!.concat(slots!.filter(x => !aggr.slots!.some(y => y.name === x.name)))
          })
        },
        { name: intentName, samples: [], slots: [] }
      )
  })

  return { intents, prompts, dialog }
}

function extractVariations(rawVariations: string[], typesFromGrammar: IIntentAndTypeGrammar) {
  return rawVariations.reduce(
    (aggr, prompt) => {
      const promptSamples = parseAndBuildSampleUtterancesFromGrammar(prompt, typesFromGrammar)
      return aggr.concat(
        promptSamples!.samples!.map(variation => {
          return { type: 'PlainText', value: variation }
        })
      )
    },
    [] as any
  )
}

function extractVariationsFromPrompts(
  rawPrompts: string[],
  typesFromGrammar: IIntentAndTypeGrammar
): SmapiModelPromptVariation[] {
  const arrayOfPrompts = rawPrompts
    .map(samplePromptRaw => {
      const sampleUtt = parseAndBuildSampleUtterancesFromGrammar(samplePromptRaw, typesFromGrammar)
        .samples
      if (sampleUtt && sampleUtt.length > 0) {
        return sampleUtt.map(s => {
          return {
            type: 'PlainText',
            value: s
          }
        })
      }
    })
    .flat()

  if (!arrayOfPrompts) {
    throw new Error(
      `The dialog definition containts prompts definition but no valid prompts for ${rawPrompts}`
    )
  }

  return arrayOfPrompts
}

function extractSlotVariables(utterance: string): string[] {
  // regex to find slots in the sample utterance
  const re = /\{[^}]*?\}/g
  if (utterance.length > 0) {
    const matchedSlots = utterance.match(re)
    // we have slots in the sample utterance
    if (matchedSlots) {
      // filter empty entries (pegjs grammar thing)
      return matchedSlots.filter(Boolean).map(slt => slt.substring(1, slt.length - 1))
    }
  }
  return []
}

function parseAndBuildSampleUtterancesFromGrammar(
  sampleUtteranceRaw: string,
  types: IIntentAndTypeGrammar | null = null
): SmapiLanguageModelIntent {
  const intent: SmapiLanguageModelIntent = {
    name: 'intentName',
    samples: [],
    slots: []
  }
  if (sampleUtteranceRaw.startsWith('+')) {
    // dialog feature only
    return intent
  }
  let lp = languageModelParser().parse(sampleUtteranceRaw)
  if (isString(lp)) {
    // not an Array just text, so push it to the list
    if (intent.samples) {
      intent.samples.push(sampleUtteranceRaw)
    }
  }
  if (lp instanceof Array) {
    if (!Array.isArray(lp[0])) {
      lp = [lp]
    }
    // array of all possible sample utterances per pegjs
    lp.forEach((sampleArrayOfArray: Array<string>) => {
      const sampleUtterance = sampleArrayOfArray
        .reduce((prev: string, curr: string): string => {
          const matchedSlots = extractSlotVariables(curr)
          matchedSlots.forEach((typeVar: string) => {
            let slot = {
              name: typeVar.toLowerCase(),
              type: typeVar.toUpperCase() + '_TYPE',
              samples: []
            }
            if (types && isString(types[typeVar])) {
              const name = types[typeVar] as any
              slot = {
                name: typeVar.toLowerCase(),
                type: name,
                samples: []
              }
            }
            if (
              intent.slots &&
              intent.slots.filter(sltSlot => sltSlot.name === slot.name).length === 0
            ) {
              intent.slots.push(slot)
            }
          })

          if (curr === ' ') {
            return prev.trimLeft() + curr.trimRight()
          }
          return prev.trimLeft() + curr.trimRight() + ' '
        }, '')
        .trim()
      if (intent.samples) {
        intent.samples.push(sampleUtterance)
      } else {
        intent.samples = [sampleUtterance]
      }
    })
  }
  return intent
}

function buildCustomTypes(types: IIntentAndTypeGrammar, locale: string) {
  let customTypes: any = []
  if (types) {
    customTypes = Object.keys(types)
      .map(typeName => {
        if (typeof types[typeName] === 'string' || types[typeName] instanceof String) {
          return
        }
        const slotType: SmapiSlotTypes = {
          name: typeName.toUpperCase() + '_TYPE',
          values: []
        }
        let typeValues: any = types[typeName]
        if (Object.keys(typeValues).filter(typeValue => typeValue === locale).length > 0) {
          typeValues = typeValues[locale]
        }
        typeValues.map((valueName: string | { [key: string]: string }) => {
          let synonyms: string[] = []
          let vName = ''
          let id = ''
          if (valueName && typeof valueName === 'object') {
            vName = Object.keys(valueName)[0]
            const values = valueName.synonyms || valueName.synonym || Object.values(valueName)
            id = valueName.id || constantCase(vName)
            synonyms = synonyms.concat(...values)
          } else {
            vName = valueName
            id = constantCase(vName)
          }
          slotType.values.push({
            id,
            name: {
              value: vName,
              synonyms
            }
          })
        })
        return slotType
      })
      .filter(s => s !== undefined)
  }
  return customTypes
}
