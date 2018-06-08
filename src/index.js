// @flow

import fs from 'fs';
import yaml from 'js-yaml';
import type { Config, RuleItem, RuleTypes } from './types';

let config: Config = yaml.safeLoad(fs.readFileSync(`${__dirname}/../config/rules.yml`, 'utf8'));

// eslint-disable-next-line flowtype/no-weak-types
function reporter(context: any, options: any = {}) {
  config = Object.assign({}, config, options);
  const baseRule: { rule: ?RuleTypes, format: ?string } = {
    rule: config.global.rule,
    format: config.global.format,
  };
  const rules = config.rules.map((rule) => {
    return Object.assign({}, baseRule, rule);
  });

  const { Syntax, report, getSource } = context;

  return {
    [Syntax.Document](node) {
      const text = getSource(node);

      applyChanges(text, changes(text, rules), context).forEach((ruleError) => {
        report(node, ruleError);
      });
    },
  };
}

type Change = {|
  index: number,
  actual: string,
  expected: string,
|};

function changes(text: string, rules: RuleItem[]): Change[] {
  const ret = rules.reduce((r, rule) => {
    matchAll(text, rule).forEach((item) => {
      r.push(item);
    });

    return r;
  }, []);

  return ret.sort((a, b) => {
    return a.index - b.index;
  });
}

// eslint-disable-next-line flowtype/no-weak-types
type RuleError = any;

// eslint-disable-next-line flowtype/no-weak-types
function applyChanges(text: string, changeItems: Change[], context: any): RuleError[] {
  // eslint-disable-next-line no-shadow
  const { RuleError, fixer } = context;

  const ret = changeItems
    .map(({ index, actual, expected }) => {
      if (actual === expected) {
        return null;
      }

      const replaceTo = fixer.replaceTextRange([index, index + actual.length], expected);

      const message = `auto-ruby: \`${actual}\` => \`${expected}\``;

      return new RuleError(message, {
        index,
        fix: replaceTo,
      });
    })
    .filter(Boolean);

  return ret;
}

function matchAll(text: string, rule: RuleItem): Change[] {
  switch (rule.rule) {
    case 'first':
      return ruleFirst(text, rule);
    case 'all':
      return ruleAll(text, rule);
    case 'off':
      return [];
    default:
      throw new Error(`Unexpected rule type '${rule.rule || ''}'`);
  }
}

function ruleFirst(text: string, rule: RuleItem): Change[] {
  const matchIndices = [];
  const fix = fixString(rule);
  const re = new RegExp(escapeRegExp(fix), 'g');
  let match;
  while ((match = re.exec(text))) {
    matchIndices.push(match.index);
  }

  const ret = matchIndices.map((index) => {
    return {
      index,
      actual: fix,
      expected: rule.text,
    };
  });

  match = rubyRegExp(rule).exec(text);
  if (match) {
    ret.push({
      index: match.index,
      actual: rule.text,
      expected: fix,
    });
  }

  return ret;
}

function ruleAll(text: string, rule: RuleItem): Change[] {
  const re = rubyRegExp(rule);
  const matchIndices = [];
  let match;
  while ((match = re.exec(text))) {
    matchIndices.push(match.index);
  }

  const fix = fixString(rule);
  return matchIndices.map((index) => {
    return {
      index,
      actual: rule.text,
      expected: fix,
    };
  });
}

function fixString(rule: RuleItem): string {
  const format: ?string = config.formats[rule.format || 'default'];
  if (format == null) {
    throw new Error('');
  }

  return format.replace(':base:', rule.text).replace(':ruby:', rule.ruby);
}

function rubyRegExp(rule: RuleItem): RegExp {
  const format: ?string = config.formats[rule.format || 'default'];
  if (format == null) {
    throw new Error('');
  }

  let str = '';
  const [front, rear] = format.replace(':ruby:', rule.ruby).split(':base:');
  if (front !== '') {
    str += `(?<!${escapeRegExp(front)})`;
  }
  str += rule.text;
  if (rear !== '') {
    str += `(?!${escapeRegExp(rear)})`;
  }

  return new RegExp(str, 'g');
}

function escapeRegExp(str: string): string {
  const matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

  return str.replace(matchOperatorsRe, '\\$&');
}

module.exports = {
  linter: reporter,
  fixer: reporter,
};
