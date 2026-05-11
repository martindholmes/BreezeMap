# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BreezeMap is an OpenLayers-based interactive mapping library developed by the Humanities Computing and Media Centre (HCMC) at the University of Victoria. It bridges TEI XML placeography/gazetteer documents and the OpenLayers mapping library. The build pipeline converts TEI XML data files → GeoJSON → deployable HTML map sites.

## Build Commands

The primary build tool is Apache Ant. Run from the project root:

```bash
ant          # Full build: CSS, TEI→GeoJSON conversion, create testsite
ant -lib .   # Required when the build needs the JS jars in the project root
```

Individual targets:
```bash
ant buildCss        # Compile SCSS → CSS (runs sass externally)
ant teiToGeoJSON    # Convert testdata/*.xml to js/*.json using Saxon
ant createTestSite  # Assemble testsite/ from source files
```

CSS only (without Ant):
```bash
sass css/hcmc_ol.scss css/hcmc_ol.css --source-map
```

**Schema build** (`buildSchema.xml`) is designed to be run from within the oXygen XML IDE using its TEI plugin, which provides the required XSLT stylesheets via `${teiPlugin}`.

## Running XSLT Tests

XSpec tests cover the XSLT functions module:

```bash
# Run via your local XSpec installation:
xspec xsl/functions_module.xspec
```

The test results are written to `xsl/functions_module-result.html`.

## Architecture

### Data flow

```
TEI XML (testdata/*.xml)
    └─→ xsl/tei_to_geojson3.xsl  (Saxon XSLT 3)
            └─→ js/*.json  (GeoJSON output)
                    └─→ HTML page (templates/BreezeMap.html + js/)
                                └─→ HolVectorLayer renders map via OpenLayers
```

### JavaScript modules (`js/`)

Three ES6 modules, loaded as `type="module"`:

- **`HolConstants.js`** — String captions (keyed by language code), state constants (`NAV_IDLE`, `NAV_SHOWHIDING_FEATURES`, etc.), and version info. Exports all constants for the other modules.
- **`HolUtil.js`** — Static utility class (`HolUtil`). Handles OL styles (hidden, selected, category, drawing, drag-box, user-location), color sets, geometry helpers, Ajax retrieval, and URL query parsing.
- **`HolVectorLayer.js`** (~3500 lines) — The main class. Instantiate with `new HolVectorLayer(olMap, featuresUrl, options)`. It builds the entire UI (toolbar, navigation panel, search, timeline, drawing tools, taxonomy/category editing) and manages feature display, selection, and filtering.

The `Hol` prefix stands for **HCMC OpenLayers** and appears on all public identifiers.

### GeoJSON format

The XSLT produces a GeoJSON `FeatureCollection`. The **first feature** has `id: "holMap"` and is never rendered; it carries the complete taxonomy/category tree (in `properties.taxonomies`) and map configuration (center, bounds, title). All subsequent features are geographic places.

### TEI XML data format

Source data lives in `testdata/*.xml`, validated against `schemas/breezemap.rng` (RelaxNG) and `schemas/breezemap.sch` (Schematron). Key structure:
- `teiHeader/encodingDesc/classDecl` — holds `<taxonomy>` / `<category>` definitions
- `text/body/listPlace` — holds `<place>` elements; each `@corresp` points to one or more category `@xml:id` values
- The `<place xml:id="holMap">` is a required special entry defining the map bounds as GeoJSON embedded in `<geo>`

### XSLT (`xsl/`)

- **`tei_to_geojson3.xsl`** — Main XSLT 3 transform; imports `functions_module.xsl`. Writes GeoJSON to `js/<inputBasename>.json`.
- **`functions_module.xsl`** — Reusable functions (date range labels, XHTML escaping, etc.) with corresponding XSpec tests.
- **`get_ol_version.xsl`** — Reads `js/ol_latest.json` to extract the OL download URL.
- **`new_html_from_template.xsl`** — Creates an HTML page from `templates/BreezeMap.html`.
- **`spiff_up_documentation.xsl`** — Post-processes the generated `documentation/breezemap.html`.

### Schema (`schemas/`)

Authored as a TEI ODD (`breezemap.odd`) and built (via `buildSchema.xml` in oXygen) into `breezemap.rng` and `breezemap.sch`.

### CSS (`css/`)

SCSS source is `hcmc_ol.scss`; the compiled output is `hcmc_ol.css`. The `.css.map` file is gitignored.

## Code Style Notes

Per HCMC custom style guide (README): **comments are used instead of self-commenting code**. Existing inline JSDoc comments must be preserved and new methods should follow the same JSDoc pattern already present in the JS files.

OpenLayers is loaded as a pre-built bundle (`ol/ol.js`) and referenced as the global `ol`. The JS modules import from each other but not from OL directly.
