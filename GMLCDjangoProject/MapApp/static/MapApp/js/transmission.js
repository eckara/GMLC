/* global dc,d3,crossfilter,colorbrewer */

// ### Create Chart Objects

// Create chart objects associated with the container elements identified by the css selector.
// Note: It is often a good idea to have these objects accessible at the global scope so that they can be modified or
// filtered by other page controls.
var typeValuePie = dc.pieChart('#type-value-chart');
//var fluctuationChart = dc.barChart('#fluctuation-chart');
var monthValuePie = dc.pieChart('#month-value-chart');
//var dayOfWeekChart = dc.rowChart('#day-of-week-chart');

var hourlyUtilityPurchaseLine = dc.lineChart("#hourly-utility-chart");

var voltageMagnitudeLine = dc.compositeChart('#voltage-magnitute-chart');
//var powerInLine = dc.lineChart('#power-in-chart');
//var powerOutLine = dc.lineChart('#power-out-chart');
var daytypeDimension=[]

var nodeChart = dc.pieChart('#bar');
//var yearlyBubbleChart = dc.bubbleChart('#yearly-bubble-chart');
//var nasdaqCount = dc.dataCount('.dc-data-count');
//var nasdaqTable = dc.dataTable('.dc-data-table');

// ### Anchor Div for Charts
/*
// A div anchor that can be identified by id
    <div id='your-chart'></div>
// Title or anything you want to add above the chart
    <div id='chart'><span>Days by Gain or Loss</span></div>
// ##### .turnOnControls()

// If a link with css class `reset` is present then the chart
// will automatically hide/show it based on whether there is a filter
// set on the chart (e.g. slice selection for pie chart and brush
// selection for bar chart). Enable this with `chart.turnOnControls(true)`

// dc.js >=2.1 uses `visibility: hidden` to hide/show controls without
// disrupting the layout. To return the old `display: none` behavior,
// set `chart.controlsUseVisibility(false)` and use that style instead.
    <div id='chart'>
       <a class='reset'
          href='javascript:myChart.filterAll();dc.redrawAll();'
          style='visibility: hidden;'>reset</a>
    </div>
// dc.js will also automatically inject the current filter value into
// any html element with its css class set to `filter`
    <div id='chart'>
        <span class='reset' style='visibility: hidden;'>
          Current filter: <span class='filter'></span>
        </span>
    </div>
*/

//### Load your data

//Data can be loaded through regular means with your
//favorite javascript library
//
//```javascript
//d3.csv('data.csv', function(data) {...});
//d3.json('data.json', function(data) {...});
//jQuery.getJson('data.json', function(data){...});
//```


function select(category) {
    render(data, category);

}


