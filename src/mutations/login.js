import { exchangeToken } from '../auth'
import { User } from '../db/models'

export default async (root, { code }) => {
  const { token, user } = await exchangeToken(code)
  console.log(`Hello, ${user.firstName}!`)
  User.upsert({ ...user })
  return token
}