## 2025-01-24 - [AuthService Redundancy]
vulnerability: none (code cleanup)
learning: the AuthService contained both synchronous and asynchronous methods for credential initialization, but only the synchronous one was utilized by the constructor.
prevention: always verify method usage across the codebase before assuming it is required for functionality.
