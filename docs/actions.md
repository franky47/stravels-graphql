# Actions

List of interactions encountered in user stories for Stravels.

## Mutations

### Login (first time, with code)

**User Story Context** : User has logged in with Strava and authorized the
Stravels application. Upon redirection, a call to the server is made to finish
the OAuth 2.0 authentication workflow (token exchange).

```graphql
mutation Login($code: AuthenticationCode!) {
  credentials: loginWithCode($code) {
    id,
    token
  }
}
```

Back-end actions:
1. Call the Strava token exchange endpoint, pass the code, get token & user info
2. Format user info and create entry in database
3. Return authentication information

Constraints:
* Strava tokens should not be stored in the database, as a breach could compromise user data.
* Strava tokens should be stored in the client instead, but would have to be transmitted for some operations
* Transmitting them over the network is OK under TLS

To decouple our application from the Strava authentication system, we generate a
JWT containing the user ID and the Strava token as claims, that can be verified
and used in the backend for authenticating queries and mutations.

Upon reception of the JWT, the front-end stores it in localStorage or in a cookie
for subsequent authentication.

*Note: this endpoint communicates with the Strava API, and is subject to rate-limiting policies, therefore some failsafe mechanism must be put in place to handle 3rd party errors.*

### Create Travel

`Authenticated` : Requires sending a JWT with the POST request.

**User Story Context** : User has selected a list of Activities to make a Travel,
and has provided the required information (name, visibility).

```graphql
mutation CreateTravel($name: String!, $activities: [ActivityDetails!]!) {
  travel: createTravel($name, $activities) {
    name
    activities {
      # ...
    }
  }
}
```

Back-end actions:
1. Create objects in the database
2. Return Travel data
3. Generate preview image asynchronously (front-end will not need it straight away)
4. Store the preview image (where ?) and store its URL into the database

## Queries

## Get User Info

`Authenticated` : Requires sending a JWT with the POST request.

**User Story Context** : User has logged in and sees their profile information
in the application (name, profile picture...)

```graphql
query GetUserInfo {
  me {
    id
    fullName
    firstName
    lastName
    profilePicture
    lastLogin(tz: Timezone = UTC)
    createdAt(tz: Timezone = UTC)
  }
}
```

The `me` query field returns data about the logged in user, ie the user associated
with the supplied JWT (where the user ID is encoded as a claim).

Back-end workflow:
1. Verify JWT & extract user ID
2. Query the database for the user with that ID
3. Resolve the output object

## List Activities

`Authenticated` : Requires sending a JWT with the POST request.

```graphql
query ListActivites($paginationQueryParameters: ?) {
  activities {
    # ...
  }
}
```

Constraints:
* Check with front-end how to handle pagination for infinite-scroll-like lists
* Handling new data: assume that new data is always added on top of the list
* Make as much use of cache as possible, new queries should only check for new data at the head, the rest of the pages coming after should use the cache
* Once a new head has been pulled, the request that pulled it should make use of the cache

*Note #1: this endpoint communicates with the Strava API, and is subject to rate-limiting policies, therefore some failsafe mechanism must be put in place to handle 3rd party errors.*

*Note #2: in order to minimize calls to the Strava API, this endpoint should be as cacheable as possible, so that clients don't request the same page twice, even when new data is available from the Strava API.*

Back-end workflow:
1. Verify JWT & extract Strava token
2. Map the pagination parameters to Strava's page system
3. Send a Strava request
4. Format the data and return it

## List Travels

`Authenticated` : Requires sending a JWT with the POST request.

**User Story Context** : User is on the Travels page, where a list of their travels
is displayed, with a summary for each Travel (no detailed activities info here).

```graphql
query ListTravels {
  travels {
    name
    previewImage
    dateRange
  }
}
```

Back-end workflow:
1. Verify JWT & extract user ID
2. Query the database for the travels associated to that user
3. Format and return the data

*Note: only allows the current user to list their travels. To see a friend's travels will require another endpoint with a userID parameter and an access control mechanism to check for visibility.*

## Get Travel

`Authenticated` : Requires sending a JWT with the POST request.

```graphql
query Travel($id: ID!) {
  travel($id) {
    name
    dateRange
    activities {
      # ...
    }
  }
}
```

Back-end workflow:
1. Verify JWT & extract user ID
2. Query the database for the travels associated to that user
3. Format and return the data

*Note: technically nothing prevents any logged in user with a valid JWT to read any travel information, so for now a mechanism that checks the JWT user ID claim against the travel's author ID should be put in place.*
