// @flow

import fs from 'fs';
import yaml from 'js-yaml';
import TextLintTester from 'textlint-tester';
import rule from '../src/index';
import type { Config } from '../src/types';

const options:Config = yaml.safeLoad(fs.readFileSync(`${__dirname}/config.yml`, 'utf8'));

const tester = new TextLintTester();

// ruleName, rule, { valid, invalid }
tester.run('rule', rule, {
  valid: [
    'text',
  ],

  invalid: [
    {
      text: 'foo',
      output: 'foo(bar)',
      options,
      errors: [
        {
          message: 'hogehoge',
          line: 1,
          column: 1
        }
      ]
    },
  ]
});
