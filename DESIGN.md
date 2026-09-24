---
name: The Daily Catch · CSCD01
description: A fishing derby printed as a bolted futurist book, projected for a tutorial room.
colors:
  mechanical-red: "#d7261e"
  type-black: "#111111"
  ink-warm: "#312d28"
  ink-faded: "#625b50"
  stock-cream: "#f2ede2"
  stock-shade: "#e7dfcd"
  stock-deep: "#d6ccb6"
  on-ink-muted: "#bdb5a6"
typography:
  display:
    fontFamily: "'Big Shoulders Variable', 'Arial Narrow', 'Roboto Condensed', Impact, sans-serif"
    fontSize: "clamp(44px, 6vw, 82px)"
    fontWeight: 900
    lineHeight: 0.86
    letterSpacing: "0"
  headline:
    fontFamily: "'Big Shoulders Variable', 'Arial Narrow', 'Roboto Condensed', Impact, sans-serif"
    fontSize: "clamp(30px, 3vw, 48px)"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "0.005em"
  title:
    fontFamily: "'Big Shoulders Variable', 'Arial Narrow', 'Roboto Condensed', Impact, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.02em"
  lever:
    fontFamily: "'Big Shoulders Variable', 'Arial Narrow', 'Roboto Condensed', Impact, sans-serif"
    fontSize: "26px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.03em"
  ui:
    fontFamily: "'Big Shoulders Variable', 'Arial Narrow', 'Roboto Condensed', Impact, sans-serif"
    fontSize: "19px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.04em"
  numeral:
    fontFamily: "'Big Shoulders Variable', 'Arial Narrow', 'Roboto Condensed', Impact, sans-serif"
    fontSize: "30px"
    fontWeight: 900
    lineHeight: 1
    fontFeature: "tnum"
  label:
    fontFamily: "'Big Shoulders Variable', 'Arial Narrow', 'Roboto Condensed', Impact, sans-serif"
    fontSize: "14px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.16em"
  body:
    fontFamily: "'Archivo Variable', 'Arial Narrow', Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.4
    fontVariation: "'wdth' 88"
rounded:
  none: "0px"
spacing:
  tight: "6px"
  sm: "12px"
  md: "14px"
  lg: "18px"
components:
  lever:
    backgroundColor: "{colors.mechanical-red}"
    textColor: "{colors.type-black}"
    rounded: "{rounded.none}"
    typography: "{typography.lever}"
    padding: "9px 32px 9px 11px"
    height: "58px"
  lever-hover:
    backgroundColor: "{colors.mechanical-red}"
    textColor: "{colors.stock-cream}"
  lever-disabled:
    backgroundColor: "{colors.stock-deep}"
    textColor: "{colors.ink-faded}"
  plate-button:
    backgroundColor: "{colors.stock-cream}"
    textColor: "{colors.type-black}"
    rounded: "{rounded.none}"
    typography: "{typography.title}"
    padding: "9px 32px 9px 11px"
    height: "52px"
  plate-button-hover:
    backgroundColor: "{colors.type-black}"
    textColor: "{colors.stock-cream}"
  icon-button:
    backgroundColor: "{colors.stock-cream}"
    textColor: "{colors.type-black}"
    rounded: "{rounded.none}"
    size: "40px"
  icon-button-hover:
    backgroundColor: "{colors.type-black}"
    textColor: "{colors.stock-cream}"
  text-button:
    textColor: "{colors.type-black}"
    typography: "{typography.ui}"
    padding: "6px 0"
  text-button-hover:
    textColor: "{colors.mechanical-red}"
  eyebrow-tag:
    backgroundColor: "{colors.type-black}"
    textColor: "{colors.stock-cream}"
    typography: "{typography.label}"
    padding: "6px 11px 5px"
  boat-name-tag:
    backgroundColor: "{colors.type-black}"
    textColor: "{colors.stock-cream}"
    typography: "{typography.title}"
    padding: "5px 7px 4px"
  number-block:
    backgroundColor: "{colors.type-black}"
    textColor: "{colors.stock-cream}"
    size: "34px"
  catch-feed:
    backgroundColor: "{colors.type-black}"
    textColor: "{colors.stock-cream}"
    padding: "11px 14px 12px 36px"
  bound-dialog:
    backgroundColor: "{colors.stock-cream}"
    textColor: "{colors.type-black}"
    rounded: "{rounded.none}"
    padding: "34px 38px 28px 76px"
  crew-field:
    textColor: "{colors.type-black}"
    typography: "{typography.body}"
    height: "46px"
