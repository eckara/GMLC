/* global dc,d3,crossfilter,colorbrewer */

// ### Create Chart Objects

// Create chart objects associated with the container elements identified by the css selector.
// Note: It is often a good idea to have these objects accessible at the global scope so that they can be modified or
// filtered by other page controls.
//var fluctuationChart = dc.barChart('#fluctuation-chart');

var filteredLineList=[]
var filteredList=[]

var normalIconSize = 20,
    bigIconSize = 30,
    megaIconSize = 60;
var normalIconDimens = [normalIconSize, normalIconSize],
    normalIconAnchor = [normalIconSize/2, normalIconSize/2],
    normalIconPopup  = [0, -normalIconSize/2 + 3];
var bigIconDimens = [bigIconSize, bigIconSize],
    bigIconAnchor = [bigIconSize/2, bigIconSize/2],
    bigIconPopup  = [0, -bigIconSize/2 + 3];
var megaIconDimens = [megaIconSize, megaIconSize],
    megaIconAnchor = [megaIconSize/2, megaIconSize/2],
    megaIconPopup  = [0, -megaIconSize/2 + 3];


var NormalGridIcon = L.Icon.extend({
    options: {
      iconUrl: '/static/MapApp/images/icons/meter.png',
      // shadowUrl: 'leaf-shadow.png',
      iconSize:     normalIconDimens, // size of the icon
      // shadowSize:   [50, 64], // size of the shadow
      iconAnchor:   normalIconAnchor, // point of the icon which will correspond to marker's location
      // shadowAnchor: [4, 62],  // the same for the shadow
      popupAnchor:  normalIconPopup // point from which the popup should open relative to the iconAnchor
    }
});
var BigGridIcon = L.Icon.extend({
    options: {
      iconUrl: '/static/MapApp/images/icons/switch.png',
      // shadowUrl: 'leaf-shadow.png',
      iconSize:     bigIconDimens, // size of the icon
      // shadowSize:   [50, 64], // size of the shadow
      iconAnchor:   bigIconAnchor, // point of the icon which will correspond to marker's location
      // shadowAnchor: [4, 62],  // the same for the shadow
      popupAnchor:  bigIconPopup // point from which the popup should open relative to the iconAnchor
    }
});
var MegaGridIcon = L.Icon.extend({
    options: {
      iconUrl: '/static/MapApp/images/icons/substation.png',
      // shadowUrl: 'leaf-shadow.png',
      iconSize:     megaIconDimens, // size of the icon
      // shadowSize:   [50, 64], // size of the shadow
      iconAnchor:   megaIconAnchor, // point of the icon which will correspond to marker's location
      // shadowAnchor: [4, 62],  // the same for the shadow
      popupAnchor:  megaIconPopup // point from which the popup should open relative to the iconAnchor
    }
});

var transmissionIcon = new NormalGridIcon({iconUrl: '/static/MapApp/images/icons/transformer.png'})
var selected = new NormalGridIcon({iconUrl: '/static/MapApp/images/icons/node_selected.png'})

var lineData
var nodeData

document.getElementById('ScenarioSelector').onchange = function(e) {
    scenario_name_ts=e.target.value
    localStorage.setItem("scenario_name_ts", e.target.value);
};

