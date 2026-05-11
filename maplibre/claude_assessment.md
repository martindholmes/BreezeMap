# Feasibility Assessment: Abstracting OpenLayers to Support MapLibre

## The core problem: the two libraries have incompatible mental models

OpenLayers is **imperative and object-oriented**. Styling is per-feature JavaScript callbacks (`feature.setStyle(new ol.style.Style({...}))`). Features are first-class objects you mutate. Interactions (draw, modify, drag-box) are objects you add to the map.

MapLibre is **declarative and data-driven**. Styling is a JSON spec with expressions evaluated by the renderer. There are no "Feature objects" — data is GeoJSON passed into sources, and you query results back. There is no built-in draw interaction; drawing requires the separate `@maplibre/maplibre-gl-draw` plugin, which has its own API.

An abstraction layer that tries to hide this difference would end up being a new mini-framework — non-trivial to design, write, and maintain.

## What could realistically be abstracted

The **display/navigation/filtering path** — which is what most deployed read-only maps need — is genuinely separable:

- Map init, center, zoom
- Loading a GeoJSON source
- Fitting the view to an extent / a set of features
- Click-to-select a feature
- Show/hide features (OL: `feature.setStyle(hidden)` vs MapLibre: filter expressions on a layer)
- Basic styling by category

This covers most of `HolVectorLayer.js`'s surface area and is what the end-user actually sees.

## What cannot be cheaply abstracted

- **Styling**: `HolUtil.js` has 18+ `ol.style.Style` / `ol.style.Stroke` / `ol.style.Fill` constructions. The MapLibre equivalent is a `paint`/`layout` object in the layer spec — a completely different shape. An adapter is possible but is not a thin wrapper.
- **Drawing tools**: `ol.interaction.Draw`, `ol.interaction.Modify`, `ol.interaction.DragBox` are ~400 lines of tightly integrated code. MapLibre Draw is a separate plugin with a different lifecycle. This is arguably easier to just duplicate than to abstract.
- **Projection**: OL works in EPSG:3857 internally and transforms on load; MapLibre is always WGS84. The projection calls are few but they touch coordinate values throughout.

## A more practical approach

Rather than a single abstraction layer over everything, a **split-by-responsibility** refactor would be more tractable:

1. Extract a `MapAdapter` module with a small, explicit interface covering only what differs between OL and MapLibre: `init`, `addGeoJSONSource`, `setFeatureVisible`, `setFeatureStyle`, `fitToExtent`, `onFeatureClick`. Implement it twice — `OLAdapter.js` and `MapLibreAdapter.js`.
2. Leave `HolVectorLayer.js` calling only `MapAdapter` methods, never `ol.*` directly.
3. Gate drawing/editing behind `allowDrawing` — keep that OL-only for now, since MapLibre projects are unlikely to need it initially.

This is still a substantial refactor (the styling adapter alone is a design problem), but it is bounded and testable rather than open-ended.

## Bottom line

If MapLibre projects only need read-only map display (no drawing), the abstraction is feasible in roughly the size of a medium project. If they need drawing too, you are closer to a full port than an abstraction. The most important decision before starting is whether drawing support in MapLibre is required.
