# TachoPlan Fleet

A fleet planning board for EU road transport, built around **Regulation (EC) 561/2006** — driving times, breaks and rest periods. Plan up to 60 trucks per day, see every tour as a tachograph-style strip, and catch violations *before* they happen on the road.

Built by a professional truck driver who moved into transport planning: the tool models the rules at the level of minutes, the way a tachograph does — not approximately.

![icon](icon-192.png)

## Features

**Per-tour simulation (daily rules)**
- Automatic 45-minute breaks inserted after each 4h30 of accumulated driving (Art. 7)
- Split break support: 15 min + 30 min in the correct order — after a 15-minute first part the planner auto-inserts only the remaining 30 minutes
- Daily driving limits 9h / 10h extended (Art. 6), shift-span checks 13h / 15h tied to daily rest requirements
- Amazon-style slot check: arrival vs. booked slot with live buffer; < 20 min buffer flags RISK
- Live disruptions per truck: **traffic delay** (counts as driving — burns hours, can trigger an extra break) and **ramp queue** (other work — shifts arrival only), with one-tap +15/+30
- **Multi-manning (crew of 2)**: per-segment driver assignment D1/D2, ≥45 min as passenger in a moving vehicle counts as a break, 21h crew span inside the 30h window

**Per-driver weekly analytics (multi-day rules)**
- Fixed weeks Mon 00:00 – Sun 24:00, exactly as the regulation defines them
- Weekly driving 56h and two-week 90h limits (Art. 6), max 2 extended (>9h) days per week
- Daily rest between duty days: 11h regular / 9h reduced, max 3 reduced between weekly rests (Art. 8)
- Weekly rest detection: regular ≥45h / reduced ≥24h, **compensation tracking** with due dates (en bloc, by end of the 3rd following week), warning on two consecutive reduced weekly rests (Art. 8(6)), weekly-rest-overdue check after six 24h periods
- DRIVERS view: week bars per driver, 10h-days used, rest history, all issues in one card — and violations escalate onto the board row of the affected truck

**Workflow**
- Day-by-day boards with date navigation and one-click "copy previous day"
- CSV import: file upload or paste straight from Excel (TAB/;/, auto-detected), replace or append per date — load the whole fleet in one click from a TMS export
- CSV export of any day, Excel-friendly (UTF-8 BOM, semicolons)
- LEGAL / RISK / VIOLATION filters, duplicate trucks, per-day delay reset
- Installable **PWA**: works offline, "Add to Home Screen" on a phone gives a full-screen app

## Quick start

No build, no dependencies — one HTML file plus a manifest and service worker.

- **Local:** open `index.html` in any modern browser (data persists in the browser via localStorage).
- **Deploy:** drop the folder onto [Netlify](https://app.netlify.com/drop), or enable GitHub Pages on this repo. Any static host works.

## CSV format

```
truck;driver;driver2;crew;date;start;slot;extended;segments
TRK-01;Ivan Petrov;;;2026-08-10;05:30;16:30;;drive:4h30:To FC DTM2|other:30:Trailer swap|drive:3h45:To FC CGN1
TRK-02;Ana Pop;Boris Ionescu;1;;06:00;20:00;;drive:4h00:Leg A|drive2:4h00:Leg B (D2)|other:45:Swap
```

- Columns in any order, case-insensitive; delimiter auto-detected (`;` `,` or TAB — pasting straight from Excel works)
- `segments` = `type:minutes:label|…` where type is `drive`, `drive2` (crew, D2), `other`/`work`, `break`; minutes accept `300`, `5h00`, `5:30`
- Empty `date` = the day currently open on the board

## Honest limits

This is a planning aid, not a legal record. Ferry/train derogations, out-of-scope driving, and Art. 12 exceptional circumstances are not modelled; weekly stats only see the days present in the planner. The final authority is always the tachograph.

## Tech

Single-file vanilla JavaScript (~40 KB), zero dependencies, localStorage persistence, service-worker PWA. Dark, night-shift-friendly UI.
