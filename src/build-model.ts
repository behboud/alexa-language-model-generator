import { readFileSync } from 'fs'
import * as peg from 'pegjs'
import { resolve } from 'path'
import {
  Locale,
  SmapiInteractionModel,
  IIntentAndTypeGrammar,
  SmapiLanguageModelIntent,
  SmapiSlotTypes
} from './index.d'

export const languageModelParser = (): peg.Parser => {
  try {
    const absolutePath = resolve(__dirname, 'languagemodel.pegjs')
    return peg.generate(readFileSync(absolutePath, 'utf8'))
  } catch (error) {
    throw new Error(error.message)
  }
}

export const buildModelForLocale = (
  invocationName: string,
  locale: Locale,
  intents: IIntentAndTypeGrammar,
  types: IIntentAndTypeGrammar
): SmapiInteractionModel => {
  const customIntents = Object.keys(intents).map(intentName => {
    let textArray: string[] = []
    const intent: SmapiLanguageModelIntent = {
      name: intentName,
      samples: [],
      slots: []
    }
    if (intents[intentName] && intents[intentName][locale]) {
      textArray = intents[intentName][locale]
    }
    textArray.map(text => {
      const lp = languageModelParser().parse(text)
      if (lp instanceof Array) {
        lp.map((sampleArrayOfArray: Array<string>) => {
          const sampleUtterance = sampleArrayOfArray
            .reduce((prev: string, curr: string): string => {
              const re = /\{[^}]*?\}/g
              if (curr) {
                const matchedSlots = curr.match(re)
                if (matchedSlots) {
                  matchedSlots.filter(Boolean).forEach((slt: string) => {
                    const typeVar = slt.substring(1, slt.length - 1)
                    let slot = {
                      name: typeVar.toLowerCase(),
                      type: typeVar.toUpperCase() + '_TYPE',
                      samples: []
                    }
                    console.log(slot)
                    if (
                      types &&
                      (typeof types[typeVar] === 'string' || types[typeVar] instanceof String)
                    ) {
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
                    slt = slt.toLowerCase()
                  })
                }
              }
              if (curr === ' ') return prev.trimLeft() + curr.trimRight()

              return prev.trimLeft() + curr.trimRight() + ' '
            }, '')
            .trim()
          if (intent.samples) {
            intent.samples.push(sampleUtterance)
          }
        })
      } else {
        if (intent.samples) {
          intent.samples.push(text)
        }
      }
    })
    return intent
  })
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

        typeValues.map((valueName: string) => {
          let synonyms = []
          if (Array.isArray(typeValues[valueName])) {
            synonyms = [...typeValues[valueName]]
          }
          slotType.values.push({
            id: valueName
              .replace(/\s/g, '')
              .replace(/[^\x00-\x7F]/g, '')
              .toUpperCase(),
            name: {
              value: valueName,
              synonyms
            }
          })
        })
        return slotType
      })
      .filter(s => s !== undefined)
  }
  const interactionModel: SmapiInteractionModel = {
    interactionModel: {
      languageModel: {
        invocationName,
        intents: [...customIntents],
        types: [...customTypes]
      }
    }
  }
  return interactionModel
}
