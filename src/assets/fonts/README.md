# Fredoka

The typeface used across the app and on the shareable scorecard, matching
dbmci.com/class-of-27.

- Two subsets of the variable font, weight axis 300 to 700, downloaded from
  Google Fonts (`fonts.gstatic.com`, Fredoka v17).
- `fredoka-latin.woff2` (30KB) covers everything the interface writes.
  `fredoka-latin-ext.woff2` (4.6KB) is insurance: college names come from the
  database and could carry an accent.
- Licensed under the SIL Open Font License 1.1. Full text in `OFL.txt`.

Self-hosted rather than linked from Google: GitHub Pages already serves this
origin, so the font arrives on a connection the browser has open instead of
costing a DNS lookup and TLS handshake to two more hosts before a glyph can
paint.