var heatmapData
d3.json("/static/MapApp/data/heatmap_data.json", function(error, datum) {
  heatmapData=datum
d3.csv('/static/MapApp/data/scenario1.csv', function (data) {
    // Since its a csv file we need to format the data a bit.
    //var dateFormat = d3.time.format('%m/%d/%Y');
    var numberFormat = d3.format('.2f');

    data.forEach(function (d) {
        //d.dd = dateFormat.parse(d.date);
        //d.month = d3.time.month(d.dd); // pre-calculate month for better performance
        d.value = +d.value; // coerce to number
        //d.open = +d.open;
    });

    function snap_to_zero(source_group) {
        return {
            all:function () {
                return source_group.all().map(function(d) {
                    return {key: d.key,
                            value: (Math.abs(d.value)<1e-6) ? 0 : d.value};
                });
            }
        };
    }
    //### Create Crossfilter Dimensions and Groups
    //### LIST OF FIELDS IN CSV FILE FROM DERCAM
    // week_hourly_pv_self_consumpt,
    // peak_hourly_pv_self_consumpt,
    // weekend_hourly_pv_self_consumpt,
    // week_elec_stored_stationnary_batteries,
    // peak_elec_stored_stationnary_batteries,
    // weekend_elec_stored_stationnary_batteries,
    // week_purchase_from_utility,
    // peak_purchase_from_utility,
    // weekend_purchase_from_utility,
    // week_elec_provided_by_stationnary_battery_charging_after_eff,
    // peak_elec_provided_by_stationnary_battery_charging_after_eff,
    // weekend_elec_provided_by_stationnary_battery_charging_after_eff


    //See the [crossfilter API](https://github.com/square/crossfilter/wiki/API-Reference) for reference.
    var ndx = crossfilter(data);
    var all = ndx.groupAll();

    // Dimension by type
    var typeDimension = ndx.dimension(function (d) {
        return d.type;
    });

    daytypeDimension = ndx.dimension(function (d) {
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

    // Group by total peak purchase from utility
    var monthlyPeakPurchaseValueGroup = monthDimension.group().reduceSum(function (d) {
        return d.purchase_from_utility;
    });

    var typeGenerationGroup = typeDimension.group().reduceSum(function (d) {
        return d.hourly_pv_self_consumpt;
    });
    // Group by total volume within move, and scale down result
    // var volumeByMonthGroup = moveMonths.group().reduceSum(function (d) {
    //     return d.volume / 500000;
    // });


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

    var avgvoltageAValueGroup = hourDimension.group().reduce(reduceAddAvg('voltage_a_magnitude'), reduceRemoveAvg('voltage_a_magnitude'), reduceInitAvg);
    var avgvoltageBValueGroup = hourDimension.group().reduce(reduceAddAvg('voltage_b_magnitude'), reduceRemoveAvg('voltage_b_magnitude'), reduceInitAvg);
    var avgvoltageCValueGroup = hourDimension.group().reduce(reduceAddAvg('voltage_c_magnitude'), reduceRemoveAvg('voltage_c_magnitude'), reduceInitAvg);



    var avgUtilityByHourGroup = hourDimension.group().reduce(reduceAddAvg('purchase_from_utility'), reduceRemoveAvg('purchase_from_utility'), reduceInitAvg);

    var avgSolarByHourGroup = hourDimension.group().reduce(reduceAddAvg('hourly_pv_self_consumpt'), reduceRemoveAvg('hourly_pv_self_consumpt'), reduceInitAvg);

    monthValuePie /* dc.pieChart('#gain-loss-chart', 'chartGroup') */
    // (_optional_) define chart width, `default = 200`
        //.width(350)
    // (optional) define chart height, `default = 200`
        //.height(225)
        //.cx(100)
    // Define pie radius\
      //  .radius(100)
    // Set dimension
        .dimension(monthDimension)
    // Set group
        .group(monthlyPeakPurchaseValueGroup)
        .legend(dc.legend())
        .on('pretransition', function(chart) {
          monthValuePie.selectAll('text.pie-slice').text(function(d) {
              return d.data.key.substring(0, 3)+".";
          })
        })


      typeValuePie /* dc.pieChart('#gain-loss-chart', 'chartGroup') */
      // (_optional_) define chart width, `default = 200`
          //.width(225)
      // (optional) define chart height, `default = 200`
          //.height(225)
      // Define pie radius
          //.innerRadius(70)
  //      .externalRadius(110)
      // Set dimension
          .dimension(typeDimension)
      // Set group
          .group(typeGenerationGroup)
          .legend(dc.legend())
          .on('pretransition', function(chart) {
            typeValuePie.selectAll('text.pie-slice').text(function(d) {
                return d.data.key.substring(0, 3)+".";
            })
          })
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
          .group(typeGenerationGroup)

    voltageMagnitudeLine /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
        //.renderArea(true)
        //.width(600)
        //.height(225)
        .x(d3.scale.linear().domain([0, 23]))
        .mouseZoomable(true)
        .yAxisLabel("Kilovolts, [kV]",30)
        .xAxisLabel("Hour of Day")
        .renderHorizontalGridLines(true)
        .brushOn(false)
        .compose([
            nonzero_min(dc.lineChart(voltageMagnitudeLine)
                .dimension(hourDimension)
                .colors('red')
                .dotRadius([10])
                .group(avgvoltageAValueGroup, 'Voltage A')
                .valueAccessor(function (d) {
                      return d.value.averages/1000;
                  })
                .dashStyle([2,2]))
                .defined(function(d) {
                      return d.y != null;
                  }),
            nonzero_min(dc.lineChart(voltageMagnitudeLine)
                .dimension(hourDimension)
                .colors('blue')
                .dotRadius([10])
                .group(avgvoltageBValueGroup, 'Voltage B')
                .valueAccessor(function (d) {
                      return d.value.averages/1000;
                  })
                .dashStyle([5,5]))
                .defined(function(d) {
                      return d.y != null;
                  }),
          nonzero_min(dc.lineChart(voltageMagnitudeLine)
                .dimension(hourDimension)
                .colors('green')
                .dotRadius([10])
                .group(avgvoltageCValueGroup, 'Voltage C')
                .valueAccessor(function (d) {
                      return d.value.averages/1000;
                  })
                .dashStyle([1,1]))
                .defined(function(d) {
                      return d.y != null;
                  })
            ])
        .elasticY(true)
        .legend(dc.legend().x(100).horizontal(true).autoItemWidth(true))
        .on('renderlet', function(chart) {
            chart.selectAll('circle.dot')
                .on('mouseover.foo', function(d) {
                    handleChange (d.data.key);
                    heatmapLayer.setData(heatmapData['voltage_A'][d.data.key]);
                    heatmapLayerB.setData(heatmapData['voltage_B'][d.data.key]);
                    heatmapLayerC.setData(heatmapData['voltage_C'][d.data.key]);
                })
                .on('mouseout.foo', function(d) {
                    //console.log('out')
                });
        });
        voltageMagnitudeLine.yAxis().tickFormat(d3.format('.2f'))
        voltageMagnitudeLine.yAxis().ticks(3)

        // Add the base layer of the stack with group. The second parameter specifies a series name for use in the
        // legend.
        // The `.valueAccessor` will be used for the base layer

        hourlyUtilityPurchaseLine /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
            .renderArea(true)
          //  .width(600)
          //  .height(225)
            .yAxisLabel("Energy,[Wh]",20)
            .xAxisLabel("Hour of Day")
            .transitionDuration(1000)
          //  .margins({top: 30, right: 50, bottom: 25, left: 40})
            .dimension(hourDimension)
            .mouseZoomable(true)
        // Specify a "range chart" to link its brush extent with the zoom of the current "focus chart".
            //.rangeChart(volumeChart)
            .elasticY(true)
            .dashStyle([3,1,1,1])
            .dotRadius([10])
            .x(d3.scale.linear().domain([0, 24]))
            .renderHorizontalGridLines(true)
        //##### Legend
            // Position the legend relative to the chart origin and specify items' height and separation.
            .legend(dc.legend().horizontal(true).autoItemWidth(true))
            .brushOn(false)
            // Add the base layer of the stack with group. The second parameter specifies a series name for use in the
            // legend.
            // The `.valueAccessor` will be used for the base layer
            .group(avgUtilityByHourGroup, 'Avg. Utility Purchase')
            .valueAccessor(function (d) {
                  return d.value.averages/1000;
              })
            // Stack additional layers with `.stack`. The first paramenter is a new group.
            // The second parameter is the series name. The third is a value accessor.
            .stack(avgSolarByHourGroup, 'Avg. Solar Generation')
            .valueAccessor(function (d) {
                  return d.value.averages/1000;
              })
            // Title can be called by any stack layer.
            // .title(function (d) {
            //     var value = d.value.avg ? d.value.avg : d.value;
            //     if (isNaN(value)) {
            //         value = 0;
            //     }
            //     return d.key + '\n' + numberFormat(value);
            // });
            .on('renderlet', function(chart) {
                chart.selectAll('circle.dot')
                    .on('mouseover.foo', function(d) {
                        handleChange (d.data.key);
                        heatmapLayer.setData(heatmapData['voltage_A'][d.data.key]);
                        heatmapLayerB.setData(heatmapData['voltage_B'][d.data.key]);
                        heatmapLayerC.setData(heatmapData['voltage_C'][d.data.key]);
                    })
                    .on('mouseout.foo', function(d) {
                        //console.log('out')
                    });
            });
      hourlyUtilityPurchaseLine.yAxis().tickFormat(d3.format('.1f'))
      hourlyUtilityPurchaseLine.yAxis().ticks(3)

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



    dc.renderAll();



//##################### General Settings #####################
simulationName="ieee123"
//---- Map Constants
var maps = [];
var center = [35.38781, -118.99631];
var zoom = 15.5;
console.log(zoom)
//---- Data and API
var transmissionApiEndpoint = "/static/MapApp/data/cache/transmission.json",
    lineApiEndpoint = "/static/MapApp/data/transmission_line.json";

console.log(lineApiEndpoint)
var sensor_list = [];

var ignoreList = ["sw61to6101", "node_6101", "line60to61", "node_610", "node_61"];

//
// var meterApiEndpoint = "/api/"+simulationName+"/meter/\*",
//     switchApiEndpoint = "/api/"+simulationName+"/switch/\*",
//     loadApiEndpoint = "/api/"+simulationName+"/load/\*",
//     nodeApiEndpoint = "/api/"+simulationName+"/node/\*",
//     feederApiEndpoint = "/api/"+simulationName+"/feeder/\*";

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


var transmissionIcon = new NormalGridIcon({iconUrl: '/static/MapApp/images/icons/transformer.png'}),
    nodeIcon = new NormalGridIcon({iconUrl: '/static/MapApp/images/icons/node.png'})
    //houseIcon = new NormalGridIcon({iconUrl: '/static/MapApp/images/icons/house.png'}),

console.log("General Settings Finished");


//##################### Layers #####################

// Base Map Layers

var Mapbox_Theme = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYmVuZHJhZmZpbiIsImEiOiJjaXRtMmx1NGwwMGE5MnhsNG9kZGJ4bG9xIn0.trghQwlKFrdvueMDquqkJA', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.streets'
});

// var Mapbox_Theme2 =
// L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYmVuZHJhZmZpbiIsImEiOiJjaXRtMmx1NGwwMGE5MnhsNG9kZGJ4bG9xIn0.trghQwlKFrdvueMDquqkJA', {
//     maxZoom: 18,
//     attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
//         '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
//         'Imagery © <a href="http://mapbox.com">Mapbox</a>',
//     id: 'mapbox.streets'
// });


// var Thunderforest_TransportDark = L.tileLayer('http://{s}.tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png?apikey={apikey}', {
// 	attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
// 	maxZoom: 19,
// 	apikey: '7eaba955146e49abba3989008a4d373d'
// });
//
// var Thunderforest_Landscape = L.tileLayer('http://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey={apikey}', {
// 	attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
// 	apikey: '7eaba955146e49abba3989008a4d373d'
// });

var Esri_WorldStreetMap = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
});

// var Esri_WorldStreetMap2 =
// L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
// 	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
// });



var OpenMapSurfer_Grayscale = L.tileLayer('http://korona.geog.uni-heidelberg.de/tiles/roadsg/x={x}&y={y}&z={z}', {
	maxZoom: 19,
	attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

// var OpenMapSurfer_Grayscale2 =
// L.tileLayer('http://korona.geog.uni-heidelberg.de/tiles/roadsg/x={x}&y={y}&z={z}', {
// 	maxZoom: 19,
// 	attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
// });


// Theme Layers
var baseLayers1 = {
    "Mapbox Theme": Mapbox_Theme,
    "Esri Theme": Esri_WorldStreetMap,
    // "Thunderforest": Thunderforest_Landscape,
    // "Thunderforest 2": Thunderforest_TransportDark,
    "OpenMap Theme": OpenMapSurfer_Grayscale
};

// Theme Layers
// var baseLayers2 = {
//     "Mapbox Theme": Mapbox_Theme2,
//     "Esri Theme": Esri_WorldStreetMap2,
//     // "Thunderforest": Thunderforest_Landscape2,
//     // "Thunderforest 2": Thunderforest_TransportDark2,
//     "OpenMap Theme": OpenMapSurfer_Grayscale2
// };


// don't forget to include leaflet-heatmap.js
// var testData = {
//   max: 2530,
//   min: 2170,
//   data: [{'count': 2547.6768648023244, 'lat': 35.390833, 'lng': -118.99405},
//  {'count': 2425.7196872590207, 'lat': 35.391183, 'lng': -118.997667},
//  {'count': 2545.3288203312754, 'lat': 35.391583, 'lng': -118.99405},
//  {'count': 2542.9996342343425, 'lat': 35.392483, 'lng': -118.99405},
//  {'count': 281.53278962005476, 'lat': 35.385267, 'lng': -118.992867},
//  {'count': 2550.1391748694818, 'lat': 35.390833, 'lng': -118.9864},
//  {'count': 2423.3610349266987, 'lat': 35.388233, 'lng': -118.99825},
//  {'count': 2425.2640532546143, 'lat': 35.3898, 'lng': -119.001617},
//  {'count': 2426.7799311589833, 'lat': 35.3898, 'lng': -118.999517},
//  {'count': 2418.2691524396118, 'lat': 35.389467, 'lng': -118.99825},
//  {'count': 2428.5813468115498, 'lat': 35.38905, 'lng': -118.999517},
//  {'count': 2429.8658433685182, 'lat': 35.388367, 'lng': -118.999517},
//  {'count': 2429.7617297126071, 'lat': 35.385267, 'lng': -118.992867},
//  {'count': 2550.597580921185, 'lat': 35.39015, 'lng': -118.992867},
//  {'count': 2429.7617297126071, 'lat': 35.39015, 'lng': -118.992867},
//  {'count': 2567.6835919024365, 'lat': 35.385967, 'lng': -118.992133},
//  {'count': 2431.5271904144934, 'lat': 35.38755, 'lng': -118.999517},
//  {'count': 2551.3526997583067, 'lat': 35.38228, 'lng': -118.9953},
//  {'count': 2415.8208637198245, 'lat': 35.39015, 'lng': -118.99405},
//  {'count': 2531.6425021177461, 'lat': 35.392483, 'lng': -118.991517},
//  {'count': 2542.9996342343425, 'lat': 35.39015, 'lng': -118.99405},
//  {'count': 2462.4223603988025, 'lat': 35.385283, 'lng': -119.000517},
//  {'count': 2487.2183450415123, 'lat': 35.3846, 'lng': -119.0022},
//  {'count': 2434.6621199922179, 'lat': 35.38625, 'lng': -118.997067},
//  {'count': 2556.4467829555929, 'lat': 35.388467, 'lng': -118.99125},
//  {'count': 2437.2499843112114, 'lat': 35.385283, 'lng': -118.997067},
//  {'count': 2549.1179849108594, 'lat': 35.390833, 'lng': -118.992867},
//  {'count': 2552.2313658295166, 'lat': 35.3894, 'lng': -118.992867},
//  {'count': 2426.1002216635652, 'lat': 35.3898, 'lng': -119.000683},
//  {'count': 2431.5271904144934, 'lat': 35.38755, 'lng': -118.999517},
//  {'count': 2449.7996088555897, 'lat': 35.385283, 'lng': -118.999517},
//  {'count': 2449.7996088555897, 'lat': 35.3846, 'lng': -118.999517},
//  {'count': 2440.0455924758476, 'lat': 35.387067, 'lng': -119.000517},
//  {'count': 2449.7996088555897, 'lat': 35.385283, 'lng': -118.999517},
//  {'count': 2423.7954772042958, 'lat': 35.385767, 'lng': -118.99825},
//  {'count': 2549.1179849108594, 'lat': 35.390833, 'lng': -118.992867},
//  {'count': 2550.6650249101704, 'lat': 35.38228, 'lng': -118.996817},
//  {'count': 2506.8499999999999, 'lat': 35.386067, 'lng': -119.00315},
//  {'count': 2551.1038865105038, 'lat': 35.38228, 'lng': -118.996067},
//  {'count': 2401.7800000000002, 'lat': 35.386067, 'lng': -119.00315}]
// };

// Overlay Layers as displayed on the layer chooser
var overlayLayers1 = {
    //"Meters": L.layerGroup([]),
    //"Switches": L.layerGroup([]),
    "Nodes": L.layerGroup([]),
    // "Houses": L.layerGroup([]),
    "Lines": L.layerGroup([]),
    "Transmission": L.layerGroup([]),
    //"Line Sensors": L.layerGroup([]),
};

console.log(overlayLayers1)
// var overlayLayers2 = {
//     "Meters": L.layerGroup([]),
//     "Switches": L.layerGroup([]),
//     "Nodes": L.layerGroup([]),
//     "Loads": L.layerGroup([]),
//     // "Houses": L.layerGroup([]),
//     "Lines": L.layerGroup([]),
//     "Line Sensors": L.layerGroup([])
// };





console.log("Layers Finished");

//##################### Maps #####################


var map1 = L.map('map1', {
    layers: [baseLayers1["Mapbox Theme"],
    //overlayLayers1["Meters"],
    overlayLayers1["Nodes"],
    overlayLayers1["Transmission"],
    //overlayLayers1["Switches"],
    //overlayLayers1["Line Sensors"],
    overlayLayers1["Lines"],
    // overlayLayers1["Voltage B"],
    // overlayLayers1["Voltage C"]
    // overlayLayers1["Regions"]
    ],
    center: center,
    zoom: zoom
});
map1.attributionControl.setPrefix('');
// var map2 = L.map('map2', {
//     layers: [baseLayers2["Mapbox Theme"], overlayLayers2["Meters"], overlayLayers2["Nodes"], overlayLayers2["Loads"], overlayLayers2["Switches"], overlayLayers2["Line Sensors"], overlayLayers2["Lines"]],
//     center: center,
//     zoom: zoom,
//     zoomControl: false
// });


// Add each map to the map array. This will be useful for scalable calling later
maps.push({"map":map1, "base":baseLayers1, "overlay":overlayLayers1, "popup":L.popup()});
// maps.push({"map":map2, "base":baseLayers2, "overlay":overlayLayers2, "popup":L.popup()});
// maps.push(map3);


console.log("Maps Finished");

//##################### Handlers #####################


//---- Pop Up Related



var popup = L.popup();

function onMapClick(e, map_obj) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map1);
}

// Temp is a debugging object that you can use to interrogate the popup object
var temp;

// This is the handler that gets called whenever an element is clicked on
// function pop_up(e) {
//   if(!e) {
//     return;
//   }
//   if(!e.popup._source) {
//     return;
//   }
//   element_details = {}
//   // Handle the secret message passing if it is a path object
//   if('_path' in e.popup._source) {
//     console.log("Path");
//     if ('classList' in e.popup._source._path) {
//       console.log("Path " + e.popup._source._path.classList);
//       classes = e.popup._source._path.classList;
//       for (index = 0; index < classes.length; ++index) {
//         value = classes[index];
//         if (value.substring(0, 4) === "line") {
//              // You've found it, the full text is in `value`.
//              element_details = {"type":"line", "name": value};
//              break;
//          }
//          if (value.substring(0, 4) === "sens") {
//               // You've found it, the full text is in `value`.
//               element_details = {"type":"sensor", "name": value};
//               break;
//           }
//
//       }
//       if (element_details == {}) {
//         console.log("No secret message found in the class name!!");
//       }
//     }
//   } else {
//     // Handle the normal markers
//     element_details = JSON.parse(e.popup._source.getElement()['alt']);
//   }
//   temp = e;
//   e.popup.setContent(element_details['name'] + " Loading...").update();
//
//   $.getJSON( "/api/"+simulationName+"/"+element_details['type']+"/"+element_details['name']+"", function(data) {
//     e.popup.setContent(
//     "Nominal Voltage: "+data['nominal_voltage']+"<br>"+
//     "Voltage: "+data['measured_voltage_2']+"<br>"+
//     "Current: "+data['measured_current_1']+"<br>"+
//     "Power: "+data['measured_power']+"<br>"+
//     "Power 2: "+data['indiv_measured_power_2']+"<br>"+
//     "Real Power: "+data['measured_real_power']+"<br>"+
//     "Reactive Energy: "+data['measured_reactive_energy']+"<br>"+
//     "Demand: "+data['measured_demand']
//   ).update();
//   });
//
// }



//---- Movement Related



//---- Coloring Related



console.log("Handlers Finished");


//##################### Controls #####################

//---- Layers Related

L.Control.Watermark = L.Control.extend({
    onAdd: function(map) {
      console.log("Testing");
        var img = L.DomUtil.create('img');
        img.src = '/static/MapApp/images/slac-logo-primary.png';
        img.style.width = '200px';
        return img;
    },

    onRemove: function(map) {
      console.log("Testing Watermark remove");
        // Nothing to do here
    }
});

L.control.watermark = function(opts) {
  console.log("Testing");
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
        }).on('click', function(e) {nodeDimension.filter(e.target.options.name)
        dc.redrawAll()

        //console.log(avgvoltageCValueGroup.top())
        //console.log(hourlyUtilityPurchaseLine.data())
        document.getElementById('map_reset').style.display = "";
        document.getElementById("map_sub_title").innerHTML = "Results for " + e.target.options.name;

      console.log('filtered '+ e.target.options.name)})//.bindPopup(element['name']); //.bindTooltip(element['name']);
        if (priority == 1) {
          marker.setZIndexOffset(700);
        }
        if (priority > 1) {
          marker.setZIndexOffset(800);
        }
        layerGroup.addLayer(marker);
      } else {
        // console.log(element['name'] + " Does Not Have Location Coordinates!!");
      }
    });
  });
}


