## 2026-05-05 - timing-safe authentication
vulnerability: authentication tokens compared using standard string equality (===) are vulnerable to timing attacks
learning: Node.js provides crypto.timingSafeEqual for secure comparison of secrets, but requires matching buffer lengths
prevention: always use timingSafeEqual for secrets and perform a length check before comparison
