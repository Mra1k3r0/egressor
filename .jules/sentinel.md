## 2026-05-07 - [Multiple Security Hardening]
vulnerability: Potential timing attacks in Basic Auth, MitM via disabled SSL verification, and local credential exposure via permissive file modes.
learning: The codebase prioritize performance/ease of use over security defaults (e.g., `rejectUnauthorized: false`).
prevention: Always audit default configurations for third-party agents and ensure secrets are stored with restricted permissions.
