---
paths:
  - "src/services/**"
  - "src/contexts/**"
  - "src/hooks/**"
---

# Security

## Frontend-Specific

- Never store sensitive data (tokens, secrets, PII) in localStorage or sessionStorage without encryption.
- Use httpOnly cookies for auth tokens (managed by backend).
- Sanitize all user input before displaying to prevent XSS. React escapes by default, but never use `dangerouslySetInnerHTML`.
- Validate input on client-side for UX, but always validate on server-side.
- Never concatenate user input into fetch URLs or API calls.
- Assume all data from `localStorage` is untrusted (users can modify it).
- Never log tokens, API keys, passwords, or PII to console or Sentry.

## API Integration

- Set appropriate request headers (Content-Type, CORS).
- Handle 401/403 responses by clearing auth state and redirecting to login.
- Use HTTPS for all API calls (enforce in production).
- Validate API responses match expected schema before using.
