# Rinox Tracking — UI

A single-file, read-only dashboard over the **Rinox Tracking** Google Sheet.

## Installing as a mobile app (PWA)

The site is an installable Progressive Web App — same codebase, no App
Store/Play Store needed:

- **iPhone**: open the link in Safari → Share → **Add to Home Screen**.
- **Android**: open the link in Chrome → ⋮ menu → **Install app** (or
  **Add to Home Screen**).

It then opens full-screen with its own icon, no browser address bar. A
service worker (`sw.js`) caches the app shell so it opens instantly and
still loads offline — but it never caches the live sheet data itself (see
`sw.js` for why): offline, you get the app with a clear "Sync failed"
state, never a stale number presented as current.

To update the installed app after a change: just push to `main` — the
service worker picks up the new shell within a page load or two.

## Overview tab

The landing tab (`#overview`) is a business dashboard built from Live +
Completed + Claims combined: revenue by month (stacked bar, Chart.js), buyer
exposure and top suppliers (bar charts), material/origin mix and claims
(donut charts), booking lead time & transit time, and a "Needs follow-up"
list — completed contracts whose REMARKS don't confirm payment despite a
balance still showing.

**"Revenue" here means invoiced value (turnover), not profit** — the sheet
has no supplier cost column, so true margin can't be computed from it.

Two upstream data quirks are corrected for in this view, not just displayed:
- The two oldest COMPLETED contracts predate the current column layout (their
  fields are shifted one cell) — detected and excluded from the totals, with
  a note on the page saying how many.
- `BAL INVOICE VALUE` is never zeroed out once a deal is marked COMPLETED, so
  REMARKS (*"FINAL PAYMENT DONE"* etc.) are trusted over that column; a
  completed contract with a balance and **no** such remark lands in "Needs
  follow-up" instead of being silently counted as paid.

## Cancelled tab

The **Cancelled** tab reads the sheet's `CANCELLED` tab (any capitalisation)
and uses the same columns as LIVE/COMPLETED. Cancelled contracts are **not**
counted in revenue, collected, outstanding, volume or any chart; the Overview
shows only their count (and contracted MT) under the operational stats.

The Cancelled tab has its own table: TS, contract (+date), supplier → buyer,
material (+origin), qty (+price/MT), contract value (the invoice value if the
sheet has one, otherwise qty × price when there is a single price — marked
"qty × price"), payment terms, status and remarks. A heading-less column right
after CONTRACT DATE is read as PAYMENT TERMS.

The Overview is built to support decisions about cancellations:

- **Cancelled tile** (top row) — contract value cancelled, contract count and
  its share of total value (cancelled ÷ (cancelled + invoiced)). Contract value
  is the invoice value if the sheet has one, otherwise qty × price when the
  contract has a single price; unpriced contracts are counted and flagged.
- **Cancellations donut** (under Claims) — value by outcome: Completed / Live
  (invoiced) vs Cancelled (contract value); the legend shows value and count.
- **Follow-up list** — only what the data shows: advance recorded on cancelled
  contracts (confirm it was received, then refund/adjust), a buyer or supplier
  with a high cancellation rate (≥2 cancelled and ≥50% of their contracts),
  cancelled contracts with no reason in Remarks, and contracts that can't be
  valued.
- **Cancelled by buyer / supplier** — bar = value cancelled, small text =
  cancelled of that party's contracts (cancellation rate).

Everything drills down to the contracts behind it. When the tab can't be read,
or is empty, a note above the charts says why.

If a contract appears on CANCELLED *and* still on LIVE or COMPLETED (copied
across but the old row not deleted), the Cancelled entry wins — it is dropped
from the Live/Completed figures and the page says how many were affected.

Google's endpoint silently returns the first tab (LIVE) when a tab name
doesn't match, so the dashboard checks the reply against LIVE and shows
"No tab named CANCELLED found" rather than double-counting LIVE.

Supplier/buyer/material names are shown exactly as typed in the sheet
(`DONGA` vs `DONGA-SPECIAL` are kept separate) — nothing is auto-merged.

## Run it

Double-click `index.html`. That's it — no build, no install, no server.

To share it with colleagues, drop `index.html` on any static host
(GitHub Pages, Netlify drop, Google Drive "publish", an S3 bucket).

## How it reads the sheet

It calls Google's `gviz` endpoint for each tab and loads the reply as a script
(JSONP), so it needs no API key, no OAuth and no backend — and it works from
`file://` as well as from a web host. The Overview tab's charts load Chart.js
from a CDN, so an internet connection is required either way.

This works because the spreadsheet is currently shared as **"anyone with the
link can view"**. If that sharing is tightened, the dashboard will stop loading
and show an error per tab.

Column mapping is by **header name**, not position, so inserting a column in
Sheets will not break it. Renaming a header will — update the `h:` entries in
`SHIPMENT_FIELDS` / `CLAIM_FIELDS` near the top of the script if you do.

## Behaviour notes

- A contract spanning several merged rows (one per lot/container) is shown as
  one record; quantities and values are totalled, per-MT prices are listed
  rather than summed, and the lot lines appear in the detail panel.
- Rows holding only a TS number are treated as placeholders and hidden.
- Data refreshes on load, on **Refresh**, and automatically every 5 minutes.
- `#live`, `#completed`, `#claims`, `#cancelled` in the URL open that tab directly.
- Press `/` to jump to search; `Esc` closes the detail panel.

## Editing

Editing still happens in Google Sheets — this is a view. Every detail panel has
an **Edit in Google Sheets** link.
