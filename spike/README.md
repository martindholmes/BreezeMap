# Spike: OpenLayers per-feature styling → MapLibre feature-state

De-risk spike for running BreezeMap on **MapLibre GL JS** as well as OpenLayers.
It answers one question: *can BreezeMap's per-feature imperative OL styling be
reproduced declaratively in MapLibre?* Answer: **yes.**

## Run it

```sh
# from the repo root
python3 -m http.server 8731
# then open:
#   http://localhost:8731/spike/styling.html
```

`styling.html` shows the **same three features** (Point, directional LineString,
Polygon) side by side — OpenLayers on the left (reproducing the current
`HolUtil` styling model), MapLibre on the right (the declarative target model).
The buttons under the maps cycle each feature's **state**
(hidden / normal / selected) and **category** (colour) at runtime.

MapLibre GL JS is vendored locally in `spike/maplibre/`. The page is **fully
self-contained — no network at all** (see the glyphs note below).

## What the translation looks like

| OpenLayers (current) | MapLibre (target) |
|---|---|
| `feature.setStyle(fn)` reading `showingCat` | one GeoJSON source + static layers; per-feature `setFeatureState({vis, cat})` |
| category colour from `showingCat` | `['match', ['to-number', ['feature-state','cat']], …]` on `fill/line/icon-color` |
| swap whole style objects for hidden/normal/selected | `['match', ['feature-state','vis'], …]` on colour/width/opacity |
| selected magenta halo + incrementing `zIndex` | a dedicated halo line layer **above** the base line layer (layer order replaces per-feature z) |
| `ol.style.Icon` `color` tint | **SDF** image (`addImage(…, {sdf:true})`) so `icon-color` can tint it (built from a canvas at runtime) |
| directional arrows: walk segments, cull by `pixLen > 25` vs resolution | `symbol` layer + `symbol-placement: line` + `symbol-spacing` + **collision detection** — arrows that don't fit are dropped automatically. No resolution math in app code. |

The directional-arrow case was the scariest item in the analysis; declaratively
it is *simpler* than OL's imperative per-segment placement.

## Gotchas learned here (carry into the real port)

- **Keep the map style self-contained.** The single biggest time-sink was a
  *blank map* that turned out to be the **glyphs fetch to
  `demotiles.maplibre.org` hanging** in a restricted network — an unreachable
  glyphs (or sprite/tile) endpoint stalls the **entire** render, not just the
  text. Vendor glyphs/sprites locally; declare no external URLs.
- **`text-field` is a *layout* property** and cannot read `feature-state`. To
  show a label only when selected, keep the field constant and gate visibility
  via `text-opacity` (a paint property). (The spike currently omits the label
  to stay glyph-free; restore it with vendored glyphs.)
- **Icons must be SDF** to be tintable by `icon-color`.
- **Apply `setFeatureState` after the source has loaded** (`isSourceLoaded`),
  not immediately after `addSource`.
- **MapLibre 512px-tile zoom is ~1 level tighter** than OL's 256px zoom.

## Verifying headlessly

- MapLibre parses GeoJSON on a **Web Worker** (real wall-clock time). Chromium
  `--headless --screenshot --virtual-time-budget=…` fast-forwards the main
  thread and shoots **before** the worker finishes → intermittent blank frames.
  Don't trust virtual-time screenshots for MapLibre.
- Driving Chromium with **puppeteer-core in real time** (wait for a ready flag)
  is reliable. OpenLayers headless screenshots are reliable either way.

## Scope

Viewer styling only. Editor parity (drawing via `ol.interaction.Draw/Modify`,
`GeometryCollection`, static-image annotation) is **deferred** — MapLibre is
weaker there, and the plan scopes the MapLibre adapter as viewer-only first.
