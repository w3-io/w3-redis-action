# TODO

## Architectural

- [ ] `subscribe` — Redis pub/sub subscribe requires a persistent
      connection held open by the consumer. W3 workflow steps are
      short-lived by design; they don't naturally hold a subscriber
      open. Options: - Skip permanently (current state). Pub/sub isn't a great fit
      for request-response workflow models. - Wrap as a polling subscriber — `subscribe-once` that fetches
      a single message with a timeout. This works for
      "wait-for-trigger" patterns. - Expose a streaming variant if the protocol ever adds a
      long-lived step mode.

## Potential additions

- [ ] Streams commands — `xadd`, `xread`, `xrange`, `xgroup`. Redis
      Streams are a closer fit to workflow patterns than pub/sub
      because they're pull-based with persistence.
- [ ] Scripting — `eval` / `evalsha`. Lua scripts unlock atomic
      multi-key operations that would otherwise require a round trip
      per command.

## Hygiene

- [ ] Upgrade to `@w3-io/action-core@^0.6.1` landed here ahead of
      the rest of the ecosystem. Either (a) roll forward the other
      actions to 0.6.x or (b) relax the audit's C9 check to accept
      newer minors. Filed separately against w3-action-template.
