export function getLogger(name) {
  function _log(levelLogger, level, ...args) {
    levelLogger(`${level.toUpperCase()} ${name}:`, ...args)
  }

  return {
    /* eslint-disable no-console */
    debug: (...args) => _log(console.debug, 'debug', ...args),
    log: (...args) => _log(console.log, 'log', ...args),
    warn: (...args) => _log(console.warn, 'warn', ...args),
    error: (...args) => _log(console.error, 'error', ...args),
    /* eslint-enable no-console */
  }
}
