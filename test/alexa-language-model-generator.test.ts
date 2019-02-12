import { buildModelForLocale } from '../src/build-model'
import * as yaml from 'js-yaml'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { SmapiInteractionModel } from '../src'

export function o<T>(someObject: T, defaultValue: T = {} as T): T {
  if (typeof someObject === 'undefined' || someObject === null) return defaultValue
  else return someObject
}

describe('Build Model', () => {
  it('builds valid US model', () => {
    const intentsJson = yaml.safeLoad(readFileSync('models/intents.yml', 'utf8'))
    const typesJson = yaml.safeLoad(readFileSync('models/types.yml', 'utf8'))
    const invocationJson = yaml.safeLoad(readFileSync('models/invocation.yml', 'utf8'))
    const usModel = JSON.parse(readFileSync(resolve('models', 'en-US.json'), 'utf8'))
    const im = buildModelForLocale(invocationJson, 'en-US', intentsJson, typesJson)
    expect(im).toEqual(usModel)
  })
  it('number of Slots and samples are correct', () => {
    const intentsJson = yaml.safeLoad(readFileSync('models/intents.yml', 'utf8'))
    const typesJson = yaml.safeLoad(readFileSync('models/types.yml', 'utf8'))
    const invocationJson = yaml.safeLoad(readFileSync('models/invocation.yml', 'utf8'))
    const usModel: SmapiInteractionModel = JSON.parse(
      readFileSync(resolve('models', 'en-US.json'), 'utf8')
    )
    const im = buildModelForLocale(invocationJson, 'en-US', intentsJson, typesJson)
    expect(
      o(o(o(o(im).interactionModel).languageModel).intents).every(intent => {
        const currentIntent = o(o(o(usModel).interactionModel).languageModel).intents.find(
          usModelIntent => usModelIntent.name === intent.name
        )
        if (currentIntent && currentIntent.samples && intent.samples) {
          const currentIntentLength = currentIntent.samples.length
          const originalIntetnLength = intent.samples.length
          return currentIntentLength === originalIntetnLength
        }
        return false
      })
    ).toEqual(true)
  })
})
