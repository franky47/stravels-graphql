# Testing

The root `/tests` directory contains integration tests. Unit tests are located
next to the code they test, to maintain modularity and cohesion.

## Test Environments

There are two types of tests:

- Unit tests
- Integration tests

Unit tests are ran from a local Node.js and are not dockerised in any way, since
they are supposed to test isolated pieces of code which have no dependencies or
little ones that can be mocked.
Tests are ran with Jest, which is installed as a devDependency for the app.

Integration tests require a more complex environment, which is orchestrated by
docker-compose.

## Boundaries

Here is the list of backing services used by the application:

- PostgreSQL database
- Strava REST API
- _Sentry error handler (optional, will be disabled for integration tests)_

## Adding integration tests

Integration tests will test the whole application as a black box and make sure
the GraphQL API is robust and behaves as intended. In a first time, this may
reveal some issues with the current implementation, that can be fixed or ignored,
but it will mostly be used as a TDD/BDD approach for the refactoring.

To setup integration tests, we will need a few things:

1. A way to automate a database to setup, seed and tear down between tests
2. A way to mock the various edge services used by the application (Strava API)
3. A way to start our application as it will be used in production
4. A way to run GraphQL queries and mutations to send to the application under test
5. A way to inspect the result of the queries and mutations that we get back from
   the application
6. A way to inspect the database contents, to run expectations

## Automation using docker-compose

This directory contains a `docker-compose.yml` file that is dedicated to running
integration tests.

What kind of tests do we want to write ?
=> Inputs should be GraphQL queries and mutations and a boundary context (state
of the database, seeding and mocking of the Strava API).
=> Outputs and assertion targets should be the result of the GraphQL operations
and the contents of the database. Should we use the code to query or run SQL
queries indepdently ? If we reuse the TypeORM schemas, we'll bring in the types
(good?) but if there's a bug in the schema definition, it may leak into the test
(bad). The best way to treat the application as a black box for testing is to
interface with the GraphQL endpoint and use pure SQL queries to talk to the DB.

Generic example:

- When I call the login mutation with valid credentials, I expect the application
  to create a User object (if it did not already exist) and a Session object in
  the database, and to return a cookie or token containing the Session ID and
  user ID.
  This translates into:
  - Setting up the database (with or without an existing User entity)
  - Calling the API with the correct mutation and parameters
  - Getting the result and extracting data from it
  - Querying the database for the given objects