// function style(feature) {
//     return {
//         fillColor: getLineColor(feature.properties.stateName),
//     };
// }

// function populateRegions(endpoint, layerGroup, predict_state) {
//   console.log("populateRegions");
//   $.getJSON( endpoint, function(elements, error) {
//     console.log("Got Data");
//     console.log(elements);
//     elements.forEach(function(element) {
//       console.log(element.points);
//       layerGroup.addLayer(L.polygon(element.points, {color: region_colors[element.group_num]}))
//     });
//   });
// }


// Adds each of the layers to each of the maps
maps.forEach(function(map_obj){
  // Lines sometimes have sensors. Get this list first
  // var jsonPromise = $.getJSON( sensorApiEndpoint, function(sensorData) {
  //   if (!sensorData) { return; }
  //   if (sensorData['status'] == "False") { return; }
  //   sensor_list = sensorData;
  //   sensor_layers = [];
  //   sensor_layers_names = [];
  //   console.log(sensor_list);
  //
  //   // Then get the list of lines
  //   $.getJSON( lineApiEndpoint, function(geo_json_data) {
  //     map_obj.overlay["Lines"].addLayer(L.geoJSON(geo_json_data,
  //         {filter: function(feature, layer) {return feature.geometry.type == "LineString";},
  //             onEachFeature: function(feature, layer) {
  //               // We want to ignore a few elements
  //               if (ignoreList.indexOf(feature.properties.name)> -1) {
  //                 console.log("FOUND Element to Ignore" + feature.properties.name)
  //                 return;
  //               }
  //                 sensorName = (feature.properties.name).replace("line","sensor");
  //                 // console.log(sensorName);
  //                 if (sensor_list.indexOf(sensorName) > -1) {
  //                   // console.log(sensorName);
  //                   // layer.setStyle(myStyle);
  //                   sensor_layers.push(layer.toGeoJSON());
  //                   sensor_layers_names.push(sensorName);
  //                 }
  //                   layer.bindPopup(feature.properties.name);
  //                   // layer.bindTooltip(feature.properties.name);
  //             },
  //             // This style is just used as a sneaky/dumb way of
  //             //    communicating to the popup handler.
  //             style: function(feature) {
  //               return {className:(feature.properties.name)};
  //             }
  //       })
  //     )
  //     for (i = 0; i < sensor_layers.length; ++i) {
  //       map_obj.overlay["Line Sensors"].addLayer(L.geoJson(sensor_layers[i], {style: function(feature) {
  //         return {color: "#ff7800", className:(sensor_layers_names[i])}
  //       }}).bindPopup(sensor_layers_names[i]));
  //
  //     }
  //
  //   });
  // }).error(function() {
    // console.log("Using Cached Lines")
    // Just so we have an offline demo as well
    // Then get the list of lines
    var jsonPromise= $.getJSON( lineApiEndpoint, function(geo_json_data) {
      // console.log(geo_json_data)

      map_obj.overlay["Lines"].addLayer(L.geoJSON(geo_json_data,
          {filter: function(feature, layer) {return feature.geometry.type == "LineString";},
              onEachFeature: function(feature, layer) {
                // We want to ignore a few elements
                if (ignoreList.indexOf(feature.properties.name)> -1) {
                  console.log("FOUND Element to Ignore" + feature.properties.name)
                  return;
                }
                    layer.bindPopup(feature.properties.name);
                    // layer.bindTooltip(feature.properties.name);

                    if (feature.properties.name == "line86to87") {
                      console.log(feature);
                    }
              },
              // This style is just used as a sneaky/dumb way of
              //    communicating to the popup handler.
              style: function(feature) {
                return {className:(feature.properties.name)};
              }
        })
      )
    });

    //setTimeout(function(){ jsonPromise.abort(); }, 2000);

    // Add each of the desired layers
    //console.log(map_obj.overlay["Meters"])
    //populateLayer(switchApiEndpoint, (map_obj.overlay["Switches"]), switchIcon, "switch", priority=2);
    //populateLayer(meterApiEndpoint, (map_obj.overlay["Meters"]), meterIcon, "meter", priority=1);
    populateLayer(transmissionApiEndpoint, (map_obj.overlay["Transmission"]), transmissionIcon, "transmission");

//    populateRegions(regionApiEndpoint, (map_obj.overlay["Regions"]), map_obj.predict_state);

    console.log("Overlay meters done")
});

  // Houses do not have location information, so skip them
  // populateLayer(houseApiEndpoint, houseLayer, houseIcon, "house");

maps.forEach(function(map_obj){
  layerControl = L.control.layers(map_obj.base, map_obj.overlay).addTo(map_obj.map);

  // layerControl.addTo(map_obj.map);

  // Can't figure out how to do the map click popups, but they are annoying anyway
  // map_obj.map.on('click', function(e, map_obj) {
  //   onMapClick(e, map_obj);
  // });
  // map_obj.map.on('popupopen', function(e) {
  //   pop_up(e);
  // });
  // Sync to Other Maps
  // maps.forEach(function(syncMapTo){
  //   map_obj.map.sync(syncMapTo.map);
  // });
});

function restyleLayer(propertyName,ts) {
  maps[0].overlay.Lines.eachLayer(function (layer) {
    layer.eachLayer(function (layer2){
      if(layer2.feature.properties.name == propertyName) {
        var myFillColor = getLineColor(propertyName, ts);
        //console.log(myFillColor)

        layer2.setStyle({color :myFillColor})
    }
    })
  });
}
console.log(typeValuePie.filters())
});
});

console.log("Done, but waiting on web requests");
//# dc.js Getting Started and How-To Guide

/* jshint globalstrict: true */
