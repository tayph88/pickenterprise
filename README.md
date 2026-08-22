# Nexova IT

Static marketing site for Nexova IT (managed IT, cloud, cybersecurity, and
network infrastructure). No build step — open `index.html` or serve the folder
as-is.

## Pages

- `index.html` — home page: hero, stats, About/company history timeline, services,
  illustrated "Our Work" gallery, IT Security Checklist lead magnet, testimonials,
  FAQ, contact form.
- `checklist.html` — the lead magnet's gated resource (also printable/savable as PDF).
- `privacy.html`, `terms.html` — legal pages linked from the footer.
- `robots.txt`, `sitemap.xml`, `.well-known/security.txt` — SEO/security metadata.
- Floating WhatsApp chat widget (bottom-right, every page) — suggested-query buttons open
  `wa.me` with a prefilled message. Number is set once in `WHATSAPP_NUMBER` at the top of
  `whatsapp-widget.js`.
- `*.jpg` (project root) — free stock photography (see `IMAGE-CREDITS.md` for sources).
  These are generic stock photos, not real Nexova IT staff/facilities — swap for real
  company photography when available.

## Before deploying to production

This is template content — replace these placeholders first:

- **Domain**: every `nexovait.example` reference (canonical URLs, JSON-LD,
  `sitemap.xml`, `robots.txt`, `security.txt`) → your real domain.
- **Form backends**: `FORM_ENDPOINT` and `LEAD_ENDPOINT` in `script.js` are
  placeholders. Once wired to a real endpoint, update the `connect-src` and
  `form-action` values in the `Content-Security-Policy` `<meta>` tag in every
  HTML file to match.
- **`og-image.png`**: referenced in Open Graph/Twitter meta tags but not included —
  add a real 1200×630 social preview image.
- **Contact details**: phone, address, and social links in the footer and JSON-LD
  are placeholders.
- **Server-side security headers**: see `SECURITY.md` — HSTS, `X-Content-Type-Options`,
  etc. can't be set via `<meta>` and must be configured at the host/CDN.

See `SECURITY.md` for the full pre-launch security checklist.
