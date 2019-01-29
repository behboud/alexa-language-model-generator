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
