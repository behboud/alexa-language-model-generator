import { buildModelForLocale } from '../src/build-model'
import * as yaml from 'js-yaml'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Build Model', () => {
  it('builds valid US model', () => {
    const intentsJson = yaml.safeLoad(readFileSync('models/intents.yml', 'utf8'))
    const typesJson = yaml.safeLoad(readFileSync('models/types.yml', 'utf8'))
    const invocationJson = yaml.safeLoad(readFileSync('models/invocation.yml', 'utf8'))
    const usModel = JSON.parse(readFileSync(resolve('models', 'en-US.json'), 'utf8'))
    const im = buildModelForLocale(invocationJson, 'en-US', intentsJson, typesJson)
    expect(im).toEqual(usModel)
  })
})