---

# Design System: The Daily Catch · CSCD01

## Overview

**Creative North Star: "The Bolted Derby Book"**

The derby is a machine-bound futurist book: a cream spread fixed to its spine with brushed-aluminium hex bolts, where every bite, catch and verdict is slammed in tilted wood type. The page is one full-bleed print. The sea is engraved as horizontal lines of force that thicken with depth. Boats, fish, hooks and headlands are printed in solid black ink. Controls are riveted plates laid over that print. There is one colour of ink besides black, a mechanical red, and it goes where the pressure is.

The system is built for a projector in a lit tutorial room. That means a cream ground rather than a dark one, heavy ink, and a scale the back row can read: boat names at 22px in tags that fill their lane, hook plates with 25px numerals, fishing lines drawn 2.4 to 3.6px, hooked fish printed at twice their swimming size. Density is low and loud. Few words, set very large, in condensed caps.

Motion is percussive. Type arrives slammed: it lands oversized and light, snaps to full weight, overshoots once and settles. The loudness of a catch follows the order of catches, never the size of the fish, so the animation can never hint at the result. The reveal runs evidence first: the catches hang at the dock, the rows and rulers print, SMALLEST stamps, and only then is the name shouted. Reduced motion turns every slam, shake and drift off. The system rejects two things: the glossy candy-button mobile game and the neon arcade.

**Key Characteristics:**
- Two inks plus red: cream stock, type black, one mechanical red.
- Condensed wood-type caps (Big Shoulders) for everything the room reads; Archivo only for explanatory sentences.
- Identity by number, not colour: every boat is a two-digit wood-type numeral on its hull, hook plate, name tag, crew row and result row, and the number leads its name wherever the name is printed ("05 · REBASE RANGERS").
- Hard offset ink drops and misregistered red-over-black type in place of soft shadows.
- Square plates with clipped corners and slanted trailing edges, fastened with bolts.
- Tilted, slammed type: fixed rotations between -4° and -15°, weight swinging from 300 to 900.

## Colors

A two-ink letterpress palette on warm cream stock, with a single mechanical red as the only chroma.

