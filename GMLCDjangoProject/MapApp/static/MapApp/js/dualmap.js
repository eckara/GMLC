
//##################### General Settings #####################

//---- Map Constants
var maps = [];
var center = [35.38781, -118.99631];
var zoom = 15.5;

var hourlyUtilityPurchaseLine = dc.lineChart("#hourly-utility-chart");

var voltageMagnitudeLine = dc.compositeChart('#voltage-magnitute-chart');
var powerFlowLine = dc.compositeChart('#power-flow-chart');
var reactiveFlowLine = dc.compositeChart('#reactive-flow-chart');

var hourlyUtilityPurchaseLine2 = dc.lineChart("#hourly-utility-chart2");
var voltageMagnitudeLine2 = dc.compositeChart('#voltage-magnitute-chart2');
var powerFlowLine2 = dc.compositeChart('#power-flow-chart2');
var reactiveFlowLine2 = dc.compositeChart('#reactive-flow-chart2');

// d3.json("/static/MapApp/data/heatmap_data.json", function(error, datum) {
//   heatmapData=datum
var lineData2
var nodeData2
var scenario_name2='scenario2'
d3.csv('/static/MapApp/data/'+scenario_name2+'_lines.csv', function (data) {
  lineData2=data
// d3.json("/static/MapApp/data/heatmap_data.json", function(error, datum) {
//   heatmapData=datum
d3.csv('/static/MapApp/data/'+scenario_name2+'.csv', function (data) {
    // Since its a csv file we need to format the data a bit.
    //var dateFormat = d3.time.format('%m/%d/%Y');
    // data.forEach(function (d) {
    //     //d.dd = dateFormat.parse(d.date);
    //     //d.month = d3.time.month(d.dd); // pre-calculate month for better performance
    //     d.value = +d.value; // coerce to number
    //     //d.open = +d.open;
    // });
    nodeData2=data

  //See the [crossfilter API](https://github.com/square/crossfilter/wiki/API-Reference) for reference.
  // CREATE DIMENSIONS OF LINE DATA
  var ldx2= crossfilter(lineData2)
  var lineDayTypeDimension2 = ldx2.dimension(function (d) {
      return d.daytype;
  });

  var lineDimension2 = ldx2.dimension(function (d) {
      return d.line;
  });


  var lineMonthDimension2 = ldx2.dimension(function (d) {
      return d.month;
  });

  var lineHourDimension2 = ldx2.dimension(function (d) {
      return parseInt(d.hour_of_day);
  });

  // CREATE DIMENSIONS OF NODE DATA
  var ndx2 = crossfilter(nodeData2);
  var all2 = ndx2.groupAll();

  // Dimension by type
  var typeDimension2 = ndx2.dimension(function (d) {
      return d.type;
  });

  var daytypeDimension2 = ndx2.dimension(function (d) {
      return d.daytype;
  });

  // Dimension by node
  var nodeDimension2 = ndx2.dimension(function (d) {
      return d.node;
  });

  // Dimension by hour
  var hourDimension2 = ndx2.dimension(function (d) {
      return parseInt(d.hour_of_day);
  });

  //Dimension by month
  var monthDimension2 = ndx2.dimension(function (d) {
      return d.month;
  });

  // Group by total peak purchase from utility
  var monthlyPeakPurchaseValueGroup2 = monthDimension2.group().reduceSum(function (d) {
      return d.purchase_from_utility;
  });

  var typeGenerationGroup2 = typeDimension2.group().reduceSum(function (d) {
      return d.hourly_pv_self_consumpt;
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

  var avgPowerFlowAGroup2= lineHourDimension2.group().reduce(reduceAddAvg('power_flow_a_P'), reduceRemoveAvg('power_flow_a_P'), reduceInitAvg);
  var avgPowerFlowBGroup2=lineHourDimension2.group().reduce(reduceAddAvg('power_flow_b_P'), reduceRemoveAvg('power_flow_b_P'), reduceInitAvg);
  var avgPowerFlowCGroup2=lineHourDimension2.group().reduce(reduceAddAvg('power_flow_c_P'), reduceRemoveAvg('power_flow_c_P'), reduceInitAvg);

  var avgReactiveFlowAGroup2= lineHourDimension2.group().reduce(reduceAddAvg('power_flow_a_Q'), reduceRemoveAvg('power_flow_a_Q'), reduceInitAvg);
  var avgReactiveFlowBGroup2=lineHourDimension2.group().reduce(reduceAddAvg('power_flow_b_Q'), reduceRemoveAvg('power_flow_b_Q'), reduceInitAvg);
  var avgReactiveFlowCGroup2=lineHourDimension2.group().reduce(reduceAddAvg('power_flow_c_Q'), reduceRemoveAvg('power_flow_c_Q'), reduceInitAvg);

  var avgvoltageAValueGroup2 = hourDimension2.group().reduce(reduceAddAvg('voltage_a_magnitude'), reduceRemoveAvg('voltage_a_magnitude'), reduceInitAvg);
  var avgvoltageBValueGroup2 = hourDimension2.group().reduce(reduceAddAvg('voltage_b_magnitude'), reduceRemoveAvg('voltage_b_magnitude'), reduceInitAvg);
  var avgvoltageCValueGroup2 = hourDimension2.group().reduce(reduceAddAvg('voltage_c_magnitude'), reduceRemoveAvg('voltage_c_magnitude'), reduceInitAvg);
  var avgUtilityByHourGroup2 = hourDimension2.group().reduce(reduceAddAvg('purchase_from_utility'), reduceRemoveAvg('purchase_from_utility'), reduceInitAvg);
  var avgSolarByHourGroup2 = hourDimension2.group().reduce(reduceAddAvg('hourly_pv_self_consumpt'), reduceRemoveAvg('hourly_pv_self_consumpt'), reduceInitAvg);


  voltageMagnitudeLine2 /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
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
          nonzero_min(dc.lineChart(voltageMagnitudeLine2)
              .dimension(hourDimension2)
              .colors('red')
              .dotRadius([10])
              .group(avgvoltageAValueGroup2, 'Voltage A')
              .valueAccessor(function (d) {
                    return d.value.averages/1000;
                })
              .dashStyle([2,2]))
              .defined(function(d) {
                    return d.y != null;
                }),
          nonzero_min(dc.lineChart(voltageMagnitudeLine2)
              .dimension(hourDimension2)
              .colors('blue')
              .dotRadius([10])
              .group(avgvoltageBValueGroup2, 'Voltage B')
              .valueAccessor(function (d) {
                    return d.value.averages/1000;
                })
              .dashStyle([5,5]))
              .defined(function(d) {
                    return d.y != null;
                }),
        nonzero_min(dc.lineChart(voltageMagnitudeLine2)
              .dimension(hourDimension2)
              .colors('green')
              .dotRadius([10])
              .group(avgvoltageCValueGroup2, 'Voltage C')
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
              // .on('mouseover.foo', function(d) {
              //     heatmapLayer.setData(heatmapData['voltage_A'][d.data.key]);
              //     heatmapLayerB.setData(heatmapData['voltage_B'][d.data.key]);
              //     heatmapLayerC.setData(heatmapData['voltage_C'][d.data.key]);
              // })
              .on('mouseout.foo', function(d) {
                  //console.log('out')
              });
      });
      voltageMagnitudeLine2.yAxis().tickFormat(d3.format('.2f'))
      voltageMagnitudeLine2.yAxis().ticks(3)


       /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
          //.renderArea(true)
          //.width(600)
          //.height(225)
      powerFlowLine2
          .x(d3.scale.linear().domain([0, 23]))
          .mouseZoomable(true)
          .yAxisLabel("Kilowatts, [kW]",30)
          .xAxisLabel("Hour of Day")
          .renderHorizontalGridLines(true)
          .brushOn(false)
          .compose([
              nonzero_min(dc.lineChart(powerFlowLine2)
                  .dimension(lineHourDimension2)
                  .colors('red')
                  .dotRadius([10])
                  .group(avgPowerFlowAGroup2, 'Power Flow A')
                  .valueAccessor(function (d) {
                        return d.value.averages/1000;
                    })
                  .dashStyle([2,2]))
                  .defined(function(d) {
                        return d.y != null;
                    }),
              nonzero_min(dc.lineChart(powerFlowLine2)
                  .dimension(lineHourDimension2)
                  .colors('blue')
                  .dotRadius([10])
                  .group(avgPowerFlowBGroup2, 'Power Flow B')
                  .valueAccessor(function (d) {
                        return d.value.averages/1000;
                    })
                  .dashStyle([5,5]))
                  .defined(function(d) {
                        return d.y != null;
                    }),
            nonzero_min(dc.lineChart(powerFlowLine2)
                  .dimension(lineHourDimension2)
                  .colors('green')
                  .dotRadius([10])
                  .group(avgPowerFlowCGroup2, 'Power Flow C')
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
                  // .on('mouseover.foo', function(d) {
                  //     heatmapLayer.setData(heatmapData['voltage_A'][d.data.key]);
                  //     heatmapLayerB.setData(heatmapData['voltage_B'][d.data.key]);
                  //     heatmapLayerC.setData(heatmapData['voltage_C'][d.data.key]);
                  // })
                  .on('mouseout.foo', function(d) {
                      //console.log('out')
                  });
          });
          powerFlowLine2.yAxis().tickFormat(d3.format('.2f'))
          powerFlowLine2.yAxis().ticks(3)

          reactiveFlowLine2
              .x(d3.scale.linear().domain([0, 23]))
              .mouseZoomable(true)
              .yAxisLabel("KiloVARs, [kVARs]",30)
              .xAxisLabel("Hour of Day")
              .renderHorizontalGridLines(true)
              .brushOn(false)
              .compose([
                  nonzero_min(dc.lineChart(reactiveFlowLine2)
                      .dimension(lineHourDimension2)
                      .colors('red')
                      .dotRadius([10])
                      .group(avgReactiveFlowAGroup2, 'Phase A')
                      .valueAccessor(function (d) {
                            return d.value.averages/1000;
                        })
                      .dashStyle([2,2]))
                      .defined(function(d) {
                            return d.y != null;
                        }),
                  nonzero_min(dc.lineChart(reactiveFlowLine2)
                      .dimension(lineHourDimension2)
                      .colors('blue')
                      .dotRadius([10])
                      .group(avgReactiveFlowBGroup2, 'Phase B')
                      .valueAccessor(function (d) {
                            return d.value.averages/1000;
                        })
                      .dashStyle([5,5]))
                      .defined(function(d) {
                            return d.y != null;
                        }),
                nonzero_min(dc.lineChart(reactiveFlowLine2)
                      .dimension(lineHourDimension2)
                      .colors('green')
                      .dotRadius([10])
                      .group(avgReactiveFlowCGroup2, 'Phase C')
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
                      // .on('mouseover.foo', function(d) {
                      //     heatmapLayer.setData(heatmapData['voltage_A'][d.data.key]);
                      //     heatmapLayerB.setData(heatmapData['voltage_B'][d.data.key]);
                      //     heatmapLayerC.setData(heatmapData['voltage_C'][d.data.key]);
                      // })
                      .on('mouseout.foo', function(d) {
                          //console.log('out')
                      });
              });
              reactiveFlowLine2.yAxis().tickFormat(d3.format('.2f'))
              reactiveFlowLine2.yAxis().ticks(3)

      // Add the base layer of the stack with group. The second parameter specifies a series name for use in the
      // legend.
      // The `.valueAccessor` will be used for the base layer

      hourlyUtilityPurchaseLine2 /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
          .renderArea(true)
        //  .width(600)
        //  .height(225)
          .yAxisLabel("Energy,[kWh]",20)
          .xAxisLabel("Hour of Day")
          .transitionDuration(1000)
        //  .margins({top: 30, right: 50, bottom: 25, left: 40})
          .dimension(hourDimension2)
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
          .group(avgUtilityByHourGroup2, 'Avg. Utility Purchase')
          .valueAccessor(function (d) {
                return d.value.averages/1000;
            })
          // Stack additional layers with `.stack`. The first paramenter is a new group.
          // The second parameter is the series name. The third is a value accessor.
          .stack(avgSolarByHourGroup2, 'Avg. Solar Generation')
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
                  // .on('mouseover.foo', function(d) {
                  //     heatmapLayer.setData(heatmapData['voltage_A'][d.data.key]);
                  //     heatmapLayerB.setData(heatmapData['voltage_B'][d.data.key]);
                  //     heatmapLayerC.setData(heatmapData['voltage_C'][d.data.key]);
                  // })
                  // .on('mouseout.foo', function(d) {
                  //     //console.log('out')
                  // });
          });
    hourlyUtilityPurchaseLine2.yAxis().tickFormat(d3.format('.1f'))
    hourlyUtilityPurchaseLine2.yAxis().ticks(3)

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


var lineData
var nodeData
var scenario_name='scenario1'
d3.csv('/static/MapApp/data/'+scenario_name+'_lines.csv', function (data) {

  lineData=data
// d3.json("/static/MapApp/data/heatmap_data.json", function(error, datum) {
//   heatmapData=datum
d3.csv('/static/MapApp/data/'+scenario_name+'.csv', function (data) {
    // Since its a csv file we need to format the data a bit.
    //var dateFormat = d3.time.format('%m/%d/%Y');
    // data.forEach(function (d) {
    //     //d.dd = dateFormat.parse(d.date);
    //     //d.month = d3.time.month(d.dd); // pre-calculate month for better performance
    //     d.value = +d.value; // coerce to number
    //     //d.open = +d.open;
    // });

    function snap_to_zero(source_group) {
        return {
            all:function () {
                return source_group.all().map(function(d) {
                    return {key: d.key,
                            value: (Math.abs(d.value)<1e-5) ? 0 : d.value};
                });
            }
        };
    }
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

  // Dimension by type
  var typeDimension = ndx.dimension(function (d) {
      return d.type;
  });

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

  // Group by total peak purchase from utility
  var monthlyPeakPurchaseValueGroup = monthDimension.group().reduceSum(function (d) {
      return d.purchase_from_utility;
  });

  var typeGenerationGroup = typeDimension.group().reduceSum(function (d) {
      return d.hourly_pv_self_consumpt;
  });



  var avgPowerFlowAGroup= lineHourDimension.group().reduce(reduceAddAvg('power_flow_a_P'), reduceRemoveAvg('power_flow_a_P'), reduceInitAvg);
  var avgPowerFlowBGroup=lineHourDimension.group().reduce(reduceAddAvg('power_flow_b_P'), reduceRemoveAvg('power_flow_b_P'), reduceInitAvg);
  var avgPowerFlowCGroup=lineHourDimension.group().reduce(reduceAddAvg('power_flow_c_P'), reduceRemoveAvg('power_flow_c_P'), reduceInitAvg);

  var avgReactiveFlowAGroup= lineHourDimension.group().reduce(reduceAddAvg('power_flow_a_Q'), reduceRemoveAvg('power_flow_a_Q'), reduceInitAvg);
  var avgReactiveFlowBGroup=lineHourDimension.group().reduce(reduceAddAvg('power_flow_b_Q'), reduceRemoveAvg('power_flow_b_Q'), reduceInitAvg);
  var avgReactiveFlowCGroup=lineHourDimension.group().reduce(reduceAddAvg('power_flow_c_Q'), reduceRemoveAvg('power_flow_c_Q'), reduceInitAvg);

  var avgvoltageAValueGroup = hourDimension.group().reduce(reduceAddAvg('voltage_a_magnitude'), reduceRemoveAvg('voltage_a_magnitude'), reduceInitAvg);
  var avgvoltageBValueGroup = hourDimension.group().reduce(reduceAddAvg('voltage_b_magnitude'), reduceRemoveAvg('voltage_b_magnitude'), reduceInitAvg);
  var avgvoltageCValueGroup = hourDimension.group().reduce(reduceAddAvg('voltage_c_magnitude'), reduceRemoveAvg('voltage_c_magnitude'), reduceInitAvg);
  var avgUtilityByHourGroup = hourDimension.group().reduce(reduceAddAvg('purchase_from_utility'), reduceRemoveAvg('purchase_from_utility'), reduceInitAvg);
  var avgSolarByHourGroup = hourDimension.group().reduce(reduceAddAvg('hourly_pv_self_consumpt'), reduceRemoveAvg('hourly_pv_self_consumpt'), reduceInitAvg);



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
              // .on('mouseover.foo', function(d) {
              //     heatmapLayer.setData(heatmapData['voltage_A'][d.data.key]);
              //     heatmapLayerB.setData(heatmapData['voltage_B'][d.data.key]);
              //     heatmapLayerC.setData(heatmapData['voltage_C'][d.data.key]);
              // })
              .on('mouseout.foo', function(d) {
                  //console.log('out')
              });
      });
      voltageMagnitudeLine.yAxis().tickFormat(d3.format('.2f'))
      voltageMagnitudeLine.yAxis().ticks(3)


       /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
          //.renderArea(true)
          //.width(600)
          //.height(225)
      powerFlowLine
          .x(d3.scale.linear().domain([0, 23]))
          .mouseZoomable(true)
          .yAxisLabel("Kilowatts, [kW]",30)
          .xAxisLabel("Hour of Day")
          .renderHorizontalGridLines(true)
          .brushOn(false)
          .compose([
              nonzero_min(dc.lineChart(powerFlowLine)
                  .dimension(lineHourDimension)
                  .colors('red')
                  .dotRadius([10])
                  .group(avgPowerFlowAGroup, 'Power Flow A')
                  .valueAccessor(function (d) {
                        return d.value.averages/1000;
                    })
                  .dashStyle([2,2]))
                  .defined(function(d) {
                        return d.y != null;
                    }),
              nonzero_min(dc.lineChart(powerFlowLine)
                  .dimension(lineHourDimension)
                  .colors('blue')
                  .dotRadius([10])
                  .group(avgPowerFlowBGroup, 'Power Flow B')
                  .valueAccessor(function (d) {
                        return d.value.averages/1000;
                    })
                  .dashStyle([5,5]))
                  .defined(function(d) {
                        return d.y != null;
                    }),
            nonzero_min(dc.lineChart(powerFlowLine)
                  .dimension(lineHourDimension)
                  .colors('green')
                  .dotRadius([10])
                  .group(avgPowerFlowCGroup, 'Power Flow C')
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
                  // .on('mouseover.foo', function(d) {
                  //     heatmapLayer.setData(heatmapData['voltage_A'][d.data.key]);
                  //     heatmapLayerB.setData(heatmapData['voltage_B'][d.data.key]);
                  //     heatmapLayerC.setData(heatmapData['voltage_C'][d.data.key]);
                  // })
                  .on('mouseout.foo', function(d) {
                      //console.log('out')
                  });
          });
          powerFlowLine.yAxis().tickFormat(d3.format('.2f'))
          powerFlowLine.yAxis().ticks(3)

          reactiveFlowLine
              .x(d3.scale.linear().domain([0, 23]))
              .mouseZoomable(true)
              .yAxisLabel("KiloVARs, [kVARs]",30)
              .xAxisLabel("Hour of Day")
              .renderHorizontalGridLines(true)
              .brushOn(false)
              .compose([
                  nonzero_min(dc.lineChart(reactiveFlowLine)
                      .dimension(lineHourDimension)
                      .colors('red')
                      .dotRadius([10])
                      .group(avgReactiveFlowAGroup, 'Phase A')
                      .valueAccessor(function (d) {
                            return d.value.averages/1000;
                        })
                      .dashStyle([2,2]))
                      .defined(function(d) {
                            return d.y != null;
                        }),
                  nonzero_min(dc.lineChart(reactiveFlowLine)
                      .dimension(lineHourDimension)
                      .colors('blue')
                      .dotRadius([10])
                      .group(avgReactiveFlowBGroup, 'Phase B')
                      .valueAccessor(function (d) {
                            return d.value.averages/1000;
                        })
                      .dashStyle([5,5]))
                      .defined(function(d) {
                            return d.y != null;
                        }),
                nonzero_min(dc.lineChart(reactiveFlowLine)
                      .dimension(lineHourDimension)
                      .colors('green')
                      .dotRadius([10])
                      .group(avgReactiveFlowCGroup, 'Phase C')
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
                      // .on('mouseover.foo', function(d) {
                      //     heatmapLayer.setData(heatmapData['voltage_A'][d.data.key]);
                      //     heatmapLayerB.setData(heatmapData['voltage_B'][d.data.key]);
                      //     heatmapLayerC.setData(heatmapData['voltage_C'][d.data.key]);
                      // })
                      .on('mouseout.foo', function(d) {
                          //console.log('out')
                      });
              });
              reactiveFlowLine.yAxis().tickFormat(d3.format('.2f'))
              reactiveFlowLine.yAxis().ticks(3)

      // Add the base layer of the stack with group. The second parameter specifies a series name for use in the
      // legend.
      // The `.valueAccessor` will be used for the base layer

      hourlyUtilityPurchaseLine /* dc.lineChart('#monthly-move-chart', 'chartGroup') */
          .renderArea(true)
        //  .width(600)
        //  .height(225)
          .yAxisLabel("Energy,[kWh]",20)
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
                  // .on('mouseover.foo', function(d) {
                  //     heatmapLayer.setData(heatmapData['voltage_A'][d.data.key]);
                  //     heatmapLayerB.setData(heatmapData['voltage_B'][d.data.key]);
                  //     heatmapLayerC.setData(heatmapData['voltage_C'][d.data.key]);
                  // })
                  // .on('mouseout.foo', function(d) {
                  //     //console.log('out')
                  // });
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








//---- Data and API
var loadApiEndpoint = "/static/MapApp/data/cache/load.json",
    nodeApiEndpoint = "/static/MapApp/data/cache/node.json",
    transmissionApiEndpoint = "/static/MapApp/data/cache/transmission.json",
    lineApiEndpoint = "/static/MapApp/data/model2.geo.json",
    substationApiEndpoint = "/static/MapApp/data/cache/substations.json";
var sensor_list = [];

var ignoreList = ["sw61to6101", "node_6101", "line60to61", "node_610", "node_61"];

// var meterApiEndpoint = "/vader/api/"+$simulationName+"/meter/\*",
//     switchApiEndpoint = "/vader/api/"+$simulationName+"/switch/\*",
//     loadApiEndpoint = "/vader/api/"+$simulationName+"/load/\*",
//     nodeApiEndpoint = "/vader/api/"+$simulationName+"/node/\*",
//     feederApiEndpoint = "/vader/api/"+$simulationName+"/feeder/\*";

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
    bigIconSize = 30;
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

var meterIcon = new NormalGridIcon({iconUrl: '/static/MapApp/images/icons/meter.png'}),
    transmissionIcon = new NormalGridIcon({iconUrl: '/static/MapApp/images/icons/transformer.png'}),
    nodeIcon = new NormalGridIcon({iconUrl: '/static/MapApp/images/icons/node.png'}),
    loadIcon = new NormalGridIcon({iconUrl: '/static/MapApp/images/icons/load.png'}),
    houseIcon = new NormalGridIcon({iconUrl: '/static/MapApp/images/icons/house.png'}),
    switchIcon = new BigGridIcon({iconUrl: '/static/MapApp/images/icons/switch.png'}),
    substationIcon = new MegaGridIcon({iconUrl: '/static/MapApp/images/icons/substation.png'});

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

var Mapbox_Theme2 =
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYmVuZHJhZmZpbiIsImEiOiJjaXRtMmx1NGwwMGE5MnhsNG9kZGJ4bG9xIn0.trghQwlKFrdvueMDquqkJA', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mapbox.streets'
});


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






// Theme Layers
var baseLayers1 = {
    "Mapbox Theme": Mapbox_Theme,
    // "Thunderforest": Thunderforest_Landscape,
    // "Thunderforest 2": Thunderforest_TransportDark,
};

// Theme Layers
var baseLayers2 = {
    "Mapbox Theme": Mapbox_Theme2,
    // "Thunderforest": Thunderforest_Landscape2,
    // "Thunderforest 2": Thunderforest_TransportDark2,
};
console.log("Layers Finished");
// Overlay Layers as displayed on the layer chooser
var overlayLayers1 = {
    "Nodes": L.layerGroup([]),
    "Loads": L.layerGroup([]),
    // "Houses": L.layerGroup([]),
    "Transmission": L.layerGroup([]),
    "Substations": L.layerGroup([]),
    "Lines": L.layerGroup([])
    // "Voltage A": heatmapLayer,
    // "Voltage B": heatmapLayerB,
    // "Voltage C": heatmapLayerC
};

var overlayLayers2 = {
    "Nodes": L.layerGroup([]),
    "Loads": L.layerGroup([]),
    // "Houses": L.layerGroup([]),
    "Transmission": L.layerGroup([]),
    "Substations": L.layerGroup([]),
    "Lines": L.layerGroup([])
    // "Voltage A": heatmapLayer,
    // "Voltage B": heatmapLayerB,
    // "Voltage C": heatmapLayerC
};

//##################### Maps #####################


var map1 = L.map('map1', {
    layers: [baseLayers1["Mapbox Theme"],
    overlayLayers1["Nodes"],
    overlayLayers1["Transmission"],
    overlayLayers1["Loads"],
    overlayLayers1["Substations"],
    overlayLayers1["Lines"]
    ],
    center: center,
    zoom: zoom
});
map1.attributionControl.setPrefix('');
var map2 = L.map('map2', {
      layers: [baseLayers2["Mapbox Theme"],
      overlayLayers2["Nodes"],
      overlayLayers2["Transmission"],
      overlayLayers2["Loads"],
      overlayLayers2["Substations"],
      overlayLayers2["Lines"]
      ],
      center: center,
      zoom: zoom
  });

// Add each map to the map array. This will be useful for scalable calling later
maps.push({"map":map1, "base":baseLayers1, "overlay":overlayLayers1, "popup":L.popup(), });
maps.push({"map":map2, "base":baseLayers2, "overlay":overlayLayers2, "popup":L.popup(), });
// maps.push(map3);
// map1.sync(map2);
// map2.sync(map1);


//##################### Handlers #####################


//---- Movement Related



//---- Coloring Related



console.log("Handlers Finished");


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
        marker.on('click', function(e) {nodeDimension.filter(e.target.options.name)
        dc.redrawAll()

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
      }
    });
  });
}

// Helper function for adding normal layers
function populateLayerSubstation(endpoint, layerGroup, iconPath, element_type, priority=0) {
  $.getJSON( endpoint, function(elements, error) {
    elements.forEach(function(element) {
      // We want to ignore a few elements
      if (ignoreList.indexOf(element['name'])> -1) {
        console.log("FOUND Element to Ignore" + element['name'])
        return;
      }
      if (('latitude' in element) && ('longitude' in element)) {
        latlong = [parseFloat(element['latitude']), parseFloat(element['longitude'])];
        marker = L.marker(latlong, {
          icon: new MegaGridIcon({iconUrl: '/static/MapApp/images/icons/substation-'+element['color']+'.png'}),
          alt:JSON.stringify({"type":element_type,"name":element['name']})
        }).bindPopup(element['name'] ); //.bindTooltip(element['name']);
        if (priority == 1) {http://127.0.0.1:8000/static/MapApp/js
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

  function onEachFeature(feature, layer) {
      // We want to ignore a few elements
      if (ignoreList.indexOf(feature.properties.name)> -1) {
        console.log("FOUND Element to Ignore" + feature.properties.name)
        return;
      }
      layer.bindPopup(feature.properties.name);
      layer.on('click', function(e) {lineDimension.filter(feature.properties.name)
      dc.redrawAll()
      console.log(feature.properties.name)
    });

      }

function populateLayerLines(endpoint, layerGroup, priority=0) {
    $.getJSON( endpoint, function(geo_json_data) {
    lines=L.geoJson(geo_json_data,
          { color: 'red',
            weight: 10,
            opacity: 0.5,
          filter: function(feature, layer) {return feature.geometry.type == "LineString";},
          onEachFeature: onEachFeature,
           // onEachFeature:

        });
      layerGroup.addLayer(lines);
    });
  }



maps.forEach(function(map_obj){
    // Add each of the desired layers
    populateLayer(nodeApiEndpoint, (map_obj.overlay["Nodes"]), nodeIcon, "node");
    populateLayer(loadApiEndpoint, (map_obj.overlay["Loads"]), loadIcon, "load");
    populateLayer(transmissionApiEndpoint, (map_obj.overlay["Transmission"]), transmissionIcon, "transmission");
    populateLayerSubstation(substationApiEndpoint, (map_obj.overlay["Substations"]), substationIcon, "substation");
    populateLayerLines(lineApiEndpoint,(map_obj.overlay["Lines"]), priority=0);
});

maps.forEach(function(map_obj){
  layerControl = L.control.layers(map_obj.base, map_obj.overlay).addTo(map_obj.map);
});

});
});

});
});
