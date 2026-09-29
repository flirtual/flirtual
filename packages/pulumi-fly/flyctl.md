# flyctl fork

Upstream `fly pg create` has no `--network`, so a cluster always lands on the organisation's
default private network. Every other app in a stack has a network of its own, so the database
would be the one app sharing a network with production.

Until [the upstream change][pr] merges, we run a fork. It ships a binary named `fly`, so
putting it first on `PATH` is all it takes. `fly.Postgres` checks for `--network` during a
preview and stops early if the fork is missing.

[pr]: https://github.com/superfly/flyctl/compare/master...ariesclark:pg-create-network

## The build

[`ariesclark/flyctl`][fork], tag `v0.4.104-network.1`, commit `c9e0d3d7` on
`pg-create-network`. That is upstream `815f54c0` (v0.4.104) plus two changes:

- `--network` on `fly pg create`, passed to the Flaps `CreateApp` request.
- The same network passed to the cluster's Flycast allocation. Without it the app lands on the
  custom network but its address lands on the default one.

[fork]: https://github.com/ariesclark/flyctl

## Using it

```sh
mkdir -p ~/.local/flyctl
gh release download v0.4.104-network.1 --repo ariesclark/flyctl \
  --pattern fly-linux-amd64.tar.gz --dir ~/.local/flyctl
tar -xzf ~/.local/flyctl/fly-linux-amd64.tar.gz -C ~/.local/flyctl
export PATH="$HOME/.local/flyctl:$PATH"
```

`fly version` should report commit `c9e0d3d7`. The release is public, so CI needs no token:

```yaml
- name: Use the flyctl fork
  run: |
    mkdir -p "$RUNNER_TEMP/flyctl"
    curl -fsSL https://github.com/ariesclark/flyctl/releases/download/v0.4.104-network.1/fly-linux-amd64.tar.gz \
      | tar -xz -C "$RUNNER_TEMP/flyctl"
    echo "$RUNNER_TEMP/flyctl" >> "$GITHUB_PATH"
```

Only `linux/amd64` is published. For another platform, clone the fork at that commit and run
`go build -o fly .` — `go install` fails, because the module path is still
`github.com/superfly/flyctl`.

## Dropping it

Once an upstream release carries the change: delete this file, the `PATH` entry, the CI step
and the `--network` check in `fly.Postgres`, and pin the upstream version.