### Primary
- **Mechanical Red** (#d7261e): The ink of pressure. It marks a hooked line (the line turns red and thickens), the pennant and name tag of the boat fighting a fish, the hook plate and hook eye once a fish is on, the canvas shouts, the CAST lever face, the smallest catch (its fish, its measuring bar, its length and its number block), the focus ring, and text selection. A bobber's cap turns red only once its line is hooked. The one piece of red scenery is the sun family: the sun disc, its glitter on the water and the lighthouse bands.

### Neutral
- **Type Black** (#111111): The main ink. Plate edges, hulls, engraved sea lines, the waterline band, the bottom control band, number blocks, eyebrow tags and every hard drop shadow.
- **Warm Ink** (#312d28): Secondary text on cream, such as help steps, tip copy and the winner sentence.
- **Faded Ink** (#625b50): Disabled and excluded states: struck-through crew names, the keyline of moored boats (5.7:1 on stock), disabled plates and footnotes.
- **Stock Cream** (#f2ede2): The paper. The whole page ground, plate faces, and type set on black.
- **Stock Shade** (#e7dfcd): A folded or recessed paper tone. The dialog spine gutter, a focused crew row, the fairness note, the scroll hint strip and scrollbar tracks.
- **Stock Deep** (#d6ccb6): The face of a disabled lever and the idle status dot.
- **On-Ink Muted** (#bdb5a6): Secondary copy set on the black band (the rule line under the control message).

### Named Rules
**The Two Inks Rule.** Everything is printed in type black on stock cream, plus red. Group colours (the 12-colour boat set) and fish colours (the 6-colour fish set) stay in data for storage and fairness; they are never rendered. Fish colours become six ink markings instead: solid, bars, spots, scale arcs, split and hatch.

**The Pressure Red Rule.** On anything the room reads as data or can act on, red means pressure: the line under strain, the lever to pull, the verdict. Red is never used as a boat's identity, and never for a resting mark. The depth-scale numerals, an idle bobber's cap, a presented boat's stamp and the Options tick box all print in ink. The sun family (disc, glitter, lighthouse bands) is the only red scenery, and nothing else on the board may borrow it.

**The Number Is The Name Rule.** A boat's identity travels as a two-digit wood-type numeral (01 to 12) on its hull, hook plate, name tag, crew row, result row and verdict. Wherever a name is printed, the number leads it: "05 · REBASE RANGERS" on the band, the catch feed, the catch shout and the toast; a paper number plate at the head of the board's name tags. The fish on the hook never carries identity; the plate does.

## Typography

**Display Font:** Big Shoulders Variable, optical size and weight axes (with Arial Narrow, Roboto Condensed, Impact)
**Body Font:** Archivo Variable, width axis, set at 88% width (with Arial Narrow, Arial)

**Character:** Big Shoulders is the wood type: condensed, uppercase, slammed to 900 and tilted. Archivo, narrowed to 88%, is the typewriter caption underneath it and is kept to sentences that explain. Both are self-hosted through @fontsource-variable; nothing loads from the network at runtime.

### Hierarchy
- **Display** (900, clamp(44px, 6vw, 82px), 0.86): The verdict name on portrait pages and the help title. Uppercase, rotated -6° (help title -4°). The help title pivots on its bottom-left corner; the verdict pivots on its left middle, so a name on two or three lines never swings into the spine. On the landscape spread the verdict grows with the screen to min(168px, 8.4vw, 15.5dvh), about 161px on a 1920×1080 projector, and steps down only as far as its longest word needs to fit the column on one line (a long name keeps to about three). The cast callout is the other shout at clamp(76px, 11vw, 168px), rotated -15°. Help step numerals use a fixed 52px display step.
- **Headline** (900, clamp(30px, 3vw, 48px), 0.9): The control message on the black band, the masthead and the red "Next to present" overprint above the verdict.
- **Lever** (900, 26px): Lever labels. The band's CAST lever steps up to the numeral size (30px).
- **Title** (800, 22px, 1): Boat name tags, plate labels, crew and result group names, step titles, the catch-feed line, toasts. The name tag on a catch shout takes 22 to 30px with the shout.
- **Numeral** (900, 30px, tabular figures): Fish lengths and the depth gauge. Units drop to the label or UI step at 800. The crew heading in the Options panel also sits at this fixed 30px step rather than the fluid headline.
- **UI** (800, 19px, 0.04em): Text buttons, crew footer, status tag, spine legend, number blocks, the SMALLEST stamp (which grows to 30px on projector screens), the catch-feed label, the depth label. 19px is the smallest step allowed to carry red-on-black or black-on-red type: at weight 800+ it counts as large text, which the 3.7:1 pairing passes.
- **Label** (800, 14px, 0.16em tracking, uppercase): Eyebrow tags, gauge keys, table headings, the scroll hint.
- **Body** (Archivo 400–600, 16px, 1.4–1.5): Help steps, the fairness note, the winner sentence; fine print (tips, help footnote) drops to the 14px label step, and the help footnote keeps a 48ch measure (about 60 characters). Short lines only; never used for anything the back row needs to read.

### Named Rules
**The Slam Rule.** Display type arrives oversized and light, snaps to weight 900, overshoots once and settles. The weight change is part of the motion (canvas shouts go 300→900, the cast callout 250→900, the verdict 200→900).

**The Caps Rule.** Everything set in Big Shoulders is uppercase. Archivo sentences keep normal case.

**The Skewed Label Rule.** Labels inside levers and plates are skewed -9°, so the type leans into the slanted trailing edge.

## Layout

The page is a single full-bleed board bound on a spine. On desktop a 58px spine column holds two bolts and the vertical legend "CSCD01 Tutorial". The game card fills the rest of the viewport (100dvh, framed in a 3px black rule, with 14px of shell padding). The card is three rows: the ocean canvas, an optional scroll-hint strip, and the black control band (at least 104px tall) holding the rule message on the left and the lever on the right.

HUD plates float over the canvas at fixed corners. The masthead sits top-left and the Options tag top-right. Once the camera dives, both lift off the top of the page so the boats reeling in their catches stay in view. They drop back as the camera surfaces, or at once when the round is paused; an open or focused Options panel stays put. The depth gauge sits bottom-left and the catch feed bottom-right, 18px in from the edges. Boats share the width in equal lanes. Each name tag may fill its lane (tags sit 4px apart) and wraps to a second line when the name needs it. The scene drops just far enough that the tallest tag and the stamp row beneath it clear every pennant, while the sun and sky hold their place. When boats no longer fit, the board scrolls sideways and a hint strip appears.

Spacing is tight and irregular in the way printed matter is. The recurring steps are 6px, 12px, 14px and 18px, and padding is optically corrected (for example 5px on top and 4px underneath caps).

Responsive behaviour. At 900px or narrower, band copy steps down. At 600px or narrower, the spine and status tag drop away, the card goes borderless, the band stacks with a full-width lever, and the cast callout steepens to -24°. Boat name tags, the Options tag, help step titles and result group names step down to the 19px UI size, and the depth gauge keeps only its number. Dialog spines narrow to 30px, and each results row stacks its name and length over a full-width ruler. At a height of 520px or less, the spine drops and the band stays in a single row.

## Elevation & Depth

There is no ambient shadow and no blur. Depth is printed. Raised things cast a hard ink drop offset down and to the right, like a misregistered second impression, and pressing a control physically closes that gap. Red display type carries a black offset copy of itself. The canvas does the same on shouts: black first, red a few pixels up and to the left. Depth numerals print in solid ink on a paper patch. Layering over the board is done with solid plates and black bands, not translucency. The single exception is the dialog backdrop, which is 80% type black with a faint cream diagonal hatch.

### Shadow Vocabulary
- **Plate drop** (`filter: drop-shadow(4px 4px 0 #111111)`): Resting levers, plates and the Options tag. Hover lifts to 6px while the plate moves -2px; press drops to 1px while the plate moves +3px.
- **Red drop** (`drop-shadow(4px 4px 0 #d7261e)`): Plates on the black band and the open Options tag, where a black drop would vanish.
- **Cream drop** (`drop-shadow(4px 4px 0 #f2ede2)`): The lever on the black band.
- **Toast drop** (`box-shadow: 5px 5px 0 #d7261e`): The ink toast.
- **Misregistered type** (`text-shadow: 2px 2px 0 #111111`, and `.045em .045em 0` on the cast callout): Red display type over cream.

### Named Rules
**The Hard Drop Rule.** Every shadow has zero blur and a positive x and y offset. Motion changes the offset; nothing ever fades in a glow.

## Shapes

Every rectangle is square-cornered, with no radius anywhere. Three silhouettes carry the world:
- **Clipped plate.** The top-right corner is cut at 45° (22px on the options panel, 26px on dialogs, 12px on the depth gauge), with the cut drawn as a 3px black edge inside a 3px black frame.
- **Slanted lever.** The trailing edge is sheared by 16px (12px on the Options tag), with a 3px black edge showing around the face.
- **Notched feed.** The catch feed clips its bottom-left corner by 12px.

Circles appear only as printed discs: bolts, the sun, bobbers, the shockwave rings behind the cast and the winner fish, and the dotted search ring around a descending hook. Status dots are squares. Hook plates are rectangles with a V-notch pointing down the line. Fixed rotations are part of the form: -2° toast, -4° help title, -5° PRESENTED stamp, -6° verdict and SMALLEST stamp, -12° winner fish, -15° cast callout.

## Components

The controls are tactile and mechanical: black-edged plates that you press into the page.

### Buttons
- **Shape:** Square with a slanted trailing edge (16px), a 3px black edge showing around a coloured face, and a bolt at the leading end.
- **Lever (primary):** Red face with black type, 26px at 900, at least 58px tall; on the band it is 30px and 64px tall, with a 26px bolt. The lever is used once per view, for the action that moves the round forward: cast, "Let's go fishing", "Mark presented".
- **Plate button (secondary):** Cream face with black type, 22px at 800, at least 52px tall. On hover the face turns black and the type cream.
- **Hover / Focus / Active:** Hover lifts the plate by -2px and extends the drop to 6px; the lever's type turns cream. Active pushes the plate 3px and shrinks the drop to 1px in 0.05s. Focus is a 3px red outline at a 4px offset (cream on the black band). Disabled plates get the stock-deep face, faded-ink type and edge, no drop, and a greyed bolt.
- **Icon button:** A 40px square with a 2px black frame on cream, inverting on hover. The pause button is 56px, cream-framed on black.
- **Text button:** Display caps at the 19px UI step (800, 0.04em) with no frame. On hover the type turns red and a 2px underline appears 5px below.
- **Add button:** A full-width 2px dashed black frame with UI caps and the group count pushed to the right. On hover it fills black, the type turns cream and the dash goes solid.

### Chips
- **Eyebrow tag:** A black slab with cream caps at the 14px label step (800, 0.16em tracking). It opens dialogs and headings.
- **Status tag:** A black slab with a slanted trailing edge and a square status dot that blinks red while fishing.
- **Number block:** A black square (34px in crew rows, 32px in results) with a cream tabular numeral. It turns red with black type for the smallest catch, and becomes an outlined faded-ink square when excluded.

### Cards / Containers
- **Corner Style:** Clipped top-right corner (see Shapes); no radius.
- **Background:** Stock cream with the global grain and speckle. Dialogs add the shaded spine gutter and a 3px rule.
- **Shadow Strategy:** None on plates; see Elevation.
- **Border:** 3px type black.
- **Internal Padding:** Options panel 18px (34px at the bottom to clear the corner bolts); dialogs 34px 38px 28px, with 76px on the left for the spine.

### Inputs / Fields
- **Style:** Crew rows are ruled ledger lines (1px black under each, 3px black above the list) with a borderless transparent Archivo input at 16px/600. Each row ends in its Presented tick box, then the remove button.
- **Presented, from Options:** A 22px square with a 2px black frame. Checked, it fills black with a cream check, never red. Each is named after its boat ("Group 03 presented"). The tip under the list says both ways in: tick it here, or click the boat's name tag on the board.
- **Presented, on the board:** The board the room watches carries no form controls. Each name tag is itself the TA's toggle, one click either way (a checkbox named "Group 03 already presented"). A presented boat's tag is struck with a rubber stamp: PRESENTED in 19px display caps at weight 900, 0.1em tracking, faded ink, in a 2px faded-ink frame on paper, turned -5° and overlapping the foot of the tag by 12px. It steps down to the 14px label step in lanes under 130px (twelve boats, phones). Pointing at a tag previews the click: a dashed ink proof of the stamp on a ready boat, or a dashed stamp ready to lift on a presented one. The stamp row is always reserved, so marking a boat never moves the dock. During a round the tags are disabled and pointer-inert.
- **Focus:** The row shades to stock shade with a 3px red underline.
- **Excluded / Disabled:** The name is struck through with a 2px line in faded ink, and the tick box is checked. On the board the name tag turns into a faded-ink outline with its name struck through and its number plate printed faded ink.

### Navigation
The Options tag is the only navigation: a slanted plate at the top right that opens a clipped panel below it. When open, it inverts to a black face with a red drop and its chevron turns 180°.

### Bound Dialog (signature)
Each page hangs on a spine: a 46px shaded gutter behind a 3px black rule, with two bolts at its top and bottom, a clipped top-right corner and grain and speckle over the page. It opens with a page slam: rising 26px from -1.5° and 97% scale over 0.38s.

### Catch Feed (signature)
A black plate with two bolts and a notched corner. It shows a red caps label (NO BITES YET, FISH ON!, REEL THEM IN, ALL ASHORE), a tabular count, the latest catch's number and name in 22px title caps on up to two lines, and a segmented gauge: one red segment per boat in the round, 3px apart, filling from the left as catches land, so the segments count the boats.

### Dock Strip (signature)
The board's name tags, one per lane: a black tag with a paper number plate at the head of 22px title caps, filling its lane and wrapping to a second line, then cut with an ellipsis. The tags share a baseline over the boats, with a reserved stamp row beneath them. In lanes wider than about 490px (two or three boats) the tags grow with the lane up to the 30px numeral step. When the camera dives they stay pinned where they are, and a 3px ink rail joins the tags into a strip, the fishing lines running up behind it to their boats. A tag turns red while its boat fights a fish and back to ink once the catch is aboard. A moored boat's tag is a faded-ink outline, struck through and stamped PRESENTED.

### To-Scale Haul (signature)
The results table. Each row has a number block and name, then a measuring bar that ends in a printed fish drawn to scale against the largest catch, over a tick ruler every 10%, then the length. A tilted red SMALLEST stamp lands on the empty ruler just past the winner's fish (over its bar if the fish runs nearly full length, and never past the ruler's end). It sits out of flow, so the winning row is laid out exactly like every other. On the stamp, the smallest catch's row inverts to black and its number, bar, fish and length turn red.

A fresh result is staged in about 1.5s, evidence before verdict. The rows slam in by boat order within 340ms. A tape then runs out along every ruler at one speed, and each length prints where its tape stops. SMALLEST stamps at 1s and the row inks over on impact. "Next to present" slides in carrying the winner's number on a black plate with a red drop, and the name is shouted last at 1.2s; that moment announces the verdict to screen readers and plays the finish tone. The sentence and the actions print at 1.5s. Until the stamp, nothing about the winner is on the page. A replayed result ("View last catch") and reduced motion open on the finished page.

The bar and fish together occupy the catch's exact proportion of the full ruler. Fish shrink to fit short measurements; they never add a fixed length to the scale. The winner's ink band extends behind the row without shifting its ruler or numerals.

### Engraved Board (signature)
The Canvas 2D scene. The sea is broken lines of force: rows every 24px of solid-ink strokes 64 to 156px long, with open paper between them. They thicken with depth from 1.1 to 2.4px, staying under the fishing lines, bow slightly and drift slowly; the solid black waterline band anchors the surface. Headlands and seabed are hatched, and a red sun has a misregistered ink ring. The seabed is the floor of the world, not a band at the foot of the idle page. Its base lies at world y 1120 (about 18 m), below the deepest swimmer and hook, and its hatched ground runs from the crest to below the page's bottom edge. Nothing ever swims beneath it or through it. The camera stops once the seabed's base reaches the page's foot, so a dive ends on kelp and rocks. On most screens the idle board shows open sea to the band, and the depth scale prints only the marks above the floor (5, 10, 15 M). Bubbles rise from the seabed to just under the surface. Boats are solid black hulls with cream numerals, keels riding just under the waterline band. They print at 1.05× in the dock's usual lanes and grow into wide lanes, up to 1.8× when two or three boats share the board, so a small board is carried by its boats rather than left as open water. The lighthouse always stands on the right headland: between the last two boats when that gap is on the headland and leaves room, otherwise on the headland past the last boat. It never stands out on open water. Boats that have presented are moored: printed as an open keyline in faded ink around paper, level and still, with an open pennant, no wake and no line in the water, so they read plainly on a washed-out projector without ever looking like one in play. A hooked line turns red and grows from 2.6 to 3.6px; the hook plate turns red, and a black-offset red shout slams in with a shockwave and radiating lines. The shout carries the boat's number and name on a black tag above the word, cut between words to stay inside the shout's margin. Each catch shakes the board up to 4.5px.

A hooked fish pops to twice its swimming size, overshooting once like the slammed type, holds that size through the fight and settles to 1.25× as it comes aboard. Every catch follows the same curve on the reel's clock, never on its length, so relative size stays true and the scale can never hint at the result.

Once every hook has a fish, whatever is still on a line is reeled home 2.5× faster after its 0.6s struggle. This is presentation only; the catch itself is fishing.js's. Each landed catch swings up to hang head-first from its boat's hoisted rod, in plain ink with its paper reserve, every catch printed alike. The board holds on that dock for 0.9s before the results open.

Fish share one code-drawn engraving across the canvas and result illustrations: a tapered body, forked tail, swept fins, small ringed eye and curved gill. The six ink markings remain recognizable when the winner is overprinted red. Fine fin rays and contour cuts appear on the large verdict fish and larger swimmers; small comparison fish retain the silhouette and markings with simpler linework. Tail motion pivots at the body join, and the mouth stays aligned with the simulated contact point.

Swimming fish carry a 2px stock-cream reserve around the body, fins and moving tail, so the sea's engraving never runs into their silhouettes. A hooked fish has none: its red outline already stands clear, and the hook must meet its mouth. Alternating tail beats shed short curved ink strokes that spread, thin from 1.5 to 0.8px and fade behind swimming fish. These wakes share the tail's clock, freeze when paused and are omitted under reduced motion.

## Do's and Don'ts

### Do:
- **Do** print in two inks plus red: type black (#111111) on stock cream (#f2ede2), with mechanical red (#d7261e) only where there is pressure or the printed sun.
- **Do** carry group identity as a two-digit wood-type numeral on hull, hook plate, name tag, crew row and result row, and lead every printed name with it.
- **Do** set anything the back row reads in Big Shoulders caps at 22px or larger, weight 800–900.
- **Do** give raised controls a hard zero-blur ink drop (4px 4px 0) and let press states close the gap.
- **Do** use the steep ease-out cubic-bezier(.16, 1, .3, 1) for every slam, and put the overshoot in keyframes, not in the curve.
- **Do** tie shout loudness and slam order to catch order, never to fish length.
- **Do** switch off every slam, shake, drift and callout under prefers-reduced-motion.
- **Do** fasten plates with the brushed-aluminium hex bolt; it is the only place a gradient appears.

### Don't:
- **Don't** render the per-group or per-fish colour sets; translate fish colour into one of the six ink markings.
- **Don't** make anything glossy, candy-coloured or rounded like a mobile game button, and don't use neon glows or dark arcade grounds.
- **Don't** use rounded rectangles; circles are allowed only as printed discs (bolts, sun, bobbers, shockwave rings).
- **Don't** use blurred shadows or translucent glass layers over the board.
- **Don't** set small body-size text in red on black or black on red; red and ink together hold only about 3.7:1, so red-carried type starts at the 19px UI step at weight 800+ (large text).
- **Don't** load fonts or art from the network; fonts are self-hosted and all scene art is drawn in code.