d3.csv('/static/MapApp/data/transmission/'+scenario_name_ts+'_lines.csv', function (data) {
  lineData=data

// d3.json("/static/MapApp/data/heatmap_data.json", function(error, datum) {
//   heatmapData=datum
d3.csv('/static/MapApp/data/transmission/'+scenario_name_ts+'.csv', function (data) {
    // Since its a csv file we need to format the data a bit.
    //var dateFormat = d3.time.format('%m/%d/%Y');
    // data.forEach(function (d) {
    //     //d.dd = dateFormat.parse(d.date);
    //     //d.month = d3.time.month(d.dd); // pre-calculate month for better performance
    //     d.value = +d.value; // coerce to number
    //     //d.open = +d.open;
    // });
    nodeData=data

  //See the [crossfilter API](https://github.com/square/crossfilter/wiki/API-Reference) for reference.
  // CREATE DIMENSIONS OF LINE DATA
  var ldx= crossfilter(lineData)
  var lineDayTypeDimension = ldx.dimension(function (d) {
      return d.daytype;
  });

  var lineDimension = ldx.dimension(function (d) {
      return d.line;
  });


  var lineMonthDimension = ldx.dimension(function (d) {
      return d.month;
  });

  var lineHourDimension = ldx.dimension(function (d) {
      return parseInt(d.hour_of_day);
  });

  // CREATE DIMENSIONS OF NODE DATA
  var ndx = crossfilter(nodeData);
  var all = ndx.groupAll();


  var daytypeDimension = ndx.dimension(function (d) {
      return d.daytype;
  });

  // Dimension by node
  var nodeDimension = ndx.dimension(function (d) {
      return d.node;
  });

  // Dimension by hour
  var hourDimension = ndx.dimension(function (d) {
      return parseInt(d.hour_of_day);
  });

  //Dimension by month
  var monthDimension = ndx.dimension(function (d) {
      return d.month;
  });

  // Generate Averages
  function reduceAddAvg(attr) {
      return function(p,v) {
          if (!isNaN(parseFloat(v[attr]))) {
              var dummy=parseFloat(v[attr])
              ++p.count
              p.sums += dummy;
              p.averages = (p.count === 0) ? 0 : p.sums/p.count; // gaurd against dividing by zero
          }
          return p;
      };
  }
  function reduceRemoveAvg(attr) {
      return function(p,v) {
          if (!isNaN(parseFloat(v[attr]))) {
             var dummy=parseFloat(v[attr])
              --p.count
              p.sums -= dummy;
              p.averages = (p.count === 0) ? 0 : p.sums/p.count;
          }
          return p;
      };
  }
  function reduceInitAvg() {
    return {count:0, sums:0, averages:0};
  }

  function mirror_dimension() {
    var dims = Array.prototype.slice.call(arguments, 0);
    function mirror(fname) {
        return function(v) {
            dims.forEach(function(dim) {
                dim[fname](v);
            });
        };
    }
    return {
        filter: mirror('filter'),
        filterExact: mirror('filterExact'),
        filterRange: mirror('filterRange'),
        filterFunction: mirror('filterFunction')
    };
  }

  var avgPowerFromGroup= lineHourDimension.group().reduce(reduceAddAvg('active_power_from'), reduceRemoveAvg('active_power_from'), reduceInitAvg);
  var avgPowerToGroup=lineHourDimension.group().reduce(reduceAddAvg('active_power_to'), reduceRemoveAvg('active_power_to'), reduceInitAvg);
  var avgReactiveFromGroup= lineHourDimension.group().reduce(reduceAddAvg('reactive_power_from'), reduceRemoveAvg('reactive_power_from'), reduceInitAvg);
  var avgReactiveToGroup=lineHourDimension.group().reduce(reduceAddAvg('reactive_power_to'), reduceRemoveAvg('active_power_to'), reduceInitAvg);

  var avgVoltageMagnitudeGroup = hourDimension.group().reduce(reduceAddAvg('voltage_magnitude'), reduceRemoveAvg('voltage_magnitude'), reduceInitAvg);
  var avgVoltageAngleGroup = hourDimension.group().reduce(reduceAddAvg('voltage_angle'), reduceRemoveAvg('voltage_angle'), reduceInitAvg);
  var avgActivePowerGroup = hourDimension.group().reduce(reduceAddAvg('active_power'), reduceRemoveAvg('active_power'), reduceInitAvg);
  var avgReactivePowerGroup = hourDimension.group().reduce(reduceAddAvg('reactive_power'), reduceRemoveAvg('reactive_power'), reduceInitAvg);


var voltageMagnitudeLine = dc.compositeChart('#voltage-magnitute-chart');
var voltageAngleLine = dc.compositeChart('#voltage-angle-chart');
var activePowerLine = dc.compositeChart('#active-power-chart');
var reactivePowerLine = dc.compositeChart('#reactive-power-chart');

var powerFlowLine = dc.compositeChart('#power-flow-chart');
var reactiveFlowLine = dc.compositeChart('#reactive-flow-chart');
var lineChart = dc.pieChart('#bar2');
var nodeChart = dc.pieChart('#bar2');


nodeChart /* dc.pieChart('#gain-loss-chart', 'chartGroup') */
// (_optional_) define chart width, `default = 200`
  //  .width(225)
// (optional) define chart height, `default = 200`
  //  .height(225)
// Define pie radius
    .innerRadius(70)
//      .externalRadius(110)
// Set dimension
    .dimension(nodeDimension)
// Set group
    .group(avgActivePowerGroup)

lineChart /* dc.pieChart('#gain-loss-chart', 'chartGroup') */
// (_optional_) define chart width, `default = 200`
  //  .width(225)
// (optional) define chart height, `default = 200`
  //  .height(225)
// Define pie radius
    .innerRadius(70)
//      .externalRadius(110)
// Set dimension
    .dimension(lineDimension)
// Set group
    .group(avgReactivePowerGroup)


voltageMagnitudeLine /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
      //.renderArea(true)
      //.width(600)
      //.height(225)
      .x(d3.scale.linear().domain([0, 23]))
      .mouseZoomable(false)

      .yAxisLabel("",30)
      .xAxisLabel("Hour of Day")
      .renderHorizontalGridLines(true)
      .brushOn(false)
      .title(function(d) { return  d.value.averages; })
      .compose([
          nonzero_min(dc.lineChart(voltageMagnitudeLine)
              .dimension(hourDimension)
              .colors('red')
              .dotRadius([10])
              .group(avgVoltageMagnitudeGroup, 'Voltage')
              .valueAccessor(function (d) {
                    return d.value.averages;
                })
              .dashStyle([2,2]))
              .defined(function(d) {
                    return d.y != null;
                }),
          ])
      .elasticY(true)
      .legend(dc.legend().x(100).horizontal(true).autoItemWidth(true))
      .on('renderlet', function(chart) {
          chart.selectAll('g.y text')
            .attr('transform', 'translate(-5,-7) rotate(315)')
      })
      .on('postRender', function(chart) {
       chart.svg().append('text').attr('class', 'y-label').attr('text-anchor', 'middle')
          .attr('x', -80).attr('y', 40).attr('dy', '-25').attr('transform', 'rotate(-90)')
          .text('p.u.');
       //different for x-axis label
    });
      voltageMagnitudeLine.yAxis().tickFormat(d3.format('.3f'))
      voltageMagnitudeLine.yAxis().ticks(3)
activePowerLine /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
          //.renderArea(true)
          //.width(600)
          //.height(225)
          .x(d3.scale.linear().domain([0, 23]))
          .mouseZoomable(false)

          .yAxisLabel("",30)
          .xAxisLabel("Hour of Day")
          .renderHorizontalGridLines(true)
          .brushOn(false)
          .title(function(d) { return  d.value.sums ; })

          .compose([
              nonzero_min(dc.lineChart(activePowerLine)
                  .dimension(hourDimension)
                  .colors('red')
                  .dotRadius([10])
                  .group(avgActivePowerGroup, 'Active Power')
                  .valueAccessor(function (d) {
                        return d.value.sums;
                    })
                  .dashStyle([2,2]))
                  .defined(function(d) {
                        return d.y != null;
                    }),
              ])
          .elasticY(true)
          .legend(dc.legend().x(100).horizontal(true).autoItemWidth(true))
          .on('renderlet', function(chart) {
              chart.selectAll('g.y text')
                .attr('transform', 'translate(-5,-7) rotate(315)')
          })
      .on('postRender', function(chart) {
       chart.svg().append('text').attr('class', 'y-label').attr('text-anchor', 'middle')
          .attr('x', -80).attr('y', 40).attr('dy', '-25').attr('transform', 'rotate(-90)')
          .text('Active Power, [GW]');
       //different for x-axis label
    });
          activePowerLine.yAxis().tickFormat(d3.format('.2f'))
          activePowerLine.yAxis().ticks(3)
       /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
          //.renderArea(true)
          //.width(600)
          //.height(225)
reactivePowerLine /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
                    //.renderArea(true)
                    //.width(600)
                    //.height(225)
                    .x(d3.scale.linear().domain([0, 23]))
                    .mouseZoomable(false)

                    .yAxisLabel("",30)
                    .xAxisLabel("Hour of Day")
                    .renderHorizontalGridLines(true)
                    .brushOn(false)
                    .title(function(d) { return  d.value.sums ; })

                    .compose([
                        nonzero_min(dc.lineChart(reactivePowerLine)
                            .dimension(hourDimension)
                            .colors('blue')
                            .dotRadius([10])
                            .group(avgReactivePowerGroup, 'Reactive Power')
                            .valueAccessor(function (d) {
                                  return d.value.sums;
                              })
                            .dashStyle([2,2]))
                            .defined(function(d) {
                                  return d.y != null;
                              }),
                        ])
                    .elasticY(true)
                    .legend(dc.legend().x(100).horizontal(true).autoItemWidth(true))
                    .on('renderlet', function(chart) {
                        chart.selectAll('g.y text')
                          .attr('transform', 'translate(-5,-7) rotate(315)')
                    })
                          .on('postRender', function(chart) {
       chart.svg().append('text').attr('class', 'y-label').attr('text-anchor', 'middle')
          .attr('x', -80).attr('y', 40).attr('dy', '-25').attr('transform', 'rotate(-90)')
          .text('Reac. Power, [GigaVARs]');
       //different for x-axis label
    });
	            reactivePowerLine.yAxis().tickFormat(d3.format('.2f'))
                    reactivePowerLine.yAxis().ticks(3)
                 /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
                    //.renderArea(true)
                    //.width(600)
                    //.height(225)
   voltageAngleLine /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
              //.renderArea(true)
              //.width(600)
              //.height(225)
              .x(d3.scale.linear().domain([0, 23]))
              .mouseZoomable(false)

              .yAxisLabel("",30)
              .xAxisLabel("Hour of Day")
              .renderHorizontalGridLines(true)
              .brushOn(false)
              .title(function(d) { return  d.value.averages ; })

              .compose([
                  nonzero_min(dc.lineChart(voltageAngleLine)
                      .dimension(hourDimension)
                      .colors('red')
                      .dotRadius([10])
                      .group(avgVoltageAngleGroup, 'Voltage Angle')
                      .valueAccessor(function (d) {
                            return d.value.averages;
                        })
                      .dashStyle([2,2]))
                      .defined(function(d) {
                            return d.y != null;
                        }),
                  ])
              .elasticY(true)
              .legend(dc.legend().x(100).horizontal(true).autoItemWidth(true))
              .on('renderlet', function(chart) {
                  chart.selectAll('g.y text')
                    .attr('transform', 'translate(-5,-7) rotate(315)')
              })
      .on('postRender', function(chart) {
       chart.svg().append('text').attr('class', 'y-label').attr('text-anchor', 'middle')
          .attr('x', -80).attr('y', 40).attr('dy', '-25').attr('transform', 'rotate(-90)')
          .text('Voltage Angle, [Degrees]');
       //different for x-axis label
    });
              voltageAngleLine.yAxis().tickFormat(d3.format('.3f'))
              voltageAngleLine.yAxis().ticks(3)
           /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
              //.renderArea(true)
              //.width(600)
              //.height(225)

   powerFlowLine
          .x(d3.scale.linear().domain([0, 23]))
          .mouseZoomable(false)

          .yAxisLabel("",30)
          .xAxisLabel("Hour of Day")
          .renderHorizontalGridLines(true)
          .brushOn(false)
          .title(function(d) { return  d.value.sums ; })

          .compose([
              nonzero_min(dc.lineChart(powerFlowLine)
                  .dimension(lineHourDimension)
                  .colors('red')
                  .dotRadius([10])
                  .group(avgReactiveFromGroup, 'Active Power From')
                  .valueAccessor(function (d) {
                        return d.value.sums;
                    })
                  .dashStyle([2,2]))
                  .defined(function(d) {
                        return d.y != null;
                    }),
              nonzero_min(dc.lineChart(powerFlowLine)
                  .dimension(lineHourDimension)
                  .colors('blue')
                  .dotRadius([10])
                  .group(avgReactiveToGroup, 'Active Power To')
                  .valueAccessor(function (d) {
                        return d.value.sums;
                    })
                  .dashStyle([5,5]))
                  .defined(function(d) {
                        return d.y != null;
                    })
              ])
          .elasticY(true)
          .legend(dc.legend().x(100).horizontal(true).autoItemWidth(true))
          .on('renderlet', function(chart) {
              chart.selectAll('g.y text')
                .attr('transform', 'translate(-5,-7) rotate(315)')
          })
      .on('postRender', function(chart) {
       chart.svg().append('text').attr('class', 'y-label').attr('text-anchor', 'middle')
          .attr('x', -80).attr('y', 40).attr('dy', '-25').attr('transform', 'rotate(-90)')
          .text('Active Power, [GW]');
       //different for x-axis label
    });
          powerFlowLine.yAxis().tickFormat(d3.format('.2f'))
          powerFlowLine.yAxis().ticks(3)

   reactiveFlowLine
              .x(d3.scale.linear().domain([0, 23]))
              .mouseZoomable(false)

              .yAxisLabel("",30)
              .xAxisLabel("Hour of Day")
              .renderHorizontalGridLines(true)
              .brushOn(false)
              .title(function(d) { return  d.value.sums ; })

              .compose([
                  nonzero_min(dc.lineChart(reactiveFlowLine)
                      .dimension(lineHourDimension)
                      .colors('red')
                      .dotRadius([10])
                      .group(avgReactiveFromGroup, 'Reactive Power From')
                      .valueAccessor(function (d) {
                            return d.value.sums;
                        })
                      .dashStyle([2,2]))
                      .defined(function(d) {
                            return d.y != null;
                        }),
                  nonzero_min(dc.lineChart(reactiveFlowLine)
                      .dimension(lineHourDimension)
                      .colors('blue')
                      .dotRadius([10])
                      .group(avgReactiveToGroup, 'Reactive Power To')
                      .valueAccessor(function (d) {
                            return d.value.sums;
                        })
                      .dashStyle([5,5]))
                      .defined(function(d) {
                            return d.y != null;
                        })
                  ])
              .elasticY(true)
              .legend(dc.legend().x(100).horizontal(true).autoItemWidth(true))
              .on('renderlet', function(chart) {
                  chart.selectAll('g.y text')
                    .attr('transform', 'translate(-5,-7) rotate(315)')
              })
      .on('postRender', function(chart) {
       chart.svg().append('text').attr('class', 'y-label').attr('text-anchor', 'middle')
          .attr('x', -80).attr('y', 40).attr('dy', '-25').attr('transform', 'rotate(-90)')
          .text('Reac. Power, [GigaVARs]');
       //different for x-axis label
    });
              reactiveFlowLine.yAxis().tickFormat(d3.format('.2f'))
              reactiveFlowLine.yAxis().ticks(3)

      // Add the base layer of the stack with group. The second parameter specifies a series name for use in the
      // legend.
      // The `.valueAccessor` will be used for the base layer

function nonzero_min(chart) {
  dc.override(chart, 'yAxisMin', function () {
       var min = d3.min(chart.data(), function (layer) {
           return d3.min(layer.values, function (p) {
               return p.y + p.y0;
           });
       });
       return dc.utils.subtract(min, chart.yAxisPadding());
  });
  return chart;
};
dc.renderAll()


console.log('here')
//##################### General Settings #####################
//---- Map Constants
var maps = [];
var center = [36.18781, -118.99631];
var zoom = 5.5;

//---- Data and API
var transmissionApiEndpoint = "/static/MapApp/data/transmission/endpoints/transmission.json",
    lineApiEndpoint = "/static/MapApp/data/transmission/endpoints/transmission_line.json"

var ignoreList = [];

//---- Styles
var myStyle = {
    "color": "#ff7800",
    "weight": 5,
    "opacity": 1
};

var geojsonMarkerOptions = {
    radius: 9,
    fillColor: "#ee5400",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

    //houseIcon = new NormalGridIcon({iconUrl: '/static/MapApp/images/icons/house.png'}),



//##################### Layers #####################
// Base Map Layers
var Mapbox_Theme = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYmVuZHJhZmZpbiIsImEiOiJjaXRtMmx1NGwwMGE5MnhsNG9kZGJ4bG9xIn0.trghQwlKFrdvueMDquqkJA', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.streets'
});

// Theme Layers
var baseLayers1 = {
    "Mapbox Theme": Mapbox_Theme,
};

// Overlay Layers as displayed on the layer chooser
var overlayLayers1 = {
    "Lines": L.layerGroup([]),
    "Transmission": L.layerGroup([]),

};

//##################### Maps #####################
var map1 = L.map('map1', {
    layers: [baseLayers1["Mapbox Theme"],
    overlayLayers1["Lines"],
    overlayLayers1["Transmission"],
    ],
    center: center,
    zoom: zoom
});
map1.attributionControl.setPrefix('');
maps.push({"map":map1, "base":baseLayers1, "overlay":overlayLayers1, "popup":L.popup()});

//---- Movement Related


//---- Coloring Related


//##################### Controls #####################

//---- Layers Related

L.Control.Watermark = L.Control.extend({
    onAdd: function(map) {
        var img = L.DomUtil.create('img');
        img.src = '/static/MapApp/images/slac-logo-primary.png';
        img.style.width = '200px';
        return img;
    },

    onRemove: function(map) {
        // Nothing to do here
    }
});

L.control.watermark = function(opts) {
    return new L.Control.Watermark(opts);
}
// Add to first map only
L.control.watermark({ position: 'bottomleft' }).addTo(map1);


console.log("Controls Finished");

//##################### Adding to Maps #####################

// Helper function for adding normal layers
function populateLayer(endpoint, layerGroup, iconPath, element_type, priority=0) {
  $.getJSON( endpoint, function(elements, error) {
    console.log("working on"+element_type)
    elements.forEach(function(element) {
      // We want to ignore a few elements
      if (ignoreList.indexOf(element['name'])> -1) {
        console.log("FOUND Element to Ignore" + element['name'])
        return;
      }
      if (('latitude' in element) && ('longitude' in element)) {
        latlong = [parseFloat(element['latitude']), parseFloat(element['longitude'])];
        marker = L.marker(latlong, {
          icon: iconPath,
          name: element['name'],
          alt:JSON.stringify({"type":element_type,"name":element['name']})
        })
        marker.bindPopup( element['name']);
        marker.on('click', function(e) {
          if (filteredList.includes(e.target.options.name)){
            filteredList.pop(e.target.options.name)
            console.log(filteredList)
            if (filteredList.length<1){
            nodeChart.filterAll()}
            else {
            console.log("Filtering"+ filteredList)
            nodeChart.filter([filteredList])}
            dc.redrawAll()
            e.target.setIcon(transmissionIcon);
          }
          else {
            filteredList.push(e.target.options.name)
            console.log(filteredList)
            nodeChart.filter([filteredList])
            dc.redrawAll()
            e.target.setIcon(selected);
          }
        // document.getElementById('map_reset').style.display = "";
        console.log('filtered '+ e.target.options.name)})//.bindPopup(element['name']); //.bindTooltip(element['name']);
        if (priority == 1) {
          marker.setZIndexOffset(700);
        }
        if (priority > 1) {
          marker.setZIndexOffset(800);
        }
        layerGroup.addLayer(marker);
      } else {
      }
    });
  });
}

function onEachFeature(feature, layer) {
    // We want to ignore a few elements
    if (ignoreList.indexOf(feature.properties.name)> -1) {
      console.log("FOUND Element to Ignore" + feature.properties.name)
      return;
    }

    layer.bindPopup(feature.properties.name);
    layer.on('click', function(e) {
      if (filteredLineList.includes(e.target.feature.properties.name)){
        filteredLineList.pop(e.target.feature.properties.name)
        console.log(filteredLineList)
        if (filteredLineList.length<1){
        lineChart.filterAll()}
        else {
        console.log("Filtering"+ filteredList)
        lineChart.filter([filteredLineList])
        }
        e.target.setStyle({color: 'red'});
        dc.redrawAll()
      }
      else {
        filteredLineList.push(e.target.feature.properties.name)
        console.log(filteredLineList)
        lineChart.filter(filteredLineList)
        e.target.setStyle({color: 'blue'});
        dc.redrawAll()
        console.log(lineDimension)
      }
      });

    }

function populateLayerLines(endpoint, priority=0) {
    $.getJSON( endpoint, function(geo_json_data) {
    lines=L.geoJson(geo_json_data,
          { color: 'red',
            weight: 10,
            opacity: 0.5,
          filter: function(feature, layer) {return feature.geometry.type == "LineString";},
          onEachFeature: onEachFeature,
           // onEachFeature:

        });
      lines.addTo(map1);
    });
  }



maps.forEach(function(map_obj){
    populateLayer(transmissionApiEndpoint, (map_obj.overlay["Transmission"]), transmissionIcon, "transmission");
    populateLayerLines(lineApiEndpoint, priority=0);
});

maps.forEach(function(map_obj){
  layerControl = L.control.layers(map_obj.base, map_obj.overlay).addTo(map_obj.map);
});
console.log("here")
});
});
//# dc.js Getting Started and How-To Guide

/* jshint globalstrict: true */
