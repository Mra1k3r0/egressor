## 2026-04-28 - [Secure Auth & File Permissions]
vulnerability: Potential timing attacks on Basic Auth tokens and insecure file permissions on stored credentials.
learning: Using standard comparison for sensitive tokens is vulnerable to timing analysis. Stored credentials should have restrictive permissions to prevent unauthorized access by other local users.
prevention: Always use timingSafeEqual for sensitive data comparison. Set file permissions to 0o600 for credential storage.
