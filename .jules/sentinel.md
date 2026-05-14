## 2025-05-15 - [Hardening Authentication and Transport]
vulnerability:
- proxy-authorization was compared using standard string equality (===), susceptible to timing attacks.
- .credentials.json was created with default file permissions, potentially exposing it to other users on the system.
- HttpsAgent had rejectUnauthorized set to false, allowing Man-in-the-Middle (MitM) attacks.
learning:
- even simple Basic Auth implementations need timingSafeEqual to be fully secure against side-channel attacks.
- credential persistence must consider filesystem-level security (file modes).
- internal connection pools might default to insecure TLS settings for "convenience," which must be overridden.
prevention:
- always use crypto.timingSafeEqual for sensitive comparisons.
- use mode 0o600 for sensitive files.
- enforce strict TLS verification (rejectUnauthorized: true) by default.
