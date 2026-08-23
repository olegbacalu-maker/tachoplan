# Working notes for this repository

TachoPlan Fleet is one file. `index.html` holds the markup, the styles, the EU
Regulation 561/2006 engine and the whole interface; everything beside it is an
asset, a document or the service worker. There is no build step, no dependency
and no server, and that is the product: a dispatcher opens it from a file on a
laptop in a yard with no signal, and the fleet's data never leaves the device.

Read this before changing the engine. Several of its rules look like defects
until you know why they are there.

## Running it

```
python -m http.server 8734 --directory .
```

Then `http://localhost:8734/?demo` for a sample fleet with a week of driver
history behind it. Nothing in demo mode is ever saved — `save()` is a no-op
while `state.demo` is set, so the sample can never overwrite a real board.

There is no test suite. Changes to the engine are verified by running concrete
scenarios against `simulate()` and reading the numbers, not by eye. A change that
cannot be demonstrated with times and totals has not been verified.

The browser console is one way. The other, when a change deserves a table of
boundary cases, is to cut the script from `"use strict";` to the icons comment
into a file, stub `localStorage`, append a `module.exports`, and run the scenarios
under node — that slice is DOM-free on purpose, and keeping it that way is worth
more than the few lines it costs. Pure helpers exist for this reason: `splitLeg`
and `routeBody` hold the parts of the split and the map request that are worth
checking without a browser or a key. Neither the harness nor its playwright
dependency belongs in the repository.

## The engine

`simulate(tr, dateStr)` walks one truck's `segments[]` from `tr.start` and
returns `{events, start, end, totalDrive, d1, d2, totalBreak, driveLimit, span,
warnings, status, slotInfo, stops, crew}`. It inserts the breaks the regulation
requires, lets the breaks a driver actually reported override the plan at their
real clock time, and reports what the difference costs.

`analyzeDrivers(sims)` aggregates across days per driver: weekly 56h and
two-week 90h driving, at most two extended days, daily rest 11h/9h with the
three-reduced cap, weekly rest 45h/24h with compensation and its due date.

`analyzeMeets(rows)` pairs trucks that share a meet code and checks their swap
windows genuinely overlap — two trucks cannot exchange trailers unless both are
in the yard at once.

Data shapes:

```js
truck   {id, name, driver, driver2, crew, trailer, place, start, slot, extended,
         trafficDelay, rampDelay, arrived, taken[], segments[]}
segment {type: drive|other|swap|break, mins, label, who}
        // other and swap may also carry slot and arrived — a stop of the tour
        // swap may also carry takes (trailer picked up) and meet (partner code)
        // drive may also carry km, to (where the leg ends), mapMin/mapAt — what
        //   Google last said about it and when — and autoMin, the figure the tool
        //   itself last wrote into mins
taken[] {at:"HH:MM", mins, open?}   // breaks the driver reported; open = still standing
```

`place` and each drive leg's `to` are the chain the distances are measured along:
the yard, then wherever each leg ends. A swap or an unload happens where the truck
already is, so only driving legs name a place.

## Invariants that look like bugs

**The cost check recurses into `simulate`.** Re-running the tour without the
reported breaks is what produces "stopping early costs 0h45". The only thing
preventing infinite recursion is `taken:[]` in the spread. Any refactor that
keeps `taken` populated, or derives the baseline from `tr` directly, hangs the
browser on every render.

**`restAll` resets both drivers.** The vehicle is stationary, so neither is
driving. Scoping it to whoever took the break looks like a fix and destroys
crew break accounting.

**A 30–44 minute break that is not preceded by a 15 does not reset the 4h30
counter** — it only arms the split. The regulation requires 15 then 30, in that
order, and this is that rule. It will read as an off-by-one.

**A 15–29 minute break while already armed changes nothing at all.** No reset,
no re-arm. The silent fall-through is intentional, not a missing `else`.

**`realSoon()` stops the plan inventing a break.** While the driver's real stop
is close, no automatic break is inserted, so accumulated driving is allowed to
run past 4h30 — which is exactly how an Article 7 over-run is detected instead
of being papered over with a break that never happened.

**The two midnight rollovers differ on purpose.** Reported breaks roll forward
only when more than twelve hours before the tour start; slots roll whenever they
fall earlier than the start. Harmonising them breaks one case or the other.

**Open breaks grow with the clock only on today's board.** A past day
re-simulates from the stored minutes, so history stays stable.

