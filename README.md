# TachoPlan Fleet

A planning board for EU road transport, built around **Regulation (EC) 561/2006** — driving times, breaks and rest periods. Plan up to 60 trucks a day on one shared timeline, and catch violations *before* they happen on the road.

Built by a professional truck driver moving into transport planning: the tool models the rules to the minute, the way a tachograph does — not approximately.

![TachoPlan board](screenshot.png)

## What it does

**Per tour (daily rules)**
- 45-minute break inserted automatically after each 4h30 of accumulated driving (Art. 7); the **15 + 30 split** is recognised — after a 15-minute first part only the missing 30 is added
- Daily driving 9h / 10h extended (Art. 6); shift-span checks 13h / 15h tied to the daily rest that follows
- Slot feasibility: arrival against the booked Amazon slot with a live buffer; under 20 minutes flags RISK
- Live disruption per truck: **traffic delay** counts as driving — it burns hours and can force another break — while a **ramp queue** counts as other work and only shifts arrival
- **Multi-manning**: per-leg driver assignment, 45 minutes as passenger in a moving vehicle counted as a break, 21h crew span inside the 30h window

**Per driver (weekly rules)**
- Fixed weeks Mon 00:00 – Sun 24:00, exactly as the regulation defines them
- Weekly 56h and two-week 90h driving caps; at most two extended (>9h) days per week
- Daily rest between duty days: 11h regular / 9h reduced, at most three reduced between weekly rests (Art. 8)
- Weekly rest: regular 45h / reduced 24h, with **compensation tracked** — how much is owed and the date it is due; two consecutive reduced weekly rests flagged (Art. 8(6)); overdue weekly rest after six 24h periods
- A driver's weekly breach is raised on the board row of the truck they are on, so history cannot quietly sink tomorrow's tour

**Live, during the shift**
- The board keeps its own clock: the strip fills as the tour is driven, so the solid part is what the truck has actually done and the pale part is what is still ahead
- ETA per truck against the booked slot, and a tile counting who arrives within the hour — plus who is already overdue
- One tap marks a truck **arrived**; the actual time is kept next to the plan (`ARR 12:25 −0h15`), which is what an Amazon dispute needs later
- Refreshes itself every 30 seconds, and never while a field is being edited

**Trailer swaps**
- Swap is its own segment type — other work for the regulation, a different thing for the fleet: the truck leaves with a different trailer
- Each truck carries a trailer number and the board shows the chain, e.g. `TR-6633 → TR-9004`
- Two trucks that share a **meet code** are partners at a meet point. The tool checks whether their swap windows actually overlap, and warns when they do not (`no overlap with TRK-05 — trailers cannot change hands`) or when one waits too long for the other

**Working the board**
- One time scale for the whole day: every truck drawn on the same clock with an hour ruler, slot pins and a now marker, so tours are comparable at a glance
- KPI tiles (trucks, drivers, fleet driving time, tightest buffer, delays, tours to fix), status filters, search by truck or driver
- Day-by-day boards with date navigation and one-click copy of the previous day
- CSV import — a file or a straight paste out of Excel — and Excel-friendly CSV export
- Light and dark themes; installable as a PWA and runs offline

## Run it

No build, no dependencies.

- **Local:** open `index.html` in any browser. Data is stored in that browser (localStorage).
- **Deploy:** drop the whole folder onto [Netlify](https://app.netlify.com/drop) or enable GitHub Pages. Any static host works — keep `fonts/` next to `index.html`.

### URL parameters

| Parameter | Effect |
|---|---|
| `?demo` | loads a sample fleet with a week of history; nothing is saved |
| `&view=drivers` | opens the driver analytics view |
| `&open=TRK-04` | expands one truck's editor |
| `&q=karl` | filters the board by truck or driver |
| `&theme=dark` | forces a theme for this visit |

Example: `index.html?demo&open=TRK-04&q=karl`

## CSV format

```
truck;driver;driver2;crew;trailer;date;start;slot;extended;arrived;segments
TRK-05;Piotr Nowak;;;TR-6633;2026-08-10;06:30;14:40;;;drive:3h10:To meet point A2|swap:40:Meet A2 #TR-9004 @M1|drive:3h20:To FC SZZ1
TRK-08;Tomas Novak;;;TR-9004;;07:00;17:30;;;drive:2h30:To meet point A2|swap:40:Meet A2 #TR-6633 @M1|drive:3h40:To FC PRG2
```

- Columns in any order, case-insensitive; delimiter detected automatically (`;` `,` or TAB, so pasting from Excel works)
- `segments` = `type:minutes:label|…` where type is `drive`, `drive2` (crew, second driver), `other`/`work`, `swap`, `break`; minutes accept `300`, `5h00`, `5:30`
- A swap may carry `#TRAILER` (the trailer taken) and `@CODE` (the meet point shared with the partner truck): `swap:40:Meet A2 Bad Oeynhausen #TR-9004 @M1`
- An empty `date` means the day currently open on the board

## Honest limits

A planning aid, not a legal record. Ferry and train derogations, out-of-scope driving and Art. 12 exceptional circumstances are not modelled; weekly figures only count the days present in the planner. The final authority is always the tachograph.

## Tech

Vanilla JavaScript, no dependencies, no server — the fleet's data never leaves the device. Inter is bundled locally (variable woff2, one `@font-face` per unicode subset) so the board renders identically offline. Design tokens keep two colour systems apart: blue is interface chrome, while amber/green/red carry tachograph meaning.
