## 2025-05-14 - Timing attack in auth token comparison
vulnerability: use of standard string comparison (===) for proxy authentication tokens
learning: standard comparison is not constant-time, allowing attackers to guess tokens by measuring response times
prevention: always use crypto.timingSafeEqual for comparing sensitive data like tokens or passwords

## 2025-05-14 - Insecure credential file permissions
vulnerability: .credentials.json created with default file permissions
learning: default permissions may allow other users on the system to read sensitive proxy credentials
prevention: explicitly set file permissions to 0o600 (owner read/write only) when creating sensitive files