**The tool fills a leg's time only until a human disagrees.** A leg whose `mins`
differ from its `autoMin` has been corrected on purpose, and re-measuring the tour
leaves it alone and shows the tool's figure beside it instead. Making the measure
authoritative would silently undo corrections a dispatcher made for a reason.

**That test is against `autoMin`, not `mapMin`.** `mapMin` is what Google measured;
`autoMin` is what was last written into `mins`, and the two differ whenever a fleet
speed is set. Comparing against `mapMin` would make every leg look hand-corrected
the moment the speed changed, and nothing would ever be filled in again.

**`planMin` takes the slower of two floors, and that is the whole point.** Google
times for a car, so on a motorway its figure arrives too early for a lorry held to
80 km/h — but on a city leg or in a jam its figure is already the slower one, and
km ÷ speed would hand back time that does not exist. Replacing rather than flooring
would turn a fix for optimism into a new source of it.

**Retyping a leg's `to` throws away `km`, `mapMin`, `mapAt` and `autoMin` — but
only if the distance came from the map.** A distance typed by hand is the dispatcher's and
survives; a measured one describes a route that no longer exists.

**`splitLeg` divides km but drops `mapMin`/`mapAt`/`autoMin`.** Neither half is the route
Google measured, so carrying its figures onto them would attach a verified-looking
number to something nobody verified. The kilometres are split in proportion because
an estimate is honestly an estimate; the timing is not.

**The map key and the fleet's lorry speed live in their own `localStorage`
entries, never in `state.days`.** That
is what keeps it out of `backupAll()` and out of the CSV, both of which get handed
to other people. Any refactor that moves it into the board data leaks it.

**Deleting the last truck of a day removes the date entirely**, and an absent
day is a day off as far as rest analysis is concerned. That is load-bearing for
the weekly verdicts of neighbouring days.

## Deliberate interface behaviour

- Nothing is live on any date except today: no now-line, no progress veil, no
  ETA. Other days are planning views.
- The board freezes while a field or button has focus. Without that guard the
  30-second re-render takes the caret out from under whoever is typing.
- The pale part of a tour bar is what is still ahead; the solid part is done.
- A leg cut in two by an inserted break prints its label on the first half only,
  so one leg does not read as two runs to the same place.
- The check button lights only when the **last** point of the tour is stamped;
  intermediate stops move the `n/m` counter instead.
- Two taps on pause inside a minute delete the break. That is the mis-click
  undo, not lost data.

## Conventions

Colours are split in two and the split is the whole design rule. One brand blue
is interface chrome — buttons, links, focus. Everything else carries tachograph
meaning and is never reused for chrome: amber is driving, steel blue other work,
violet a trailer swap, green a break; green, amber and red are legal, risk and
violation. This is why the primary button is blue and not amber: on this board
amber already means "at risk".

Inter is bundled locally, one `@font-face` per unicode subset, weight given as
the range `100 900`. Splitting it into per-weight faces silently loses 700.

Comments explain why a rule exists, not what the line does. The regulation
articles are worth naming; the JavaScript is not.

## Before committing

- Bump **both** version numbers in the same commit: `CACHE` in `sw.js` and the
  `ver` line in the sidebar. Miss `CACHE` and installed clients keep serving the
  old build from cache.
- Keep the CSV documented in three places consistent with the exporter: the
  comment above the parser, the `EXAMPLE()` template, and the README.
- Never add a build step, a dependency, a CDN link or an external font URL. The
  Google distance lookup is the one outbound call, and it stays within that rule
  on purpose: Routes API v2 is served with CORS headers, so it is a plain `fetch`
  with no script tag and no library. The legacy Distance Matrix endpoint sends no
  such headers and is refused by the browser — reaching for it, or for the Maps
  JavaScript API to get around that, would put a CDN script in the page.
- Nothing may go to the network on its own. The dispatcher presses Measure, for
  one tour, or nothing leaves the device. A board opened in a yard with no signal
  must show every distance already measured and behave exactly as it did before.
- Never relicense. The all-rights-reserved terms are deliberate, and
  `fonts/OFL.txt` must stay with the font it covers.
- Never commit files kept outside the repository for privacy. `.gitignore`
  guards the historical path; anything personal belongs outside this folder.

The engine decides whether a driver's day is legal. It has been dangerously
wrong once already — a driver stopping exactly at 4h30 was charged a phantom
second break while a real five-hour over-run was hidden behind a break the plan
drew for him. Both were found by review, not by use. Check the boundaries every
time: exactly at 4h30, later than 4h30, across midnight, inside a swap, inside a
break the plan already had, with a crew of two, and against a board saved before
the field you are adding existed.
