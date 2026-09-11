# API Lab

This is the experimental layer of the repository. Its purpose is to turn the API/knowledge bank into working prototypes rather than a static list.

## Rules
- Prefer no-key/free APIs for first experiments.
- Never commit secrets, API keys, OAuth tokens, cookies or credentials.
- Every experiment records: API, endpoint, capability, result, limitations, and a possible real-world use case.
- Experiments are disposable prototypes; production code must use provider-neutral adapters and explicit validation.

## First verified experiments

### 01 — Pokémon Explorer
- API: PokéAPI
- Endpoint tested: `/api/v2/pokemon/pikachu`
- Result: endpoint responded successfully during verification.
- Prototype: `mini-apps/pokemon-explorer.html`
- Useful for: testing API consumption, search UX, caching, image rendering and mobile UI.

### 02 — Card Battle
- API: Deck of Cards API
- Endpoint tested: `/api/deck/new/shuffle/?deck_count=1`
- Result: endpoint responded successfully during verification.
- Prototype: `mini-apps/card-battle.html`
- Useful for: game state, randomization, turn logic and API-backed game mechanics.

### 03 — Trivia Sprint
- API: Open Trivia Database
- Endpoint tested: `/api.php?amount=5&type=multiple`
- Result: endpoint responded successfully during verification.
- Prototype: `mini-apps/trivia-sprint.html`
- Useful for: quiz products, education, engagement loops and gamification.

## Company-problem experiments

The next experiments should target real operational pain, not just demos:

1. Customer-support triage — classify and route incoming questions.
2. Product catalog enrichment — turn incomplete product data into structured listings.
3. Market research — collect and normalize competitor/product signals.
4. Delivery visibility — normalize carrier tracking into one status model.
5. Ad creative intelligence — compare public ad signals and extract patterns.
6. Appointment/no-show reduction — reminders, status tracking and analytics.
7. Inventory alerts — detect low-stock/high-demand conditions.
8. Invoice/document extraction — convert documents into structured records.
9. Multilingual commerce — Arabic/French/English product and support workflows.
10. Internal knowledge assistant — answer staff questions from approved company documents.

Each problem will be converted into a small proof-of-concept before we consider production integration.
