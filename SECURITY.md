# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, please report it responsibly by emailing:

**Email:** beslagicadin@gmail.com

Please do **NOT** create a public GitHub issue for security vulnerabilities. You will receive a response within 72 hours acknowledging receipt.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## License

This software is proprietary. All rights reserved by Adin Beslagic. Any use, modification, or distribution requires prior written permission from the author. See the [LICENSE](LICENSE) file for full terms.

To request permission, contact: beslagicadin@gmail.com

## Environment Variables & Secrets

**NEVER commit `.env.local` files to version control.**

Use the provided template to create your local configuration:

```bash
cp .env.local.example .env.local
```

### Sensitive Variables

| Variable | Risk | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | MEDIUM | Public anon key — safe for browser, but rotate if leaked with the URL |
| `NEXT_PUBLIC_SUPABASE_URL` | LOW | Public Supabase project URL |
| `NEXT_PUBLIC_BACKEND_URL` | LOW | Backend API URL |

### Rules

- All `NEXT_PUBLIC_*` variables are embedded into the client bundle at build time — they are **visible to end users**
- **Never** put `SUPABASE_SERVICE_ROLE_KEY` or any backend secret in frontend environment variables
- The `anon` key is designed to be public, but relies on Supabase Row Level Security (RLS) for protection

## Authentication

- **Supabase Auth** handles all authentication (email/password + Google OAuth)
- JWT tokens are stored in Supabase's secure cookie/session mechanism
- `AuthProvider` context manages session state and auto-fetches the user profile from the backend
- Users without a complete profile are redirected to `/complete-profile`

### Session Security

- Tokens are validated server-side by the backend on every API call and WebSocket handshake
- Session expiry is managed by Supabase Auth defaults
- Sign-out disconnects the WebSocket and clears the session

## Client-Side Security

### XSS Prevention

- All user-provided content rendered in Leaflet popups is escaped via `escapeHtml()` before injection
- React's JSX automatically escapes interpolated values
- No use of `dangerouslySetInnerHTML`

### WebSocket

- Socket.io client sends the JWT token during handshake (`auth: { token }`)
- Connection is rejected server-side if the token is invalid or expired
- The socket singleton ensures only one connection exists at a time

### External Resources

- Leaflet tile layers are loaded from trusted CDN sources (OpenStreetMap, OpenTopoMap, Esri)
- APRS symbol sprites are loaded from a pinned GitHub CDN URL
- No user-uploaded content is rendered without sanitization

## Production Deployment Checklist

- [ ] Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` point to the production Supabase project
- [ ] Verify `NEXT_PUBLIC_BACKEND_URL` points to the production backend (HTTPS)
- [ ] Ensure HTTPS is enforced on the frontend domain
- [ ] Confirm Supabase RLS policies are enabled and tested
- [ ] Review Content Security Policy headers (restrict script and connect sources)
- [ ] Disable React strict mode artifacts in production build
- [ ] Set up monitoring for client-side errors
- [ ] Keep all dependencies up to date (`npm audit`)

## Third-Party Services

| Service | Usage | Security Notes |
|---|---|---|
| **Supabase** | Auth + profile management | `anon` key only — never expose `service_role` here |
| **OpenStreetMap / OpenTopoMap / Esri** | Map tiles | Trusted tile providers, no auth required |
| **Socket.io** | Real-time position streaming | Authenticated via JWT on handshake |

## Dependency Management

- Run `npm audit` regularly and address vulnerabilities promptly
- Pay special attention to updates for `next`, `react`, `@supabase/supabase-js`, and `socket.io-client`
- Review Next.js security advisories for each major version upgrade
