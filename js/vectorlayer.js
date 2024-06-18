
'use strict';

import * as util from "./util.js"
import * as constants from "./constants.js"

/**
 * VectorLayer class is the core class which is
 * instantiated to create the vector layer on the map.
 * When constructing, pass it a pointer to the map,
 * along with the URLs of the JSON files for categories
 * and GeoJSON features, and it will take care of the
 * rest.
 *
 * @class VectorLayer
 * @constructs VectorLayer
 * @param {ol.Map} map OpenLayers3 ol.Map object on
 *        which the vector layer will be constructed.
 * @param {string} featuresUrl URL of the GeoJSON file
 *        which contains the features for the layer.
 *
 */
class VectorLayer {

    constructor(olMap, featuresUrl, options) {
        this.olMap = olMap;
        this.featuresUrl = featuresUrl;
        this.options = options;

        try{
            // First process the options object.
            if (options === undefined){
                options = {};
            }
            // Setting for testing new features.
            this.testing = options.testing || false;
            this.allowUpload = options.allowUpload || false;
            this.allowDrawing = options.allowDrawing || false;
            this.allowTaxonomyEditing = options.allowTaxonomyEditing || false;
            this.allFeaturesTaxonomy = (options.allFeaturesTaxonomy /*&& !this.allowDrawing*/) || false;
            // If multiple taxonomies are being used, and this is true, then
            // generate an additional taxonomy which combines everything. If
            // you combine this with drawing, though, things get messy.
            this.initialTaxonomyId = options.initialTaxonomyId || '';


            this.msPlayInterval = (options.msPlayInterval === undefined)? 1500 : options.msPlayInterval;
            this.pageLang = document.querySelector('html').getAttribute('lang') || 'en';
            this.collator = new Intl.Collator(this.pageLang);

            // Prefix to be added to all linked document paths before retrieval.
            // To be set by the host application if required.
            this.linkPrefix = options.linkPrefix || '';

            // A function to be called when the object has been fully constructed.
            this.onReadyFunction = options.onReadyFunction || null;

            // Whether geolocation tracking should be turned on automatically
            this.trackUserLocation = options.trackUserLocation || false;

            // Whether a button is provided for users to turn on tracking.
            this.allowUserTracking = options.allowUserTracking || false;


            // Whether to pan/zoom to frame current features
            // when a timeline step happens.
            this.timelinePanZoom = (options.timelinePanZoom === undefined)? true : options.timelinePanZoom;


            // Will hold the id of the position watcher if tracking is turned on.
            this.geolocationId = -1;

            // Pointer to a feature used as a position marker for user tracking.
            this.userPositionMarker = null;

            // Stash a convenient ref to the body of the host document.
            this.docBody = document.getElementsByTagName('body')[0];


            this.captionLang = document.getElementsByTagName('html')[0].getAttribute('lang') || 'en'; //Document language.
            // Pointer to the caption object we're going to use.
            this.captions = constants.captions[this.captionLang];


            // The OpenLayers map object.
            this.map = olMap;
            // If a map title is specified in the GeoJSON, it will be stored here.
            this.mapTitle = '';
            // Pointer to the ol.View.
            this.view = this.map.getView();
            // URL of the JSON file containing all the features.
            this.featuresUrl = featuresUrl || '';
            // If there is an initial document to show in the left panel.
            this.startupDoc = options.startupDoc || '';
            // Will contain a filename for data download if needed.
            this.geojsonFileName = '';
            // Will point to drawing interaction if invoked.
            this.draw = null;
            // Will point to modify interaction if invoked.
            this.modify = null;
            // Will hold e.g. 'Point', 'GeometryCollection'.
            this.currDrawGeometryType = '';
            // Will hold an actual ol geometry object.
            this.currDrawGeometry = null;
            // Will point to an ol.Collection() if invoked.
            this.drawingFeatures = null;
            // Will carry drawn features if invoked.
            this.featureOverlay = null;
            this.coordsBox = null;
            // Will point to a box containing drawing coords.
            this.acceptCoords = null;
            // Will point to a button to accept drawn coords.
            this.splash = this.getSplashScreen();

            // Will point to the ol.source.Vector.
            this.source = null;
            this.tmpSource = null;
            // Will be used to load more features without discarding existing set.
            this.taxonomiesLoaded = false;
            // Need to know when the taxonomies have been constructed.
            this.features = [];
            // This is set to point to the features of the source after loading.
            this.baseFeature = null;
            // Will hold a pointer to the base map feature which is never shown but
            // carries the complete set of taxonomies and other map-wide properties.
            this.taxonomies = [];
            // Holds the reconstructed taxonomy/category sets after loading.
            // Holds the index of the taxonomy currently being displayed in the
            // navigation panel.
            this.currTaxonomy = -1;
            // Good to know when loading of features is done.
            this.featsLoaded = false;

            // Makes sure we don't try to do two things at the same time.
            this.featureDisplayStatus = constants.NAV_IDLE;

            // Pointer to the toolbar after we have created it.
            this.toolbar = null;
            // Pointer to Information button after we have created it.
            this.iButton = null;
            // Pointer to user location tracking button if it is created.
            this.userTrackButton = null;
            // Pointer to button which toggles the menu display in mobile view.
            this.mobileMenuToggleButton = null;
            // Pointer to the taxonomy selector on the toolbar.
            this.taxonomySelector = null;
            // Pointer to the navPanel after we have created it.
            this.navPanel = null;
            // Pointer to the nav search input box after we've created it.
            this.navInput = null;
            // Will be a nodeList of all checkboxes for features.
            this.featureCheckboxes = null;
            // Will be a nodeList of all checkboxes for categories.
            this.categoryCheckboxes = null;
            // Will be a pointer to the show/hide all features checkbox.
            this.allFeaturesCheckbox = null;
            // Will contain the index of the currently-selected feature, or -1.
            this.selectedFeature = -1;
            // Will contain a pointer to the navigation panel list item for
            // the selected feature.
            this.selectedFeatureNav = null;
            // Will contain a pointer to the title span on the left of the toolbar.
            this.docTitle = null;
            // Will contain a pointer to menu-like controls for editing etc.
            this.menu = null;
            // Will contain a pointer to file upload/download control menu.
            this.fileMenu = null;
            // Will contain a pointer to map setup menu.
            this.setupMenu = null;
            // Will contain a pointer to the drawing menu.
            this.drawMenu = null;
            // Will be populated from the richTimelinePoints property of the base feature.
            this.timelineData = null;
            // Will contain a pointer to the timeline control, if one is constructed.
            this.timeline = null;
            // Will be populated with objects for start and end points, labels, and lists of features.
            this.timelinePoints = [];
            // Will hold the numbers of features shown the last time a timeline change happened.
            this.lastTimelineFeatNums = new Set();
            // Will store the interval pointer when playing the timeline.
            this.playInterval = null;
            // Will contain a pointer to the timeline play control, if one is constructed.
            this.playButton = null;
            // Will contain a pointer to the timeline step forward control, if one is constructed.
            this.stepForwardButton = null;
            // Will contain a pointer to the timeline step back control, if one is constructed.
            this.stepBackButton = null;
            // Will contain a pointer to an SVG image for the button if required.
            this.playImg = null;

            // Start by creating the toolbar for the page.
            this.buildToolbar();

            // Next we create a div for displaying external retrieved documents.
            this.docDisplayDiv = document.createElement('div');
            this.docDisplayDiv.setAttribute('id', 'holDocDisplay');
            //  We need to avoid this thing flashing on the screen just when it's added to the DOM.
            this.docDisplayDiv.setAttribute('style', 'display: none;');
            this.docDisplayDiv.classList.add('hidden');
            let closeBtn = document.createElement('span');
            closeBtn.setAttribute('class', 'closeBtn');
            closeBtn.appendChild(document.createTextNode(this.captions.strCloseX));
            closeBtn.addEventListener('click', function(e){e.target.parentNode.classList.add('hidden'); this.docDisplayFrame.setAttribute('src', '');}.bind(this), false);
            this.docDisplayDiv.appendChild(closeBtn);
            this.docDisplayFrame = document.createElement('iframe');
            this.docDisplayFrame.setAttribute('id', 'holDocDisplayFrame');
            this.docDisplayDiv.appendChild(this.docDisplayFrame);
            this.docBody.appendChild(this.docDisplayDiv);
            this.docDisplayDiv.setAttribute('style', '');

            //  Add an event listener to fix hol: links whenever a document is loaded.
            this.docDisplayFrame.addEventListener('load', function(){try{this.rewriteHolLinks(this.docDisplayFrame.contentDocument.getElementsByTagName('body')[0]);}catch(e){}}.bind(this), false);

            //  Now we create a box-dragging feature.
            this.dragBox = new ol.interaction.DragBox({
                condition: ol.events.condition.platformModifierKeyOnly,
                style: util.Util.getDragBoxStyle()

            });

            this.dragBox.on('boxend', function(e){
                let boxExtent = this.dragBox.getGeometry().getExtent();
                this.zoomToBox(boxExtent);
            }.bind(this));

            this.map.addInteraction(this.dragBox);

            // Add the click function to the map, even though there's nothing to receive it yet.
            this.map.on('click', function(evt){this.selectFeatureFromPixel(evt.pixel);}.bind(this));

            // Add the vector layer, with no source for the moment.
            this.layer = new ol.layer.Vector({style: util.Util.getHiddenStyle});
            this.map.addLayer(this.layer);

            //  Now various extra optional features.

            if (this.allowUpload === true){
                this.setupUpload();
            }

            if (this.allowDrawing === true){
                this.setupDrawing();
            }
            if (this.allowTaxonomyEditing === true){
                this.setupTaxonomyEditing();
            }

            // Now start loading vector data.
            if (this.featuresUrl !== ''){
                this.loadGeoJSONFromString(this.featuresUrl);
                this.geojsonFileName = this.featuresUrl.split(/(\\|\/)/).pop();
            }

        }
        catch(e){
            console.error(e.message);
        }

    }


