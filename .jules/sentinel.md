## 2026-04-30 - timing attack and insecure credential storage
vulnerability: The `AuthService` used string comparison for authentication tokens, which is vulnerable to timing attacks. It also saved persistent credentials with default file permissions, potentially allowing other users on the system to read them.
learning: Insecure string comparisons can leak information about the correct token through timing differences. Credentials should always be stored with restrictive permissions (0o600) to ensure only the owner can access them.
prevention: Use `crypto.timingSafeEqual` for all credential comparisons. Explicitly set file permissions to `0o600` when writing sensitive information to disk.
