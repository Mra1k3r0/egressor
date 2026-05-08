## 2025-05-22 - hardening authentication and connection security
vulnerability:
- insecure ssl verification: 'rejectUnauthorized' was set to 'false' in HttpsAgent, allowing mitm attacks.
- timing attack: proxy authentication used standard string comparison '===' which is vulnerable to timing attacks.
- insecure file permissions: '.credentials.json' was saved with default permissions, potentially exposing secrets to other local users.
learning: standard library defaults or explicit 'false' settings for convenience often bypass critical security controls.
prevention: always use 'crypto.timingSafeEqual' for secret comparisons, enforce 'rejectUnauthorized: true' in production-ready agents, and use restricted file modes (0o600) for sensitive data.
