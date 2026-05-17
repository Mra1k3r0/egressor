## 2025-01-24 - [Security Hardening]
vulnerability: Insecure SSL verification, timing attack in auth, and overly permissive credential file permissions.
learning: The proxy was explicitly disabling SSL verification (`rejectUnauthorized: false`) which exposes users to MitM attacks. Authentication used direct string comparison, vulnerable to timing attacks. Credential files were created with default system permissions.
prevention: Always enforce SSL verification by default. Use `crypto.timingSafeEqual` for secret comparisons. Set explicit restrictive permissions (0600) when writing sensitive files.
