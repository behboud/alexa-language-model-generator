export interface IDialog {
  [key: string]: IDialogEntry | null
}

export interface IDialogEntry {
  prompts: string[]
  samples: string[]
  confirm?: string[]
}

export type Dialog = IDialog | string

export type DelegateFeature = 'autodelegate' | 'confirm' | 'elicit'

export interface IIntentAndTypeGrammar {
  [name: string]: { [key in Locale | DelegateFeature]: Dialog[] }
}

export type InvocationName = { [key in Locale]: string }

export interface IServerlessInstance {
  cli: {
    log(str: string): void
  }
  config: {
    servicePath: string
  }
  service: {
    provider: {
      name: string
      stage: string
      region: string
      runtime: string
    }
    functions: { [key: string]: IServerlessFunction }
    package: IServerlessPackage
    getFunction: (functionName: string) => string
    getAllFunctions: () => string[]
    custom: any
  }
  pluginManager: IPluginManager
  getProvider(provider: 'aws'): any
  version: string
}

export interface IServerlessOptions {
  function?: string
  watch?: boolean
  extraServicePath?: string
  [k: string]: any
}

export interface IServerlessFunction {
  handler: string
  package: IServerlessPackage
  name: string
}

export interface IServerlessPackage {
  include: string[]
  exclude: string[]
  artifact?: string
  individually?: boolean
}

export interface IPluginManager {
  spawn(command: string): Promise<void>
}

export interface IToken {
  access_token: string
  expires_at: Date
  expires_in: number
  refresh_token: string
  token_type: 'bearer'
}
export interface _links {
  next?: {
    href: string
  }
  self: {
    href: string
  }
}
export type Locale =
  | 'de-DE'
  | 'en-AU'
  | 'en-CA'
  | 'en-GB'
  | 'en-IN'
  | 'en-US'
  | 'fr-FR'
  | 'ja-JP'
  | 'es-ES'
  | 'es-MX'
  | 'fr-FR'
  | 'it-IT'

export type Countries =
  | 'DE'
  | 'AU'
  | 'CA'
  | 'GB'
  | 'IN'
  | 'US'
  | 'FR'
  | 'JP'
  | 'ES'
  | 'MX'
  | 'FR'
  | 'IT'
export type Stages = 'development' | 'certification' | 'live'
export type publicationStatus = 'DEVELOPMENT' | 'CERTIFICATION' | 'LIVE'
export type SmapiCustomSkillCategory = 'HEALTH_AND_FITNESS'
export type apis = Array<'custom' | 'householdList'>

export interface SmapiListOfSkills {
  _links: _links
  isTruncated: boolean
  nextToken?: string
  skills: Array<SmapiSkill>
}

type UnionKeyToValue<U extends string> = { [K in U]: string }

export interface SmapiSkill {
  lastUpdated: Date
  nameByLocale: UnionKeyToValue<Locale>
  stage: Stages
  apis: apis
  publicationStatus: publicationStatus
  _links: _links
  skillId: string
}
export interface SmapiSlot {
  name: string
  type: string
  samples?: Array<string>
}

declare interface SmapiSlotTypeValue {
  id: string
  name: { value: string; synonyms: Array<string> }
}

export interface SmapiSlotTypes {
  name: string
  values: Array<SmapiSlotTypeValue>
}

export interface SmapiSkillStatusCheck {
  manifest: {
    eTag: string
    lastUpdateRequest: { status: 'SUCCEEDED' | 'FAILED' }
  }
}

declare enum AMAZON {
  CancelIntent = 'AMAZON.CancelIntent',
  HelpIntent = 'AMAZON.HelpIntent',
  StopIntent = 'AMAZON.StopIntent',
  FallbackIntent = 'AMAZON.FallbackIntent'
}

export interface SmapiLanguageModelIntent {
  name: AMAZON | string
  samples?: Array<string>
  slots?: Array<SmapiSlot>
}

