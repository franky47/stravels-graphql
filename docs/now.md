# Using `zeit/now-cli`

To release a new version:
```shell
$ yarn deploy
```

To link it to prod:
```
$ now alias https://the-url-that-was-deployed.now.sh https://stravels-graphql.now.sh
```

It should handle auto-scaling the new instance up and the old instance down.

Cleanup:
```shell
$ now rm the-old-url.now.sh
```
