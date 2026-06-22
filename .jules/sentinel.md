## 2025-05-14 - timingSafeEqual for Basic Auth
**Vulnerability:** Basic authentication was using standard string comparison, which is susceptible to timing attacks.
**Learning:** Even simple authentication tokens should be compared using constant-time algorithms to prevent bit-by-bit guessing via response time analysis.
**Prevention:** Always use `crypto.timingSafeEqual` for sensitive comparisons and ensure buffer lengths are checked before comparison.
