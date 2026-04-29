## 2025-01-24 - authentication timing attack mitigation
vulnerability: use of standard string comparison for authentication tokens allows for timing attacks.
learning: comparing sensitive tokens using `===` in Node.js can reveal information about the token's content through execution time differences.
prevention: always use `crypto.timingSafeEqual` when comparing authentication tokens, passwords, or any other sensitive secrets.

## 2025-01-24 - restrictive credential file permissions
vulnerability: persistent credentials stored in `.credentials.json` were created with default file permissions, potentially allowing other users on the system to read them.
learning: when persisting sensitive information to disk, default file permissions (often 0644) are too permissive.
prevention: explicitly set restrictive permissions (e.g., 0600) using `writeFile` mode option and `chmod` to ensure the file is only readable and writable by the owner.
