# Rinox Tracking — UI

A single-file, read-only dashboard over the **Rinox Tracking** Google Sheet.

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
- `#live`, `#completed`, `#claims` in the URL open that tab directly.
- Press `/` to jump to search; `Esc` closes the detail panel.

## Editing

Editing still happens in Google Sheets — this is a view. Every detail panel has
an **Edit in Google Sheets** link.
