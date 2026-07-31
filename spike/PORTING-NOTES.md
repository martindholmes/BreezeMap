# BreezeMap → MapLibre porting notes (handoff)

Working context for adding MapLibre support to BreezeMap. Branch `maplibre`
(off `dev`). This doc is the cross-machine handoff: it captures the analysis,
the decision, and the next steps so a fresh session can continue from here.
The runnable proof and styling details are in the companion
[`spike/README.md`](./README.md) and [`spike/styling.html`](./styling.html).

## Goal

Let BreezeMap run on **MapLibre GL JS** as well as **OpenLayers**, selectable
via a runtime option, ideally from **one codebase**.

## Status (as of this branch)

- Analysis complete (below).
- **Styling de-risk spike done and confirmed working** (commit that adds
  `spike/`). It proves the hardest translation — per-feature imperative OL
  styling → MapLibre `feature-state` + expressions — is sound, including
  directional arrows.
- No production code refactored yet. Adapter not written yet.

## Analysis

BreezeMap is ~4,370 lines across `js/HolVectorLayer.js`, `js/HolUtil.js`,
`js/HolConstants.js`. Roughly **~80% is map-engine-agnostic** (navigation menu,
taxonomy/category model, info panel, timeline, search, feature upload,
`hol:` deep-links, i18n/captions). OpenLayers coupling is **concentrated in
~35–40 sites**, not diffuse.

### Where the OL coupling lives

- **Per-feature imperative styling** — `feature.setStyle(...)` in
  `HolVectorLayer.js` (several call sites: normal/selected/hidden/drawing/
  user-location), driven by `HolUtil.getCategoryStyle`, `getSelectedStyle`,
  `getHiddenStyle`, `getDrawingStyle`, `getUserLocationStyle`. Colour is chosen
  at render time from the feature's runtime `showingCat` property.
- **Resolution-dependent geometry in styles** — `getSelectedStyle` /
  `getCategoryStyle` walk each segment of directional LineStrings and place an
  arrow only when `pixLen > 25` (pixel length = segment length ÷ view
  resolution). See `HolUtil.getPointGeometry`.
- **Hit-testing** — `forEachFeatureAtPixel` for click/hover selection.
- **Drawing / editing** — `ol.interaction.Draw` / `Modify` / `DragBox`, plus
  `GeometryCollection` handling in the drawing code (`HolVectorLayer.js`).
- **Geometry utilities** — extent math (`getSize`, `getCenter`), `getLength`,
  `GeometryCollection`, `ol.geom.*` constructors.
- **Projection** — internal reliance on EPSG:3857 (`ol.proj.fromLonLat`, etc.).

### Hardest mismatch

Per-feature imperative styling (`setStyle`) and the resolution-based arrow
culling vs. MapLibre's **declarative** model (feature-state + data-driven
expressions, no imperative per-feature styling). This is exactly what the spike
targeted — and it translates cleanly (see below).

## Decision: refactor-first, adapter-based

1. Extract a **~15-method map-engine adapter** interface (hit-testing, styling,
   layer/source management, view/camera, geometry helpers, drawing hooks).
2. Implement it first with **OpenLayers**, as a **behaviour-preserving**
   refactor — route the ~35–40 coupling sites through the adapter with no
   visible change. This is the low-risk step and can be validated against the
   existing app before MapLibre exists.
3. Add a **viewer-only MapLibre adapter**.
4. **Defer editor parity** (drawing, `GeometryCollection`, static-image
   annotation) — MapLibre is weaker there; do it later if needed.

## What the spike proved

Full mapping table is in `spike/README.md`. Headlines:

- OL `setStyle` reading `showingCat` → one GeoJSON source + static layers +
  per-feature `setFeatureState({vis, cat})` + `match` expressions on
  `fill/line/icon-color`, width, and opacity.
- Three visual states (hidden/normal/selected) → `match` on
  `['feature-state','vis']`.
- Selected magenta halo + incrementing `zIndex` → a dedicated halo line layer
  above the base line layer (layer order replaces per-feature z).
- **Directional arrows** (the scary one) → `symbol-placement: line` +
  `symbol-spacing` + built-in **collision detection**, which drops arrows that
  don't fit. This *replaces* the resolution-based `pixLen > 25` culling and is
  simpler than the imperative version.
- Icon tinting requires **SDF** images (`addImage(..., {sdf:true})`).

## Gotchas / lessons (carry into the real port)

- **Keep the map style fully self-contained.** The blank-map debugging in this
  spike was caused by the **glyphs fetch (`demotiles.maplibre.org`) hanging in a
  restricted network, which stalls the entire render** — not by the data or
  expressions. Vendor glyphs/sprites; declare no external URLs.
- `text-field` is a **layout** property and cannot read `feature-state`; gate
  label visibility via `text-opacity` (paint). The spike omits the label to
  stay glyph-free — restore it with vendored glyphs.
- Apply `setFeatureState` **after** the source has loaded (`isSourceLoaded`).
- MapLibre 512px-tile zoom is ~1 level tighter than OL's 256px zoom.
- Verifying MapLibre headlessly: `--virtual-time-budget` screenshots race
  MapLibre's real-time GeoJSON Web Worker → blank/partial frames. Drive
  Chromium with **puppeteer-core in real time** (wait for a ready flag) instead.
  OL headless screenshots are reliable either way.

## Next steps

1. **Design the ~15-method adapter interface** (write the contract first;
   OL as the first implementation).
2. Begin the behaviour-preserving OL extraction, routing coupling sites through
   the adapter.
3. Build the viewer-only MapLibre adapter, starting from the spike's styling
   translation.
4. (Polish) Restore the selected-state text label using vendored glyphs.

## Palette reference (must match `HolUtil.tenColors`)

```
rgb(85,0,0) rgb(0,85,0) rgb(0,0,85) rgb(85,85,0) rgb(85,0,85)
rgb(0,85,85) rgb(150,0,0) rgb(0,130,0) rgb(0,0,150) rgb(0,0,0)
```
Category colour = `tenColors[catNum % 10]`. Shape fill opacity 0.2; line
opacity 0.6; selected halo `rgba(255,0,255,0.6)` width 8; selected icon tint
magenta; category line width 5 for non-directional LineStrings else 2.
