## 2025-05-15 - [Auth Hardening & SSL Verification]
vulnerability: Insecure SSL verification (rejectUnauthorized: false), potential timing attacks in Basic Auth comparison, and insecure file permissions for persisted credentials.
learning: The proxy server was explicitly disabling SSL verification for its HTTPS agent, making it vulnerable to MitM. Authentication used standard string comparison which is vulnerable to timing attacks.
prevention: Always enable SSL verification by default. Use `crypto.timingSafeEqual` for sensitive comparisons (with a preceding length check). Ensure sensitive files are written with restricted permissions (e.g., 0o600).
