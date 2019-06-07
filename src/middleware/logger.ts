import chalk from 'chalk'
import morgan from 'morgan'
import { __DEV__, instanceId } from '../config'
import { InjectedRequest } from './types'
import { Request } from 'express'

// --

export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'LOG' | 'DEBUG'
export type LogCategory = 'INIT' | 'APP' | 'HTTP' | 'DB' | 'API' | 'AUTH'

type LogMeta = { [key: string]: any }

export interface LogInput {
  message: string
  level: LogLevel
  category: LogCategory
  req?: InjectedRequest
  meta?: LogMeta
}

// --

export const color = new chalk.constructor({
  enabled: process.env.COLORIZE_LOGS === 'true'
})

const getLevelForStatusCode = (code: number): LogLevel => {
  if (code >= 500) {
    return 'ERROR' // Server Error
  }
  if (code >= 400) {
    return 'WARN' // Client Error
  }
  if (code >= 300) {
    return 'INFO' // Redirects
  }
  return 'LOG'
}

const getColorForStatusCode = (code: number) => {
  if (code >= 500) {
    return color.red
  }
  if (code >= 400) {
    return color.yellow
  }
  if (code >= 300) {
    return color.magenta
  }
  return color.green
}

const formatLevel = (level: LogLevel): string => {
  const colors = {
    ERROR: color.red,
    WARN: color.yellow,
    INFO: color.blue,
    LOG: color.reset,
    DEBUG: color.dim
  }
  return colors[level](level.padEnd(5))
}

const assembleLogLine = (input: LogInput) => {
  const { message, level, req, meta } = input
  const date = new Date().toISOString()
  const commit = process.env.COMMIT_ID
  const dimOnDebug = level === 'DEBUG' ? color.dim : color.reset
  return [
    __DEV__ && color.dim(date),
    instanceId,
    commit && color.dim(commit.slice(0, 8)),
    formatLevel(level),
    input.category.padEnd(5),
    req && req.fingerprint && dimOnDebug(req.fingerprint),
    req && req.id && dimOnDebug(req.id),
    dimOnDebug(message),
    meta && color.dim(JSON.stringify(meta))
  ]
    .filter(x => !!x)
    .join(' ')
}

// --

export const log = (
  message: string,
  {
    category = <LogCategory>'API',
    level = <LogLevel>'LOG',
    req = <InjectedRequest | undefined>undefined,
    meta = <LogMeta | undefined>undefined
  } = {}
) => {
  const text = assembleLogLine({
    category,
    level,
    message,
    req,
    meta
  })
  const fn = {
    ERROR: console.error,
    WARN: console.warn,
    INFO: console.info,
    LOG: console.log,
    DEBUG: console.debug
  }
  const levels: LogLevel[] = ['DEBUG', 'LOG', 'INFO', 'WARN', 'ERROR']
  const threshold = <LogLevel>(process.env.LOG_LEVEL || 'LOG').toUpperCase()
  if (levels.indexOf(level) >= levels.indexOf(threshold)) {
    fn[level](text)
  }
}

// --

export default function loggerMiddleware() {
  return morgan(
    (tokens, req, res) => {
      const message = [
        tokens.method(req, res),
        tokens.url(req, res),
        getColorForStatusCode(res.statusCode)(tokens.status(req, res)),
        '-',
        tokens['response-time'](req, res),
        'ms,',
        tokens.res(req, res, 'content-length'),
        'bytes'
      ].join(' ')
      return assembleLogLine({
        category: 'HTTP',
        level: getLevelForStatusCode(res.statusCode),
        message,
        req
      })
    },
    {
      skip: (req: Request) => {
        // Don't monitor health checks from Clever Cloud in production
        return req.headers['X-CleverCloud-Monitoring'] === 'telegraf'
      }
    }
  )
}
