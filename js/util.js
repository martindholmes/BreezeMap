'use strict';

/**
 * Util class contains utility methods
 * and constants for the rest of the classes.
 *
 * @class Util Contains utility methods
 * and constants for the rest of the classes.
 * @constructor
 */

class Util {
    static tenColors;
    static colorSet;
    static lineOpacity;
    static shapeOpacity;
    static tenTranslucentColors;
    static translucentColorSet;

    static {
        /**
         * Ten maximally distinct colours, useful when using many categories on a layer.
         * @type {string[]}
         * @memberOf Util
         */
        this.tenColors = ['rgb(85, 0, 0)', 'rgb(0, 85, 0)', 'rgb(0, 0, 85)', 'rgb(85, 85, 0)', 'rgb(85, 0, 85)', 'rgb(0, 85, 85)', 'rgb(150, 0, 0)', 'rgb(0, 130, 0)', 'rgb(0, 0, 150)', 'rgb(0, 0, 0)'];
        /**
         * @description Set of distinct colours, initially set to the ten defaults.
         * The end-user can override these colours if they wish. By default,
         * identical to Util.tenColors.
         * @type {string[]}
         * @memberOf Util
         */
        this.colorSet = this.tenColors;
        /**
         * @description Opacity setting for lines and the outline of shapes, defaulting to '0.6'.
         *              Made into a variable so that projects can override it.
         * @type {string}
         * @memberOf Util
         */
        this.lineOpacity = '0.6';

        /**
         * @description Opacity setting for the interior of shapes, defaulting to '0.2'.
         *              Made into a variable so that projects can override it.
         * @type {string}
         * @memberOf Util
         */
        this.shapeOpacity = '0.2';
        /**
         * @description Array of strings representing ten maximally distinct colours,
         * with an alpha setting of Util.lineOpacity (default 0.6).
         * @type {string[]}
         * @memberOf Util
         */
        this.tenTranslucentColors = [];


        /**
         * @description Below anonymous function just populates the tenTranslucentColors array.
         */
        void function() {
            let i, maxi;
            for (i = 0, maxi = Util.tenColors.length; i < maxi; i++) {
                Util.tenTranslucentColors.push(Util.getColorWithAlpha(i, Util.lineOpacity));
            }
        }();

        /**
         * @description Set of distinct colours, with an alpha setting of 0.6. Initially set to
         * the Util.tenTranslucentColors, but can be overridden by the end user.
         * @type {string[]}
         * @memberOf Util
         */

        this.translucentColorSet = this.tenTranslucentColors;
    }

    constructor() {
    }

    /**
     * @description Helper method to avoid repeated code instances.
     * @type
     * @memberOf Util
     * @param {number} dx
     * @param {number[]} end
     * @param {number[]} start
     * @param {number} dy
     * @param {number} rotation
     * @param {any[]} midPoint
     */

    static getPointGeometry(dx, end, start, dy, rotation, midPoint) {
        dx = end[0] - start[0];
        dy = end[1] - start[1];
        rotation = Math.atan2(dy, dx);
        //We want the arrow in the middle of the segment.
        midPoint = [start[0] + Math.round((end[0] - start[0]) / 2), start[1] + Math.round((end[1] - start[1]) / 2)];
        return {rotation, midPoint};
    }

    /**
     * A utility function which shows the current version of this code and
     * the last version of OpenLayers with which it was tested.
     * @function Util.showVersion
     * @memberof Util
     * @description Outputs the version string to the console and returns it too.
     * @returns {string} The same string as is output to the console.
     */
    static showVersion() {
        const verString = 'hol (HCMC OpenLayers) JS version ' + VERSION + ' tested with OpenLayers ' + OLVERSION + '.';
        console.log(verString);
        return verString;
    };

    /**
     * A utility function borrowed with thanks from here:
     * http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
     * @function Util.crudeHash
     * @memberof Util
     * @description Creates a crude
     *                  one-way hash from an input string.
     * @param {string} s The input string.
     * @returns {number} A 32-bit integer.
     */
    static crudeHash(s) {
        let hash = 0, strlen = s.length, i, c;
        if (strlen === 0) {
            return hash;
        }
        for (i = 0; i < strlen; i++) {
            c = s.charCodeAt(i);
            hash = ((hash << 5) - hash) + c;
            hash &= hash; // Convert to 32bit integer
        }
        return hash;
    };

