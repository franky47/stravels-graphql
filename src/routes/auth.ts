import express, { Response } from 'express'
import { InjectedRequest } from '../middleware/types'
import { loginWithCode, logout, deleteAccount } from '../auth'
import { NextFunction } from 'connect'
import { validateJwt } from '../auth/jwt'
import { log } from '../middleware/logger'

const requireJwt = (
  req: InjectedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.jwt) {
    log('Authentication required (missing JWT)', {
      level: 'WARN',
      category: 'AUTH',
      req,
      meta: {
        path: req.originalUrl
      }
    })
    return res.status(401).json({
      statusCode: 401,
      error: 'Authentication required',
      reason: 'Missing `Bearer {jwt}` in authorization header'
    })
  }
  next()
}

const handleLogin = async (req: InjectedRequest, res: Response) => {
  const code: string = req.body.code
  const jwt = await loginWithCode(code)
  res.json({ jwt })
}

const handleLogout = async (req: InjectedRequest, res: Response) => {
  const auth = await validateJwt(<string>req.jwt)
  await logout(auth)
  res.sendStatus(204) // No content
}

const handleDeleteAccount = async (req: InjectedRequest, res: Response) => {
  const auth = await validateJwt(<string>req.jwt)
  await logout(auth)
  await deleteAccount(auth.userId)
  res.sendStatus(204) // No content
}

const router = express.Router()
router.post('/login', handleLogin)
router.post('/logout', requireJwt, handleLogout)
router.post('/deleteAccount', requireJwt, handleDeleteAccount)

export default router
