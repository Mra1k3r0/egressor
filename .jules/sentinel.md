## 2025-05-15 - [disabled-ssl-verification]
vulnerability: SSL/TLS certificate verification was explicitly disabled (`rejectUnauthorized: false`) in the HTTPS agent used by the connection pool.
learning: This configuration left the proxy vulnerable to Man-in-the-Middle (MitM) attacks when communicating with upstream HTTPS servers, likely introduced during development to bypass certificate issues but never reverted.
prevention: Always default to `rejectUnauthorized: true` in production environments and use environment-specific overrides or CA injection if internal/self-signed certificates must be supported.
