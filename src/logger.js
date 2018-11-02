export function getLogger(name) {
  function _log(levelLogger, ...args) {
    levelLogger(`${name}: `, ...args)
  }

  return {
    /* eslint-disable no-console */
    log: (...args) => _log(console.log, ...args),
    debug: (...args) => _log(console.log, ...args),
    warn: (...args) => _log(console.log, ...args),
    error: (...args) => _log(console.log, ...args),
    /* eslint-enable no-console */
  }
}
