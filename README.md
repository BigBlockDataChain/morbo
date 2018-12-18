# morbo

[![Build Status][build-badge-image]][build-link]


## Development setup

You will require [NPM][npm-link] or [Yarn][yarn-link], and preferable an editor that
supports JavaScript and linting with ESLint.

### Install dependencies
If using NPM, `npm i`.

If using Yarn, `yarn`.

### Starting development server
First start up the TypeScript compiler with `npm run tsc`. Then in another shell start the
development server with `npm run serve`. Then open `localhost:1234` in a browser (Chrome
or Firefox should be well supported, while others are untested)

### Linting
To check for link errors, run `npm run lint` or `yarn lint`.

To fix some error automatically, run `npm run lint-fix` or `yarn lint-fix`. Rest of the
errors will need to be fixed manually.


[build-link]: https://api.travis-ci.org/BigBlockDataChain/morbo.svg?branch=master
[build-badge-image]: https://api.travis-ci.org/BigBlockDataChain/morbo.svg?branch=master

[npm-link]: https://www.npmjs.com/
[yarn-link]: https://yarnpkg.com/en/