    /**
     * @description Get one of the distinct colours, but combine it with a translucency level.
     * @method Util.getColorWithAlpha Get one of the distinct colours, but
     *                                    combine it with a translucency level.
     * @param {number} catNum Number of the category
     * @param {string} alpha Alpha value (decimal between 0 and 1) in the form of a string.
     * @returns {string} String value of colour.
     */

    static getColorWithAlpha(catNum, alpha) {
        const rgb = this.tenColors[catNum % 10].replace('rgb\(', '').replace('\)', '').split('\s*,\s*');
        return 'rgba(' + rgb.join(', ') + ', ' + alpha + ')';
    };

    /**
     * @description Get the current main colour for a specific category,
     * based on its index number.
     * @function Util.getColorForCategory
     * @memberof Util
     * @param  {number} catNum Number of the category.
     * @return {string}
     */
    static getColorForCategory(catNum) {
        return this.colorSet[catNum % this.colorSet.length];
    };

    /**
     * @description Get the current translucent colour for a specific category,
     * based on its index
     * @function Util.getTranslucentColorForCategory
     * @memberof Util
     * @param  {number} catNum Number of the category.
     * @return {string}
     */
    static getTranslucentColorForCategory(catNum) {
        return this.translucentColorSet[catNum % this.translucentColorSet.length];
    };

    /**
     * @function Util.getCenter
     * @memberof Util
     * @description Calculates the centre
     *               point of an ol.Extent object.
     * @return {number[]} Array of two integers for x and y.
     * @param extent
     */
    static getCenter(extent) {
        let x, y;
        x = extent[0] + (extent[2] - extent[0]);
        y = extent[1] + (extent[3] - extent[1]);
        return [x, y];
    };

    /**
     * @function Util.escapeXml
     * @memberof Util
     * @description Escapes a block of XML so that it
     *              can be shown in literal form.
     * @param  {string} xml XML code.
     * @return {string} Escaped string
     */
    static escapeXml(xml) {
        return xml.replace(/</g, '&lt;').replace(/&amp;/g, '&amp;amp;').replace(/\n/g, '<br/>');
    };

    /**
     * A function in the Util namespace which returns
     * an ol.style.Style object which renders a feature as
     * essentially invisible.
     * @function Util.getHiddenStyle
     * @memberof Util
     * @description returns the default
     *                    style for features when they are
     *                    not visible on the map.
     * @returns {object} ol.style.Style
     */

    static getHiddenStyle() {
        return new ol.style.Style({
            image: new ol.style.Circle({
                fill: new ol.style.Fill({
                    color: 'rgba(255,255,255,0)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(255,255,0,0)',
                    width: 16
                }),
                radius: 30
            }),
            fill: new ol.style.Fill({
                color: 'rgba(255,255,255,0)'
            }),
            stroke: new ol.style.Stroke({
                color: 'rgba(255,255,255,0)',
                width: 12
            })
        });
    };

