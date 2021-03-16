// create functions for marker size and color based on magnitude and depth
function markerSize(magnitude) {
  return magnitude * 4;
}

function colorScale(depth) {
  switch(true) {
    case depth > 90:
      return "#FF3300";
    case depth > 70:
      return "#FF6600";
    case depth > 50:
      return "#FF9900";
    case depth > 30:
      return "#FFCC00";
    case depth > 10:
      return "#CCFF00";
    default:
      return "#99FF00";
  }
}

// Store our API endpoint inside queryUrl
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
var tectonicUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";
// var tectonicUrl ="https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_orogens.json"
// var tectonicUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json"

// Perform a GET request to the query URL
d3.json(queryUrl, function(data) {
  // console.log(data.features)
  // Once we get a response, send the data.features object to the createFeatures function
  createFeatures(data.features);
});

function createFeatures(earthquakeData) {

  // Define a function that will be called once for each feature in the features array
  // Give each feature a popup describing the place and time of the earthquake
  function onEachFeature(feature, layer) {
    layer.bindPopup("<h3>Location: " + feature.properties.place +
      "</h3><hr><p>Date: " + new Date(feature.properties.time) + 
      "</p><p>Magnitude: " + feature.properties.mag + 
      "</p><p>Depth: " + feature.geometry.coordinates[2] + "</p>");
  }
  // Define a function of how GeoJSON points spawn Leaflet layers
  function pointToLayer(feature, latlng) {
    return L.circleMarker(latlng, {
      color: "black",
      stroke: true,
      weight: 0.5,
      radius: markerSize(feature.properties.mag),
      fillColor: colorScale(feature.geometry.coordinates[2]),
      fillOpacity: 1
    });
  }

  // Create a GeoJSON layer containing the features array on the earthquakeData object
  // Run the onEachFeature function once for each piece of data in the array
  // Run the pointToLayer function to alter the default simple markers to our style
  var earthquakes = L.geoJSON(earthquakeData, {
    onEachFeature: onEachFeature,
    pointToLayer: pointToLayer
  });

  // Sending our earthquakes layer to the createMap function
  createMap(earthquakes);
}

function createMap(earthquakes) {

  // Define tile layers
  var satelliteMap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.satellite",
    accessToken: API_KEY
  });

  var grayscaleMap = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
    tileSize: 512,
    maxZoom: 18,
    zoomOffset: -1,
    id: "mapbox/light-v10",
    accessToken: API_KEY
  });

  var outdoorsMap = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
    tileSize: 512,
    maxZoom: 18,
    zoomOffset: -1,
    id: "mapbox/outdoors-v11",
    accessToken: API_KEY
  });

  var tectonicplates = L.layerGroup();
  // Perform a GET request to the tectonic plate URL
  d3.json(tectonicUrl, function(data) {
    L.geoJSON(data, {
      color: "orange",
      weight: 2
    }).addTo(tectonicplates);
    tectonicplates.addTo(myMap);
  });

  // Define a baseMaps object to hold our base layer
  var baseMaps = {
    "Satellite": satelliteMap,
    "Grayscale": grayscaleMap,
    "Outdoors": outdoorsMap
  };

  // Create overlay object to hold our overlay layer
  var overlayMaps = {
    "Tectonic Plates": tectonicplates,
    "Earthquakes": earthquakes
  };

  // Create our map, giving it the satelliteMap, tectonicplates and earthquakes layers to display on load
  var myMap = L.map("map", {
    center: [40.7608, -111.8910],
    zoom: 3,
    layers: [satelliteMap, tectonicplates, earthquakes]
  });

  // Create a layer control
  // Pass in our baseMaps and overlayMaps
  // Add the layer control to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);

  // Add legend
  var legend = L.control({position: "bottomright"});
  legend.onAdd = function() {
    var div = L.DomUtil.create("div", "info legend"),
    depth = [-10, 10, 30, 50, 70, 90];
    
    div.innerHTML += "<h4 style='text-align: center'>Depth</h4>"

    for (var i = 0; i < depth.length; i++) {
      div.innerHTML += 
      '<i style="background:' + colorScale(depth[i] + 1) + '"></i> ' +
      depth[i] + (depth[i + 1] ? '&ndash;' + depth[i + 1] + '<br>' : '+');
    }
    return div;
    };
  legend.addTo(myMap);
}