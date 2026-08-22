# Security notes for this site

This is a static site, so several defenses are already baked into the HTML/CSS/JS
(CSP meta tag, no inline scripts, honeypot + time-trap on both forms, `rel="noopener
noreferrer"` on new-tab links). A few controls can only be set by whatever serves the
static files — configure these at the host/CDN level before going live:

| Header | Recommended value | Why |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS on every visit, blocks downgrade/MITM attacks. Cannot be set via `<meta>`. |
| `X-Content-Type-Options` | `nosniff` | Stops browsers from MIME-sniffing responses. Cannot be set via `<meta>`. |
| `X-Frame-Options` | `DENY` | Legacy clickjacking protection for browsers that don't honor CSP `frame-ancestors`. |
| `Permissions-Policy` | `geolocation=(), camera=(), microphone=()` | Disables browser features the site never uses. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Already set via `<meta name="referrer">`, but a header takes precedence and covers more resource types. |

## Before going live

- Replace `FORM_ENDPOINT` and `LEAD_ENDPOINT` in `script.js` with real backends, and update
  `connect-src`/`form-action` in the CSP `<meta>` tags in `index.html`, `checklist.html`,
  `privacy.html`, and `terms.html` to match the real domain(s).
- Replace all `nexovait.example` references (canonical URLs, JSON-LD, sitemap.xml,
  robots.txt, security.txt) with the real production domain.
- Server-side validation is required — the client-side checks in `script.js` (honeypot,
  time-trap, field validation) deter casual bots and typos but are not a substitute for
  validating and rate-limiting submissions on whatever backend receives them.
- Rotate the `security.txt` `Expires` date at least annually.
