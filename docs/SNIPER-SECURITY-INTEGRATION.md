# SNIPER security integration

EASY adopts SNIPER as a defensive first-deviation security pattern for the product and its runtime boundaries.

SNIPER should observe authenticated, auditable signals such as:
- seller/admin identity and session changes
- new devices or network origins
- credential/token and permission changes
- API/webhook destination changes
- deployment/configuration/schema changes
- provider integration changes
- unexpected automation or agent/tool activity

A single anomaly is not treated as proof of compromise. Signals are correlated with approved changes, deployment provenance, and expected automation.

Response remains defensive: alert, step-up verification, revoke/rotate affected credentials, isolate an affected workload, preserve evidence, restore a known-good state, and independently verify recovery.

EASY must never use SNIPER for counter-intrusion, retaliation, or modification/deletion of third-party systems or data.

This document is an architectural integration note; runtime adapters should be added only where they can operate with least privilege and without introducing secrets into source control.
