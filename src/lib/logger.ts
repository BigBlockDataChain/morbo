import {VoidFunction} from './types'

const LOG_LEVEL: string = process.env.DEBUG || 'INFO'

export interface ILogger {
  trace: VoidFunction,
  debug: VoidFunction,
  info: VoidFunction,
  log: VoidFunction,
  warn: VoidFunction,
  error: VoidFunction,
}

export function getLogger(name: string): ILogger {
  function log(levelLogger: any, level: _LoggerLevel, priority: number, ...args: any[]) {
    if ((_LoggerPriority as any)[LOG_LEVEL] >= priority) {
      levelLogger(`${level} ${name}:`, ...args)
    }
  }

  return {
    /* tslint:disable: no-console */
    trace: (...args: any[]) =>
      log(console.debug, _LoggerLevel.TRACE, _LoggerPriority.TRACE, ...args),
    debug: (...args: any[]) =>
      log(console.debug, _LoggerLevel.DEBUG, _LoggerPriority.DEBUG, ...args),
    info: (...args: any[]) =>
      log(console.log, _LoggerLevel.INFO, _LoggerPriority.INFO, ...args),
    log: (...args: any[]) =>
      log(console.log, _LoggerLevel.INFO, _LoggerPriority.INFO, ...args),
    warn: (...args: any[]) =>
      log(console.warn, _LoggerLevel.WARN, _LoggerPriority.WARN, ...args),
    error: (...args: any[]) =>
      log(console.error, _LoggerLevel.ERROR, _LoggerPriority.ERROR, ...args),
    /* tslint:enable: no-console */
  }
}

enum _LoggerLevel {
  TRACE = 'TRACE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

const _LoggerPriority = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
}
