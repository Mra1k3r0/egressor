## 2026-05-18 - [insecure defaults and timing leaks]
vulnerability: disabled tls verification and timing-unsafe auth comparison
learning: the codebase explicitly disabled tls verification in the connection pool (rejectUnauthorized: false) and used standard string comparison for auth headers.
prevention: always enforce rejectUnauthorized: true for proxy agents and use timingSafeEqual for all authentication token comparisons. ensure local secret files use restricted permissions (0o600).
