'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _jsYaml = require('js-yaml');

var _jsYaml2 = _interopRequireDefault(_jsYaml);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let config = _jsYaml2.default.safeLoad(_fs2.default.readFileSync(`${__dirname}/config.yml`, 'utf8'));

/* eslint-disable flowtype/no-weak-types */

/* eslint-enable flowtype/no-weak-types */

function reporter(context, options = {}) {
  const { Syntax, report, getSource } = context;

  config = mergeConfig(options);
  const baseRule = {
    rule: config.global.rule,
    format: config.global.format
  };
  const rules = config.rules.map(rule => {
    return Object.assign({}, baseRule, rule);
  });

  return {
    [Syntax.Document](node) {
      const text = getSource(node);

      applyChanges(text, changes(text, rules), context).forEach(ruleError => {
        report(node, ruleError);
      });
    }
  };
}

function mergeConfig(options = {}) {
  let userConfig = {};
  if (options.configPath) {
    userConfig = _jsYaml2.default.safeLoad(_fs2.default.readFileSync(options.configPath), 'utf8');
  }

  return Object.assign({}, config, options.config || {}, userConfig);
}

function changes(text, rules) {
  const ret = rules.reduce((r, rule) => {
    matchAll(text, rule).forEach(item => {
      r.push(item);
    });

    return r;
  }, []);

  return ret.sort((a, b) => {
    return a.index - b.index;
  });
}

function applyChanges(text, changeItems, context) {
  // eslint-disable-next-line no-shadow
  const { RuleError, fixer } = context;

  const ret = changeItems.map(({ index, actual, expected }) => {
    if (actual === expected) {
      return null;
    }

    const replaceTo = fixer.replaceTextRange([index, index + actual.length], expected);

    const message = `auto-ruby: \`${actual}\` => \`${expected}\``;

    return new RuleError(message, {
      index,
      fix: replaceTo
    });
  }).filter(Boolean);

  return ret;
}

function matchAll(text, rule) {
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

function ruleFirst(text, rule) {
  let items = matches(text, rule);
  if (items.length === 0) {
    return [];
  }

  let firstItem = [];
  if (items[0].type === 'base') {
    items = items.slice(1);
  } else {
    firstItem = [items[0]];
    items = items.slice(1);
  }

  return firstItem.concat(items.filter(item => item.type === 'base'));
}

function ruleAll(text, rule) {
  return matches(text, rule).filter(item => item.type === 'ruby');
}

function matches(text, rule) {
  return baseMatches(text, rule).concat(rubyMatches(text, rule)).sort((a, b) => a.index - b.index);
}

function baseMatches(text, rule) {
  const fix = fixString(rule);
  const re = new RegExp(escapeRegExp(fix), 'g');
  const indices = [];
  let match;
  while (match = re.exec(text)) {
    indices.push(match.index);
  }

  return indices.map(index => {
    return {
      type: 'base',
      index,
      actual: fix,
      expected: rule.text
    };
  });
}

function rubyMatches(text, rule) {
  const re = rubyRegExp(rule);
  const indices = [];
  let match;
  while (match = re.exec(text)) {
    indices.push(match.index);
  }

  const fix = fixString(rule);
  return indices.map(index => {
    return {
      type: 'ruby',
      index,
      actual: rule.text,
      expected: fix
    };
  });
}

function fixString(rule) {
  const format = config.formats[rule.format || 'default'];
  if (format == null) {
    throw new Error('');
  }

  return format.replace(':base:', rule.text).replace(':ruby:', rule.ruby);
}

function rubyRegExp(rule) {
  const format = config.formats[rule.format || 'default'];
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

function escapeRegExp(str) {
  const matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

  return str.replace(matchOperatorsRe, '\\$&');
}

module.exports = {
  linter: reporter,
  fixer: reporter
};