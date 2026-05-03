## 2025-01-24 - authentication and transport security hardening
vulnerability: multiple security issues including timing attacks in auth token comparison, insecure file permissions for persisted credentials, and disabled ssl verification in the connection pool.
learning: the application used standard string comparison for secrets, lacked explicit permission control on sensitive credential files, and explicitly disabled tls validation in its https agent.
prevention: always use `crypto.timingSafeEqual` for secret comparison, set strict file permissions (e.g., 0o600) for sensitive data, and never disable ssl verification (`rejectUnauthorized: false`) in production code.
