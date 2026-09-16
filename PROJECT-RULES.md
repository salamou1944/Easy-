# EASY Project Rules

These rules apply before every implementation action and before every status response.

1. Review this rules list before responding or changing the repository.
2. Inspect the real current repository state before claiming work is complete.
3. Separate planned work from implemented and verified work.
4. For every failure: identify the root cause, fix it, test it, then verify the resulting state.
5. Never commit secrets, API keys, OAuth tokens, cookies, passwords, or private credentials.
6. Prefer free/no-key experiments for first validation when they are sufficient.
7. Use provider-neutral boundaries; seller-facing flows must not depend directly on external providers.
8. Treat imported/external data as untrusted input. Product DNA and Product Integrity remain authoritative.
9. Do not silently overwrite conflicting product facts; surface conflicts for validation.
10. Keep customer/order data to the minimum required and avoid unnecessary PII.
11. Do not count files, commits, workflows, or plans as success by themselves; success requires a practical, testable capability.
12. Do not spend time polishing a completed component unless verification shows it is broken or blocking a usable outcome.
13. When a live credential or external dependency is unavailable, use a safe fixture/mock path so development does not stall.
14. Prioritize work that moves EASY toward a usable/sellable capability and can also support the Revenue Engine (keyword: `mony`).
15. Before each new response, re-check this list and the current repository state; do not rely on stale assumptions.
