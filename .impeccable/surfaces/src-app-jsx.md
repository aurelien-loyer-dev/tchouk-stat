---
version: 1
slug: "src-app-jsx"
primary_target: "src/App.jsx"
related_targets: []
---

# Surface: Tchoukball Assistant (all app screens)

Mode: Operate. Audience: coachs / table officials on tablet or laptop courtside. Task: log match stats live, read results, run tournaments.
User constraints: sober, light + dark (system default + remembered toggle), readable, easy; may simplify flows.

## Direction contract

THESIS: A working stats tool that borrows the sports hall, not a dashboard. Refuses the neon-on-black "sports app" and the grey card grid.
OWN-WORLD: Ground tinted like a pale maple sports floor (light) / dark lacquered court (dark); hairline court lines (1px, line colour) instead of boxed cards; ink neutrals warm-tinted from the floor. One court-line accent (court green-blue) for primary actions/focus; team colours only for teams; red/amber/green only for states. Inter Variable, tabular numerals.
STORY: Coach opens the app, sees three clear actions (stats, scoreboard, tournament) and recent matches; starts a match in two steps; taps big +/- targets; ends and reads the result.
FIRST VIEWPORT: Top bar (app name left, language + theme toggle right). Home: three action rows separated by court lines, each with icon, name, one-line description, chevron; recent matches list below. Match screen: scoreboard band at top with the free-zone semicircle drawn under the score separator, two team columns side by side on tablet.
FORM: candidate 2 of grounded list ("gym floor lines"), user-chosen over the assigned roll. seed:688e7b293fc00945
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
