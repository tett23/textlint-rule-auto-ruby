// @flow

import fs from 'fs';
import yaml from 'js-yaml';
import TextLintTester from 'textlint-tester';
import rule from '../src/index';
import type { Config } from '../src/types';

const options: Config = yaml.safeLoad(fs.readFileSync(`${__dirname}/config.yml`, 'utf8'));

const tester = new TextLintTester();

// ruleName, rule, { valid, invalid }
tester.run('rule', rule, {
  valid: ['text'],

  invalid: [
    {
      text: 'foo',
      output: 'foo(bar)',
      options,
      errors: [
        {
          message: 'auto-ruby: `foo` => `foo(bar)`',
          line: 1,
          column: 1,
        },
      ],
    },
    {
      text: 'hoge',
      output: 'hoge(fuga)',
      options,
      errors: [
        {
          message: 'auto-ruby: `hoge` => `hoge(fuga)`',
          line: 1,
          column: 1,
        },
      ],
    },
    {
      text: 'foo, foo',
      output: 'foo(bar), foo(bar)',
      options,
      errors: [
        {
          message: 'auto-ruby: `foo` => `foo(bar)`',
          line: 1,
          column: 1,
        },
        {
          message: 'auto-ruby: `foo` => `foo(bar)`',
          line: 1,
          column: 6,
        },
      ],
    },
    {
      text: 'foo, hoge',
      output: 'foo(bar), hoge(fuga)',
      options,
      errors: [
        {
          message: 'auto-ruby: `foo` => `foo(bar)`',
          line: 1,
          column: 1,
        },
        {
          message: 'auto-ruby: `hoge` => `hoge(fuga)`',
          line: 1,
          column: 6,
        },
      ],
    },
    {
      text: 'foo, foo(bar)',
      output: 'foo(bar), foo(bar)',
      options,
      errors: [
        {
          message: 'auto-ruby: `foo` => `foo(bar)`',
          line: 1,
          column: 1,
        },
      ],
    },

    {
      text: 'foo, foo(bar)',
      output: 'foo(bar), foo',
      options: Object.assign({}, options, {
        rules: [
          {
            text: 'foo',
            ruby: 'bar',
            rule: 'first',
            format: 'default',
          },
        ],
      }),
      errors: [
        {
          message: 'auto-ruby: `foo` => `foo(bar)`',
          line: 1,
          column: 1,
        },
        {
          message: 'auto-ruby: `foo(bar)` => `foo`',
          line: 1,
          column: 6,
        },
      ],
    },
  ],
});
