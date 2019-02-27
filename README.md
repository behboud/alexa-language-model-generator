# Overview

Use a simple syntax to quickly define the interaction model of your alexa skill.

For example

`(recipe|receipes) for (|a|an) {item}`

will expand to:

```
recipe for {item}
receipes for {item}
recipe for a {item}
receipes for a {item}
recipe for an {item}
receipes for an {item}
```

Where `{item}` refers to a custom slot containing several entities. For instance:

```
item:
  'en-US':
    - snow golem:
    - pillar quartz block
    - firework rocket
  'en-GB':
    - snow golem
    - pillar quartz block
    - firework rocket
  'de-DE':
    - Schneegolem
    - Quarzsäule
    - Feuerwerksrakete
```

## Intent File

Your intent file includes all the intents and the sample utterances like the following:

```
RecipeIntent:
  'en-US':
    - how (can|do) (I|you) (build|craft|get|make) (|a|an) {item}
    - how is (|a|an) {item} (built|crafted|made)
    - (recipe|receipes) for (|a|an) {item}
```

In this case only locale en-US is defined.

### Dialogs

Adding dialog features requires the following syntax:

- End any of the sample utterance where you would like to have slot elicitation or delegation with a colon `:`
- Add the slot name
- Add keys
  - _prompts_ for all prompts that are coming from Alexa to ask the customer
  - _samples_ for all samples the customer might say
  - _confirm_ if you want to confirm the slot and the sample for that

You can also specify auto delegation behavior and confirmation per intent.

For instance:

```
NavigateIntent:
  +autodelegate: true
  +confirm:
    - sure (|that you want to proceed)?
    - please confirm
  'en-US':
    - (Navigate|directions|drive me|take me) to ({cityus} {yesnostreet}|{street} {cityus}|{street}):
      street:
        prompts:
          - Which street?
        samples:
          - (|to) {street}
        confirm:
          - I heared {cityus}. Is that correct?
    - get me to {street}
```

## Types File

Provide the name of the slot as described in the intent file and list all entries or built-in slot values.

```
cityus: AMAZON.US_CITY
```

### Synonyms

```
item:
  'en-US':
    - snow golem:
      - ice golem
      - spice golem
      - rice golem
    - pillar quartz block
    - firework rocket
```

defines `snow golem` with the three synonyms

```
ice golem
spice golem
rice golem
```

id of the synonym is set to [constant case](https://github.com/blakeembrey/constant-case) of the value name. So in the above case it is `SNOW_GOLEM`.

It is also possible to define your own id by changing the above definition to

```
item:
  'en-US':
    - snow golem:
      id: GOLEM
      synonyms:
        - ice golem
        - spice golem
        - rice golem
    - pillar quartz block
    - firework rocket
```

Now the id is explicitly set to `GOLEM`.

## Slot ID's

Slot id is generated as constant case using [change case](https://www.npmjs.com/package/change-case#constantcase).

## Usage as CLI

`npx alexa-language-model-generator -i invocation.yml -l "en-US" -n intents.yml -t types.yml -m models`

You can also install the tool globally and invoke it without npx:
`npm i -g alexa-language-model-generator`

### Options

#### Invocation File Path

`-i, --invocation [path]`

Invocation name file path (default models/invocation.yml)

#### Locale

`-l, --locales [locales]`
Specific Locales separated by comma (default all)

currently all equals: de-DE,en-AU,en-CA,en-GB,en-IN,en-US,es-ES,es-MX,fr-FR,ja-JP

#### Intent File Path

`-n, --intents [path]`

Intent file path where all intents are defined (default models/intents.yml)

#### Types File Path

`-t, --types [path]`
Intent file path where all types are defined (default models/types.yml),

#### Models Path

`-m, --models [path]`
Path to the folder where model JSON files should be stored (default models)
