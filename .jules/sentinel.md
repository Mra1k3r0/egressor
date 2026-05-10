## 2025-05-14 - [timing-safe authentication and transport security]
vulnerability: proxy authentication was susceptible to timing attacks, and SSL verification was disabled in the connection pool.
learning: standard string comparison for tokens can leak information via timing; disabling 'rejectUnauthorized' in 'HttpsAgent' is a common but dangerous pattern that enables MitM attacks.
prevention: always use 'crypto.timingSafeEqual' for secret comparisons after a length check; ensure SSL verification is enabled ('rejectUnauthorized: true') by default in all outbound agents.
