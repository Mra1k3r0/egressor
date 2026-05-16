## 2025-01-24 - [security] harden credentials handling and enable ssl verification
vulnerability: missing timing-safe comparison in auth, insecure file permissions for credentials, and disabled ssl verification.
learning: standard string comparison is vulnerable to timing attacks; default file creation might be too permissive; disabling ssl verification in proxy servers exposes traffic to mitm.
prevention: use crypto.timingSafeEqual for auth tokens, enforce restrictive file modes (0o600) for sensitive data, and ensure rejectUnauthorized is true in HttpsAgent.
