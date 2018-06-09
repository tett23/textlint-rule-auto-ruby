// @flow

import fs from 'fs';
import yaml from 'js-yaml';
import TextLintTester from 'textlint-tester';
import rule from '../src/index';
import type { Config } from '../src/types';

const options: Config = yaml.safeLoad(fs.readFileSync(`${__dirname}/config.yml`, 'utf8'));

const tester = new TextLintTester();

tester.run('rule', rule, {
  valid: [
    'nothing to do',
    {
      text: 'rule: all. foo(bar), foo',
      output: 'rule: all. foo(bar), foo',
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
    },
  ],

  invalid: [
    {
      text: 'rule: all. foo',
      output: 'rule: all. foo(bar)',
      options,
      errors: [
        {
          message: 'auto-ruby: `foo` => `foo(bar)`',
          line: 1,
          column: 12,
        },
      ],
    },
    {
      text: 'rule: all. hoge',
      output: 'rule: all. hoge(fuga)',
      options,
      errors: [
        {
          message: 'auto-ruby: `hoge` => `hoge(fuga)`',
          line: 1,
          column: 12,
        },
      ],
    },
    {
      text: 'rule: all. foo, foo',
      output: 'rule: all. foo(bar), foo(bar)',
      options,
      errors: [
        {
          message: 'auto-ruby: `foo` => `foo(bar)`',
          line: 1,
          column: 12,
        },
        {
          message: 'auto-ruby: `foo` => `foo(bar)`',
          line: 1,
          column: 17,
        },
      ],
    },
    {
      text: 'rule: all. foo, hoge',
      output: 'rule: all. foo(bar), hoge(fuga)',
      options,
      errors: [
        {
          message: 'auto-ruby: `foo` => `foo(bar)`',
          line: 1,
          column: 12,
        },
        {
          message: 'auto-ruby: `hoge` => `hoge(fuga)`',
          line: 1,
          column: 17,
        },
      ],
    },
    {
      text: 'rule: all. foo, foo(bar)',
      output: 'rule: all. foo(bar), foo(bar)',
      options,
      errors: [
        {
          message: 'auto-ruby: `foo` => `foo(bar)`',
          line: 1,
          column: 12,
        },
      ],
    },

    {
      text: 'rule: first. foo, foo(bar)',
      output: 'rule: first. foo(bar), foo',
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
          column: 14,
        },
        {
          message: 'auto-ruby: `foo(bar)` => `foo`',
          line: 1,
          column: 19,
        },
      ],
    },
    {
      text: 'rule: first. foo, foo',
      output: 'rule: first. foo(bar), foo',
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
          column: 14,
        },
      ],
    },
    {
      text: 'rule: first. foo(bar), foo, foo(bar)',
      output: 'rule: first. foo(bar), foo, foo',
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
          message: 'auto-ruby: `foo(bar)` => `foo`',
          line: 1,
          column: 29,
        },
      ],
    },
  ],
});
