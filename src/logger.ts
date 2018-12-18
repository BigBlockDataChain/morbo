import {VoidFunction} from './types'

export interface Logger {
  debug: VoidFunction,
  log: VoidFunction,
  warn: VoidFunction,
  error: VoidFunction,
}

export function getLogger(name: string): Logger {
  function log(levelLogger: any, level: _LoggerLevel, ...args: any[]) {
    levelLogger(`${level} ${name}:`, ...args)
  }

  return {
    /* eslint-disable no-console */
    debug: (...args: any[]) => log(console.debug, _LoggerLevel.DEBUG, ...args),
    log: (...args: any[]) => log(console.log, _LoggerLevel.LOG, ...args),
    warn: (...args: any[]) => log(console.warn, _LoggerLevel.WARN, ...args),
    error: (...args: any[]) => log(console.error, _LoggerLevel.ERROR, ...args),
    /* eslint-enable no-console */
  }
}

enum _LoggerLevel {
  DEBUG = 'DEBUG',
  LOG = 'LOG',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

