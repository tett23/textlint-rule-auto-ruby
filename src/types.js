// @flow

export type RuleTypes = 'all_types' | 'file' | 'paragraph' | 'first' | 'off';
export type FormatTypesType = {
  [string]: string,
};

export type GlobalType = {
  message: string,
  rule: RuleTypes,
  format: string,
};

export type Formats = {
  [string]: string,
};

export type RuleItem = {
  text: string,
  ruby: string,
  rule: ?RuleTypes,
  format: ?string,
};

export type Config = {
  global: GlobalType,
  formats: Formats,
  rules: RuleItem[],
};
