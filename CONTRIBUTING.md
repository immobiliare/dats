# Contributing

### npm scripts

```bash
# install dependencies
$ npm i
# run tests
$ npm test
# run the code linter
$ npm run lint
# run in debug mode
$ DEBUG=dats ...
# new release
$ npm run release
```

### Commit Convention

Angular, enforced with [commitizen](https://github.com/commitizen/cz-cli) and [commitlint](https://github.com/conventional-changelog/commitlint).

### Quality

Contributions should be validated with the command:

```bash
$ codeclimate analyze
```

See [codeclimate](https://github.com/codeclimate/codeclimate).

### Test

Contributions should pass existing tests or have test cases for new functionality.

```bash
# Should pass
$ npm test
```

### Style

Style and lint errors should be fixed with

```bash
$ npm run lint
```
