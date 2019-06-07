import { Request } from 'express'

export interface InjectedRequest extends Request {
  jwt?: string
  id?: string
  fingerprint?: string
}
