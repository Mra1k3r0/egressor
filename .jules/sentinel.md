## 2025-05-14 - [auth/transport hardening]
vulnerability: multiple gaps: timing attack in basic auth, disabled ssl verification, and insecure credential file permissions.
learning: core infrastructure components (connection pools, auth services) often contain legacy "convenience" settings like `rejectUnauthorized: false` or default file permissions that undermine security.
prevention: always enforce `rejectUnauthorized: true` for outgoing proxy traffic; use `crypto.timingSafeEqual` for all credential comparisons; explicitly set `0o600` for files containing secrets.
