## 2025-05-06 - [ssl-verification-enforcement]
vulnerability: disabled ssl certificate verification (`rejectUnauthorized: false`) in upstream proxy connections.
learning: the codebase used a shared connection pool that explicitly bypassed ssl security, likely for development convenience, creating a critical mitm risk.
prevention: always default to `rejectUnauthorized: true` and use environment-specific ca configuration instead of disabling verification.
