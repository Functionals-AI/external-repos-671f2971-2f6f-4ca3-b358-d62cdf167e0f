import {IContext} from './context'

enum LogLevel {
  FATAL = 'fatal',
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

export interface ILogger {
  fatal: (context: IContext, tag: string[] | string, message: string, data?: object) => void,
  error: (context: IContext, tag: string[] | string, message: string, data?: object) => void,
  warn: (context: IContext, tag: string[] | string, message: string, data?: object) => void,
  info: (context: IContext, tag: string[] | string, message: string, data?: object) => void,
  debug: (context: IContext, tag: string[] | string, message: string, data?: object) => void,
  trace: (context: IContext, tag: string[] | string, message: string, data?: object) => void,
  exception: (context: IContext, tag: string[] | string, exception: Error, data?: object) => void,
  tag: () => string[],
}

function log(context: IContext, tag: string[] | string, level: LogLevel, message: string, data?: Record<string, any>) {
  let shallow: object = {}

  if (data != undefined) {
    shallow = Object.entries(data).reduce((memo, [key, value]) => {
      if (['string', 'number'].includes(typeof(value))) {
        return {...memo, [key]: value}
      } else {
        return {...memo, [key]: JSON.stringify(value)}
      }
    }, {})
  } 

  if (Array.isArray(tag)) {
    tag = tag.join('.')
  }

  console.log(JSON.stringify({...shallow, tag, level, message, trace: context.trace}))
}

function fatal(context: IContext, tag: string[] | string, message: string, data?: Record<string, any>) {
  log(context, tag, LogLevel.FATAL, message, data)
}

function error(context: IContext, tag: string[] | string, message: string, data?: Record<string, any>) {
  log(context, tag, LogLevel.ERROR, message, data)
}

function warn(context: IContext, tag: string[] | string, message: string, data?: Record<string, any>) {
  log(context, tag, LogLevel.WARN, message, data)
}

function info(context: IContext, tag: string[] | string, message: string, data?: Record<string, any>) {
  log(context, tag, LogLevel.INFO, message, data)
}

function debug(context: IContext, tag: string[] | string, message: string, data?: Record<string, any>) {
  log(context, tag, LogLevel.DEBUG, message, data)
}

function trace(context: IContext, tag: string[] | string, message: string, data?: Record<string, any>) {
  log(context, tag, LogLevel.TRACE, message, data)
}

function exception(context: IContext, tag: string, e: Error, data: Record<string, any>={}) {
  let message = 'exception occured'

  if (e !== undefined) {
    if (e.stack !== undefined) {
      data.stack = e.stack
    }

    if (e['type'] !== undefined) {
      data['type'] = e['type']
    }

    if (e.message !== undefined) {
      message = e.message
    }
  }

  log(context, tag, LogLevel.ERROR, message, data)
}

function tag(): string[] {
  const elements = []
  const e = new Error()
  const lines = String(e.stack).split("\n").filter(line => /^\s+at/.test(line)).map(line => line.replace(/^\s+at\s+/, ''))
  const match = lines[1].match(/\(([^)]+)\)/)

  if (match) {
    const location = match[1]
    const filepath = location.split(':')[0]
    let parts = filepath.split('/').filter(item => !/^(?:src|lib)$/.test(item))
    const index = parts.findIndex(item => item === 'packages')
    
    if (index >= 0 && index+1 < parts.length-1) {
      parts = parts.slice(index+1)
      parts = parts.map(item => item.replace(/\.[a-z]+$/i, ''))
      return parts
    }
  }

  return elements
}

function create(): ILogger {
  return {
    fatal,
    error,
    warn,
    info,
    debug,
    trace,
    exception,
    tag,
  }
}

export default {
  create,
  tag,
}