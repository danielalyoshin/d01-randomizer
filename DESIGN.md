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
    padding: "5px 8px 4px"
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

The system is built for a projector in a lit tutorial room. That means a cream ground rather than a dark one, heavy ink, and a scale the back row can read: boat names at 22px, hook plates with 25px numerals, fishing lines drawn 2.4 to 3.6px. Density is low and loud. Few words, set very large, in condensed caps.

Motion is percussive. Type arrives slammed: it lands oversized and light, snaps to full weight, overshoots once and settles. The loudness of a catch follows the order of catches, never the size of the fish, so the animation can never hint at the result. Reduced motion turns every slam, shake and drift off. The system rejects two things: the glossy candy-button mobile game and the neon arcade.

**Key Characteristics:**
- Two inks plus red: cream stock, type black, one mechanical red.
- Condensed wood-type caps (Big Shoulders) for everything the room reads; Archivo only for explanatory sentences.
- Identity by number, not colour: every boat is a two-digit wood-type numeral on its hull, hook plate, crew row and result row.
- Hard offset ink drops and misregistered red-over-black type in place of soft shadows.
- Square plates with clipped corners and slanted trailing edges, fastened with bolts.
- Tilted, slammed type: fixed rotations between -4° and -15°, weight swinging from 300 to 900.

## Colors

A two-ink letterpress palette on warm cream stock, with a single mechanical red as the only chroma.

