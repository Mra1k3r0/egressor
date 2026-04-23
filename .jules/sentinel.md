## 2025-04-23 - Hardening Proxy Authentication and Storage
**Vulnerability:** Timing attack vulnerability in token comparison and insecure file permissions for persistent credentials.
**Learning:** Using standard string comparison for authentication tokens is susceptible to timing attacks. Credentials stored on disk should use restrictive file permissions (0600) to prevent unauthorized access by other users on the system. Additionally, the project was using a version of `http-proxy` vulnerable to request smuggling (CVE-2021-32831).
**Prevention:** Always use `crypto.timingSafeEqual` for sensitive comparisons, ensuring buffers have equal length first. Use explicit file modes when writing sensitive files. Regularly audit and upgrade core dependencies like `http-proxy`.
