# Services

- stravels-graphql
- stravels-graphql-db
- stravels-graphql-cache
- stravels-graphql-integration-db
- stravels-graphql-integration-test-runner

## Dockerisation

During development, I want to use Docker to automate some of the actions needed
to get a consistent development environment:

- Starting the backing services before the application
- Have a complete separate integration testing environment, with:
  - A separate database
  - An isolated production-ready version of the app (implies building it)
- Building the source code into a Docker image for deployment

Two environments for the app will be defined:

- Development, uses persistance for the backing services and maps the source code
  directory using volumes.
- Production, uses a Dockerfile which only defines the app boundaries with envs
