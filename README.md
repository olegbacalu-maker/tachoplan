# TachoPlan Fleet

A planning board for EU road transport, built around **Regulation (EC) 561/2006** — driving times, breaks and rest periods. Plan up to 60 trucks a day on one shared timeline, and catch violations *before* they happen on the road.

Built by a professional truck driver moving into transport planning: the tool models the rules to the minute, the way a tachograph does — not approximately.

![TachoPlan board](screenshot.png)

## What it does

**Per tour (daily rules)**
- 45-minute break inserted automatically after each 4h30 of accumulated driving (Art. 7); the **15 + 30 split** is recognised — after a 15-minute first part only the missing 30 is added
- Daily driving 9h / 10h extended (Art. 6); shift-span checks 13h / 15h tied to the daily rest that follows
- Slot feasibility: arrival against the booked Amazon slot with a live buffer; under 20 minutes flags RISK
- Live disruption per truck: **traffic delay** counts as driving — it burns hours and can force another break — while a **ramp queue** counts as other work and only shifts arrival. Both are added to the end of the planned tour rather than inserted at the point they happened: the totals, the limits and the arrival time come out right, the strip shows them as a tail
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
- **Breaks the driver actually took.** The 4h30 rule sets the latest moment for a break, not the exact one, and drivers routinely stop earlier. One tap stamps the real time, the break cuts the plan where it happened and resets the counter there, and the row counts the rest of it down (`BREAK 0h22`). The tool then answers the question that follows: an early stop is legal, but if the stretch still to drive now passes 4h30 it forces a second break, and the warning says so with the exact cost
- Refreshes itself every 30 seconds, and never while a field is being edited

**Trailer swaps**
- Swap is its own segment type — other work for the regulation, a different thing for the fleet: the truck leaves with a different trailer
- Each truck carries a trailer number and the row shows where it starts and ends, e.g. `TR-6633 → TR-9004`; every individual swap is listed inside the truck's editor
- Two trucks that share a **meet code** are partners at a meet point. The tool checks whether their swap windows actually overlap, and warns when they do not (`no overlap with TRK-05 — trailers cannot change hands`) or when one waits too long for the other

**Working the board**
- One time scale for the whole day: every truck drawn on the same clock with an hour ruler, slot pins and a now marker, so tours are comparable at a glance
- KPI tiles — trucks, tightest slot buffer, delays and tours to fix, joined on the current day by "arriving within 1h" and "arrived" — status filters, and search across truck, driver, trailer number, leg label and meet code
- Day-by-day boards with date navigation and one-click copy of the most recent day that has trucks on it
- CSV import — a file or a straight paste out of Excel — and Excel-friendly CSV export of the open day
- A **backup file** carries every planned day at once, for moving between devices or keeping a copy ([example CSV](example_tours.csv) ships with the repo)
- Light and dark themes; installable as a PWA and runs offline

**[Open the live board](https://olegbacalu-maker.github.io/tachoplan/?demo)** — a sample fleet of eight trucks with a week of driver history behind it. Nothing is saved; your own board starts empty.

## Run it

No build, no dependencies.

- **Local:** open `index.html` in any browser. Data is stored in that browser (localStorage); `tachoplan.ico` is there for a desktop shortcut on Windows.
- **Deploy:** enable GitHub Pages on this repository (Settings → Pages → deploy from `main`, folder `/`), or upload the files to any static host. Everything is path-relative, so serving from a subfolder works.

> If you host it by uploading a folder rather than from git, upload only the files in this repository. A drag-and-drop host takes the folder as it is on disk and ignores `.gitignore`, so anything else you keep alongside it would be published too.

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
truck;driver;driver2;crew;trailer;date;start;slot;extended;arrived;breaks;segments
TRK-05;Piotr Nowak;;;TR-6633;2026-08-10;06:30;14:40;;;10:40:45;drive:3h10:To meet point A2|swap:40:Meet A2 #TR-9004 @M1|drive:3h20:To FC SZZ1
TRK-08;Tomas Novak;;;TR-9004;;07:00;17:30;;;;drive:2h30:To meet point A2|swap:40:Meet A2 #TR-6633 @M1|drive:3h40:To FC PRG2
```

- Columns in any order, case-insensitive; delimiter detected automatically (`;` `,` or TAB, so pasting from Excel works)
- `segments` = `type:minutes:label|…` where type is `drive`, `drive2` (crew, second driver), `other`/`work`, `swap`, `break`; minutes accept `300`, `5h00`, `5:30`
- A swap may carry `#TRAILER` (the trailer taken) and `@CODE` (the meet point shared with the partner truck): `swap:40:Meet A2 Bad Oeynhausen #TR-9004 @M1`
- `breaks` carries the breaks actually taken, as `clock:minutes` pairs: `11:15:45|15:40:30`
- Only `truck` and `segments` are required; `work` is accepted as an alias of `other`, `rest` of `break`, and `drive1` of `drive`
- An empty `date` means the day currently open on the board

## Honest limits

Not affiliated with, endorsed by or connected to Amazon in any way; "Amazon" appears here only to describe the kind of delivery slots and disputes the board is used with.

A planning aid, not a legal record. Ferry and train derogations, out-of-scope driving and Art. 12 exceptional circumstances are not modelled; weekly figures only count the days present in the planner. The final authority is always the tachograph.

## Licence

Copyright (c) 2026 Oleg Bacalu. Published to be read and evaluated, not to be
reused — see [LICENSE](LICENSE). The bundled Inter typeface is licensed
separately under the SIL Open Font License 1.1 (`fonts/OFL.txt`).

## Tech

Vanilla JavaScript, no dependencies, no server — the fleet's data never leaves the device. Inter is bundled locally (variable woff2, one `@font-face` per unicode subset) so the board renders identically offline. Design tokens keep two colour systems apart. One is interface chrome — a single brand blue for buttons, links and focus. The other is meaning, and it is never reused for chrome: on the strip amber is driving, steel blue other work, violet a trailer swap, green a break; for a tour green is legal, amber risk, red violation. That separation is why the primary button is not amber: on this board amber already means "at risk".

The Russian user guide for day-to-day operation is in [ИНСТРУКЦИЯ.md](ИНСТРУКЦИЯ.md).
