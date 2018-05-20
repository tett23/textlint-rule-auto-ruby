// @flow

export type RuleTypes = 'all_types' | 'file' | 'paragraph' | 'first' | 'off'
export type ConvertTypes = 'simple' | 'complex'
export type ConvertTypesType = {
  [string]: string
}

export type GlobalType = {
  rule: RuleTypes,
  fubyFormat: ConvertTypes,
}

export type ConvertFormats= {
  [string]: string
}

export type RuleItem = {|
  text: string,
  ruby: string,
  rule: ?RuleTypes,
  convert: ?ConvertTypes
|}

export type RuleType = RuleItem[]

export type Config = {|
  global: GlobalType,
  convertFormats: ConvertFormats,
  rules: RuleType[],
|}
