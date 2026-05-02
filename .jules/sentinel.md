## 2025-05-15 - proxy security hardening
vulnerability: missing upstream ssl verification, timing attack vulnerability in auth, and insecure credential file permissions
learning: the proxy was disabling ssl verification for all https requests, and using loose string comparison for basic auth tokens which are susceptible to timing attacks
prevention: always enable rejectUnauthorized for production agents, use timingSafeEqual for secret comparisons, and enforce strict file permissions (0o600) for sensitive local data
