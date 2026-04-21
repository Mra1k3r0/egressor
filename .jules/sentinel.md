## 2025-05-14 - [Mitigating Timing Attacks in Proxy Authentication]
**Vulnerability:** Use of standard string comparison (`===`) for proxy authentication tokens was susceptible to timing attacks, allowing an attacker to potentially deduce the correct token by measuring response times.
**Learning:** In Node.js, `crypto.timingSafeEqual` is the standard for constant-time comparisons, but it requires both inputs to be Buffers of identical length, otherwise it throws a `TypeError`.
**Prevention:** Always use `crypto.timingSafeEqual` for comparing secrets, and ensure that a length check (on Buffers, not strings) is performed beforehand to prevent application crashes from `TypeError`.
