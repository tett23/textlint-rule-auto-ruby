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

  // console.log('options', options);
  const { Syntax, report, getSource } = context;

  // console.log('context', context);
  // console.log('options', options);
  // console.log(Syntax, RuleError, report, getSource, fixer);

  // console.log('Syntax', Syntax);
  const rules = config.rules.map((rule) => {
    return Object.assign({}, baseRule, rule);
  });

  return {
    [Syntax.Document](node) {
      const text = getSource(node);
      // console.log('doc node', node);
      // console.log('doc text', text);

      applyChanges(text, changes(text, rules), context).forEach((ruleError) => {
        report(node, ruleError);
      });
    },
  };
}

type Change = {|
  index: number,
  offset: number,
  actual: string,
  expected: string,
  message: string,
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

  // let delta = 0;
  const ret = changeItems
    .map(({ index, offset, actual, expected, message }) => {
      if (actual === expected) {
        return null;
      }

      // const matchStartIndex = diff.index;
      // const matchEndIndex = matchStartIndex + diff.matches[0].length;
      // // actual => expected
      // const rep = text.slice(index + delta, index + delta + actual.length);
      // console.log('rep', rep);

      const replaceTo = fixer.replaceTextRange([index, index + offset], expected);

      // text = text.slice(0, index + delta) + expected + text.slice(index + delta + actual.length);
      // console.log('text', text);
      // delta += expected.length - actual.length;

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
  const fix = fixString(rule.text, rule);
  const matchIndices = [];
  let offset = 0;
  let index = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    index = text.indexOf(rule.text, offset);
    if (index === -1) {
      break;
    }

    matchIndices.push(index);
    offset = index + 1;
  }

  return matchIndices.map((i) => {
    return {
      index: i,
      offset: rule.text.length,
      actual: rule.text,
      expected: fix,
      message: `auto-ruby: ${rule.text} => ${fix}`,
    };
  });
}

function ruleAll(text: string, rule: RuleItem): Change[] {
  const re = rubyRegExp(rule);
  const matchIndices = [];
  let match;
  // eslint-disable-next-line no-constant-condition
  while ((match = re.exec(text))) {
    matchIndices.push(match.index);
  }

  const fix = fixString(rule.text, rule);
  return matchIndices.map((index) => {
    return {
      index,
      offset: rule.text.length,
      actual: rule.text,
      expected: fix,
      message: `auto-ruby: ${rule.text} => ${fix}`,
    };
  });
}

function fixString(base: string, rule: RuleItem): string {
  const format: ?string = config.formats[rule.format || 'default'];
  if (format == null) {
    throw new Error('');
  }

  const replace = format.replace(':base:', rule.text).replace(':ruby:', rule.ruby);
  return base.replace(rule.text, replace);
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

  console.log(str);
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