### Primary
- **Mechanical Red** (#d7261e): The ink of pressure. It marks a hooked line (the line turns red and thickens), the pennant of the boat fighting a fish, the hook plate and hook eye once a fish is on, the canvas shouts, the CAST lever face, the smallest catch (its fish, its measuring bar, its length and its number block), the focus ring, and text selection. It also prints the scene's sun family: the sun disc, its glitter on the water, the lighthouse bands, the depth-scale numerals and the idle bobber caps.

### Neutral
- **Type Black** (#111111): The main ink. Plate edges, hulls, engraved sea lines, the waterline band, the bottom control band, number blocks, eyebrow tags and every hard drop shadow.
- **Warm Ink** (#312d28): Secondary text on cream, such as help steps, tip copy and the winner sentence.
- **Faded Ink** (#625b50): Disabled and excluded states: struck-through crew names, excluded boats, disabled plates and footnotes.
- **Stock Cream** (#f2ede2): The paper. The whole page ground, plate faces, and type set on black.
- **Stock Shade** (#e7dfcd): A folded or recessed paper tone. The dialog spine gutter, a focused crew row, the fairness note, the scroll hint strip and scrollbar tracks.
- **Stock Deep** (#d6ccb6): The face of a disabled lever and the idle status dot.
- **On-Ink Muted** (#bdb5a6): Secondary copy set on the black band (the rule line under the control message).

### Named Rules
**The Two Inks Rule.** Everything is printed in type black on stock cream, plus red. Group colours (the 12-colour boat set) and fish colours (the 6-colour fish set) stay in data for storage and fairness; they are never rendered. Fish colours become six ink markings instead: solid, bars, spots, scale arcs, split and hatch.

**The Pressure Red Rule.** On anything the room reads as data or can act on, red means pressure: the line under strain, the lever to pull, the verdict. Red is never used as a boat's identity. The printed sun family is the only place red is scenery.

**The Number Is The Name Rule.** A boat's identity travels as a two-digit wood-type numeral (01 to 12) on its hull, hook plate, crew row and result row. The fish on the hook never carries identity; the plate does.

## Typography

**Display Font:** Big Shoulders Variable, optical size and weight axes (with Arial Narrow, Roboto Condensed, Impact)
**Body Font:** Archivo Variable, width axis, set at 88% width (with Arial Narrow, Arial)

**Character:** Big Shoulders is the wood type: condensed, uppercase, slammed to 900 and tilted. Archivo, narrowed to 88%, is the typewriter caption underneath it and is kept to sentences that explain. Both are self-hosted through @fontsource-variable; nothing loads from the network at runtime.

### Hierarchy
- **Display** (900, clamp(44px, 6vw, 82px), 0.86): The verdict name in the results and the help title. Uppercase, rotated -6° (help title -4°), pivoting on the bottom-left corner. The cast callout is the one larger shout at clamp(76px, 11vw, 168px), rotated -15°. Help step numerals use a fixed 52px display step.
- **Headline** (900, clamp(30px, 3vw, 48px), 0.9): The control message on the black band, the masthead, the crew heading and the red "Next to present" overprint above the verdict.
- **Lever** (900, 26px): Lever labels. The band's CAST lever steps up to the numeral size (30px).
- **Title** (800, 22px, 1): Boat names, plate labels, crew and result group names, step titles, the catch-feed line, toasts.
- **Numeral** (900, 30px, tabular figures): Fish lengths and the depth gauge. Units drop to the label or UI step at 800.
- **UI** (800, 19px, 0.04em): Text buttons, crew footer, status tag, spine legend, number blocks, the SMALLEST stamp, the catch-feed label, the depth label. 19px is the smallest step allowed to carry red-on-black or black-on-red type: at weight 800+ it counts as large text, which the 3.7:1 pairing passes.
- **Label** (800, 14px, 0.16em tracking, uppercase): Eyebrow tags, gauge keys, table headings, the scroll hint.
- **Body** (Archivo 400–600, 16px, 1.4–1.5): Help steps, the fairness note, the winner sentence; fine print (tips, help footnote) drops to the 14px label step. Short lines only; never used for anything the back row needs to read.

### Named Rules
**The Slam Rule.** Display type arrives oversized and light, snaps to weight 900, overshoots once and settles. The weight change is part of the motion (canvas shouts go 300→900, the cast callout 250→900, the verdict 200→900).

**The Caps Rule.** Everything set in Big Shoulders is uppercase. Archivo sentences keep normal case.

**The Skewed Label Rule.** Labels inside levers and plates are skewed -9°, so the type leans into the slanted trailing edge.

## Layout

The page is a single full-bleed board bound on a spine. On desktop a 58px spine column holds two bolts and the vertical legend "CSCD01 Tutorial". The game card fills the rest of the viewport (100dvh, framed in a 3px black rule, with 14px of shell padding). The card is three rows: the ocean canvas, an optional scroll-hint strip, and the black control band (at least 104px tall) holding the rule message on the left and the lever on the right.

HUD plates float over the canvas at fixed corners. The masthead sits top-left and the Options tag top-right. The depth gauge sits bottom-left and the catch feed bottom-right, 18px in from the edges. Boats share the width in equal lanes, with name tags up to 118px wide. When boats no longer fit, the board scrolls sideways and a hint strip appears.

Spacing is tight and irregular in the way printed matter is. The recurring steps are 6px, 12px, 14px and 18px, and padding is optically corrected (for example 5px on top and 4px underneath caps).

Responsive behaviour. At 900px or narrower, band copy steps down. At 600px or narrower, the spine and status tag drop away, the card goes borderless, the band stacks with a full-width lever, and the cast callout steepens to -24°. Dialog spines narrow to 30px and results rows tighten. At a height of 520px or less, the spine drops and the band stays in a single row.

## Elevation & Depth

There is no ambient shadow and no blur. Depth is printed. Raised things cast a hard ink drop offset down and to the right, like a misregistered second impression, and pressing a control physically closes that gap. Red display type carries a black offset copy of itself. The canvas does the same on shouts and depth numerals: black first, red a few pixels up and to the left. Layering over the board is done with solid plates and black bands, not translucency. The single exception is the dialog backdrop, which is 80% type black with a faint cream diagonal hatch.

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

Circles appear only as printed discs: bolts, the sun, bobbers, the shockwave rings behind the cast and the winner fish, and the dotted search ring around a descending hook. Status dots are squares. Hook plates are rectangles with a V-notch pointing down the line. Fixed rotations are part of the form: -2° toast, -4° help title, -6° verdict and SMALLEST stamp, -12° winner fish, -15° cast callout.

## Components

The controls are tactile and mechanical: black-edged plates that you press into the page.

### Buttons
- **Shape:** Square with a slanted trailing edge (16px), a 3px black edge showing around a coloured face, and a bolt at the leading end.
- **Lever (primary):** Red face with black type, 26px at 900, at least 58px tall; on the band it is 30px and 64px tall, with a 26px bolt. The lever is used once per view, for the action that moves the round forward: cast, "Let's go fishing", "Mark presented".
- **Plate button (secondary):** Cream face with black type, 22px at 800, at least 52px tall. On hover the face turns black and the type cream.
- **Hover / Focus / Active:** Hover lifts the plate by -2px and extends the drop to 6px; the lever's type turns cream. Active pushes the plate 3px and shrinks the drop to 1px in 0.05s. Focus is a 3px red outline at a 4px offset (cream on the black band). Disabled plates get the stock-deep face, faded-ink type and edge, no drop, and a greyed bolt.
- **Icon button:** A 40px square with a 2px black frame on cream, inverting on hover. The pause button is 56px, cream-framed on black.
- **Text button:** Display caps at 17px/800 with no frame. On hover the type turns red and a 2px underline appears 5px below.

### Chips
- **Eyebrow tag:** A black slab with cream caps at 15px/800 and 0.16em tracking. It opens dialogs and headings.
- **Status tag:** A black slab with a slanted trailing edge and a square status dot that blinks red while fishing.
- **Number block:** A black square (34px in crew rows, 32px in results) with a cream tabular numeral. It turns red with black type for the smallest catch, and becomes an outlined faded-ink square when excluded.

### Cards / Containers
- **Corner Style:** Clipped top-right corner (see Shapes); no radius.
- **Background:** Stock cream with the global grain and speckle. Dialogs add the shaded spine gutter and a 3px rule.
- **Shadow Strategy:** None on plates; see Elevation.
- **Border:** 3px type black.
- **Internal Padding:** Options panel 18px (34px at the bottom to clear the corner bolts); dialogs 34px 38px 28px, with 76px on the left for the spine.

### Inputs / Fields
- **Style:** Crew rows are ruled ledger lines (1px black under each, 3px black above the list) with a borderless transparent Archivo input at 16px/600. Presented checkboxes are 16px black-framed squares that fill red with a black X when checked.
- **Focus:** The row shades to stock shade with a 3px red underline.
- **Excluded / Disabled:** The name is struck through with a 2px line in faded ink, and the row mark turns red.

### Navigation
The Options tag is the only navigation: a slanted plate at the top right that opens a clipped panel below it. When open, it inverts to a black face with a red drop and its chevron turns 180°.

### Bound Dialog (signature)
Each page hangs on a spine: a 46px shaded gutter behind a 3px black rule, with two bolts at its top and bottom, a clipped top-right corner and grain and speckle over the page. It opens with a page slam: rising 26px from -1.5° and 97% scale over 0.38s.

### Catch Feed (signature)
A black plate with two bolts and a notched corner. It shows a red caps label, a tabular count, the latest catch in 24px caps, and a segmented gauge: 11px red segments with 3px gaps that fill from the left as catches land.

### To-Scale Haul (signature)
The results table. Each row has a number block and name, then a measuring bar that ends in a printed fish drawn to scale against the largest catch, over a tick ruler every 10%, then the length. The smallest catch's row inverts to black; its bar, fish and length turn red, and a tilted red SMALLEST stamp appears. Rows slam in from the left with a 45ms stagger.

### Engraved Board (signature)
The Canvas 2D scene. The sea is ink lines every 12px, from 1.3 to 2.6px thick and heavier every sixth row, with a solid black waterline band. Headlands and seabed are hatched, and a red sun has a misregistered ink ring. Boats are solid black hulls with cream numerals. A hooked line turns red and grows from 2.6 to 3.6px; the hook plate turns red, and a black-offset red shout slams in with a shockwave and radiating lines. Each catch shakes the board up to 4.5px.

## Do's and Don'ts

### Do:
- **Do** print in two inks plus red: type black (#111111) on stock cream (#f2ede2), with mechanical red (#d7261e) only where there is pressure or the printed sun.
- **Do** carry group identity as a two-digit wood-type numeral on hull, hook plate, crew row and result row.
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
