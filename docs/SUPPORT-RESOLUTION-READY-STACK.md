# Support Resolution Engine — Ready Stack

## Decision

Use Chatwoot as the conversation/inbox layer and keep EASY's Support Resolution Engine as the business decision layer.

Do not copy or fork the support-agent-stack or helpdesk-agent code into EASY at this stage. Adopt their strongest patterns as contracts:
- retrieve approved evidence before answering;
- classify before response generation;
- escalate risky or uncertain cases;
- redact sensitive data from logs;
- preserve an auditable conversation timeline;
- require human approval before high-impact external actions.

## Ready integration

EASY now contains a provider-neutral Chatwoot adapter:
- src/providers/chatwoot.mjs
- test/chatwoot-provider.test.mjs

The adapter supports:
1. Normalizing message_created incoming webhook events.
2. Sending an outgoing reply to a Chatwoot conversation.
3. Changing a conversation status.
4. Rejecting malformed configuration and unsupported status values.
5. Verifying the Chatwoot webhook HMAC signature before accepting an inbound event.
6. Emitting a stable eventId for downstream idempotency/deduplication.
7. Ignoring outgoing messages to prevent a basic reply loop.

Chatwoot exposes REST APIs and webhooks for conversations and messages and supports self-hosting. The core repository is MIT outside the enterprise directory; enterprise components have separate licensing. Do not copy enterprise code into EASY.

## Production pilot boundary

Chatwoot webhook -> support resolver -> approved order/customer context -> policy gate -> draft -> human approval

For the first pilot, replies remain draft/human-approved.

Automatic resolution is allowed only after the resolver has real order data, explicit client policies, deterministic risk gates, and evidence-backed evaluation.

## Environment contract

- EASY_CHATWOOT_BASE_URL
- EASY_CHATWOOT_API_TOKEN
- EASY_CHATWOOT_ACCOUNT_ID
- EASY_CHATWOOT_WEBHOOK_SECRET

Secrets must never be committed. The inbound handler must verify the raw request body against the webhook secret before JSON parsing or business processing. Downstream processing should deduplicate by `eventId` before invoking the resolver.

## Current gate

This adapter is an integration foundation, not proof of a live Chatwoot deployment. A real pilot requires a reachable Chatwoot instance, valid credentials, a real inbound webhook, and real customer/order data.