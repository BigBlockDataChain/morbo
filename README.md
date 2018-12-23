# morbo

[![Build Status][build-badge-image]][build-link]


## Development setup

You will require [NPM][npm-link] or [Yarn][yarn-link], and preferable an editor that
supports JavaScript and linting with ESLint.

### Install dependencies
If using NPM, `npm i`.

### Starting development server
1. Start TypeScript compiler and Parcel bundler/development server
```
# Run both in a single shell
make

# Run seperately in two shells
npm run tsc # shell 1
npm run serve # shell 2
```

2. Start Electron
```
# Using make
make electron

# Manually
MORBO_HOME=data/ npm run start
```

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