export interface SmapiLanguageModel {
  invocationName: string
  intents: Array<SmapiLanguageModelIntent>
  types?: Array<SmapiSlotTypes>
}

export interface SmapiDialogSlots {
  name: string
  type: string
  confirmationRequired?: boolean
  elicitationRequired?: boolean
  prompts?: SmapiDialogSlotsPromptType
}

export interface SmapiDialogSlotsPromptType {
  ['elicitation']?: string
  ['confirmation']?: string
}

export interface SmapiDialogIntents {
  name: string
  confirmationRequired?: boolean
  prompts?: SmapiDialogIntentsPromptType
  slots?: Array<SmapiDialogSlots>
  delegationStrategy?: 'ALWAYS' | 'SKILL_RESPONSE'
}

export interface SmapiDialogIntentsPromptType {
  ['confirmation']?: string
}

export interface SmapiDialog {
  intents: Array<SmapiDialogIntents>
  delegationStrategy: 'ALWAYS' | 'SKILL_RESPONSE'
}

export interface SmapiModelPromptVariation {
  type: 'PlainText'
  value: string
}

export interface SmapiModelPrompt {
  id: string
  variations: Array<SmapiModelPromptVariation>
}

export interface SmapiInteractionModel {
  interactionModel: {
    languageModel: SmapiLanguageModel
    dialog?: SmapiDialog
    prompts?: Array<SmapiModelPrompt>
  }
}

export interface SmapiCustomSkillInterface {
  type:
    | 'AUDIO_PLAYER'
    | 'CAN_FULFILL_INTENT_REQUEST'
    | 'GADGET_CONTROLLER'
    | 'GAME_ENGINE'
    | 'RENDER_TEMPLATE'
    | 'VIDEO_APP'
}

export interface SmapiCustomSkillPermission {
  name:
    | 'alexa::devices:all:address:full:read'
    | 'alexa:devices:all:address:country_and_postal_code:read'
    | 'alexa::household:lists:read'
    | 'alexa::household:lists:write'
}

export type Endpoint = 'NA' | 'EU' | 'FE'

export interface SmapiCustomSkillEventSubscription {
  eventName:
    | 'SKILL_ENABLED'
    | 'SKILL_DISABLED'
    | 'SKILL_PERMISSION_ACCEPTED'
    | 'SKILL_PERMISSION_CHANGED'
    | 'SKILL_ACCOUNT_LINKED'
}
export interface SmapiCustomSkillRegion {
  endpoint: {
    sslCertificateType: 'Trusted'
    uri: string
  }
}

export interface SmapiCustomSkillManifest {
  manifest: {
    publishingInformation: {
      locales: {
        [key in Locale]: {
          summary: string
          examplePhrases: Array<string>
          keywords: Array<string>
          smallIconUri: string
          largeIconUri: string
          name: string
          description: string
        }
      }
      isAvailableWorldwide: boolean
      testingInstructions: string
      category: SmapiCustomSkillCategory
      distributionCountries: Array<Countries>
    }
    apis: {
      custom: {
        endpoint: {
          uri: string
        }
        interfaces: Array<SmapiCustomSkillInterface>
        regions: { [key in Endpoint]: SmapiCustomSkillRegion }
      }
    }
    manifestVersion: '1.0'
    permissions: Array<SmapiCustomSkillPermission>
    privacyAndCompliance: {
      allowsPurchases: boolean
      usesPersonalInfo: boolean
      isChildDirected: boolean
      isExportCompliant: boolean
      containsAds: boolean
      locales: {
        [key in Locale]: {
          privacyPolicyUrl: string
          termsOfUseUrl: string
        }
      }
    }
    events: {
      endpoint: {
        uri: string
      }
      subscriptions: Array<SmapiCustomSkillEventSubscription>
      regions: {
        [key in Endpoint]: {
          endpoint: {
            uri: string
          }
        }
      }
    }
  }
}
