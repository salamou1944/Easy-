# Security Policy

## Security boundary
This repository must never contain live API keys, access tokens, OAuth client secrets, passwords, cookies, private certificates, customer credentials, or other private operational secrets.

Secrets belong in Replit/Railway/production secret management or protected environment variables, never in source files, issues, pull requests, logs, or documentation.

## Reporting a suspected leak
Do not copy or repost a suspected credential. Report the file/path and commit reference privately to `easy@agentmail.to` so it can be contained and rotated.

## Public disclosure boundary
Public content must remain limited to code and documentation that is safe to disclose. Runtime secrets, private customer data, internal credentials, and private operational material must remain outside the public repository.

## Remediation rule
Any real credential committed to Git history is treated as compromised and must be revoked/rotated before cleanup.
