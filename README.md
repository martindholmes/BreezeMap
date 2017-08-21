# BreezeMap
BreezeMap is a project to create a simple user interface for interactive map editing based on OpenLayers.

##Research Challenge 
The Geohumanist wishing to annotate historical maps, identify toponyms, or plot humanist data on maps currently must choose between highly sophisticated and powerful but proprietary tools (like ArcGIS) or simple tools unsuitable for complex research questions (like Google MyMaps). Our community needs a tool enabling a researcher without GIS expertise or coding skills to create a map with a rich range of feature types (from points to multi-geometries), create useful taxonomies for categorizing these features, link features to external open-data authorities, present the results in a user-friendly rich interface, and store the data in formats suitable for interchange. 
BreezeMap: The Tool
We are developing a tool tentatively called BreezeMap.* This tool is built on the OpenLayers framework and the Open Street Maps tileset (although allowing the use of any other suitable tile source, such as those created by the Pelagios project). BreezeMap will allow researchers to draw features on a map; annotate them; and categorize them according to multiple new or pre-existing taxonomies. The tool is designed to be simple to learn, yet powerful in its functions. 

##Plan
The project will take place in three phases, each with a useful deliverable product:

###Phase 1
During Phase 1 we will build and test a web-based interface that enables users to:

* Identify an area of interest on the world map;
* Create one or more named taxonomies, each with a set of named categories, to any of which they can assign the features they create; 
* Create the full range of features supported by the GeoJSON specification (Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon, and Geometry Collection) by drawing on the map (see http://mapoflondon.uvic.ca/agas.htm for a rudimentary version of such a drawing interface);
* Assign a range of properties to each feature (id, name, description, links to authority sources, etc.);
* Assign each feature to one or more categories in one or more of the taxonomies created by the user;
* Display the results in an instantly-updated live interface using a category-based menu similar to that on MoEML’s  Agas Map;
* Save the results in two formats: (1) a GeoJSON file containing all the data (including taxonomy and category information), which can be re-uploaded into the interface to continue work on the project, and (2) an XML-TEI gazetteer for interchange purposes;
* Deploy the completed map as a package of HTML, JavaScript, GeoJSON, and CSS by following some simple instructions.

This web-based interface can be deployed on a server or run locally on a user’s desktop. It will be released with full accompanying documentation and a video tutorial.

###Phase 2
During Phase 2, we will use Electron to create a desktop application version of the Phase 1 product. The desktop version for Windows, Linux, and Macintosh will enable additional features such as:

* Straightforward save/load of GeoJSON and TEI to the local disk;
* In-app conversion between formats, allowing us to support KML and RDF in addition to the other two formats;
* Automated building of a deployment package for any project with the click of a button.

Electron is based on node.js, so we will be able to take advantage of local file i/o, as well as using libxml for XSLT 1.0 transformations between TEI and other formats such as KML and RDF. We will move the web-page menu up to the application window level and add additional menu items for the extra features. The Electron-based application will be released with accompanying documentation and its own video tutorial. All user-interface strings will be abstracted for easy translation.

###Phase 3
During Phase 3, we will extend the capabilities of the Electron-based application to provide support for historical maps that cannot be, or have not been, georectified, and enable the creation of feature geometries specified in pixels rather than GIS coordinates. For simpler projects with relatively small images, we will make use of OpenLayers’s support for static images, but for larger images the application will provide automated creation of tilesets. We would like to be able to provide the tiling support using the vips library, but if this proves impractical, we could use a node.js image processing library like lwip, and write a tiling algorithm to generate the Zoomify tiles for consumption by OpenLayers.

This version of the Electron application will come with updated tutorials and documentation. Documentation will include: programmer/API documentation generated with jsdoc; user documentation authored in TEI and rendered into HTML; and tutorial screencasts.

##Licensing and deployment

All code and documentation will be hosted on GitHub and released under an MIT license. Software releases will be made through GitHub. Documentation will be released under Creative Commons Attribution 4.0 International.
