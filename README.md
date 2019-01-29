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

Where `{item}` refers to a custom slot containing several entities and possible synonyms. For instance:

```
item:
  'en-US':
    - snow golem:
      - ice golem
      - spice golem
      - rice golem
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

defines `snow golem` with the three synonyms

```
ice golem
spice golem
rice golem
```

## Usage as CLI

`npx alexa-language-model-generator -i invocation.yml -l "en-US" -n intents.yml -t types.yml -m models`

You can also install the tool globally and invoke it without npx:
`npm i -g alexa-language-model-generator`

### Options

#### Invocation File Path

`-i, --invocation [path]`

Invocation name file path (default invocation.yml)

#### Locale

`-l, --locales [locales]`
Specific Locales separated by comma (default all)

currently all equals: de-DE,en-AU,en-CA,en-GB,en-IN,en-US,es-ES,es-MX,fr-FR,ja-JP

#### Intent File Path

`-n, --intents [path]`

Intent file path where all intents are defined (default intents.yml)

#### Types File Path

`-t, --types [path]`
Intent file path where all types are defined (default types.yml),

#### Models Path

`-m, --models [path]`
Path to the folder where model JSON files should be stored (default model)
