/**
 * An object in the hol namespace contains
 * captions organized by language. When ES6
 * modules are fully supported, this should be
 * ported to a separate module.
 * */
"use strict";

const captions = [];
captions['en'] = {};
captions['en'].strCloseX = '×';
captions['en'].strFile = 'File';
captions['en'].strLoadFile = 'Load file...';
captions['en'].strPasteGeoJSON = 'Paste GeoJSON...'
captions['en'].strPasteHere = 'Paste a single GeoJSON Feature here';
captions['en'].strSaveGeoJSON = 'Save GeoJSON...';
captions['en'].strSetup = 'Setup...';
captions['en'].strMapArea = 'Map area';
captions['en'].strDraw = 'Draw';
captions['en'].strLoad = 'Load';
captions['en'].strLoading = 'Loading...';
captions['en'].strInfo = 'Information about this map.';
captions['en'].strMenuToggle = '≡';
captions['en'].strOk = '✔';
captions['en'].strEdit = '🖉';
captions['en'].strLocationsByCat = 'Features by category';
captions['en'].strSearch = 'Search the map features.';
captions['en'].strReadMore = 'Read more...';
captions['en'].strUnnamedFeat = 'unnamed feature';
captions['en'].strNetworkError = 'There was a network error.';
captions['en'].strToggleTracking = 'Toggle tracking of my location on the map.';
captions['en'].strShowHideAllFeats = 'Show/hide all features';
captions['en'].strGeoLocNotSupported = 'Sorry, your browser does not support geolocation tracking.';
captions['en'].strGeoLocRequiresTLS = 'Geolocation tracking requires a secure connection (https).';
captions['en'].strNewTaxonomy = 'Add taxonomy';
captions['en'].strNewCategory = 'Add category';
captions['en'].strGetTaxonomyName = 'Type a name for your new taxonomy:'
captions['en'].strGetCategoryName = 'Type a name for your new category:';
captions['en'].strGetCategoryDesc = 'Type a brief description for your new category:';
captions['en'].strGetFeatureName = 'Type a name for your new feature:';
captions['en'].strStopDrawing = 'Stop drawing';
captions['en'].strClear = 'Clear';
captions['en'].strDrawnFeatures = 'Drawn features';
captions['en'].strDrawnFeaturesDesc = 'Features drawn during the current session';
captions['en'].strEditThisFeature = 'Edit a copy of this feature by clicking on the edit button above.';
captions['en'].strTimeline = 'Timeline';
captions['en'].strPlay = 'Play the timeline.'
captions['en'].strStopPlay = 'Stop the timeline playback.'
captions['en'].strStepForward = 'Step forward in the timeline.'
captions['en'].strStepBackward = 'Step backward in the timeline.'


/** @constant const VERSION
 *  Version of this library.
 *  @type {string}
 *  @default
 */
const VERSION = '1.2b';

/** @constant const OLVERSION
 *  Latest release of OpenLayers with which this codebase was tested.
 *  @type {string}
 *  @default
 */
const OLVERSION = ol.util.VERSION;

/**
 * Constants in hol namespace used
 * for tracking the process of complex
 * interactions between the navigation
 * panel and the features on the map.
 */

/** @constant const NAV_IDLE No action to show or hide
 *                 features is currently happening.
 *  @type {number}
 *  @default
 */
const NAV_IDLE = 0;

/** @constant const NAV_SHOWHIDING_FEATURES Another
 *                     user action has triggered the
 *                     showing/hiding of features, and thatusing
 *                     process is not yet complete.
 *  @type {number}
 *  @default
 */
const NAV_SHOWHIDING_FEATURES = 1;

/** @constant const NAV_HARMONIZING_FEATURE_CHECKBOXES
 *                     A process of showing and hiding
 *                     features triggered by the user is
 *                     currently making sure all the checkboxes
 *                     in the navigation panel for each feature
 *                     are in the same state.
 *  @type {number}
 *  @default
 */
const NAV_HARMONIZING_FEATURE_CHECKBOXES = 2;

/** @constant const NAV_HARMONIZING_CATEGORY_CHECKBOXES
 *                     A process of showing and hiding
 *                     features triggered by the user is
 *                     currently making sure all the checkboxes
 *                     in the navigation panel for for categories
 *                     reflect the combined state of their descendant
 *                     feature checkboxes.
 *  @type {number}
 *  @default
 */
const NAV_HARMONIZING_CATEGORY_CHECKBOXES = 3;

/** @constant const NAV_SHOWHIDING_CATEGORY
 *                     A process of showing or hiding
 *                     an entire category of features
 *                     is currently in progress.
 *  @type {number}
 *  @default
 */
const NAV_SHOWHIDING_CATEGORY = 4;

export {captions,NAV_IDLE, NAV_SHOWHIDING_CATEGORY, NAV_HARMONIZING_CATEGORY_CHECKBOXES,
    NAV_HARMONIZING_FEATURE_CHECKBOXES, NAV_SHOWHIDING_FEATURES, OLVERSION, VERSION
}