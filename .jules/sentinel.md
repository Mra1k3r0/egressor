## 2026-05-04 - [hardening authentication and transport security]
vulnerability: missing SSL verification, potential timing attacks on auth tokens, and permissive credential file permissions.
learning: the proxy was explicitly disabling SSL verification with rejectUnauthorized: false, and using standard string comparison for auth tokens.
prevention: always enable SSL verification by default, use timingSafeEqual for sensitive comparisons, and enforce restricted file permissions (0o600) for stored credentials.
