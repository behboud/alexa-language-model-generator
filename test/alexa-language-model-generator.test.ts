import { buildModelForLocale } from '../src/build-model'
import * as yaml from 'js-yaml'
import { readFileSync } from 'fs'
import { resolve } from 'path'

let intentsJson = {}
let typesJson = {}
let usModel = {}
describe('Build Model', () => {
  beforeAll(() => {
    intentsJson = yaml.safeLoad(readFileSync('intents.yaml', 'utf8'))
    typesJson = yaml.safeLoad(readFileSync('types.yaml', 'utf8'))
    usModel = JSON.parse(readFileSync(resolve('models', 'en-US.json'), 'utf8'))
  })
  it('builds valid US model', () => {
    const im = buildModelForLocale('mine helper', 'en-US', intentsJson, typesJson)
    expect(usModel).toEqual(im)
  })
})
