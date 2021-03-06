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

// Perform a GET request to the query URL
d3.json(queryUrl, function(data) {
  console.log(data.features)
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

  // Define a lightmap layer
  var lightmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery ?? <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    tileSize:512,
    maxZoom: 18,
    zoomOffset: -1,
    id: "light-v10",
    accessToken: API_KEY
  });

  // Define a baseMaps object to hold our base layer
  var baseMaps = {
    "Map": lightmap,
  };

  // Create overlay object to hold our overlay layer
  var overlayMaps = {
    Earthquakes: earthquakes
  };

  // Create our map, giving it the lightmap and earthquakes layers to display on load
  var myMap = L.map("map", {
    center: [40.7608, -111.8910],
    zoom: 5,
    layers: [lightmap, earthquakes]
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