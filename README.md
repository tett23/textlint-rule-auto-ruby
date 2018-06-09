# textlint-rule-auto-ruby

textlint-rule-auto-ruby is a [textlint](https://github.com/textlint/textlint) plugin for automatically attach ruby.

## Installation

```
$ yarn add textlint-rule-auto-ruby
```

or

```
$ npm install textlint-rule-auto-ruby
```

## Usage

in .textlintrc

``` json
{
  "rules": {
    "auto-ruby": {
      "configPath": "path/to/config.yml"
    }
  }
}
```

in config file

``` yaml
formats:
  default: ':base:(:ruby:)'

rules:
  -
    text: foo
    ruby: bar
    rule: first
    format: default
  -
    text: hoge
    ruby: fuga
    rule: all
    format: default
```

textlint-rule-auto-ruby supports `--fix`

```
$ foo.md --fix
yarn run v1.7.0
$ /path/to/textlint foo.md --fix

sample.md
  1:1  ✔   auto-ruby: `foo` => `foo(bar)`     auto-ruby
  1:6  ✔   auto-ruby: `hoge` => `hoge(fuga)`  auto-ruby

✔ Fixed 2 problems

✨  Done in 1.90s.
```

input

```
foo, hoge
```

output

```
foo(bar), hoge(fuga)
```

## Configure

Will write later.

## Tests

```
$ yarn run test
```

## License

MIT
