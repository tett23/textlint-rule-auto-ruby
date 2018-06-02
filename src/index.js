// @flow

import fs from 'fs';
import yaml from 'js-yaml';
import type { Config, RuleItem, RuleTypes } from './types';

let config:Config = yaml.safeLoad(fs.readFileSync(`${__dirname}/../config/rules.yml`, 'utf8'));

// eslint-disable-next-line flowtype/no-weak-types
function reporter(context:any, options:any = {}) {
  config = Object.assign({}, config, options);
  const baseRule: {rule: ?RuleTypes, format: ?string} = {
    rule: config.global.rule,
    format: config.global.format
  };

  // console.log('options', options);
  const {
    Syntax, RuleError, report, getSource, fixer
  } = context;

  // console.log('context', context);
  // console.log('options', options);
  // console.log(Syntax, RuleError, report, getSource, fixer);

  // console.log('Syntax', Syntax);

  return {
    [Syntax.Str](node) {
      const text = getSource(node);
      // console.log('doc node', node, text);
      // console.log('doc text', text);

      config.rules.forEach((rule, index) => {
        const merged: RuleItem = Object.assign({}, baseRule, rule);
        const fix = fixString(text, merged);
        const match = text.match(rule.text);
        if (!match) {
          return;
        }

        const replaceTo = fixer.replaceTextRange([match.index, rule.text.length], fix);
        const ruleError = new RuleError(config.global.message, {
          index,
          fix: replaceTo
        });

        report(node, ruleError);
      });
    },
  };
}

function fixString(base: string, rule: RuleItem) {
  const format:?string = config.formats[rule.format || 'default'];
  if (format == null) {
    throw new Error('');
  }

  const replace = format.replace(':base:', rule.text).replace(':ruby:', rule.ruby);
  return base.replace(rule.text, replace);
}

module.exports = {
  linter: reporter,
  fixer: reporter
};
