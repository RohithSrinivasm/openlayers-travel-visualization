import './style.css';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import OSM from 'ol/source/OSM.js';
import Point from 'ol/geom/Point.js';
import LineString from 'ol/geom/LineString.js';
import Feature from 'ol/Feature.js';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js';
import { unByKey } from 'ol/Observable.js';
import { fromLonLat } from 'ol/proj';

// Coordinates in longitude and latitude
const coordChennai = fromLonLat([80.2707, 13.0827]);          // Point A
const coordBangalore = fromLonLat([77.5946, 12.9716]);        // Point B
const coordKerala = fromLonLat([76.9366, 8.5241]);            // Point C (Thiruvananthapuram)
const coordPune = fromLonLat([73.8567, 18.5204]);             // Point D
const coordLondon = fromLonLat([-0.1278, 51.5074]);           // Point E

// Base layer with OpenStreetMap
const baseLayer = new TileLayer({
  source: new OSM(), // OpenStreetMap as the base layer
});

// Creating a new feature for the vector layer (Point at Chennai)
const pointFeature = new Feature({
  geometry: new Point(coordChennai), // Point geometry with coordinates at Chennai
});

// Creating a source for the vector layer
const vectorSource = new VectorSource({
  features: [pointFeature], // Adding the point feature to the source
});

// Creating a vector layer
const layer1 = new VectorLayer({
  source: vectorSource,
  style: new Style({
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({ color: 'red' }), // Red fill for the point
      stroke: new Stroke({
        color: 'black',
        width: 2,
      }),
    }),
  }),
});

// Function to create an arc between two points
function createArc(start, end, numPoints) {
  const coords = [];
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const controlPoint = [
    start[0] + dx / 2,
    start[1] + dy / 2 + 500000, // Adjusted the height of the arc for less curvature
  ];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const x =
      (1 - t) * (1 - t) * start[0] +
      2 * (1 - t) * t * controlPoint[0] +
      t * t * end[0];
    const y =
      (1 - t) * (1 - t) * start[1] +
      2 * (1 - t) * t * controlPoint[1] +
      t * t * end[1];
    coords.push([x, y]);
  }
  return coords;
}

// Creating arcs from Chennai to other cities
const arcCoordsAB = createArc(coordChennai, coordBangalore, 100);
const arcAB = new LineString(arcCoordsAB);

const arcCoordsAC = createArc(coordChennai, coordKerala, 100);
const arcAC = new LineString(arcCoordsAC);

const arcCoordsAD = createArc(coordChennai, coordPune, 100);
const arcAD = new LineString(arcCoordsAD);

const arcCoordsAE = createArc(coordChennai, coordLondon, 100);
const arcAE = new LineString(arcCoordsAE);

// Create trail features to represent the paths
const trailFeatureAB = new Feature({
  geometry: new LineString([]), // Starts empty
});

const trailFeatureAC = new Feature({
  geometry: new LineString([]), // Starts empty
});

const trailFeatureAD = new Feature({
  geometry: new LineString([]), // Starts empty
});

const trailFeatureAE = new Feature({
  geometry: new LineString([]), // Starts empty
});

// Creating a vector source for layer2 and adding trail features
const vectorSource2 = new VectorSource({
  features: [trailFeatureAB, trailFeatureAC, trailFeatureAD, trailFeatureAE],
});

// Updating layer2 to include trail features
const layer2 = new VectorLayer({
  source: vectorSource2,
  style: function (feature) {
    // Style for the trails (LineStrings)
    if (feature.getGeometry() instanceof LineString) {
      return new Style({
        stroke: new Stroke({
          color: 'red',
          width: 2,
        }),
      });
    }
  },
});

// Add layer2 to the map (layer2 is initially invisible)
layer2.setVisible(false);

// Animation function to draw the trail along the arc
function animateTrail(feature, line, duration, startTime) {
  function drawTrail(event) {
    const frameState = event.frameState;
    if (!startTime) {
      startTime = frameState.time;
    }

    const elapsedTime = frameState.time - startTime;
    const fraction = elapsedTime / duration;

    if (fraction >= 1) {
      // Stop the animation once complete
      feature.getGeometry().setCoordinates(line.getCoordinates());
      feature.changed();
      unByKey(listenerKey);
    } else {
      // Update the trail
      const lineCoords = line.getCoordinates();
      const currentIndex = Math.floor(fraction * (lineCoords.length - 1));
      const trailCoords = lineCoords.slice(0, currentIndex + 1);
      feature.getGeometry().setCoordinates(trailCoords);
      feature.changed();
    }
  }

  const listenerKey = map.on('postrender', drawTrail);
}

// Map view with base layer and vector layer
const map = new Map({
  target: 'map', // Reference to the HTML element with id 'map'
  layers: [
    baseLayer, // The OSM base layer
    layer1, // The point at Chennai
    layer2,
  ],
  view: new View({
    center: coordChennai, // Centered at Chennai
    zoom: 5, // Initial zoom level to start with Chennai
  }),
});

// Function to calculate the extent of all features
function calculateExtent() {
  const features = vectorSource2.getFeatures();
  const extent = features[0].getGeometry().getExtent().slice();
  for (let i = 1; i < features.length; i++) {
    const geomExtent = features[i].getGeometry().getExtent();
    extent[0] = Math.min(extent[0], geomExtent[0]);
    extent[1] = Math.min(extent[1], geomExtent[1]);
    extent[2] = Math.max(extent[2], geomExtent[2]);
    extent[3] = Math.max(extent[3], geomExtent[3]);
  }
  return extent;
}

// JavaScript to handle the radio button functionality
document.getElementById('santander').addEventListener('change', function () {
  if (this.checked) {
    layer1.setVisible(true);
    layer2.setVisible(false);
    // Reset view to Chennai
    map.getView().animate({
      center: coordChennai,
      zoom: 5,
      duration: 1000,
    });
  }
});

document.getElementById('visitedPlaces').addEventListener('change', function () {
  if (this.checked) {
    layer1.setVisible(false);
    layer2.setVisible(true);

    // Reset the trail features
    trailFeatureAB.getGeometry().setCoordinates([]);
    trailFeatureAC.getGeometry().setCoordinates([]);
    trailFeatureAD.getGeometry().setCoordinates([]);
    trailFeatureAE.getGeometry().setCoordinates([]);
    trailFeatureAB.changed();
    trailFeatureAC.changed();
    trailFeatureAD.changed();
    trailFeatureAE.changed();

    const duration = 5000; // Duration of the animation
    const startTime = Date.now();

    // Start animations for all trails simultaneously
    animateTrail(trailFeatureAB, arcAB, duration, startTime);
    animateTrail(trailFeatureAC, arcAC, duration, startTime);
    animateTrail(trailFeatureAD, arcAD, duration, startTime);
    animateTrail(trailFeatureAE, arcAE, duration, startTime);

    // Zoom out the map to fit all features
    const extent = calculateExtent();
    map.getView().fit(extent, {
      duration: duration,
      padding: [50, 50, 50, 50],
    });
  }
});
