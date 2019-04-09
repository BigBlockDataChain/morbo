# imacs

[![Build Status][build-badge-image]][build-link]


## Development setup

You will require [NPM][npm-link] or [Yarn][yarn-link], and preferable an editor that
supports JavaScript/TypeScript.

### Install dependencies
If using NPM, `npm i`.

### Starting development server
```
npm start
```

### Linting
To check for link errors, run `npm run lint` or `yarn lint`.

To fix some error automatically, run `npm run lint-fix` or `yarn lint-fix`. Rest of the
errors will need to be fixed manually.

### Testing
Test are written using [Jest][jest-link].
Two NPM scripts are provided to run the tests.

Run tests and watch for changes with `npm run test`.

Run tests once and exit with `npm run test-no-watch'.


[build-link]: https://api.travis-ci.org/BigBlockDataChain/morbo.svg?branch=master
[build-badge-image]: https://api.travis-ci.org/BigBlockDataChain/morbo.svg?branch=master

[npm-link]: https://www.npmjs.com/
[yarn-link]: https://yarnpkg.com/en/
[jest-link]: https://jestjs.io/
