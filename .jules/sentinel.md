## 2026-06-18 - [harden-auth-and-transport]
vulnerability: timing side-channel in auth comparison and insecure transport defaults
learning: proxy servers are sensitive to timing attacks during auth; transport security must be enforced by default even if it breaks self-signed setups in dev
prevention: use timingSafeEqual for all secret comparisons; always default rejectUnauthorized to true
