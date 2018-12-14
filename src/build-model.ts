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
              if (curr && curr.substring(0, 1) === '{' && curr.substring(curr.length - 1) === '}') {
                const slot = {
                  name: curr.substring(1, curr.length - 1).toLowerCase(),
                  type: curr.substring(1, curr.length - 1).toUpperCase() + '_TYPE',
                  samples: []
                }
                if (
                  intent.slots &&
                  intent.slots.filter(currSlot => currSlot.name === slot.name).length === 0
                ) {
                  intent.slots.push(slot)
                }
                curr = curr.toLowerCase()
              }
              if (curr === ' ') return prev.trimLeft() + curr.trimRight()

              return prev.trimLeft() + curr.trimRight() + ' '
            }, '')
            .trimRight()
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
    customTypes = Object.keys(types).map(typeName => {
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
