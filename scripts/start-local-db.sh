#!/usr/bin/env bash

docker run --rm -it \
  -v $(pwd)/.db:/var/lib/postgresql/data \
  --name stravels-pg \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=stravels \
  -p 5432:5432 \
  -d \
  postgres:11.1
