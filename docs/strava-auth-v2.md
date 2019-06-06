# Strava Auth v2

[Documentation](https://developers.strava.com/docs/authentication/)

Strava has updated their authentication flow as of 2018-10-18. They now make use
of Refresh Tokens and Access Tokens instead of a Forever Access Tokens,
which is good news for security but bad news for complexity.

Access Tokens are short-lived (6 hours).
Refresh Tokens are long-lived, and are obtained and rotated when initiating the
authentication flow.

The authentication flow involves the following endpoints:

- GET https://www.strava.com/oauth/authorize, to authorize the use of the application
  on behalf of the user.
  This is done in the browser and redirects to the client with a code.

- POST https://www.strava.com/oauth/token
  This endpoint is used at multiple points in time.

1. To exchange the code received from the app authorization process for a set
   of Refresh and Access tokens, using `grant_type=authorization_code`
2. To refresh an access token (whether expired or not), by passing the Refresh
   Token and `grant_type=refresh_token`

There is no way to invalidate the Access Token or Refresh Token without also
"uninstalling" the app and clearing the authorization permissions done in step 1,
so logging out should be an internal thing, while using the Deauthorization
endpoint from Strava would be used when deleting a user account (for cleaning up
and compliance with GDPR).

Calls to https://www.strava.com/oauth/token must be done from the backend, as
the app secret is passed in the body, and should not be shared with the client.

The client will supply the authorization code obtained in the authorization flow
when logging in, which will yield a Refresh Token and an Access Token.
In terms of features and security, we want the following:

- For users to be "permanently" logged in on the front-end, until they choose to
  log out, in which case their credentials are invalidated and will have to forego
  the full login process (with the authorization code) to login again.
- For users to have a way to "log out of all sessions (but the current one)" to
  mitigate undesired accesses. This would invalidate all credentials linked to
  the sessions of that particular user but the one they used to invoke that command.

So we need a sessions mechanism, which will be persisted on the backend.
For security reasons, the Refresh Token should not be stored on the server, and
should instead live on the client and be sent to the server with every request,
in the form of a cookie or a JWT.

The server can store Access Tokens as part of a session data to:

- Simplify the client logic for token management, as Access Tokens are useless
  for the client and their short life would make sending them back and forth tedious
- Abstract the authentication behaviour from the client point of view
- Cache access tokens from one request to the Strava API to the next, to avoid
  a fully stateless system that would involve spamming the /oauth/token endpoint
  before every request.

When a session is created upon successful completion of the authorization flow,
the Access Token is included in the session data and saved into the database.
Subsequent accesses to the Strava API will require an Access Token, which can
be obtained from the Session. The session data would also include the expiration
timestamp of the Access Token, in order for the backend to know if the token
should be refreshed prior to making the call to the API. If the token still has
more than one hour to live, it can be used as is to authenticate the API call.
Otherwise, the refresh flow should be invoked, passing the Refresh Token provided
by the initial request. The resulting Access Token and its new expiration date
would then replace the old one in the current Session ID.

Note: sessions do not expire, only their associated Access Token does. To remove
an active session, either logout from that session or "logout from all sessions"
from another session from the same user ID.

Session data in the database includes:
User ID | Session ID | Access Token | Expires At | Created At | Last Login
Indexing is done on (UserID + SessionID) if possible, otherwise make Session ID
unique and index on that (just keep UserID here for reference)
Last Login is provided to know when the Access Token was last updated, which
should give a good idea of when the user last used the app.

So the client needs to send the following things for every request:

- Client ID: number (given by Strava)
- Session ID: "hex{N}", does not have to be long or unique by itself, only
  ClientID + SessionID has to be unique)
- Refresh Token: "hex{P}"

Those are provided as a response when logging in with an authorization code.

How they are provided is another question, the options being:

- Separate cookies
- Single cookie as base64(JSON)
- JWT as a cookie
- JWT as a header

A JWT will expire and will have to be refreshed, and stored when changed, which
is the exact behaviour of a cookie. So might as well use cookies ?

The JWT payload will look like this:

```json
{
  "iat": 1516239022, // Issued at, timestamp of JWT generation
  "exp": 1516339022, // Expiration date (better not having one of those)
  "aud": "stravels-graphql", // Audience, to validate it comes from the server (in complement of the signature check)
  "sub": "1234567890", // Subject ID is the Strava User ID
  "sid": "92a4a5cf", // Session ID as found in the database
  "tkn": "60459b11668027ff2cab530f506a9ecb" // Refresh Token, as received
}
```

## JWT vs Cookie

JWT pros:

- Stored in localStorage for permanent login, good for PWA. But then it means
  the JWT should also not expire. The session can still be cleared on the backend
  to revoke access for this token
- Self-contained and signed
- Can contain claims to avoid making round-trips to the server, potentially
  helping with offline support
  => dangerous: consider that the client can fiddle with the front-end code,
  and critical pieces of data can be tampered with along with skipping signature
  checks

JWT cons:

- Manual operations: has to be fetched from the server (either from response
  header or body), stored to localStorage and sent to the server for all auth'd
  requests (which is pretty much every request once logged in). This reflects
  the desired behaviour of a cookie, but with manual operation.
- Subject to theft
- Stateless by design, therefore requiring explicit stateful implementation to
  revoke them.

Cookie pros:

- Lightweight compared to JWT (no extra data), saves bandwidth
- Storage and exchange is handled for us

Cookie cons:

- More easily open to theft
- Always sent on every request (since GraphQL has a single endpoint, no way to
  specify only certain queries or mutations to send the credentials)
  => is it really an issue though ? not for this use case

Side Note:
There's always the option of JWT within a Cookie, but that's not really useful.
It solves the automatic exchange part, but does not solve the durability of the
token (the Cookie expires independently from the token), the sending of creds
for every request, the overhead in size...

## Summary

In order for a session system to be overridable from an external source, it must
be stateful, there's no way to invalidate tokens that are in the wild without
some form of persistence, whether it's pre-ban (store active sessions) or
post-ban (store blacklisted credentials).
In order to comply with regulations and ensure minimal liability if the database
is compromised, long-lived authentication tokens for the Strava API should never
be stored at any time on the backend, and should live instead in the local
storage of the client. Access Tokens can be persisted in the database, as they
are short-lived and will be refreshed often. A leak of the database would be
useful only for a few hours before all the included tokens die out, which gives
attackers very little time to do a meaningful attack on user data.

The second attack vector is identity theft and user impersonation. There is
currently no way to attach a token to a specific client to prevent token reuse
across clients and impersonation via token theft. Mitigation for such an attack
would require to uniquely identify each client running the front-end code, and
craft a specific token for each client. Attempting to reuse a token crafted for
another client would result in an error. Maybe there might be a use case for a
bit of cryptography here (key pair signature):
https://www.sjoerdlangkemper.nl/2017/07/05/prevent-session-hijacking-with-token-binding/
