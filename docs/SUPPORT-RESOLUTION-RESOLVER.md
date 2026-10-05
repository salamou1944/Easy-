# Support Resolution Resolver Contract

The resolver is the decision layer between Chatwoot and customer/order systems.

## Flow
Chatwoot event -> normalize -> classify -> retrieve approved context -> policy gate -> draft -> human review/auto-resolve candidate.

## Safety contract
- No order/customer context means no evidence-backed resolution.
- Risky intents (refund, payment, account access, cancellation, complaint) remain human-reviewed.
- Auto-resolution is opt-in per intent and requires an explicit confidence threshold.
- The resolver never invents order facts.
- The first commercial pilot should use `human_review` for every outbound action.
- A downstream adapter must deduplicate Chatwoot `eventId` before calling the resolver.

## Integration boundary
Implement `contextProvider({ticket, classification})` against the client's real order/CRM system. Implement `policyProvider(ticket)` against the client's written support policy. These providers are deliberately injected so EASY does not pretend a mock order database is production data.

## Current state
The resolver and tests are production-shaped decision logic, but **not a live customer integration**. Live pilot proof still requires a real Chatwoot instance, real order/customer source, written client policy, and human-approved outbound flow.