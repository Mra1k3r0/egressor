## 2026-04-22 - [Secure Authentication and Credential Storage]
**Vulnerability:** Potential timing attack on proxy authentication token comparison and insecure default file permissions for credential storage.
**Learning:** Standard string comparison (`===`) in Node.js is not constant-time, allowing for potential token discovery through timing analysis. Also, default file creation permissions often allow reading by other users on the system.
**Prevention:** Use `crypto.timingSafeEqual` for sensitive comparisons (ensuring equal buffer lengths) and explicitly set file modes to `0o600` when writing sensitive data to the filesystem.
