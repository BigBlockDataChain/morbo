# morbo

[![Build Status][build-badge-image]][build-link]


## Development setup

You will require [NPM][npm-link] or [Yarn][yarn-link], and preferable an editor that
supports JavaScript and linting with ESLint.

### Install dependencies
If using NPM, `npm i`.

### Starting development server
A Makefile is provided that lets you run tasks in parallel and can be used to avoid
running the TypeScript compiler and development server in two different shells. Use `make`
to start both in parallel. Then start Electron using `npm run start`.

Alternatively start each manually. First start up the TypeScript compiler with `npm run
tsc`. Then in another shell start the development server with `npm run serve`. Then start
Electron using `npm run start`.

### Linting
To check for link errors, run `npm run lint` or `yarn lint`.

To fix some error automatically, run `npm run lint-fix` or `yarn lint-fix`. Rest of the
errors will need to be fixed manually.

### Troubleshooting
It may be that there is a missing dependency. Run `npm i` and try again.

If it is an Electron issue, the best place to look is in the shell that launched Electron.

If it is a UI issue open the developer tools and look for any errors in the console.


[build-link]: https://api.travis-ci.org/BigBlockDataChain/morbo.svg?branch=master
[build-badge-image]: https://api.travis-ci.org/BigBlockDataChain/morbo.svg?branch=master

[npm-link]: https://www.npmjs.com/
[yarn-link]: https://yarnpkg.com/en/
