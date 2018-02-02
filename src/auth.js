import axios from 'axios'

const tokenExchangeURL = 'https://wt-92cccbcf027a1b4070443ff04b9033cc-0.sandbox.auth0-extend.com/strava-token-exchange'

export const exchangeToken = async (code) => {
  const res = await axios.get(tokenExchangeURL, {
    params: { code }
  })
  return res.data.token
}