    /**
     * A function in the Util namespace which returns
     * an ol.style.Style object which is used for drawing
     * operations.
     * @function Util.getDrawingStyle
     * @memberof Util
     * @description returns the default
     *                    style for drawing new features on
     *                    the map when feature-editing is
     *                    enabled.
     * @returns {object} ol.style.Style
     */
    static getDrawingStyle() {
        return new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, ' + Util.shapeOpacity + ')'
            }),
            stroke: new ol.style.Stroke({
                color: '#ffcc33',
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: '#ffcc33'
                })
            })
        });
    };

    /**
     * A function in the Util namespace which returns
     * an ol.style.Style object designed for rendering a
     * user-dragged box on the map.
     * @function Util.getDragBoxStyle
     * @memberof Util
     * @description returns the default
     *                    style for a box drawn by the user
     *                    on the map using the mouse.
     * @returns {object} ol.style.Style
     */
    static getDragBoxStyle() {
        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#33ff33',
                width: 1
            })
        });
    };

    /**
     * An immediately-executed function in the Util
     *                   namespace which maintains
     *                   an incrementing counter, used for
     *                   purposes such as providing a high
     *                   zIndex to make selected objects
     *                   appear above others in their layer.
     * @function Util.counter
     * @memberof Util
     * @description returns a function which
     *                   returns an incremented counter value.
     * @returns {function} a function which returns an integer.
     */
    static counter = (function () {
        let c = 1000; //initial value.
        return function () {
            return c++;
        };
    })();

    /**
     * A function in the Util namespace which returns
     * an ol.style.Style object which renders a feature as
     * it would appear when highlighted.
     * @function Util.getSelectedStyle
     * @memberof Util
     * @description returns default
     *                    style for features when they are
     *                    selected on the map.
     * @param {string} catIcon Path to the icon for the category
     (may be null).
     * @param {Array}  catIconDim Array of width,height in pixels of the
     *                            category icon (may be null).
     * @returns {function} Function which returns an Array of ol.style.Style
     */
    static getSelectedStyle(catIcon, catIconDim) {
        //We use a closure to get a self-incrementing zIndex.
        let newZ = this.counter();
        return (feature, resolution) => {
            let catNum, catCol, geometry, dx, dy, rotation, midPoint, styles, offY;
            catNum = feature.getProperties().showingCat;
            catCol = this.getColorForCategory(catNum);

            //Default values for category icon.
            if (catIcon == null) {
                catIcon = 'js/placemark.png';
            }
            if (catIconDim == null) {
                catIconDim = [20, 30];
            }
            offY = Math.round(catIconDim[1] / 2) + 4;

            styles =
                [
                    new ol.style.Style({
                        image: new ol.style.Icon({
                            src: catIcon,
                            imgSize: catIconDim,
                            anchor: [0.5, 1],
                            color: 'rgba(255,0,255,1)'
                        }),
                        stroke: new ol.style.Stroke({
                            color: 'rgba(255,0,255,0.6)',
                            width: 8
                        }),
                        zIndex: newZ
                    }),
                    new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: '#ffffff',
                            width: 3
                        }),
                        text: new ol.style.Text({
                            font: '1em sans-serif',
                            offsetY: offY,
                            fill: new ol.style.Fill({color: catCol}),
                            stroke: new ol.style.Stroke({color: 'rgba(255, 255, 255, 1)', width: 3}),
                            text: feature.getProperties().name
                        }),
                        zIndex: newZ
                    })
                ];
            //If the feature is a directional LineString, we need to add arrows, assuming the
            //segment is long enough to fit one in.
            if (feature.getProperties().directional) {
                geometry = feature.getGeometry();
                geometry.forEachSegment((start, end) => {
                        let pixLen = Math.round(new ol.geom.LineString([start, end]).getLength() / resolution);
                        if (pixLen > 25) {
                            const __ret = this.getPointGeometry(dx, end, start, dy, rotation, midPoint);
                            rotation = __ret.rotation;
                            midPoint = __ret.midPoint;
                            styles.push(new ol.style.Style({
                                geometry: new ol.geom.Point(midPoint),
                                image: new ol.style.RegularShape({
                                    fill: new ol.style.Fill({color: 'rgba(255,0,255,1)'}),
                                    points: 3,
                                    radius: 10,
                                    rotation: -rotation,
                                    angle: Math.PI / 2 // rotate 90°
                                })
                            }));
                        }
                    }
                );
            }
            return styles;
        };
    };

    /**
     * A function in the Util namespace which returns
     * an ol.style.Style object which renders a feature
     * intended to be used to track the user's location
     * on the map.
     * @function Util.getUserLocationStyle
     * @memberof Util
     * @description returns default style for a feature
     *                      which tracks the user's location
     *                      on the map.
     * @returns {function} ol.FeatureStyleFunction
     */
    static getUserLocationStyle() {
        return function (feature, resolution) {
            return [new ol.style.Style({
                image: new ol.style.Icon({
                    src: 'js/userLocation.png',
                    imgSize: [30, 30],
                    anchor: [0.5, 0.5]
                })
                /*image: new ol.style.Circle({
                  radius: 12,
                  fill: new ol.style.Fill({
                      color: '#f00'
                  }),
                  stroke: new ol.style.Stroke({
                    color: '#ff0',
                    width: 6
                  })
                }),
                text: new ol.style.Text({
                  font: '5em sans-serif',
                  fill: new ol.style.Fill({color: '#f00'}),
                  stroke: new ol.style.Stroke({color: '#ff0', width: 10}),
                  text: '⌖',
                  textBaseline: 'bottom'
                })*/
            })]
        };
    };

    /**
     * A function in the Util namespace which returns
     * an ol.FeatureStyleFunction object which renders a feature as
     * it would appear as a member of a specified category.
     * @function Util.getCategoryStyle
     * @memberof Util
     * @description returns a constructed ol.FeatureStyleFunction
     *                    for features when they are
     *                    rendered normally on the map.
     * @param {number} catNum Index of the category in its array.
     * @param {string} catIcon Path to the icon for this category
     (might be null).
     * @param {Array}  catIconDim Array of width,height in pixels of the
     *                            category icon (may be null).
     * @returns {function} ol.FeatureStyleFunction
     */
    static getCategoryStyle(catNum, catIcon, catIconDim) {
        let col, transCol;
        col = this.getColorForCategory(catNum);
        transCol = this.getColorWithAlpha(catNum, this.shapeOpacity);

        //Default values for category icon.
        if (catIcon == null) {
            catIcon = 'js/placemark.png';
        }
        if (catIconDim == null) {
            catIconDim = [20, 30];
        }

        return (feature, resolution) => {
            let lineWidth, geomType, geometry, dx, dy, rotation, midPoint;
            lineWidth = 2;
            geomType = feature.getGeometry().getType();
            if (((geomType === 'LineString') && !(feature.getProperties().directional)) || (geomType === 'MultiLineString') || (geomType === 'GeometryCollection')) {
                lineWidth = 5;
            }

            let styles =
                [new ol.style.Style({
                    /*image: new ol.style.Circle({
                      fill: new ol.style.Fill({
                        color: transCol
                      }),
                      stroke: new ol.style.Stroke({
                        color: col,
                        width: 2
                      }),
                      radius: 10
                    }),*/
                    image: new ol.style.Icon({
                        src: catIcon,
                        imgSize: catIconDim,
                        anchor: [0.5, 1],
                        color: col
                    }),
                    fill: new ol.style.Fill({
                        color: transCol
                    }),
                    stroke: new ol.style.Stroke({
                        color: col,
                        width: lineWidth
                    })
                })];
            //If the feature is a directional LineString, we need to add arrows, assuming the
            //segment is long enough to fit one in.
            if (feature.getProperties().directional) {
                geometry = feature.getGeometry();
                geometry.forEachSegment((start, end) => {
                    let pixLen = Math.round(new ol.geom.LineString([start, end]).getLength() / resolution);
                    if (pixLen > 25) {
                        const __ret = this.getPointGeometry(dx, end, start, dy, rotation, midPoint);
                        rotation = __ret.rotation;
                        midPoint = __ret.midPoint;
                        styles.push(new ol.style.Style({
                            geometry: new ol.geom.Point(midPoint),
                            image: new ol.style.RegularShape({
                                fill: new ol.style.Fill({color: col}),
                                points: 3,
                                radius: 10,
                                rotation: -rotation,
                                angle: Math.PI / 2 // rotate 90°
                            })
                        }));
                    }
                });
            }
            return styles;
        };
    };

    /** Utility function which is passed an ol.Extent (minx, miny, maxx, maxy)
     and returns the area of the rectangle.
     *  @method Util.getSize Utility function for calculating the size of an ol.Extent.
     *  @param   {ol.Extent} extent
     *  @returns {number} The width * height of the extent.
     * */
    static getSize(extent) {
        let w, h;
        w = extent[2] - extent[0];
        h = extent[3] - extent[1];
        return (w * h);
    };

    /** Utility function which is passed a user-created name and
     *          returns a valid id constructed from it.
     *  @method Util.idFromName Utility function for constructing
     *                   a valid QName from a prose string.
     *  @param   {string} name
     *  @returns {string} The constructed ud.
     * */
    static idFromName(name) {
        //Get rid of unwanted chars.
        let candidate = name.replace(/[^A-Za-z0-9]+/g, '').replace(/^[^A-Za-z]+/, '');
        //Lowercase the first letter.
        candidate = candidate.substring(0, 1).toLowerCase() + candidate.substring(1);
        return candidate;
    };

    /**
     * A function in the Util namespace which expands and
     * contracts a category in the navigation panel.
     * @function Util.expandCollapseCategory
     * @memberof Util
     * @description expands or
     *              contracts a category in the
     *              navigation panel.
     * @param {object} sender The HTML element from which the
     *                        call originates.
     * @param {number} catNum
     */
    static expandCollapseCategory(sender, catNum) {
        let p = sender.parentNode;
        let cat = null;
        if (p.classList.contains('headless')) {
            return;
        }
        if (p.classList.contains('expanded')) {
            p.classList.remove('expanded');
        } else {
            p.classList.add('expanded');
            if (catNum > -1) {
                cat = this.taxonomies[this.currTaxonomy].categories[catNum];
                if ((typeof cat.desc !== 'undefined') && (cat.desc.length > 0)) {
                    this.deselectFeature();
                    this.infoDiv.querySelector('h2').innerHTML = cat.name;
                    this.infoDiv.querySelector("div[id='infoContent']").innerHTML = cat.desc;
                    if (this.allowDrawing) {
                        this.infoDiv.querySelector("button[id='btnEditFeature']").style.display = 'none';
                    }
                    this.rewriteHolLinks(this.infoDiv);
                    this.infoDiv.style.display = 'block';
                }
            }
        }
    };

    /**
     * @description A specific exception type we need to tell the user about.
     * @constructor Util.DataNotFoundError
     * @memberof Util
     * @param {string} missingData Specifics of the data which is missing.
     * @param {string} dataFile The file in which the data was expected to be found.
     */
    static DataNotFoundError(missingData, dataFile) {
        this.message = 'Error: ' + missingData + ' not found in the JSON file ' + dataFile + '.';
        this.stack = (new Error()).stack;
        // todo: not sure about the 2-line bit that follows, in terms of where they should be placed
        Object.setPrototypeOf(this.DataNotFoundError.prototype, Error.prototype);
        this.DataNotFoundError.prototype.name = 'Util.DataNotFoundError';
    };

    /**
     * @description Simple test function. Throws up an alert.
     * @function test
     * @param {string} inStr String to show in alert.
     * @memberof Util
     */
    static test(inStr) {
        alert('Util.test has been called with ' + inStr + '.');
    };

    /**
     * Method for retrieving JSON from a URL using
     * XMLHttpRequest. Stolen from:
     * https://github.com/mdn/promises-test/blob/gh-pages/index.html
     * with thanks.
     *
     * Call like this:
     *
     *  Util.ajaxRetrieve('json/myfile.json', 'json').then(function(response) {
     *  // The first runs when the promise resolves, with the request.response
     *  // specified within the resolve() method.
     *  something.something = JSON.Parse(response);
     *  // The second runs when the promise
     *  // is rejected, and logs the Error specified with the reject() method.
     *    }, function(Error) {
     *      console.log(Error);
     *  });
     *
     * @function Util.ajaxRetrieve
     * @memberof Util
     * @description Method for retrieving JSON from a URL using
     * XMLHttpRequest. Stolen from:
     * https://github.com/mdn/promises-test/blob/gh-pages/index.html
     * with thanks.
     * @param {string} url URL from which to retrieve target file.
     * @param {XMLHttpRequestResponseType} responseType the mime type of the target document.
     * @return Promise
     */
    static ajaxRetrieve(url, responseType) {
        // Create new promise with the Promise() constructor;
        // This has as its argument a function
        // with two parameters, resolve and reject

        return new Promise(function (resolve, reject) {
            // Standard XHR to load a JSON file
            let request = new XMLHttpRequest();
            request.open('GET', url);
            request.responseType = responseType;
            // When the request loads, check whether it was successful
            request.onload = function () {
                if (request.status === 200) {
                    // If successful, resolve the promise by passing back the request response
                    resolve(request.response);
                } else {
                    // If it fails, reject the promise with a error message
                    reject(Error(responseType.toUpperCase() + ' file ' + url + 'did not load successfully; error code: ' + request.statusText));
                }
            };
            request.onerror = function () {
                // Also deal with the case when the entire request fails to begin with
                // This is probably a network error, so reject the promise with an appropriate message
                reject(Error(this.captions.strNetworkError));
            };
            // Send the request
            request.send();
        });
    };

    /**
     * Function for parsing a URL query string.
     *
     * @function Util.getQueryParam
     * @memberof Util
     * @description parses a URL query
     *         string and returns a value for a specified param name.
     * @param {string} param The name of the param name to search for.
     * @returns {string} the value of the param, or an empty string.
     */
    static getQueryParam(param) {
        let sp = new URLSearchParams(decodeURI(document.location.search));
        let val = sp.get(param);
        return val ? val.trim() : '';
    };

}

export {Util}