    setupEditingMenu = function(){
        try{
            if (this.menu === null){
                this.menu = document.createElement('ul');
                this.menu.setAttribute('class', 'holMenu');
                this.toolbar.insertBefore(this.menu, this.docTitle.nextSibling);
            }
            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for setting up interface components for uploading
     *                         a GeoJSON file.
     *
     * @function
     setupUpload
     * @memberof VectorLayer.prototype
     * @description Adds components to the toolbar to allow the user
     *              to upload a GeoJSON file into the page.
     * @returns {Boolean} true (success) or false (failure).
     */

    setupUpload(){
        let input, ul, itemUp, itemDown, itemPaste;
        try{
            if (this.fileMenu === null){
                if (this.menu === null){this.setupEditingMenu();}
                input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('id', 'fileInput');
                input.setAttribute('accept', 'application/vnd.geo+json,application/json');
                this.toolbar.appendChild(input);
                this.fileMenu = document.createElement('li');
                this.fileMenu.appendChild(document.createTextNode(this.captions.strFile));
                ul = document.createElement('ul');
                this.fileMenu.appendChild(ul);
                itemUp = document.createElement('li');
                itemUp.appendChild(document.createTextNode(this.captions.strLoadFile));
                ul.appendChild(itemUp);
                this.menu.appendChild(this.fileMenu);
                itemUp.addEventListener('click', function(e){input.click(); e.preventDefault();}, false);
                input.addEventListener('change', function(){
                    let reader = new FileReader();
                    reader.onload = (function(hol) { return function(e) {
                        if (input.files[0].type.match('xml')){
                            //NOTE: THIS DOESN'T WORK AND WILL PROBABLY NEVER WORK.
                            teiToGeoJSON(e.target.result, 'js/tei_to_geojson_xslt1.xsl');
                        }
                        else{
                            loadGeoJSONFromString(e.target.result);
                        }

                    }; })(this);
                    console.log('Loading ' + input.files[0].name + ' as ' + input.files[0].type);
                    this.geojsonFileName = input.files[0].name;
                    reader.readAsDataURL(input.files[0]);
                }.bind(this), false);
                itemDown = document.createElement('li');
                itemDown.appendChild(document.createTextNode(this.captions.strSaveGeoJSON));
                ul.appendChild(itemDown);
                itemDown.addEventListener('click', this.downloadGeoJSON.bind(this), false);
                itemPaste = document.createElement('li');
                itemPaste.appendChild(document.createTextNode(this.captions.strPasteGeoJSON));
                ul.appendChild(itemPaste);
                itemPaste.addEventListener('click', this.pasteGeoJSON.bind(this), false);
            }

            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for setting up feature-editing functionality.
     *
     * @function
     setupFeatureEditing
     * @memberof VectorLayer.prototype
     * @description Sets up some interface controls that allow the user
     *              to create new features and edit existing ones.
     * @returns {Boolean} true (success) or false (failure).
     */

    setupDrawing(){
        let menu, item, types, simpleTypes, i, maxi, j, maxj, submenu, subitem;
        try{
            if (this.menu === null){this.setupEditingMenu();}
            // Set up the setup menu.
            if (this.setupMenu === null){
                this.setupMenu = document.createElement('li');
                this.setupMenu.appendChild(document.createTextNode(this.captions.strSetup));
                menu = document.createElement('ul');
                this.setupMenu.appendChild(menu);
                item = document.createElement('li');
                item.appendChild(document.createTextNode(this.captions.strMapArea));
                menu.appendChild(item);
                item.addEventListener('click', this.drawMapBounds.bind(this), false);
                this.menu.appendChild(this.setupMenu);
            }


            // Now the main feature-drawing menu.
            if (this.drawMenu === null){
                types = [this.captions.strStopDrawing, this.captions.strClear, 'Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection'];
                simpleTypes = ['Point', 'LineString', 'Polygon'];
                this.drawMenu = document.createElement('li');
                this.drawMenu.appendChild(document.createTextNode(this.captions.strDraw));
                menu = document.createElement('ul');
                this.drawMenu.appendChild(menu);
                for (i=0, maxi = types.length; i< maxi; i++){
                    item = document.createElement('li');
                    item.appendChild(document.createTextNode(types[i]));
                    menu.appendChild(item);
                    if (types[i] === 'GeometryCollection'){
                        item.setAttribute('class', 'hasSubmenu');
                        submenu = document.createElement('ul');
                        for (j=0, maxj=simpleTypes.length; j<maxj; j++){
                            subitem = document.createElement('li');
                            subitem.appendChild(document.createTextNode(simpleTypes[j]));
                            subitem.addEventListener('click', this.addDrawInteraction.bind(this, (types[i]+':'+simpleTypes[j])), false);
                            submenu.appendChild(subitem);
                        }
                        item.appendChild(submenu);
                    }
                    else{
                        item.addEventListener('click', this.addDrawInteraction.bind(this, types[i]), false);
                    }
                }
                this.menu.appendChild(this.drawMenu);
                this.drawingFeatures = new ol.Collection();
                this.featureOverlay = new ol.layer.Vector({
                    source: new ol.source.Vector({
                        features: this.drawingFeatures
                    }),
                    style: util.Util.getDrawingStyle()
                });
                this.featureOverlay.setMap(this.map);
                this.coordsBox = document.createElement('textarea');
                this.coordsBox.setAttribute('id', 'holCoordsBox');
                this.docBody.appendChild(this.coordsBox);
                this.acceptCoords = document.createElement('button');
                this.acceptCoords.setAttribute('id', 'btnAcceptCoords');
                this.acceptCoords.setAttribute('class', 'drawButton');
                this.acceptCoords.appendChild(document.createTextNode(this.captions.strOk));
                this.acceptCoords.addEventListener('click', this.addDrawnFeature.bind(this));
                this.docBody.appendChild(this.acceptCoords);
            }

            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for setting up taxonomy-editing functionality.
     *
     * @function
     setupTaxonomyEditing
     * @memberof VectorLayer.prototype
     * @description Sets up some interface controls that allow the user
     *              to create new taxonomies and categories, and edit
     *              existing ones.
     * @returns {Boolean} true (success) or false (failure).
     */

    setupTaxonomyEditing(){
        let itemAddTaxonomy;
        try{
            if (this.fileMenu === null){this.setupFileMenu();}
            itemAddTaxonomy = document.createElement('li');
            itemAddTaxonomy.appendChild(document.createTextNode(this.captions.strNewTaxonomy));
            this.fileMenu.getElementsByTagName('ul')[0].appendChild(itemAddTaxonomy);
            itemAddTaxonomy.addEventListener('click', this.newTaxonomy.bind(this), false);
            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for allowing the user to define the main map bounds.
     *
     * @function
     drawMapBounds
     * @memberof VectorLayer.prototype
     * @description Initiates a drawing action the user to draw a
     *              rectangular box which delineates the starting
     *              boundary of their map.
     * @returns {Boolean} true (success) or false (failure).
     */


    drawMapBounds(drawingType){
        try{
            this.drawingFeatures.clear();
            if (this.draw !== null){
                this.map.removeInteraction(this.draw);
            }
            if (this.modify !== null){
                this.map.removeInteraction(this.modify);
            }
            this.draw = new ol.interaction.Draw({
                features: this.drawingFeatures,
                type: 'LineString',
                maxPoints: 2,
                geometryFunction: ol.interaction.Draw.createBox()
            });
            this.map.addInteraction(this.draw);
            this.coordsBox.style.display = 'block';
            this.draw.on('drawend', function(evt){this.drawMapBoundsEnd(evt);}.bind(this));
            this.showTimeline(false);
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for initiating a feature-drawing action
     *
     * @function
     addDrawInteraction
     * @memberof VectorLayer.prototype
     * @description Initiates a drawing action for users editing and
     *                        creating new feature geometries.
     * @param {ol.geom.GeometryType} drawingType A string representing a
     *                               specific feature type.
     * @returns {Boolean} true (success) or false (failure).
     */

    addDrawInteraction(drawingType){
        try{

            if (drawingType === this.captions.strClear){
                this.drawingFeatures.clear();
                this.coordsBox.value = '';
                return true;
            }
            if (((drawingType !== this.currDrawGeometryType)&&(!drawingType.match(/^GeometryCollection:/)))||((!this.currDrawGeometryType.match(/^GeometryCollection:/))&&(drawingType.match(/^GeometryCollection:/)))){
                this.drawingFeatures.clear();
                this.currDrawGeometryType = '';
                this.currDrawGeometry = null;
            }
            if (this.draw !== null){
                this.map.removeInteraction(this.draw);
            }
            if (this.modify !== null){
                this.map.removeInteraction(this.modify);
            }
            if (drawingType === this.captions.strStopDrawing){
                this.drawingFeatures.clear();
                this.currGeometry = null;
                this.currDrawGeometryType = '';
                this.coordsBox.style.display = 'none';
                this.acceptCoords.style.display = 'none';
                this.showTimeline(true);
                return true;
            }


            this.draw = new ol.interaction.Draw({
                features: this.drawingFeatures,
                type: /** @type {ol.geom.GeometryType} */ drawingType.replace(/^GeometryCollection:/, '')
            });
            this.draw.on('drawstart', function(evt){this.drawStart(evt);}.bind(this));
            this.draw.on('drawend', function(evt){this.drawEnd(evt);}.bind(this));
            this.map.addInteraction(this.draw);
            this.modify = new ol.interaction.Modify({
                features: this.drawingFeatures,
                // the SHIFT key must be pressed to delete vertices, so
                // that new vertices can be drawn at the same position
                // of existing vertices
                deleteCondition: function(event) {
                    return ol.events.condition.shiftKeyOnly(event) &&
                        ol.events.condition.singleClick(event);
                }
            });
            this.modify.on('modifyend', function(evt){this.drawEnd(evt);}.bind(this));
            this.map.addInteraction(this.modify);
            this.currDrawGeometryType = drawingType;
            this.coordsBox.style.display = 'block';
            this.showTimeline(false);
            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function to handle the initiation of drawing a feature.
     *
     * @function
     drawStart
     * @memberof VectorLayer.prototype
     * @description Handles the beginning of a drawing operation, configuring the
     *                      drawing interface as needed.
     * @param   {ol.interaction.DrawEvent} evt The event emitted by the
     *                        ol.interaction.Draw instance that has started.
     * @returns {Boolean} true (success) or false (failure).
     */

    drawStart(){
        try{
            if (!this.currDrawGeometryType.match(/^((Polygon)|(Multi)|(GeometryCollection))/)){
                this.drawingFeatures.clear();
            }
            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function which decides whether a geometry needs to be transformed
     * from EPSG:3857 to EPSG4326 or not, and if needed. transforms it.
     * The decision depends on whether the initial view projection is
     * 3857 or not. If we're dealing with a static image layer, then it
     * would not be.
     *
     * @function
     transformGeom
     * @memberof VectorLayer.prototype
     * @description If the projection of the ol.View is EPSG:3857, then we're
     *              dealing with a real map, and we need to convert to EPSG:4326
     *              to save as GeoJSON. If not, we're dealing with a static image
     *              and we need to leave the geometry alone.
     * @param   {ol.geom.Geometry} geom The geometry we're dealing with.
     * @returns {ol.geom.Geometry} A clone of the original geometry, transformed or not.
     */

    transformGeom(geom){
        try{
            if (this.view.getProjection().getCode() === 'EPSG:3857'){
                return geom.clone().transform('EPSG:3857', 'EPSG:4326');
            }
            else{
                return geom.clone();
            }
        }
        catch(e){
            console.error(e.message);
            return null;
        }
    };

    /**
     * Function to handle the products of drawing a feature.
     *
     * @function
     drawEnd
     * @memberof VectorLayer.prototype
     * @description Handles the end of a drawing operation, generating the
     *              appropriate output code.
     * @param   {ol.interaction.DrawEvent} evt The event emitted by the
     *                        ol.interaction.Draw instance that has completed.
     * @returns {Boolean} true (success) or false (failure).
     */

    drawEnd(evt){
        let tmpFeat, i, maxi, j, maxj, tmpGeom, polys, arrGeoms;
        try{
            // For some feature types, it's not possible to know for sure when drawing is finished.
            if (this.currDrawGeometryType.match(/^((Polygon)|(Multi)|(GeometryCollection))/)){
                switch (this.currDrawGeometryType){

                    case 'Polygon':
                        tmpFeat = new ol.Feature({geometry: new ol.geom.Polygon([])});
                        tmpGeom = tmpFeat.getGeometry();
                        for (i=0, maxi=this.drawingFeatures.getLength(); i<maxi; i++){
                            // tmpFeat.getGeometry().appendLinearRing(this.drawingFeatures.item(i).getGeometry().clone().transform('EPSG:3857', 'EPSG:4326'));
                            tmpFeat.getGeometry().appendLinearRing(this.transformGeom(this.drawingFeatures.item(i).getGeometry()));
                        }
                        // The last geometry drawn is not added to the layer because technically we have not finished drawing yet.
                        if (typeof evt.feature !== 'undefined'){
                            // tmpGeom.appendLinearRing(evt.feature.getGeometry().clone().transform('EPSG:3857', 'EPSG:4326'));
                            tmpGeom.appendLinearRing(this.transformGeom(evt.feature.getGeometry()));
                        }
                        this.showCoords(tmpFeat.getGeometry());
                        break;

                    case 'MultiPoint':
                        tmpFeat = new ol.Feature({geometry: new ol.geom.MultiPoint([])});
                        tmpGeom = tmpFeat.getGeometry();
                        for (i=0, maxi=this.drawingFeatures.getLength(); i<maxi; i++){
                            //tmpFeat.getGeometry().appendPoint(this.drawingFeatures.item(i).getGeometry().clone().transform('EPSG:3857', 'EPSG:4326'));
                            tmpFeat.getGeometry().appendPoint(this.transformGeom(this.drawingFeatures.item(i).getGeometry()));
                        }
                        //The last geometry drawn is not added to the layer because technically we have not finished drawing yet.
                        if (typeof evt.feature !== 'undefined'){
                            //tmpGeom.appendPoint(evt.feature.getGeometry().clone().transform('EPSG:3857', 'EPSG:4326'));
                            tmpGeom.appendPoint(this.transformGeom(evt.feature.getGeometry()));
                        }
                        this.showCoords(tmpFeat.getGeometry());
                        break;
                    case 'MultiLineString':
                        tmpFeat = new ol.Feature({geometry: new ol.geom.MultiLineString([])});
                        tmpGeom = tmpFeat.getGeometry();
                        for (i=0, maxi=this.drawingFeatures.getLength(); i<maxi; i++){
                            //tmpGeom.appendLineString(this.drawingFeatures.item(i).getGeometry().clone().transform('EPSG:3857', 'EPSG:4326'));
                            tmpGeom.appendLineString(this.transformGeom(this.drawingFeatures.item(i).getGeometry()));
                        }
                        if (typeof evt.feature !== 'undefined'){
                            tmpGeom.appendLineString(evt.feature.getGeometry().clone().transform('EPSG:3857', 'EPSG:4326'));
                        }
                        this.showCoords(tmpFeat.getGeometry());
                        break;
                    case 'MultiPolygon':
                        maxi = this.drawingFeatures.getLength();
                        if (maxi > 0){
                            tmpFeat = new ol.Feature({geometry: new ol.geom.MultiPolygon([])});
                            tmpGeom = tmpFeat.getGeometry();
                            for (i=0; i<maxi; i++){
                                polys = this.drawingFeatures.item(i).getGeometry().getPolygons();
                                for (j=0, maxj = polys.length; j<maxj; j++){
                                    //tmpGeom.appendPolygon(polys[j].clone().transform('EPSG:3857', 'EPSG:4326'));
                                    tmpGeom.appendPolygon(this.transformGeom(polys[j]));
                                }
                            }
                            if (typeof evt.feature !== 'undefined'){
                                polys = evt.feature.getGeometry().getPolygons();
                                for (j=0, maxj = polys.length; j<maxj; j++){
                                    //tmpGeom.appendPolygon(polys[j].clone().transform('EPSG:3857', 'EPSG:4326'));
                                    tmpGeom.appendPolygon(this.transformGeom(polys[j]));
                                }
                            }
                            this.showCoords(tmpGeom);
                        }
                        break;
                    default:
                        // This must be a multi-geometry. Very gnarly indeed.
                        // Go through all features on the drawing layer and build something...
                        // Now if we actually have multiple geometries...
                        maxi = this.drawingFeatures.getLength();
                        if (maxi > 0){

                            // Create an array to hold the geometries:
                            arrGeoms = [];

                            // Now go through all the features on the layer.
                            for (i=0; i<maxi; i++){
                                // arrGeoms.push(this.drawingFeatures.item(i).getGeometry().clone().transform('EPSG:3857', 'EPSG:4326'));
                                arrGeoms.push(this.transformGeom(this.drawingFeatures.item(i).getGeometry()));
                            }
                            // Add the feature from this drawing event.
                            if (typeof evt.feature !== 'undefined'){
                                //arrGeoms.push(evt.feature.getGeometry().clone().transform('EPSG:3857', 'EPSG:4326'));
                                arrGeoms.push(this.transformGeom(evt.feature.getGeometry()));
                            }
                            // Create a new GeometryCollection with the array.
                            tmpGeom = new ol.geom.GeometryCollection(arrGeoms);
                            this.showCoords(tmpGeom);
                        }
                        break;
                }
            }
            else{
                if (typeof evt.feature !== 'undefined'){
                    tmpFeat = evt.feature;
                    // tmpGeom = tmpFeat.getGeometry().clone().transform('EPSG:3857', 'EPSG:4326');
                    tmpGeom = this.transformGeom(tmpFeat.getGeometry());
                    this.showCoords(tmpGeom);
                }
                else{
                    // This must be the end of a modify operation, in which case we just write the feature from the drawing layer.
                    // tmpGeom = this.drawingFeatures.item(0).getGeometry().clone().transform('EPSG:3857', 'EPSG:4326');
                    tmpGeom = this.transformGeom(this.drawingFeatures.item(0).getGeometry());
                    this.showCoords(tmpGeom);
                }
            }
            this.currDrawGeometry = tmpGeom;
            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function to handle the end process after defining the map rectangle bounds.
     *
     * @function
     drawMapBoundsEnd
     * @memberof VectorLayer.prototype
     * @description Handles the end of a drawing operation which produces a rectangle
     *                      defining the user's preferred map bounds.
     * @param   {ol.interaction.DrawEvent} evt The event emitted by the
     *                        ol.interaction.Draw instance that has completed.
     * @returns {Boolean} true (success) or false (failure).
     */

    drawMapBoundsEnd(evt){
        let tmpFeat, geom;
        try{
            if (typeof evt.feature !== 'undefined'){
                tmpFeat = evt.feature;
            }
            else{
                tmpFeat = this.drawingFeatures.item(0);
            }
            geom = tmpFeat.getGeometry();
            this.setMapBounds(geom.getExtent());
            this.showCoords(this.transformGeom(geom.clone()));
            this.drawingFeatures.clear();
            this.baseFeature.setGeometry(geom);
            tmpFeat.setGeometry(null);

            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for writing out the coordinates of drawn geometries.
     * Note that this is currently an ad-hoc rendering intended for
     * the convenience of the researcher in our pilot project; eventually
     * this will be part of the overall feature-editing interface.
     *
     * @function
     showCoords
     * @memberof VectorLayer.prototype
     * @description Writes out the coordinates of drawn geometries to a
     *              textarea. Note that this is currently an ad-hoc rendering
     *              intended for the convenience of the researcher in our pilot
     *              project; eventually this will be part of the overall
     *              feature-editing interface.
     * @param   {ol.geom.Geometry} geom A geometry or geometry collection in EPSG:4326.
     * @returns {Boolean} true (success) or false (failure).
     */


    showCoords(geom){
        let strGeoJSON, teiLocation, strFullGeoJSON, geojson = new ol.format.GeoJSON();
        try{
            if (this.view.getProjection().getCode() === 'EPSG:3857'){
                strGeoJSON = geojson.writeGeometry(geom, {decimals: 6, rightHanded: true});
            }
            else{
                strGeoJSON = geojson.writeGeometry(geom, {decimals: 1, rightHanded: true});
            }
            teiLocation = 'TEI:\n<location type="GeoJSON">\n';
            teiLocation += '  <geo>"geometry": ' + strGeoJSON + '</geo>\n';
            teiLocation += '</location>';

            strFullGeoJSON = '\n\nGeoJSON:\n{"type": "Feature", "geometry":' + strGeoJSON + ', "properties":{}}';

            this.coordsBox.value = teiLocation + strFullGeoJSON;
            this.acceptCoords.style.display = 'block';
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for adding a newly-drawn feature to the nav.
     *
     * @function
     addDrawnFeature
     * @memberof VectorLayer.prototype
     * @description Gets a name from the user for the feature, and
     *              then adds it to the navigation box. If there is
     *              no "Drawn Features" category yet, it creates one.
     * @returns {Boolean} true (success) or false (failure).
     */

    addDrawnFeature(){
        let tax, catNum, catPos, cat, featName, featId, feat;
        tax = this.taxonomies[this.currTaxonomy];

        try{

            // First check whether there's a Drawn Features category.
            if (!this.taxonomyHasCategory(this.currTaxonomy, 'drawnFeatures')){
                // If not, create one.
                catPos = tax.categories.length + 1;
                tax.categories.push({name: this.captions.strDrawnFeatures, desc: this.captions.strDrawnFeaturesDesc, pos: catPos, id: 'drawnFeatures', features: []});
                catNum = tax.categories.length-1;
                cat = tax.categories[catNum];
            }
            else{
                catNum = this.getCatNumFromId('drawnFeatures', -1);
                cat = tax.categories[catNum];
            }

            // Now ask for a name from the user.
            featName = window.prompt(this.captions.strGetFeatureName, '');

            // Create an id from the name.
            featId = util.Util.idFromName(featName);

            // Make it unique.
            while (this.getFeatNumFromId(featId, -1) !== -1){
                featId += 'x';
            }

            // Create a new feature.
            feat = new ol.Feature({});
            feat.setId(featId);
            feat.setProperties({"name": featName, "links": [], "desc": this.captions.strEditThisFeature});
            feat.setProperties({"taxonomies": [{"id": this.currTaxonomy.id, "name": this.currTaxonomy.name, "pos": catPos, "categories": [{"id": "drawnFeatures", "name": this.captions.strDrawnFeatures}]}]});
            feat.setProperties({"showing": false, "selected": false}, true);
            if (this.view.getProjection().getCode() === 'EPSG:3857'){
                feat.setGeometry(this.currDrawGeometry.clone().transform('EPSG:4326', 'EPSG:3857'));
            }
            else{
                feat.setGeometry(this.currDrawGeometry.clone());
            }

            // Add it to the feature set.
            this.features.push(feat);
            this.source.addFeature(feat);
            cat.features.push(feat);

            // Clear the drawing surface.
            this.drawingFeatures.clear();
            this.addDrawInteraction(this.currDrawGeometryType);

            // Rebuild the navbar.
            this.buildNavPanel();

            // Show the new feature by id.
            this.selectFeatureFromId(featId);

            // Hide the accept button, and null the current geometry.
            this.currDrawGeometry = null;
            this.coordsBox.value = '';
            this.acceptCoords.style.display = 'none';

            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    // This load procedure is a discrete process
    // that can be called from the constructor (assuming a GeoJSON
    // file is supplied to the constructor), but can also be called
    // later to replace one set of features with another.
    /**
     * Function for loading GeoJSON from a string variable.
     *
     * @function
     loadGeoJSONFromString
     * @memberof VectorLayer.prototype
     * @description Reads the string supplied as GeoJSON and constructs
     *              a feature set on the vector layer from it, then
     *              parses the feature set for taxonomies.
     * @param   {String} geojson The input string; either GeoJSON or the url
     *                           of a GeoJSON file.
     * @returns {Boolean} true (success) or false (failure).
     */

    loadGeoJSONFromString(geojson){

        let listenerKey, showTax, showTaxInt;

        try{
            // Clear existing features on the map, along with taxonomies.
            // TODO: If source features or taxonomies have been edited, trap and warn.
            if (this.source !== null){
                this.source.clear();
            }

            this.featsLoaded = false;

            this.taxonomies = [];

            this.taxonomiesLoaded = false;

            if (this.taxonomySelector !== null){

                // Remove the wrapper span if removing the taxonomy selector.
                this.taxonomySelector.parentNode.parentNode.removeChild(this.taxonomySelector.parentNode);
                this.taxonomySelector = null;
            }

            // We need to know whether the input string is GeoJSON, TEI or a url.

            // This is a crude approach: does it contain a curly brace?
            if (geojson.indexOf('{') > -1){
            // It's a GeoJSON string;

            // TODO: THIS IS BADLY BROKEN. The features are read, and the navbar is created,
            // but the map disappears and all features are points in the centre. Don't know
            // why yet.
                this.source.addFeatures((new ol.format.GeoJSON()).readFeatures(geojson));
            }
            else{
                //It's a URL.
                this.featuresUrl = geojson;
                this.source = new ol.source.Vector({
                    crossOrigin: 'anonymous',
                    url: this.featuresUrl,
                    format: new ol.format.GeoJSON()
                });
                this.layer.setSource(this.source);
            }

            listenerKey = this.source.on('change', function(e) {
                let i, maxi, j, maxj, dt;
                if (this.source.getState() === 'ready') {

                    // and unregister the "change" listener
                    ol.Observable.unByKey(listenerKey);

                    this.featsLoaded = true;
                    this.features = this.source.getFeatures();

                    // Now we need to set some additional properties on the features.
                    for (i = 0, maxi = this.features.length; i<maxi; i++){
                        this.features[i].setProperties({"showing": false, "selected": false}, true);
                        let p = this.features[i].getProperties();
                        if (p.dateTimes){
                            dt = p.dateTimes;
                            for (j = 0, maxj = dt.length; j < maxj; j++){
                                if (dt[j].from){
                                    dt[j].ssFrom = Date.parse(dt[j].from);
                                }
                                if (dt[j].to){
                                    dt[j].ssTo = Date.parse(dt[j].to);
                                }
                            }
                        }
                    }

                    // Now build the taxonomy data structure from the information
                    // encoded in the features' properties component. If this succeeds
                    // (returning the number of taxonomies created), we can move on.

                    if (this.readTaxonomies() > 0){

                        // Check the status of the first feature; if its id is not holMap, then
                        // create one and insert it, then copy the taxonomies into it.
                        this.baseFeature = this.source.getFeatureById('holMap');
                        if (this.baseFeature === null){
                            console.log('Creating a holMap feature...');
                            this.baseFeature = new ol.Feature();
                            this.baseFeature.setId('holMap');
                            this.baseFeature.setProperties({"taxonomies": JSON.toString(this.taxonomies)}, true);
                            this.features.unshift(this.baseFeature);
                        }
                        // Otherwise, we set the map to the bounds of the first feature.
                        else{
                            this.setMapBounds(this.baseFeature.getGeometry().getExtent());
                            this.mapTitle = this.baseFeature.getProperties().mapTitle || '';
                            if (this.mapTitle != ''){
                                document.querySelector('span.docTitle').innerHTML = this.mapTitle;
                            }
                        }

                        // Now check for rich timeline data.
                        if (this.baseFeature.getProperties().hasOwnProperty('timeline') &&
                            this.baseFeature.getProperties().timeline.hasOwnProperty('richTimelinePoints')){
                            this.timelineData = this.baseFeature.getProperties().timeline.richTimelinePoints;
                        }

                        // Now we want to discover whether there's a preferred
                        // taxonomy to display, based on the URI query string.
                        // Start by setting default value; if there are no taxonomies,
                        // then -1; else the first one in the list.
                        this.currTaxonomy = 0;
                        showTax = (this.initialTaxonomyId == '')? util.Util.getQueryParam('taxonomy') : this.initialTaxonomyId;
                        //showTax = util.Util.getQueryParam('taxonomy');
                        if (showTax.length > 0){
                            // It may be a name or an index number.
                            showTaxInt = parseInt(showTax);
                            if ((Number.isInteger(showTaxInt))&&(showTaxInt < this.taxonomies.length)){
                                this.currTaxonomy = showTaxInt;
                            }
                            else{
                                if ((showTax == 'holTaxonomyAll') && (this.allFeaturesTaxonomy)){
                                    this.currTaxonomy = this.taxonomies.length - 1;
                                }
                                else{
                                    for (i=0, maxi=this.taxonomies.length; i<maxi; i++){
                                        if (this.taxonomies[i].id === showTax){
                                            this.currTaxonomy = i;
                                        }
                                    }
                                }
                            }
                        }

                        this.buildTaxonomySelector();
                        this.buildNavPanel();
                        this.buildTimeline();

                        // Now we can parse the query string in case anything is supposed
                        // to be shown by default.
                        this.parseSearch();

                        // Finally we're ready.
                        this.afterLoading();
                    }
                }
            }.bind(this));


            // Success.
            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    //This procedure is adapted from loadGeoJSONFromString
    //to provide an option for appending the contents of a GeoJSON file to the
    //existing set of features.
    /**
     * Function for loading GeoJSON from a string variable without
     * removing existing features.
     *
     * @function
     appendGeoJSONFromString
     * @memberof VectorLayer.prototype
     * @description Reads the string supplied as GeoJSON and constructs
     *              a feature set on in a temporary source from it, then
     *              adds the features to the existing source, and
     *              parses the feature set for taxonomies.
     * @param   {String} geojson The input string; either GeoJSON or the url
     *                           of a GeoJSON file.
     * @returns {Boolean} true (success) or false (failure).
     */

    appendGeoJSONFromString(geojson){

        let listenerKey, showTax, showTaxInt;

        try{

            this.featsLoaded = false;

            this.taxonomies = [];

            this.taxonomiesLoaded = false;

            if (this.taxonomySelector !== null){

                // Remove the wrapper span if removing the taxonomy selector.
                this.taxonomySelector.parentNode.parentNode.removeChild(this.taxonomySelector.parentNode);
                this.taxonomySelector = null;
            }

                // We need to know whether the input string is GeoJSON, TEI or a url.

                // This is a crude approach: does it contain a curly brace?
                            if (geojson.indexOf('{') > -1){
                // It's a GeoJSON string;

                // TODO: THIS IS BADLY BROKEN. The features are read, and the navbar is created,
                // but the map disappears and all features are points in the centre. Don't know
                // why yet.
                this.source.addFeatures((new ol.format.GeoJSON()).readFeatures(geojson));
            }
            else{
                // It's a URL.

                this.tmpSource = new ol.source.Vector({
                    crossOrigin: 'anonymous',
                    url: geojson,
                    format: new ol.format.GeoJSON({dataProjection: 'EPSG:3857', featureProjection: 'EPSG:4326'})
                });
            }

            listenerKey = this.tmpSource.on('change', function(e) {
                let i, maxi;
                if (this.tmpSource.getState() === 'ready') {

                    // and unregister the "change" listener
                    ol.Observable.unByKey(listenerKey);

                    // Now we need to set some additional properties on the new features.
                    this.tmpSource.forEachFeature(function(feat){
                        if (feat.getId() != 'holMap'){
                            feat.setProperties({"showing": false, "selected": false}, true);
                            this.source.addFeature(feat);
                        }
                    }.bind(this));

                    this.tmpSource = null;

                    this.featsLoaded = true;

                    this.features = this.source.getFeatures();

                    // Now build the taxonomy data structure from the information
                    // encoded in the features' properties component. If this succeeds
                    // (returning the number of taxonomies created), we can move on.

                    if (this.readTaxonomies() > 0){

                        // Now we want to discover whether there's a preferred
                        // taxonomy to display, based on the URI query string.
                        // Start by setting default value; if there are no taxonomies,
                        // then -1; else the first one in the list.
                        this.currTaxonomy = 0;
                        showTax = util.Util.getQueryParam('taxonomy');
                        if (showTax.length > 0){
                            // It may be a name or an index number.
                            showTaxInt = parseInt(showTax);
                            if ((Number.isInteger(showTaxInt))&&(showTaxInt < this.taxonomies.length)){
                                this.currTaxonomy = showTaxInt;
                            }
                            else{
                                for (i=0, maxi=this.taxonomies.length; i<maxi; i++){
                                    if (this.taxonomies[i].name === showTax){
                                        this.currTaxonomy = i;
                                    }
                                }
                            }
                        }

                        this.buildTaxonomySelector();
                        this.buildNavPanel();
                        this.buildTimeline();
                    }
                }
            }.bind(this));

            this.tmpSource.loadFeatures();

            // Success.
            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };


    /**
     * Function for providing a download of the map data in GeoJSON
     * format.
     *
     * @function
     downloadGeoJSON
     * @memberof VectorLayer.prototype
     * @description Provides the current state of the map taxonomies, categories
     *              and features in the form of a GeoJSON file for download.
     * @param   {String} filename The suggested filename. Optional.
     * @returns {Boolean} true (success) or false (failure).
     */

    downloadGeoJSON(){
        let el, geojson, mapjson, outFeats;
        try{
            geojson = new ol.format.GeoJSON();
            outFeats = [this.baseFeature];
            outFeats = outFeats.concat(this.source.getFeatures());
            if (this.view.getProjection().getCode() === 'EPSG:3857'){
                mapjson = geojson.writeFeatures(outFeats, {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857', decimals: 6, rightHanded: true});
            }
            else{
                mapjson = geojson.writeFeatures(outFeats, {dataProjection: this.view.getProjection().getCode(), featureProjection: this.view.getProjection().getCode(), decimals: 1, rightHanded: true});
            }
            el = document.createElement('a');
            el.setAttribute('href', 'data:application/geo+json;charset=utf-8,' + encodeURIComponent(mapjson));
            el.setAttribute('download', this.geojsonFileName);
            el.style.display = 'none';
            this.docBody.appendChild(el);
            el.click();
            this.docBody.removeChild(el);
            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };


    /**
     * Function for providing an option to paste a GeoJSON feature
     * into the map.
     *
     * @function
     pasteGeoJSON
     * @memberof VectorLayer.prototype
     * @description Provides the option for the user to paste some
     *              GeoJSON into the map. Currently handling is
     *              limited to only a single Feature object.
     * @returns {Boolean} true (success) or false (failure).
     */

    pasteGeoJSON(){
        let geojson, pastedText;
        try{
            geojson = new ol.format.GeoJSON();
            pastedText = window.prompt(this.captions.strPasteHere, '{"type": "Feature"}');

        // TODO: Finish this function.

        // Check the object is parseable.

        // Create a temporary feature with it.

        // Set up drawing for this feature.

        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for testing new features. Subject to change and
     * eventual removal.
     *
     * @function
     addTestingFeatures
     * @memberof VectorLayer.prototype
     * @description Performs some initialization of features
     *              which are currently in development and testing.
     *  @returns {Boolean} True (success) or false (failure).
     */

    addTestingFeatures(){
        /*form = document.createElement('form');
          this.textEditor = document.createElement('div');
          this.textEditor.setAttribute('id', 'holTextEditor');
          form.appendChild(this.textEditor);
          this.textarea = document.createElement('textarea');
          this.textEditor.appendChild(this.textarea);
          btn = document.createElement('button');
          btn.appendChild(document.createTextNode(this.captions.strLoad));
          btn.setAttribute('type', 'button');
          this.textEditor.appendChild(btn);
          this.docBody.appendChild(form);*/
        //btn.addEventListener('click', function(){this.loadGeoJSONFromString(this.textarea.value);}.bind(this), false);
    };

    /**
     * Function for constructing a set of taxonomies, each containing
     * a list of categories, and each category containing a set of
     * features.
     *
     * @function
     readTaxonomies
     * @memberof VectorLayer.prototype
     * @description Reads the data in the properties members of the
     *           features, and uses it to construct a set of one or
     *           more taxonomies, each with a list of categories,
     *           with each category having a list of feature pointers.
     * @returns {number} Total number of taxonomies constructed.
     */

    readTaxonomies(){
        let hasName, i, maxi, j, maxj, k, maxk, props, taxName, taxPos, taxId,
            catName, catDesc, catPos, catId, catIcon, catIconDim, foundTax, foundCat, maxPos = 0;

        // We read the taxonomies based on finding them in the features,
        // just in case a subset of features has been separated from the
        // base feature which includes all the taxonomies.

        // Function for filtering taxonomy and category arrays by name.
        hasName = function(element, index, array){
            return element.name === this;
        };

        try{
            for (i=0, maxi=this.features.length; i<maxi; i++){
                props = this.features[i].getProperties();

                if (props.taxonomies){
                    for (j=0, maxj=props.taxonomies.length; j<maxj; j++){
                        taxName = props.taxonomies[j].name;
                        taxPos = props.taxonomies[j].pos;
                        maxPos = Math.max((maxPos, taxPos));
                        taxId = props.taxonomies[j].id;
                        // If this is the first time we're encountering this taxonomy, add it
                        // to the array.
                        foundTax = this.taxonomies.filter(hasName, taxName);

                        if (foundTax.length < 1){
                            this.taxonomies.push({name: taxName, pos: taxPos, id: taxId, categories: []});
                            foundTax[0] = this.taxonomies[this.taxonomies.length-1];
                        }
                        for (k=0, maxk=props.taxonomies[j].categories.length; k<maxk; k++){
                            catName = props.taxonomies[j].categories[k].name;
                            catDesc = props.taxonomies[j].categories[k].desc;
                            catPos = props.taxonomies[j].categories[k].pos;
                            catId = props.taxonomies[j].categories[k].id;
                            catIcon = (props.taxonomies[j].categories[k].icon) ? props.taxonomies[j].categories[k].icon : null;
                            catIconDim = (props.taxonomies[j].categories[k].iconDim) ? props.taxonomies[j].categories[k].iconDim : null;
                            foundCat = foundTax[0].categories.filter(hasName, catName);
                            if (foundCat.length < 1){
                                foundTax[0].categories.push({name: catName, desc: catDesc, pos: catPos, id: catId, icon: catIcon, iconDim: catIconDim, features: []});
                                foundCat[0] = foundTax[0].categories[foundTax[0].categories.length-1];
                            }
                            if (this.features[i].getId() !== 'holMap'){
                                foundCat[0].features.push(this.features[i]);
                            }
                        }
                    }
                }
            }
            // Now we sort according to positions recorded in the GeoJSON file, so that
            // the map interface reflects the order assigned by the user in the originating
            // TEI taxonomy setup.
            this.taxonomies.sort(function(a,b){
                if (a.pos < b.pos){return -1;}
                if (a.pos > b.pos){return 1;}
                return 0;
            });
            for (i=0, maxi=this.taxonomies.length; i<maxi; i++){
                this.taxonomies[i].categories.sort(function(a,b){
                    if (a.pos < b.pos){return -1;}
                    if (a.pos > b.pos){return 1;}
                    return 0;
                });
            }

            // If there's more than one taxonomy, and the option has been set to
            // create a final combined taxonomy, do so.
            if ((this.taxonomies.length > 1) && (this.allFeaturesTaxonomy)){
                taxName = 'All';
                taxPos = maxPos + 1;
                taxId = 'holAllTaxonomies';
                this.taxonomies.push({name: taxName, pos: taxPos, id: taxId, categories: []});
                foundTax[0] = this.taxonomies[this.taxonomies.length-1];
                for (i=0, maxi=this.taxonomies.length-1; i<maxi; i++){
                    for (j=0, maxj=this.taxonomies[i].categories.length; j<maxj; j++){
                        foundTax[0].categories.push(this.taxonomies[i].categories[j]);
                    }
                }
            }

            this.taxonomiesLoaded = true;

            return this.taxonomies.length;
        }
        catch(e){
            console.error(e.message);
            return 0;
        }
    };

    /**
     * Function for checking whether a particular taxonomy
     *              contains a specific category or not.
     *
     * @function
     taxonomyHasCategory
     * @memberof VectorLayer.prototype
     * @description Checks whether the specified taxonomy contains
     *              a particular category or not.
     * @param {number} taxNum The index of the taxonomy in the taxonomy
     *                 array
     * @param {string} catId The id attribute of the category.
     * @returns {Boolean} true (taxonomy exists and contains category)
     *                    or false (taxonomy doesn't exist, or doesn't
     *                    contain the category)
     */

    taxonomyHasCategory(taxNum, catId){
        let i, maxi;
        try{
            // First we check whether the taxonomy exists.
            if ((taxNum < 0) || (taxNum >= this.taxonomies.length)){
                return false;
            }
            // Now we figure out if the category is a string or a number.
            for (i=0, maxi=this.taxonomies[taxNum].categories.length; i<maxi; i++){
                if (this.taxonomies[taxNum].categories[i].id === catId){
                    return true;
                }
            }
            return false;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for checking whether a particular taxonomy
     *              contains a specific feature or not.
     *
     * @function
     taxonomyHasFeature
     * @memberof VectorLayer.prototype
     * @description Checks whether the specified taxonomy contains
     *              a particular feature as a member of one of its
     *              categories or not.
     * @param {number} taxNum The index of the taxonomy in the taxonomy
     *                 array
     * @param {string} featId The id attribute of the feature.
     * @returns {Boolean} true if the taxonomy contains the feature; false if
     *                    the taxonomy does not exist, or does not contain
     *                    the feature.
     */

    taxonomyHasFeature(taxNum, featId){
        let i, maxi, j, maxj;
        try{
            // First we check whether the taxonomy exists.
            if ((taxNum < 0) || (taxNum >= this.taxonomies.length)){
                return false;
            }
            // Now we figure out if the category is a string or a number.
            for (i=0, maxi=this.taxonomies[taxNum].categories.length; i<maxi; i++){
                for (j=0, maxj=this.taxonomies[taxNum].categories[i].features.length; j<maxj; j++){
                    if (this.taxonomies[taxNum].categories[i].features[j].getId() === featId){
                        return true;
                    }
                }

            }
            return false;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for adding a new taxonomy to the current set.
     *
     * @function
     newTaxonomy
     * @memberof VectorLayer.prototype
     * @description Prompts the user for a new taxonomy name, then
     *              constructs an id for the new taxonomy, adds
     *              it to the set, then switches to it.
     * @returns {Boolean} true if the taxonomy is successfully created;
     *                    false if the process fails or is aborted.
     */

    newTaxonomy(){
        let taxName, taxId;
        try{
            //Now ask for a name from the user.
            taxName = window.prompt(this.captions.strGetTaxonomyName, '');

            //Create an id from the name.
            taxId = util.Util.idFromName(taxName);

            //Make it unique.
            while (this.getTaxNumFromId(taxId, -1) !== -1){
                taxId += 'x';
            }
            //Add it to the set.
            this.taxonomies.push({name: taxName, pos: this.taxonomies.length + 1, id: taxId, categories: []});
            this.buildTaxonomySelector();
            this.taxonomySelector.selectedIndex = this.taxonomySelector.options.length - 1;
            this.changeTaxonomy(this.taxonomySelector);
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for adding a new category to the current taxonomy.
     *
     * @function
     newCategory
     * @memberof VectorLayer.prototype
     * @description Prompts the user for a new category name, then
     *              constructs an id for the new category, and adds
     *              it to the current taxonomy.
     * @returns {Boolean} true if the category is successfully created;
     *                    false if the process fails or is aborted.
     */

    newCategory(){
        let catName, catId, catDesc, catPos;
        try{
            //Now ask for a name from the user.
            catName = window.prompt(this.captions.strGetCategoryName, '');

            //Create an id from the name.
            catId = util.Util.idFromName(catName);

            //Get the category description.
            catDesc = window.prompt(this.captions.strGetCategoryDesc, '');

            catPos = this.taxonomies[this.currTaxonomy].categories.length + 1;

            //Make it unique.
            while (this.getCatNumFromId(catId, -1) !== -1){
                catId += 'x';
            }
            //Add it to the set.
            this.taxonomies[this.currTaxonomy].categories.push({name: catName, desc: catDesc, pos: catPos, id: catId, features: []});


        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for finding an existing splash screen div, or
     * creating one if one does not exist.
     *
     * @function
     getSplashScreen
     * @memberof VectorLayer.prototype
     * @description looks for
     * a user-defined splash screen element, and if there isn't one,
     * creates it.
     * @returns {element | null} HTML element with id 'splash'.
     */

    getSplashScreen(){
        let loading, spinner;
        try{
            this.splash = document.getElementById('splash');
            if (this.splash === null){
                this.splash = document.createElement('div');
                this.splash.setAttribute('id', 'splash');
            }
            loading = document.createElement('div');
            loading.setAttribute('id', 'holLoadingMessage');
            loading.appendChild(document.createTextNode(this.captions.strLoading));
            this.splash.appendChild(loading);
            this.docBody.appendChild(this.splash);
            spinner = document.createElement('div');
            spinner.setAttribute('id', 'holSpinner');
            spinner.setAttribute('class', 'waiting');
            this.splash.appendChild(spinner);
            return this.splash;
        }
        catch(e){
            console.error(e.message);
            return null;
        }
    };

    /**
     * Function for reconfiguring the splash screen for use as an
     * information popup box.
     *
     * @function
     afterLoading
     * @memberof VectorLayer.prototype
     * @description reconfigures
     * the splash screen so that it can be used as purely an
     * information element.
     * @returns {Boolean} true (succeeded) or false (failed).
     */

    afterLoading(){
        /*  var i, maxi;
        */  try{
            if (this.splash !== null){
                document.getElementById('holSpinner').style.display = 'none';
                document.getElementById('holLoadingMessage').style.display = 'none';
                this.splash.addEventListener('click', function(){this.style.display = 'none';}.bind(this.splash));
                this.splash.style.display = 'none';
            }
            //Now do some sanity checking.
            /*
                if (this.features.length < 1){
                  throw new util.Util.DataNotFoundError('features (locations)', this.featuresUrl);
                }

                if (this.taxonomies.length < 1){
                  throw new util.Util.DataNotFoundError('taxonomies (lists of location categories)', this.featuresUrl);
                }

                for (i=0, maxi=this.taxonomies.length; i<maxi; i++){
                  if (this.taxonomies[i].categories.length < 1){
                    throw new util.Util.DataNotFoundError('categories for taxonomy ' + this.taxonomies[i].name, this.featuresUrl);
                  }
                }
                */

            this.browserShims();

            if (this.onReadyFunction !== null){
                this.onReadyFunction();
            }

            return true;
        }
        catch(e){
            if (e instanceof util.Util.DataNotFoundError){
                alert(e.message);
            }
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function to handle any annoying browser glitches in support for newer
     * standards features.
     *
     * @function
     browserShims
     * @memberof VectorLayer.prototype
     * @description Implements some shims/hacks to work around limitations
     *              of old browsers. REMOVE AS SOON AS APPROPRIATE.
     * @returns {Boolean} true (something was needed) or false (nothing was needed).
     */

    browserShims(){
        let rightBox, result = false;
        try{
            // Safari 9.1 and IE 11 bug with Flex container sizing.
            rightBox = document.getElementById('holRightBox');
            if (rightBox.offsetHeight < 20){
                rightBox.style.height = '100%';
                result = true;
            }
            return result;
        }
        catch(e){
            console.error(e.message);
            return result;
        }
    };

    /**
     * Function for zooming the map to a specific coordinate box,
     * and showing all of the features which appear within that box.
     *
     * @function
     zoomToBox
     * @memberof VectorLayer.prototype
     * @description Zooms the map
     *                    to show an area dragged by the user, and
     *                    shows all the features within that box.
     * @param   {ol.Extent} the box to zoom to.
     * @returns {Boolean} true (success) or false (failure).
     */

    zoomToBox(boxExtent){
        let featId, featNum, featNums = [];
        try{
            this.source.forEachFeatureInExtent(boxExtent, function(hitFeature){
                if (ol.extent.containsExtent(boxExtent, hitFeature.getGeometry().getExtent())){
                    featNum = this.features.indexOf(hitFeature);
                    featId = hitFeature.getId();
                    if (this.taxonomyHasFeature(this.currTaxonomy, featId)){
                        this.showHideFeature(true, featNum, -1);
                        featNums.push(featNum);
                    }
                }
            }.bind(this), this);
            this.centerOnFeatures(featNums);
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };



    /**
     * Function for building the HTML toolbar at the top of the
     * document.
     *
     * @function
     buildToolbar
     * @memberof VectorLayer.prototype
     * @description creates
     *         a toolbar at the top of the screen, including the document
     *         title and info button.
     * @returns {Boolean} true (succeeded) or false (failed).
     */

    buildToolbar(){
        let form, div, img;
        try{
            form = document.createElement('form');
            form.addEventListener('submit', function(e){e.preventDefault(); return false;});
            this.toolbar = document.createElement('div');
            this.toolbar.setAttribute('id', 'holToolbar');
            form.appendChild(this.toolbar);
            this.docTitle = document.createElement('span');
            this.docTitle.setAttribute('class', 'docTitle');
            this.docTitle.appendChild(document.createTextNode(document.title));
            this.toolbar.appendChild(this.docTitle);
            div = document.createElement('div');
            div.setAttribute('class', 'toolbarSpacer');
            this.toolbar.appendChild(div);
            this.iButton = document.createElement('button');
            this.iButton.setAttribute('title', this.captions.strInfo);
            img = document.createElement('img');
            img.setAttribute('src', 'images/info-circle.svg');
            this.iButton.appendChild(img);
            this.iButton.addEventListener('click', function(){
                if (this.splash.style.display === 'block'){
                    this.splash.style.display = 'none';
                }
                else{
                    this.splash.style.display = 'block';
                }
                return false;
            }.bind(this));
            this.toolbar.appendChild(this.iButton);

            if ((this.allowUserTracking === true)&&('geolocation' in navigator)){
                this.userTrackButton = document.createElement('button');
                img = document.createElement('img');
                img.setAttribute('src', 'images/map-marker-alt.svg');
                this.userTrackButton.appendChild(img);
                this.userTrackButton.setAttribute('title', this.captions.strToggleTracking);
                this.userTrackButton.addEventListener('click', function(){
                    this.toggleTracking();
                    return false;
                }.bind(this));
                this.toolbar.appendChild(this.userTrackButton);
            }

            this.mobileMenuToggleButton = document.createElement('button');
            img = document.createElement('img');
            img.setAttribute('src', 'images/menu.svg');
            this.mobileMenuToggleButton.setAttribute('title', this.captions.strMenuToggle);
            this.mobileMenuToggleButton.appendChild(img);
            this.mobileMenuToggleButton.setAttribute('id', 'mobileMenuToggle');
            this.mobileMenuToggleButton.addEventListener('click', function(){document.getElementById('holRightBox').classList.toggle('hidden');this.classList.toggle('menuHidden');});
            this.toolbar.appendChild(this.mobileMenuToggleButton);

            this.docBody.appendChild(form);

            if (this.testing){
                this.addTestingFeatures();
            }
        }
        catch(e){
            console.error(e.message);
            return false;
        }
        return true;
    };

    /**
     * Function for adding a taxonomy selector to the toolbar .
     * @function
     buildTaxonomySelector
     * @memberof VectorLayer.prototype
     * @description creates a selector element for choosing between
     *         taxonomies, and attaches it to the toolbar at the top
     *         of the screen. Removes an existing selector element
     *         if one exists before starting.
     * @returns {Boolean} true (succeeded) or false (failed).
     */

    buildTaxonomySelector(){
        let i, maxi, opt, wrapper;
        try{
            if (this.taxonomySelector !== null){
                //Remove the wrapper span if removing the taxonomy selector.
                this.taxonomySelector.parentNode.parentNode.removeChild(this.taxonomySelector.parentNode);
                this.taxonomySelector = null;
            }
            maxi = this.taxonomies.length;
            if (maxi > 1){
                this.taxonomySelector = document.createElement('select');
                for (i=0; i<maxi; i++){
                    opt = document.createElement('option');
                    opt.value = i;
                    if (this.currTaxonomy === i){
                        opt.setAttribute('selected', 'selected');
                    }
                    opt.appendChild(document.createTextNode(this.taxonomies[i].name));
                    this.taxonomySelector.appendChild(opt);
                }
                this.taxonomySelector.addEventListener('change', this.changeTaxonomy.bind(this, this.taxonomySelector));
                wrapper = document.createElement('span');
                wrapper.setAttribute('class', 'taxonomySelector');
                wrapper.appendChild(this.taxonomySelector);
                this.toolbar.insertBefore(wrapper, this.iButton);
            }
            return true;
        }
        catch(e){
            console.error(e.error);
            return false;
        }
    };

    /**
     * Function for switching from one displayed taxonomy to another.
     *
     * @function
     changeTaxonomy
     * @memberof VectorLayer.prototype
     * @description Typically called by the user choosing a taxonomy from
     *              a selector at the top of the screen; invokes a rebuild
     *              of the navigation panel to display the newly-chosen
     *              taxonomy.
     * @param {Element} sender The HTML selector whose change event called
     *                             the function.
     * @returns {Boolean} true (succeeded) or false (failed).
     */

    changeTaxonomy(sender){
        let newTax;
        try{
            newTax = sender.selectedIndex;
            if ((newTax > -1) && (newTax < this.taxonomies.length) && (newTax !== this.currTaxonomy)){
                this.showHideAllFeatures(null, false);
                this.currTaxonomy = newTax;
                this.buildNavPanel();
            }
        }
        catch(e){
            console.error(e.message);
            return false;
        }
        return true;
    };

    /**
     * Function for building the HTML navigation panel in the
     * document.
     *
     * @function
     buildNavPanel
     * @memberof VectorLayer.prototype
     * @description creates
     *         a navigation panel/menu for all the categories
     *         and features in the active taxonomy.
     * @returns {Boolean} true (succeeded) or false (failed).
     */

    buildNavPanel(){
        let doc = document, form, rightBox, navPanel, navCloseDiv, navHeader, navSearchButton,
            img, chkShowAll, navCaption, navInput, catUl, cats, catMax, catNum, catLi, catLiChk,
            catTitleSpan, thisCatUl, thisCatFeatures, f, props, thisFeatLi,
            thisFeatChk, thisFeatSpan, i, maxi, infoCloseDiv, closeBtn, editBtn, contentDiv;
        try{
            // Sanity check:
            if (this.currTaxonomy < 0){
                throw new Error('No taxonomy to display; current taxonomy set to ' + this.currTaxonomy + '.');
            }

            // If the navPanel has already been created, we just have to empty the
            // categories and re-create them.
            catUl = doc.getElementById('holCategories');
            if (catUl !== null){
                while (catUl.firstChild) {
                    catUl.removeChild(catUl.firstChild);
                }
            }
            else{
                // It's the first run; we have to create the navPanel.
                form = doc.createElement('form');
                form.addEventListener('submit', function(e){e.preventDefault(); return false;});
                rightBox = doc.createElement('div');
                rightBox.setAttribute('id', 'holRightBox');
                form.appendChild(rightBox);
                navCloseDiv = document.createElement('div');
                navCloseDiv.setAttribute('id', 'navCloseDiv');
                closeBtn = doc.createElement('span');
                closeBtn.setAttribute('class', 'closeBtn');
                closeBtn.appendChild(doc.createTextNode(this.captions.strCloseX));
                closeBtn.addEventListener('click', function(){document.getElementById('holRightBox').classList.toggle('hidden'); this.mobileMenuToggleButton.classList.toggle('menuHidden');}.bind(this));
                navCloseDiv.appendChild(closeBtn);
                rightBox.appendChild(navCloseDiv);
                navPanel = doc.createElement('nav');
                navPanel.setAttribute('id', 'holNav');
                navHeader = doc.createElement('h2');
                chkShowAll = doc.createElement('input');
                chkShowAll.setAttribute('type', 'checkbox');
                chkShowAll.setAttribute('title', this.captions.strShowHideAllFeats);
                chkShowAll.setAttribute('id', 'chkShowAll');
                chkShowAll.addEventListener('change', this.showHideAllFeatures.bind(this, chkShowAll, chkShowAll.checked));
                this.allFeaturesCheckbox = chkShowAll;
                navHeader.appendChild(chkShowAll);

                navCaption = doc.createElement('span');
                navCaption.setAttribute('id', 'navCaption');
                navCaption.appendChild(doc.createTextNode(this.captions.strLocationsByCat));
                navHeader.appendChild(navCaption);
                navInput = doc.createElement('input');
                navInput.setAttribute('type', 'text');
                navInput.setAttribute('id', 'inpNavSearch');
                navInput.setAttribute('placeholder', this.captions.strSearch);
                navInput.addEventListener('keydown', function(event){if (event.keyCode===13 || event.which===13){this.doLocationSearch(true); event.preventDefault();}}.bind(this), false);
                this.navInput = navInput;
                navHeader.appendChild(navInput);

                navSearchButton = doc.createElement('button');
                navSearchButton.setAttribute('id', 'btnNavSearch');
                img = document.createElement('img');
                img.setAttribute('src', 'images/search.svg');
                navSearchButton.appendChild(img);
                navSearchButton.addEventListener('click', this.showHideMapSearch.bind(this, navSearchButton));
                navSearchButton.setAttribute('title', this.captions.strSearch);
                navHeader.appendChild(navSearchButton);


                navPanel.appendChild(navHeader);
                catUl = doc.createElement('ul');
                catUl.setAttribute('id', 'holCategories');
                navPanel.appendChild(catUl);
                rightBox.appendChild(navPanel);
                // Now we create a div for displaying descriptive info from the
                // features.
                this.infoDiv = doc.createElement('div');
                this.infoDiv.setAttribute('id', 'holInfo');
                infoCloseDiv = doc.createElement('div');
                infoCloseDiv.setAttribute('id', 'infoCloseDiv');
                closeBtn = doc.createElement('span');
                closeBtn.setAttribute('class', 'closeBtn');
                closeBtn.addEventListener('click', function(){this.parentNode.parentNode.style.display = 'none';}, false);
                closeBtn.appendChild(doc.createTextNode(this.captions.strCloseX));
                infoCloseDiv.appendChild(closeBtn);
                if (this.allowDrawing){
                    editBtn = doc.createElement('button');
                    editBtn.appendChild(doc.createTextNode(this.captions.strEdit));
                    editBtn.setAttribute('id', 'btnEditFeature');
                    editBtn.setAttribute('class', 'drawButton');
                    editBtn.addEventListener('click', this.editSelectedFeature.bind(this));
                    infoCloseDiv.appendChild(editBtn);
                }
                this.infoDiv.appendChild(infoCloseDiv);
                this.infoDiv.appendChild(doc.createElement('h2'));
                contentDiv = doc.createElement('div');
                contentDiv.setAttribute('id', 'infoContent');
                this.infoDiv.appendChild(contentDiv);
                rightBox.appendChild(this.infoDiv);

                this.docBody.appendChild(form);
                this.navPanel = navPanel;
            }

            cats = this.taxonomies[this.currTaxonomy].categories;
            catMax = cats.length;
            for (catNum = 0; catNum < catMax; catNum++){
                catLi = doc.createElement('li');
                catLi.setAttribute('id', 'catLi_' + catNum);
                catLi.style.color = util.Util.getColorForCategory(catNum);
                catLi.style.backgroundColor = util.Util.getColorWithAlpha(catNum, '0.1');
                catLiChk = doc.createElement('input');
                catLiChk.setAttribute('type', 'checkbox');
                catLiChk.setAttribute('data-type', 'category');
                catLiChk.setAttribute('data-catNum', catNum);
                catLiChk.addEventListener('change', this.showHideCategory.bind(this, catLiChk, catNum));
                catLi.appendChild(catLiChk);
                catTitleSpan = doc.createElement('span');
                catTitleSpan.appendChild(doc.createTextNode(cats[catNum].name));
                catLi.appendChild(catTitleSpan);
                // catTitleSpan.addEventListener('click', util.Util.expandCollapseCategory.bind(this, catTitleSpan), false);
                catTitleSpan.addEventListener('click', util.Util.expandCollapseCategory.bind(this, catTitleSpan, catNum), false);
                thisCatUl = doc.createElement('ul');
                thisCatFeatures = cats[catNum].features;
                /*for (f=0, fmax=thisCatFeatures.length; f<fmax; f++){
                  props = this.features[f].getProperties();
                  if (props.categories.indexOf(this.categories[catNum].id) > -1){
                    thisCatFeatures.push(this.features[f]);
                  }
                }*/
                thisCatFeatures.sort(function(a,b){
                    let aName = a.getProperties().name.toUpperCase(), bName = b.getProperties().name.toUpperCase();
                    return this.collator.compare(aName,bName);
                }.bind(this));

                for (i=0, maxi=thisCatFeatures.length; i<maxi; i++){
                    f = this.features.indexOf(thisCatFeatures[i]);
                    props = thisCatFeatures[i].getProperties();

                    if ((props.showOnMenu == null) || (props.showOnMenu == true)){
                        thisFeatLi = doc.createElement('li');
                        thisFeatLi.setAttribute('id', 'featLi_' + catNum + '_' + f);
                        thisFeatChk = doc.createElement('input');
                        thisFeatChk.setAttribute('type', 'checkbox');
                        thisFeatChk.setAttribute('data-featNum', f);
                        thisFeatChk.setAttribute('data-catNum', catNum);
                        thisFeatChk.addEventListener('change', this.showHideFeatureFromNav.bind(this, thisFeatChk, f, catNum));
                        thisFeatSpan = doc.createElement('span');
                        thisFeatSpan.addEventListener('click', this.selectFeatureFromNav.bind(this, f, catNum));
                        thisFeatSpan.appendChild(doc.createTextNode(props.name || this.captions.strUnnamedFeat));
                        thisFeatLi.appendChild(thisFeatChk);
                        thisFeatLi.appendChild(thisFeatSpan);
                        thisCatUl.appendChild(thisFeatLi);
                    }
                }
                if (thisCatUl.getElementsByTagName('li').length > 0){
                    catLi.appendChild(thisCatUl);
                    catUl.appendChild(catLi);
                }
            }

            this.featureCheckboxes = this.navPanel.querySelectorAll("input[type='checkbox'][data-featNum]");
            this.categoryCheckboxes = this.navPanel.querySelectorAll("input[type='checkbox'][data-type='category']");
        }
        catch(e){
            console.error(e.message);
            return false;
        }
        return true;
    };

    /**
     * Function for building the HTML range control and associated
     *          components for the timeline functionality, if required.
     *
     * @function
     buildTimeline
     * @memberof VectorLayer.prototype
     * @description creates a box containing a range control and
     *               associated components for showing/hiding features based
     *               on dateTime.
     * @returns {Boolean} true (succeeded) or false (failed).
     */

    buildTimeline(){
        try{
            if (!this.timelineData){
                return true;
            }
            // These are the things we need.
            let i, imax, cont, dl, opt, slider, cbx, btns, stepB, play, stepF, label, img;
            cont = document.createElement('div');
            cont.classList.add('timeline');
            // Note: No browser currently supports the use of datalist.
            // This is forward-looking.
            dl = document.createElement('datalist');
            dl.setAttribute('id', 'tlPoints');
            for (i = 0, imax=this.timelineData.length; i < imax; i++){
                let temp = this.timelineData[i].tp.split('/');
                let featNums = [];
                this.timelineData[i].featIds.forEach(function(featId){
                    featNums.push(this.getFeatNumFromId(featId));
                }.bind(this));
                this.timelinePoints.push({'start': temp[0], 'end': temp[1], 'label': temp[2],
                    'ssStart': Date.parse(temp[0]), 'ssEnd': Date.parse(temp[1]),
                    'featIds': new Set(this.timelineData[i].featIds),
                    'featNums': new Set(featNums)});
                opt = document.createElement('option');
                opt.setAttribute('value', i);
                if (i % 5 == 0){
                    opt.setAttribute('label', temp[2]);
                }
            }
            document.body.appendChild(dl);
            cbx = document.createElement('input');
            cbx.setAttribute('type', 'checkbox');
            cbx.setAttribute('id', 'chkTimeline');
            cbx.addEventListener('change', function(e){this.toggleTimeline(e.target);}.bind(this));
            cont.appendChild(cbx);
            label = document.createElement('label');
            label.setAttribute('id', 'lblTimeline');
            label.appendChild(document.createTextNode(this.captions.strTimeline));
            cont.appendChild(label);

            // Control buttons for playback.
            btns = document.createElement('span');

            stepB = document.createElement('button');
            stepB.setAttribute('id', 'btnStepBTimeline');
            img = document.createElement('img');
            img.setAttribute('src', 'images/step-backward-circle.svg');
            img.setAttribute('title', this.captions.strStepBackward);
            stepB.appendChild(img);
            stepB.addEventListener('click', function(){this.timelineStep(-1);}.bind(this));
            stepB.disabled = true;
            btns.appendChild(stepB);

            play = document.createElement('button');
            play.setAttribute('id', 'btnPlayTimeline');
            this.playImg = document.createElement('img');
            this.playImg.setAttribute('src', 'images/play-circle.svg');
            this.playImg.setAttribute('title', this.captions.strPlay);
            play.appendChild(this.playImg);
            play.addEventListener('click', function(){this.timelinePlay();}.bind(this));
            play.disabled = true;
            btns.appendChild(play);

            stepF = document.createElement('button');
            stepF.setAttribute('id', 'btnStepFTimeline');
            img = document.createElement('img');
            img.setAttribute('src', 'images/step-forward-circle.svg');
            img.setAttribute('title', this.captions.strStepForward);
            stepF.appendChild(img);
            stepF.addEventListener('click', function(){this.timelineStep(1);}.bind(this));
            stepF.disabled = true;
            btns.appendChild(stepF);

            cont.appendChild(btns);

            slider = document.createElement('input');
            slider.setAttribute('type', 'range');
            slider.setAttribute('value', '0');
            slider.setAttribute('step', '1');
            slider.setAttribute('min', '0');
            slider.setAttribute('max', (this.timelineData.length - 1).toString());
            slider.setAttribute('list', 'ptsTimeline');
            slider.setAttribute('id', 'rngTimeline');
            slider.addEventListener('change', function(e){this.timelineChange(e.target)}.bind(this));
            slider.disabled = true;
            cont.appendChild(slider);

            document.body.appendChild(cont);
            this.timeline = slider;
            this.stepBackButton = stepB;
            this.playButton = play;
            this.stepForwardButton = stepF;
            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for showing/hiding the timeline, when the screen space
     *              is tight (e.g. when drawing).
     *
     * @function
     showTimeline
     * @memberof VectorLayer.prototype
     * @description hides or shows any timelines on the page.
     * @param   {Boolean} show show if true, hide if false
     * @returns {Boolean} true (succeeded) or false (failed).
     */

    showTimeline(show){
        try{
            let displayVal = show ? 'grid' : 'none';
            let timelines = document.getElementsByClassName('timeline');
            for (let i = 0; i< timelines.length; i++){
                timelines[i].style.display = displayVal;
            }
            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    }

    /**
     * Function for toggling the timeline functionality.
     *
     * @function
     toggleTimeline
     * @memberof VectorLayer.prototype
     * @description enables or disables the timeline control, and
     *              runs its change event to reconfigure visibility
     *              of features currently showing.
     * @returns {Boolean} true (succeeded) or false (failed).
     */

    toggleTimeline(sender){
        try{
            // Whatever happens, we're resetting the play button to show the play icon.
            this.playImg.setAttribute('src', 'images/play-circle.svg');
            this.playImg.setAttribute('title', this.captions.strPlay);
            if (sender.checked){
                this.timeline.disabled = false;
                this.stepBackButton.disabled = false;
                this.playButton.disabled = false;
                this.stepForwardButton.disabled = false;
                this.timelineChange(this.timeline);
                this.timeline.parentElement.classList.add('enabled');
                // If pan/zoom is turned off, it makes sense to zoom initially
                // to the base layer frame.
                if (this.timelinePanZoom === false){
                    this.setMapBounds(this.baseFeature.getGeometry().getExtent());
                }
            }
            else{
                if (this.playInterval !== null){
                    this.timelinePlay();
                }
                this.timeline.disabled = true;
                this.timeline.parentElement.classList.remove('enabled');
                document.getElementById('lblTimeline').innerHTML = this.captions.strTimeline;
                this.stepBackButton.disabled = true;
                this.playButton.disabled = true;
                this.stepForwardButton.disabled = true;
                this.timeline.value = 0;
            }
            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for showing/hiding features based on their current
     *          display setting and the timeline position.
     *
     * @function
     timelineChange
     * @memberof VectorLayer.prototype
     * @description triggered by a change in the timeline position,
     *              this checks all the currently-showing features
     *              and switches their styles between showing
     *              (if they're in the range) and another style
     *              (if they're not). The Set of feature numbers which
     *              were previously showing is available in the
     *              this.lastTimelineFeatNums property; the numbers of
     *              candidate features are stored in the this.timelinePoints
     *              array item.
     * @returns {Boolean} true (succeeded) or false (failed).
     */

    timelineChange(sender){
        try{
            let val = sender.value;

            let tp = this.timelinePoints[val];

            // First we get a list of featNums which are currently showing
            // but need to be hidden.
            let featNumsToHide = new Set([...this.lastTimelineFeatNums].filter(x => !tp.featNums.has(x)));

            // We need a set of the featNums which were showing before and should remain so.
            let featNumsToKeepShowing = new Set([...this.lastTimelineFeatNums].filter(x => tp.featNums.has(x)))

            // Next, we need a list of features in the new set which were not
            // previously showing, so need to be shown (assuming they match the taxonomy).
            let featNumsToShowNew = new Set([...tp.featNums].filter(x => !this.lastTimelineFeatNums.has(x)));

            // Change the label to show the current timeline item.
            document.getElementById('lblTimeline').innerHTML = this.timelinePoints[val].label;

            this.stepBackButton.disabled = !(parseInt(sender.value) > this.timeline.min);
            this.stepForwardButton.disabled = !(parseInt(sender.value) < this.timeline.max);


            if (this.timelinePanZoom){
                let feats = [...featNumsToKeepShowing, ...featNumsToShowNew];
                // console.log(feats);
                if ((feats.length > 1)||((feats.length === 1) && (this.features[feats[0]].getGeometry().GeometryType !== 'Point'))){
                    this.centerOnFeatures(feats);
                }
            }

            // Now hide the ones that need to be hidden.
            for (let featNum of featNumsToHide) this.showHideFeature(false, featNum, -1);

            // Set the style of those to keep showing. We do this by showing them again.
            for (let featNum of featNumsToKeepShowing) this.showHideFeature(true, featNum, -1);

            // Finally we show the new ones with the selected style.
            featNumsToShowNew.forEach(function(featNum){
                this.showHideFeature(true, featNum, -1);
                let catNum = this.features[featNum].getProperties().showingCat;
                if (catNum < 0){
                    catNum = this.getCatNumFromId(this.features[featNum].getProperties().taxonomies[0].categories[0]);
                }
                if (catNum > -1){
                    let cat = this.taxonomies[this.currTaxonomy].categories[catNum];
                    this.features[featNum].setStyle(util.Util.getSelectedStyle(cat.icon, cat.iconDim));
                }
            }.bind(this));


            // Now we replace the old list of showing features with the new one.
            this.lastTimelineFeatNums = new Set(tp.featNums);

            // Generate a custom event that can be hooked by external code.
            let ev = new CustomEvent('timelineChange', {detail: {timelinePoint: tp, playing: (this.playInterval !== null)}});
            document.dispatchEvent(ev);

            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for "playing" the timeline in sequence.
     *
     * @function
     timelinePlay
     * @memberof VectorLayer.prototype
     * @description triggered by the timeline play button, this
     *              uses a recursive function to advance the
     *              timeline until it ends.
     * @returns {Boolean} true (succeeded) or false (failed).
     */

    timelinePlay(){
        let i, maxi;
        try{
            // Are we already playing? If so, stop.
            if (this.playInterval !== null){
                try{clearInterval(this.playInterval);}catch(e){'Failed to clear play interval.'};
                this.playImg.setAttribute('src', 'images/play-circle.svg');
                this.playImg.setAttribute('title', this.captions.strPlay);
                this.playInterval = null;
                // Now make sure all showing features have their default style.
                for (i = 1, maxi = this.features.length; i<maxi; i++){
                    if (this.features[i].getProperties().showing){
                        this.showHideFeature(true, i, -1);
                    }
                }
                // Generate a custom event that can be hooked by external code.
                let ev = new CustomEvent('timelineChange', {detail: {timelinePoint: this.timelinePoints[this.timeline.value], playing: false}});
                document.dispatchEvent(ev);
                return true;
            }

            // Otherwise, we start playing.
            this.playImg.setAttribute('src', 'images/stop-circle.svg');
            this.playImg.setAttribute('title', this.captions.strStopPlay);

            this.playInterval = setInterval(function(){
                if (parseInt(this.timeline.value) < parseInt(this.timeline.max)){
                    this.timeline.stepUp();
                    this.timelineChange(this.timeline);
                }
                else{
                    clearInterval(this.playInterval);
                    this.playInterval = null;
                    this.playImg.setAttribute('src', 'images/play-circle.svg');
                    this.playImg.setAttribute('title', this.captions.strPlay);
                }
            }.bind(this), this.msPlayInterval);
            this.timelineChange(this.timeline);
            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for "stepping" the timeline forwards or backwards.
     *
     * @function
     timelineStep
     * @memberof VectorLayer.prototype
     * @description triggered by the timeline stepback or stepforward
     *              buttons, this moves the timeline one step.
     * @param   {Number} step -1 or +1 to move back or forward.
     * @returns {Boolean} true (succeeded) or false (failed).
     */

    timelineStep(step){
        // Stop playing if we're playing.
        if (this.playInterval !== null){this.timelinePlay();}
        (step < 0)? this.timeline.stepDown() : this.timeline.stepUp();
        this.timelineChange(this.timeline);
    }

    /**
     * Function for retrieving the category index from its string identifier.
     *
     * @function VectorLayer.getCatNumFromId
     * @memberof VectorLayer.prototype
     * @description retrieves the category index
     *                         number from its string id.
     * @param {string} catId the string identifier.
     * @param {number} defVal the value to return if the category id is not found.
     * @returns {number} the index of the category, or defVal by default if the
     *                   identifier is not found.
     */

    getCatNumFromId(catId, defVal){
        let i, maxi, result = defVal;
        try{
            if ((this.currTaxonomy > -1) && (this.currTaxonomy < this.taxonomies.length)){
                for (i=0, maxi=this.taxonomies[this.currTaxonomy].categories.length; i<maxi; i++){
                    if (this.taxonomies[this.currTaxonomy].categories[i].id === catId){
                        return i;
                    }
                }
            }
            return result;
        }
        catch(e){
            console.error(e.message);
            return defVal;
        }
    };

    /**
     * Function for retrieving the taxonomy index from its string identifier.
     *
     * @function VectorLayer.getTaxNumFromId
     * @memberof VectorLayer.prototype
     * @description retrieves the taxonomy index
     *                         number from its string id.
     * @param {string} taxId the string identifier.
     * @param {number} defVal the value to return if the category id is not found.
     * @returns {number} the index of the taxonomy, or defVal by default if the
     *                   identifier is not found.
     */

    getTaxNumFromId(taxId, defVal){
        let i, maxi;
        try{
            for (i=0, maxi=this.taxonomies.length; i<maxi; i++){
                if (this.taxonomies[i].id === taxId){
                    return i;
                }
            }
            return defVal;
        }
        catch(e){
            console.error(e.message);
            return defVal;
        }
    };

    /**
     * Function for retrieving the feature index from its string identifier.
     *
     * @function VectorLayer.getFeatNumFromId
     * @memberof VectorLayer.prototype
     * @description retrieves the feature index
     *                         number from its string id.
     * @param {string} featId the string identifier.
     * @param {number} defVal the value to return if the feature is not
     *                 found
     * @returns {number} the index of the feature, or defVal if the
     *                   identifier is not found.
     */

    getFeatNumFromId(featId, defVal){
        let i, maxi, result = defVal;
        for (i=0, maxi=this.features.length; i<maxi; i++){
            if (this.features[i].getId() === featId){
                result = i;
            }
        }
        return result;
    };

    /**
     * Function for retrieving a workable category id for
     * a feature that is to be displayed.
     *
     * @function
     getCurrFirstCatNum
     * @memberof VectorLayer.prototype
     * @description finds the first category number in the currently-active
     *              taxonomy which contains the feature with the supplied
     *              id. This is used to decide what category to use when
     *              displaying a feature.
     * @param {string} featId   The id of the feature.
     * @returns {number} the index of the first category containing this
     *                   feature, or -1 if it is not found.
     */

    getCurrFirstCatNum(featId){
        let cats, feats, i, maxi, j, jmax, result = -1;
        try{
            if ((this.currTaxonomy < 0)||(this.currTaxonomy >= this.taxonomies.length)){
                return -1;
            }
            cats = this.taxonomies[this.currTaxonomy].categories;
            for (i=0, maxi=cats.length; i<maxi; i++){
                feats = cats[i].features;
                for (j=0, jmax=feats.length; j<jmax; j++){
                    if (feats[j].getId() === featId){
                        return i;
                    }
                }
            }
            return result;
        }
        catch(e){
            console.error(e.message);
            return -1;
        }
    };

    /**
     * Function for hiding/showing a single feature on the map.
     *
     * @function
     showHideFeature
     * @memberof VectorLayer.prototype
     * @description turns
     *                         a feature on or off on the layer,
     *                         by assigning a style based on
     *                         a provided category, or failing
     *                         that, the first category the feature
     *                         belongs to.
     * @param {Boolean} show   Whether to show or hide the feature.
     * @param {number} featNum The number of the feature in the layer array.
     * @param {number} catNum  The category number (or -1 for no category).
     * @returns {Boolean} true (succeeded) or false (failed).
     */

    showHideFeature(show, featNum, catNum){
        let thisFeature, featId, cat, i, maxi;
        try{
            if ((featNum < 0) || (featNum >= this.features.length)){return false;}

            // First we determine an appropriate category for the feature, either
            // the one passed into the function, or the first one in the feature's
            // own array.
            thisFeature = this.features[featNum];
            featId = thisFeature.getId();

            // Now we check that it's in the current taxonomy. If not, we don't show it.
            if (this.taxonomyHasFeature(this.currTaxonomy, featId) === false){
                return false;
            }

            if (catNum < 0){
                catNum = this.getCurrFirstCatNum(featId);
            }

            //Retrieve the cat itself.
            cat = this.taxonomies[this.currTaxonomy].categories[catNum];

            // TODO: We get the catId so that we can retrieve the icon info for the
            // category if there is a custom icon.

            // Now we show or hide the feature.
            this.featureDisplayStatus = constants.NAV_SHOWHIDING_FEATURES;
            if (show === true){
                thisFeature.setStyle(util.Util.getCategoryStyle(catNum, cat.icon, cat.iconDim));
                thisFeature.setProperties({"showing": true, "showingCat": catNum});
            }
            else{
                if (thisFeature.getProperties().selected){this.deselectFeature();}
                // todo: below doesn't have an actual declaration
                thisFeature.setStyle(util.Util.hiddenStyle);
                thisFeature.setProperties({"showing": false, "showingCat": -1});
            }
            // Next, we set the status of all the checkboxes associated with this
            // feature.
            this.featureDisplayStatus = constants.NAV_HARMONIZING_FEATURE_CHECKBOXES;
            for (i=0, maxi=this.featureCheckboxes.length; i<maxi; i++){
                if (this.featureCheckboxes[i].getAttribute('data-featNum') === featNum.toString()){
                    this.featureCheckboxes[i].checked = show;
                }
            }
            // Finally we need to harmonize the status of the category checkboxes.
            this.featureDisplayStatus = constants.NAV_HARMONIZING_CATEGORY_CHECKBOXES;
            this.harmonizeCategoryCheckboxes();

            // We're done
            this.featureDisplayStatus = constants.NAV_IDLE;
            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for showing/hiding all features on the layer.
     *
     * @function
     showHideAllFeatures
     * @memberof VectorLayer.prototype
     * @description toggles display of all features which are part of
     *              the currently-selected taxonomy.
     * @param   {Element} sender The DOM element which initated the action.
     * @param   {Boolean} show Whether to show or hide features.
     * @returns {number} the number of features whose state is changed
     *                          by the operation.
     */

    showHideAllFeatures(sender, show){
        let i, maxi, j, maxj, showVal, currTaxCats, feats, featuresChanged;
        if (sender === null){
            showVal = show;
        }
        else{
            showVal = sender.checked;
        }
        featuresChanged = 0;

        // If hiding, we just hide everything.
        if (showVal === false){
            for (i=0, maxi=this.features.length; i<maxi; i++){
                if (this.features[i].getProperties().showing !== showVal){
                    this.showHideFeature(showVal, i, -1);
                    featuresChanged++;
                }
            }
        }
        // Otherwise we show only the features for the currently-selected
        // taxonomy.
        else{
            currTaxCats = this.taxonomies[this.currTaxonomy].categories;
            for (i=0, maxi=currTaxCats.length; i<maxi; i++){
                feats = currTaxCats[i].features;
                for (j=0, maxj=feats.length; j<maxj; j++){
                    if (feats[j].getProperties().showing === false){
                        this.showHideFeature(true, this.features.indexOf(feats[j]), -1);
                    }
                }
            }
        }

        return featuresChanged;
    };

    /**
     * Function for hiding/showing features on the map controlled by
     *              the navigation panel.
     *
     * @function
     showHideFeatureFromNav
     * @memberof VectorLayer.prototype
     * @description is called
     *             from the navigation panel, and hides
     *             or shows a specific feature on the map using
     *             a style based on a specific category.
     * @param {element} sender HTML element from which the function was called.
     * @param {number}  featNum Index of the feature to be shown or hidden in
     *                          the feature array.
     * @param {number}  catNum The number of the category whose style is to
     *                         be used for display, or -1 if the category is
     *                         to be taken from the feature itself.
     * @returns {Boolean} true (succeeded) or false (failed).
     */


    showHideFeatureFromNav(sender, featNum, catNum){
        // If a change has resulted from an action happening in code rather
        // than a user interaction, then do nothing.
        let success = false;
        if (this.featureDisplayStatus !== constants.NAV_IDLE){return success;}

        success = this.showHideFeature(sender.checked, featNum, catNum);

        if (sender.checked){
            success = success && this.setSelectedFeature(featNum, false);
            this.centerOnFeatures([featNum]);
        }
        return success;
    };

    /**
     * Function for selecting and centring a feature on the map controlled by
     *              the navigation panel.
     *
     * @function
     selectFeatureFromNav
     * @memberof VectorLayer.prototype
     * @description is called
     *             from the navigation panel, and shows, selects and centres
     *             a specific feature on the map using
     *             a style based on a specific category.
     * @param {number}  featNum Index of the feature to be shown or hidden in
     *                          the feature array.
     * @param {number}  catNum The number of the category whose style is to
     *                         be used for display, or -1 if the category is
     *                         to be taken from the feature itself.
     * @returns {Boolean} true (succeeded) or false (failed).
     */


    selectFeatureFromNav(featNum, catNum){
        let success = false;
        if (this.featureDisplayStatus !== constants.NAV_IDLE){return success;}

        success = this.showHideFeature(true, featNum, catNum);

        success = success && this.setSelectedFeature(featNum, false);
        this.centerOnFeatures([featNum]);
        return success;
    };

    /**
     * Function for harmonizing the status of category checkboxes
     * after operations which have changed the status of their
     * subsidiary feature checkboxes.
     *
     * @function
     harmonizeCategoryCheckboxes
     * @memberof VectorLayer.prototype
     * @description goes through
     *                         all the checkboxes for categories, and
     *                         sets their status to checked, indeterminate
     *                         or unchecked based on the status of their
     *                         subsidiary checkboxes.
     * @returns {Boolean} true (succeeded) or false (failed).
     */

    harmonizeCategoryCheckboxes(){
        // Variables for tracking what we need to know for the
        // all-controlling checkbox chkShowAll.
        let allChecked = true, allUnchecked = true, allIndeterminate = false, i, maxi, j, maxj, hasChecked, hasUnchecked, childInputs;
        try{
            for (i=0, maxi=this.categoryCheckboxes.length; i<maxi; i++){
                hasChecked = false;
                hasUnchecked = false;
                childInputs = this.categoryCheckboxes[i].parentNode.querySelectorAll("input[data-featNum]");
                for (j=0, maxj=childInputs.length; j<maxj; j++){
                    if (childInputs[j].checked){hasChecked = true;}
                    if (childInputs[j].checked === false){hasUnchecked = true;}
                }
                if (hasChecked && hasUnchecked){
                    this.categoryCheckboxes[i].indeterminate = true;
                    allIndeterminate = true;
                    allChecked = false;
                    allUnchecked = false;
                }
                else{
                    this.categoryCheckboxes[i].indeterminate = false;
                    if (hasChecked){
                        this.categoryCheckboxes[i].checked = true;
                        allUnchecked = false;
                    }
                    else{
                        this.categoryCheckboxes[i].checked = false;
                        allChecked = false;
                    }
                }
            }
            this.allFeaturesCheckbox.checked = (allChecked === true) && (allUnchecked === false);
            this.allFeaturesCheckbox.indeterminate = allIndeterminate;
            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for hiding/showing a complete category of
     * features on the map.
     *
     * @function
     showHideCategory
     * @memberof VectorLayer.prototype
     * @description hides
     *             or shows all the features belonging to a
     *             specific category on the map using
     *             a style based on the category.
     * @param   {element} sender HTML element which called the function.
     * @param   {number}  catNum index of the category to be shown
     *                    or hidden.
     * @param   {Boolean} show  (optional) If the sender is not specified
     *                    then whether to show or hide can be specified
     *                    in this optional parameter.
     * @returns {Boolean} true (succeeded) or false (failed).
     */

    showHideCategory(sender, catNum){
        let featNum, featNums = [], show, childInputs, i, maxi;
        if (this.featureDisplayStatus != constants.NAV_IDLE){return false;}

        this.featureDisplayStatus = constants.NAV_SHOWHIDING_CATEGORY;
        show = sender.checked;
        try{
            childInputs = sender.parentNode.querySelectorAll("input[data-featNum]");
            for (i=0, maxi=childInputs.length; i<maxi; i++){
                featNum = childInputs[i].getAttribute('data-featNum');
                this.showHideFeature(show, featNum, catNum);
                featNums.push(featNum);
            }
            this.centerOnFeatures(featNums);
            this.featureDisplayStatus = constants.NAV_IDLE;
            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for centring the map on a selection of multiple
     * features.
     * @function
     centerOnFeatures
     * @memberof VectorLayer.prototype
     * @description
     *              centres the map on a set of features which
     *              are specified as an array of feature numbers.
     * @param   {number[]} featNums array of feature numbers.
     * @returns {Boolean} true (succeeded) or false (failed).
     */

    centerOnFeatures(featNums){
        let i, maxi, geomCol, extent, el, leftMargin = 20, rightMargin, bottomMargin = 20, opts, geoms = [];
        try{
            for (i=0, maxi=featNums.length; i<maxi; i++){
                let g = this.features[featNums[i]].getGeometry();
                if (g !== undefined){
                    geoms.push(g);
                }
            }
            if (geoms.length > 0){
                geomCol = new ol.geom.GeometryCollection(geoms);
                extent = geomCol.getExtent()
                // Now we need to allow for the fact that a big block of the map
                // is invisible under the navigation, info and doc panels.
                if (parseInt(window.getComputedStyle(this.docDisplayDiv).left) > -1){
                    leftMargin = this.docDisplayDiv.offsetWidth + 20;
                }
                if (this.timeline !== null){
                    el = this.timeline.parentElement;
                    bottomMargin = el.offsetHeight + 40;
                }
                rightMargin = this.navPanel.offsetWidth + 20;
                opts = {padding: [20, rightMargin, bottomMargin, leftMargin],
                    duration: Math.min(Math.floor(this.msPlayInterval / 2), 1000)
                };

                this.view.fit(extent, /* this.map.getSize(),*/ opts);

            }
            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for navigating the map to a specified extent. Used when
     *          defining a map boundary rectangle, and later when using
     *          that rectangle when initializing.
     * @function
     setMapBounds
     * @memberof VectorLayer.prototype
     * @description Navigates the map to a specified extent. Used when
     *           the user defines a map boundary startup setting, and
     *           then when the map is first loaded, initializing it at
     *           that setting.
     * @param   {ol.Extent} extent The extent to navigate the map to.
     * @returns {Boolean} true (succeeded) or false (failed).
     */

    setMapBounds(extent){
        let opts;
        opts = {
            duration: 1000
        };

        try{
            this.view.fit(extent, opts);
            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for finding the smallest feature at a specific
     *                      pixel on the map.
     *
     * @function
     selectFeatureFromPixel
     * @memberof VectorLayer.prototype
     * @description detects
     *                         all features that overlap a specific
     *                         pixel and returns the smallest of them.
     * @param {ol.pixel} pixel The pixel in question.
     * @returns {number} the index of a feature if one is found, or -1.
     */

    selectFeatureFromPixel(pixel){
        let featNum, hitFeature = null, fSize = -1;
        this.map.forEachFeatureAtPixel(pixel, function(feature, layer){
            let thisSize, geom, geomType, showing;
            geom = feature.getGeometry();
            geomType = geom.getType();
            showing = feature.getProperties().showing;
            if (showing){
                if (geomType === 'LineString' || geomType === 'MultiLineString' || geomType === 'Point' || geomType === 'MultiPoint'){
                    hitFeature = feature;
                    fSize = 0;
                } else if (geomType === 'Polygon'||geomType === 'MultiPolygon'||geomType === 'GeometryCollection'){
                    thisSize = util.Util.getSize(geom.getExtent());
                    if ((thisSize < fSize) || (fSize < 0)){
                        hitFeature = feature;
                        fSize = thisSize;
                    }
                }
            }
        });
        if (hitFeature !== null){
            featNum = this.features.indexOf(hitFeature);
            if (hitFeature.getProperties().showing === false){
                this.showHideFeature(true, featNum, hitFeature.getProperties().showingCat);
            }
            this.setSelectedFeature(featNum, true);
        }
    };

    /**
     * Function for selecting a feature on the map based on its
     *          id. This is most likely to be used as part of
     *          the hol: linking protocol whereby a user can point
     *          to the id of a specific feature in a text or description.
     *
     * @function
     selectFeatureFromId
     * @memberof VectorLayer.prototype
     * @description selects a feature on the map based on its
     *          id.
     * @param {String} featId The id attribute of the target feature.
     * @returns {number} the index of a feature if one is found, or -1.
     */

    selectFeatureFromId(featId){
        let featNum = -1, catNum = -1;
        try{
            featNum = this.getFeatNumFromId(featId, -1);
            if (featNum > -1){
                catNum = this.getCurrFirstCatNum(featId);
                // Check whether it's included in the currently-selected taxonomy.
                if (catNum > -1){
                    // If an index is found, show that feature and select it.
                    this.showHideFeature(true, featNum, catNum);
                    this.setSelectedFeature(featNum, true);
                    this.centerOnFeatures([featNum]);
                }
            }
            return featNum;
        }
        catch(e){
            console.error(e.message);
            return -1;
        }
    };

    /**
     * Function for selecting a specific feature and displaying info
     *                        about it.
     *
     * @function
     setSelectedFeature
     * @memberof VectorLayer.prototype
     * @description deselects
     *                         any feature currently selected, and
     *                         selects the one passed (by index) to the
     *                         function
     * @param {number} featNum The index of the feature to select.
     * @param {Boolean} jumpInNav Whether or not to highlight/select the
     *                         corresponding item in the navigation panel.
     *                         If the action is triggered from the panel,
     *                         it would be undesirable to make it leap
     *                         around.
     * @returns {number} the index of a feature if one is selected, or -1.
     */

    setSelectedFeature(featNum, jumpInNav){
        let currFeat, props, ul, showDoc, readMore, catNum, cat, catLi, featLi, i, imax;
        // First deselect any existing selection.
        try{
            this.deselectFeature();
            // Next, select this feature.
            this.selectedFeature = featNum;
            currFeat = this.features[featNum];
            props = currFeat.getProperties();

            // First find the appropriate category: either the one it was shown with, or the first
            // in its list.
            catNum = currFeat.getProperties().showingCat;
            if (catNum < 0){
                catNum = this.getCatNumFromId(currFeat.getProperties().categories[0]);
            }
            cat = this.taxonomies[this.currTaxonomy].categories[catNum];

            currFeat.setStyle(util.Util.getSelectedStyle(cat.icon, cat.iconDim));
            currFeat.setProperties({"selected": true});
            // Set the title of the popup to the name of the feature.
            this.infoDiv.querySelector('h2').innerHTML = props.name;
            // Set the content of the popup to the description of the feature.
            this.infoDiv.querySelector("div[id='infoContent']").innerHTML = props.desc;
            // Show the edit button if we're allowing feature editing.
            if (this.allowDrawing){
                this.infoDiv.querySelector("button[id='btnEditFeature']").style.display = 'inline-block';
            }

            this.rewriteHolLinks(this.infoDiv);
            if ((props.links.length > 0)&&(this.infoDiv.querySelectorAll('span[class=\'holShowDoc\']').length < 1)){
                ul = document.createElement('ul');
                for (i=0, imax=props.links.length; i< imax; i++){
                    showDoc = document.createElement('li');
                    showDoc.setAttribute('class', 'holShowDoc');
                    showDoc.addEventListener('click', this.showDocument.bind(this, props.links[i]));
                    readMore = this.captions.strReadMore;
                    if (imax > 1){readMore += ' (' + (i+1) + ')';}
                    showDoc.appendChild(document.createTextNode(readMore));
                    ul.appendChild(showDoc);
                }

                this.infoDiv.querySelector("div[id='infoContent']").appendChild(ul);
            }
            this.infoDiv.style.display = 'block';
            // Now highlight and if necessary show the appropriate entry in the navigation panel.

            // Next, make sure that category is expanded in the navigation panel.
            catLi = document.getElementById('catLi_' + catNum);
            if (!catLi.classList.contains('expanded')){catLi.classList.add('expanded');}
            // Now we have to find the feature item in that category.
            featLi = catLi.querySelector('li#featLi_' + catNum + '_' + featNum);
            if (!featLi.classList.contains('selected')){
                featLi.classList.add('selected');
                this.selectedFeatureNav = featLi;
                if (jumpInNav === true){
                    featLi.scrollIntoView(true);
                }
            }
            return featNum;
        }
        catch(e){
            console.error(e.message);
            return -1;
        }
    };

    /**
     * Function for cloning the currently-selected feature so its
     *                         geometry can be edited.
     *
     * @function
     editSelectedFeature
     * @memberof VectorLayer.prototype
     * @description clones the currently-selected feature (if there
     *                     is one) and presents that geometry for
     *                     editing.
     * @returns {boolean} true for success, false for failure.
     */

    editSelectedFeature(){
        let tmpFeat, evt;
        try{
            if ((this.selectedFeature > -1)&&(this.allowDrawing)){
                // Clear existing drawing (should we warn first?)
                this.drawingFeatures.clear();

                // Clone the current feature
                tmpFeat = this.features[this.selectedFeature].clone();

                // Find its geometry type, and set up drawing for that drawing type
                this.addDrawInteraction(tmpFeat.getGeometry().getType());
                tmpFeat.setStyle(util.Util.getDrawingStyle());

                // Deselect the current feature.
                this.showHideFeature(false, this.selectedFeature);

                // Assign the feature to the drawing layer
                this.drawingFeatures.push(tmpFeat);

                // Run the drawing-done function to write the geometry to the
                // coords box.
                evt = {feature: tmpFeat};
                this.drawEnd(evt);

            }
            else{
                return false;
            }
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for deselecting the currently-selected feature if there
     *                          is one.
     *
     * @function
     deselectFeature
     * @memberof VectorLayer.prototype
     * @description deselects
     *                         any feature currently selected.
     * @returns {number} the index of the deselected feature if one
     *                   is found, or -1.
     */

    deselectFeature(){
    };

    /**
     * Function for parsing the search component of the URL string
     *              and showing/selecting features found there.
     *
     * @function
     parseSearch
     * @memberof VectorLayer.prototype
     * @description Parses the
     *              search component of the window URL and attempts
     *              to act on any information found there by selecting
     *              and showing features.
     * @returns {number} true if any features or categories were shown,
     *              false if not.
     */

    parseSearch(){
        let result, i, maxi, catIds, arrCatIds, catChk, catNum, featIds,
            arrFeatIds, featNum, arrFeatNums, docPath, currLoc, drawing,
            upload;
        result = 0;

        // First deselect any existing selection.
        this.deselectFeature();

        // Now hide any features currently showing.
        this.showHideAllFeatures(null, false);

        // Hide the document display box.
        //this.docDisplayDiv.style.display = 'none';
        //this.docDisplayDiv.style.left = '-21rem';
        this.docDisplayDiv.classList.add('hidden');
        this.docDisplayFrame.src = '';

        try{
            // First parse for a document to display.
            docPath = util.Util.getQueryParam('docPath');
            if (docPath.length > 0){
                this.showDocument(docPath);
            }
            else{
                if (this.startupDoc.length > 0){
                    this.showDocument(this.startupDoc);
                }
            }

            // Now parse the URL for category ids.
            catIds = util.Util.getQueryParam('catIds');
            if (catIds.length > 0){
                arrCatIds = catIds.split(';');
                for (i=0, maxi=arrCatIds.length; i<maxi; i++){

                    // For each category id found, check whether it's part of the currently-displayed
                    // taxonomy.
                    if (this.taxonomyHasCategory(this.currTaxonomy, arrCatIds[i])){
                        // Now look for a corresponding
                        // category number.
                        catNum = this.getCatNumFromId(arrCatIds[i], -1);
                        // If a cat number is found, show all items in that category.
                        if (catNum > -1){
                            // We simply check the appropriate checkbox.
                            catChk = document.querySelector('input[data-catNum="' + catNum + '"]');
                            if (catChk !== null){
                                catChk.checked = true;
                                catChk.dispatchEvent(new Event('change', { 'bubbles': true }));
                                result++;
                            }
                        }
                    }
                }
            }

            // Now parse the search string for individual features.
            featIds = util.Util.getQueryParam('featIds');
            if (featIds.length > 0){
                arrFeatNums = [];
                arrFeatIds = featIds.split(';');
                // For each feature id, check for a feature index number.
                for (i=0, maxi=arrFeatIds.length; i<maxi; i++){
                    featNum = this.getFeatNumFromId(arrFeatIds[i], -1);
                    catNum = this.getCurrFirstCatNum(arrFeatIds[i]);
                    // Check whether it's included in the currently-selected taxonomy.
                    if (catNum > -1){
                        // If an index is found, show that feature and select it.
                        if (featNum > -1){
                            this.showHideFeature(true, featNum, catNum);
                            this.setSelectedFeature(featNum, true);
                            result++;
                            arrFeatNums.push(featNum);
                        }
                    }
                }
            }
            // If more than one feature is specified, then deselect the selected one (which would be the last).
            if (result > 1){this.deselectFeature();}

            // Now we should zoom to the highlighted features.
            if (result > 0){
                this.centerOnFeatures(arrFeatNums);
            }

            // Now check whether we want to allow feature editing.
            drawing = util.Util.getQueryParam('drawing');
            if (drawing.length > 0){
                this.setupDrawing();
            }

            // Now check whether we want to allow JSON file upload.
            upload = util.Util.getQueryParam('upload');
            if (upload.length > 0){
                this.setupUpload();
            }

            // Now check for the current location feature.
            currLoc = util.Util.getQueryParam('currLoc');
            if (currLoc != ''){
                this.toggleTracking(true);
            }

            return result;
        }
        catch(e){
            console.error(e.message);
            return 0;
        }
    };

    /**
     * Function for showing/hiding the search box in the navigation panel.
     *
     * @function
     showHideMapSearch
     * @memberof VectorLayer.prototype
     * @description Hides or shows
     *                         the search box for the navigation panel.
     * @param {element(button)} sender the button element clicked to trigger
     *                          the action.
     * @returns {Boolean} true (success) or false (failure).
     */

    showHideMapSearch(sender){
        let caption, input;
        try{
            //alert(sender.innerHTML);
            // Always start by resetting the visibility of everything.
            this.doLocationSearch(false);
            caption = document.getElementById('navCaption');
            input = document.getElementById('inpNavSearch');
            if (caption.style.display === 'none'){
                sender.classList.remove('pressed');
                caption.style.display = '';
                input.style.display = 'none';
            }
            else{
                sender.classList.add('pressed');
                caption.style.display = 'none';
                input.style.display = 'block';
                input.focus();
            }
            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * Function for searching locations in the navigation panel.
     *
     * @function
     doLocationSearch
     * @memberof VectorLayer.prototype
     * @description Searches the
     *                         list of locations in the location panel
     *                         and hides those which are not found.
     * @param {Boolean} doSearch Whether to search or to re-hide the search features.
     * @returns {number} the number of search hits found.
     */

    doLocationSearch(doSearch){
        let i, j, maxi, maxj, strSearch, hits, allHits, nameRe, descendants, allDescendants, items;
        try{
            strSearch = this.navInput.value;
            allHits = 0;
            nameRe = new RegExp(strSearch, 'i');
            if ((doSearch === false)||(strSearch.length === 0)){
                allDescendants = this.navPanel.getElementsByTagName('*');
                for (i=0, maxi=allDescendants.length; i<maxi; i++){
                    allDescendants[i].classList.remove('hidden');
                    allDescendants[i].classList.remove('headless');
                    allDescendants[i].classList.remove('searchCatHeader');
                    allDescendants[i].classList.remove('expanded');
                }
            }
            else{
                document.getElementById('chkShowAll').classList.add('hidden');
                items = this.navPanel.getElementsByTagName('li');
                for (i=0, maxi=items.length; i<maxi; i++){
                    if (items[i].parentNode.id === 'holCategories'){
                        // This is a category container. Hide its category checkbox and triangle marker,
                        // and show its child ul.
                        items[i].classList.add('searchCatHeader');
                        items[i].getElementsByTagName('input')[0].classList.add('hidden');
                        // items[i].getElementsByTagName('span')[0].classList.add('hidden');

                        hits = 0;
                        descendants = items[i].getElementsByTagName('li');
                        for (j=0, maxj=descendants.length; j<maxj; j++){
                            if (descendants[j].textContent.match(nameRe)){
                                descendants[j].classList.remove('hidden');
                                hits++;
                            }
                            else{
                                descendants[j].classList.add('hidden');
                            }
                        }
                        if ((hits > 0)&&(items[i].getElementsByTagName('ul').length > 0)){
                            allHits += hits;
                            items[i].classList.add('headless');
                            items[i].classList.remove('hidden');
                        }
                        else{
                            items[i].classList.add('hidden');
                        }
                    }
                }
            }
            return allHits;
        }
        catch(e){
            console.error(e.message);
            return 0;
        }
    };

    /**
     * @function
     showDocument
     * @memberof VectorLayer.prototype
     * @description Shows an HTML
     *                          file linked from a popup description.
     * @param {string} docPath The path to the document to be displayed.
     *                          This is prefixed with the linkPrefix
     *                          property (which by default is an empty
     *                          string) to enable simpler configuration
     *                          if these resources are all coming from
     *                          the same source.
     * @returns {boolean} true (success) or false (failure).
     */

    showDocument(docPath){
        try{
            this.docDisplayFrame.setAttribute('src', this.linkPrefix + docPath);
            this.docDisplayDiv.classList.remove('hidden');
            //  TODO: MAKE THIS AN EVENT LISTENER!
            // window.setTimeout(function(){this.rewriteHolLinks(this.docDisplayFrame.contentDocument.getElementsByTagName('body')[0]);}.bind(this), 100);
            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * @function
     rewriteHolLinks
     * @memberof VectorLayer.prototype
     * @description Rewrites links written with the hol: and box: private URI
     *              protocols so that they make a JS call to this object. hol:
     *              links are turned into feature id links, and box: links are
     *              turned into calls which show the document inside the left-side
     *              iframe.
     * @param {element} the element containing the HTML within which this
     *                  operation should be done.
     * @returns {boolean} true (success) or false (failure).
     */

    rewriteHolLinks(el){
        let links, elMatch, i, maxi, link, featId, docUrl;
        try{
            if (el == null){return false;}
            elMatch = 'a[href^=hol\\3A]';
            links = el.querySelectorAll(elMatch);
            for (i=0, maxi=links.length; i<maxi; i++){
                link = links[i];
                featId = link.getAttribute('href').replace(/^hol:/, '');
                link.setAttribute('href', 'javascript:void(0)');
                link.classList.add('holFeatureLink');
                link.addEventListener('click', function(featId){this.selectFeatureFromId(featId);}.bind(this, featId), false);
            }
            elMatch = 'a[href^=box\\3A]';
            links = el.querySelectorAll(elMatch);
            for (i=0, maxi=links.length; i<maxi; i++){
                link = links[i];
                docUrl = link.getAttribute('href').replace(/^box:/, '');
                link.setAttribute('href', 'javascript:void(0)');
                link.classList.add('holShowDoc');
                link.addEventListener('click', this.showDocument.bind(this, docUrl));
            }
            return true;
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * @function
     toggleTracking
     * @memberof VectorLayer.prototype
     * @description Uses the HTML5 Geolocation API to turn on or off tracking of
     *              the user's current location on the map.
     * @returns {boolean} true (turned on tracking) or false (turned off tracking).
     * NOTE: The OL wrapper is not working, so this is implemented with
     *       standard navigator.geolocation functionality.
     */

    toggleTracking(){
        try{
            let track = (this.geolocationId === -1), msg;

            if ((track === true)&&('geolocation' in navigator)){
                this.userTrackButton.classList.add('on');
                if (window.location.protocol === 'https:'){msg = this.captions.strGeoLocNotSupported;}
                else{msg = this.captions.strGeoLocRequiresTLS;}
                this.geolocationId = navigator.geolocation.watchPosition(this.trackPosition.bind(this), function(){alert(msg); this.userTrackButton.classList.remove('on'); navigator.geolocation.clearWatch(this.geolocationId); this.geolocationId = -1;}.bind(this), {enableHighAccuracy: true});
            }
            else{
                if (this.userPositionMarker !== null){
                    // Delete the position marker
                    this.source.removeFeature(this.userPositionMarker);
                    // Clear the position watcher
                    navigator.geolocation.clearWatch(this.geolocationId);


                    this.userPositionMarker = null;
                    this.geolocationId = -1;
                    this.userTrackButton.classList.remove('on');
                }
            }
            return (this.geolocationId !== -1);
        }
        catch(e){
            console.error(e.message);
            return false;
        }
    };

    /**
     * @function
     trackPosition
     * @memberof VectorLayer.prototype
     * @description Callback function called by the geolocation API when the user's
     *              position changes. Used to update their position on the map.
     * @returns {boolean} true (success) or false (failure).
     */

    trackPosition(position) {
        let coords, extent, rightMargin, leftMargin = 0, opts;
        try {
            coords = ol.proj.transform([position.coords.longitude, position.coords.latitude], 'EPSG:4326', 'EPSG:3857');
            if (this.userPositionMarker === null) {
                //Create a new user position marker and put it on the map.
                this.userPositionMarker = new ol.Feature();

                this.userPositionMarker.setStyle(util.Util.getUserLocationStyle());
                this.source.addFeature(this.userPositionMarker);
            }

            this.userPositionMarker.setGeometry(coords ? new ol.geom.Point(coords) : null);
            //Centre on the new position.
            extent = this.userPositionMarker.getGeometry().getExtent();
            // Now we need to allow for the fact that a big block of the map
            // is invisible under the navigation, info and doc panels.
            if (parseInt(window.getComputedStyle(this.docDisplayDiv).left) > -1) {
                leftMargin = parseInt(window.getComputedStyle(this.docDisplayDiv).width);
            }
            rightMargin = this.navPanel.parentNode.classList.contains('hidden') ? 0 : parseInt(window.getComputedStyle(this.navPanel).width);
            opts = {
                padding: [0, rightMargin, 0, leftMargin],
                duration: 1000
            };
            opts.maxZoom = this.view.getZoom();
            this.view.fit(extent, /* this.map.getSize(),*/ opts);

            return true;
        } catch (e) {
            console.error(e.message);
            return false;
        }
    }
}

export {VectorLayer}