const btn = document.getElementById('btn');
const btn2 = document.getElementById('btn2');

var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");
    borders = 0;

var rateById = d3.map();
    

var projection = d3.geoAlbersUsa()
        .scale(4000)    
        .translate([width*0.80, height / 2]);
    
var path = d3.geoPath()
        .projection(projection);
    
var col2 = d3.schemeBuGn[9];
var col1 = d3.schemeOrRd[9];
var barCol = col1;

let index = 0;

btn.addEventListener('click', function onClick() {
    index += 1;
    index = index % 2;
    update(index);
    console.log("Hit button 1");
});

btn2.addEventListener('click', function onClick() {
    if (borders == 0){
        borders = 1;
        update(4);
    } else {
        borders = 0;
        update(4);
    }
});

function update(num){
    d3.selectAll("svg > *").remove();
    // Updates the color
    console.log(num);
    if (num == 0){
        barCol = col1;
    } else if (num == 1) {
        barCol = col2;
    }
    
    var color = d3.scaleThreshold()
        .domain([1, 10, 50, 200, 500, 1000, 2000, 4000])
        .range(barCol);

    // Adds in the counties
    var allCounties = [];
    var i = 0;
    d3.queue()
        .defer(d3.json, "us-10m.json")
        .defer(d3.tsv, "PopulationDenisty.tsv", function(d) { 
//                                                        console.log("ID: " + d.id);
                                                        rateById.set(d.id, +d.rate);
                                                        
                                                        allCounties[i] = d.id;
                                                        i++;

//                                                        console.log(allCounties);
                                                         })
        .await(ready);

    function ready(error, us) {
        if (error) throw error;
        console.log(allCounties);
        svg.append("g")
            .attr("class", "counties")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.counties).features
//                  .filter(function(d){
//                console.log("Data: " + d.id);
//                return allCounties.includes(d.id);
//                })
                 )
            .enter().append("path")
            .style("fill", function(d) { return color(rateById.get(d.id)); })
            .style("stroke", function(d) { if (Math.floor(d.id / 1000) == 8){return "black";}  else {return "green"} })
            .attr("stroke-opacity", function(d){ if (Math.floor(d.id / 1000) == 8){return borders;}  else {return 0} })
            .attr('opacity', '0.70')
            // mouse over
            .on("mouseover", function(d, i){
                d3.select("#tooltip")
                .style("left", (d3.event.pageX ) + "px") 
                .style("top", (d3.event.pageY ) + "px")
                // Adds the ountry and pop density
                d3.select("#tooltip")
                .select("#county").text(d.id);
                d3.select("#tooltip")
                .select("#number").text(rateById.get(d.id))
                d3.select(this).transition()
                .duration('500')
                .attr('opacity',1);
            })
            // mouse out
            .on("mouseout", function(d, i) {
                d3.select("#tooltip")
                    .classed("hidden", true)
                d3.select(this).transition()
                    .duration('200')
                    .attr('opacity', '0.67'); 
            })
            
            .attr("d", path)
            .append("title")
                .text(function(d) { return d.id + " Pop. Density: " + rateById.get(d.id); });
        

//      console.log(us)
        svg.append("path")
            .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
            .attr("class", "states")
            .attr("d", path);

    }
    // Adds bar to the top
    var x = d3.scaleSqrt()
        .domain([0, 4500])
        .rangeRound([420, 650]);

    var g = svg.append("g")
        .attr("class", "key")
        .attr("transform", "translate(0,40)");

    g.selectAll("rect")
      .data(color.range().map(function(d) {
          d = color.invertExtent(d);
          if (d[0] == null) d[0] = x.domain()[0];
          if (d[1] == null) d[1] = x.domain()[1];
          return d;
        }))
      .enter().append("rect")
        .attr("height", 8)
        .attr("x", function(d) { return x(d[0]); })
        .attr("y", -5)
        .attr("width", function(d) { return x(d[1]) - x(d[0]); })
        .attr("fill", function(d) { return color(d[0]); });

    g.append("text")
        .attr("class", "caption")
        .attr("x", 420)
        .attr("y", -15)
        .attr("fill", "#000")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text("Population per square mile");

    g.call(d3.axisBottom(x)
        .tickSize(6)
        .tickValues(color.domain()))
        .select(".domain")
        .remove();
}

update(0)

