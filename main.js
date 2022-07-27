const EDUCATION_FILE = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json'
const COUNTY_FILE = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json'

var tooltip = d3.select("#main")
  .append('div')
  .attr('class', 'tooltip')
  .attr('id', 'tooltip')
  .style('opacity', 0);

Promise.all([d3.json(COUNTY_FILE), d3.json(EDUCATION_FILE)])
.then((data) => ready(data[0], data[1]))
.catch((err) => console.log(err));

function ready(us, education) {

  let min_education = d3.min(education, (d) => d.bachelorsOrHigher);
  let max_education = d3.max(education, (d) => d.bachelorsOrHigher);

  var color = d3
  .scaleThreshold()
  .range(d3.schemeBlues[7])
  .domain(d3.range(min_education, max_education, 
    (max_education - min_education) / d3.schemeBlues[7].length));

  var svg = d3.select("#graph")
  .append("svg")
  .attr("width", 960)
  .attr("height", 600)
  .append("g")
  .attr("class", "counties")

  var xScaleLegend = d3.scaleLinear().domain(
    [min_education, max_education]).rangeRound([600, 860]);

  var g = svg
  .append('g')
  .attr('class', 'key')
  .attr('id', 'legend')
  .attr('transform', 'translate(0,40)');

  g.selectAll('rect')
  .data(
    color.range().map(function (d) {
      // Invert extent will give the bins left and right intervals
      d = color.invertExtent(d);
      if (d[0] === null) {
        d[0] = xScaleLegend.domain()[0];
      }
      if (d[1] === null) {
        d[1] = xScaleLegend.domain()[1];
      }
      return d;
    })
  )
  .enter()
  .append('rect')
  .attr('height', 8)
  .attr('x', function (d) {
    return xScaleLegend(d[0]);
  })
  .attr('width', function (d) {
    return d[0] && d[1] ? xScaleLegend(d[1]) - xScaleLegend(d[0]) : xScaleLegend(null);
  })
  .attr('fill', function (d) {
    return color(d[0]);
  });

  xLegendAxis = d3
  .axisBottom()
  .scale(xScaleLegend)
  .tickSize(13)
  .tickFormat(function (x) {
    return Math.round(x) + '%';
  })
  .tickValues(color.domain())

  g
  .call(xLegendAxis)
  .select('.domain')
  .remove();

  var mouseover = function(event, d){
    tooltip.style('opacity', 0.9);
    tooltip
      .html(function () {
        var result = education.filter(function (obj) {
          return obj.fips === d.id;
        });
        if (result[0]) {
          return (
            result[0]['area_name'] +
            ', ' +
            result[0]['state'] +
            ': ' +
            result[0].bachelorsOrHigher +
            '%'
          );
        }
        // could not find a matching fips id in the data
        return 0;
      })
      .style('left', event.pageX + 10 + 'px')
      .style('top', event.pageY - 28 + 'px')
      .attr('data-education', function () {
        var result = education.filter(function (obj) {
          return obj.fips === d.id;
        });
        if (result[0]) {
          return result[0].bachelorsOrHigher;
        }
        // could not find a matching fips id in the data
        return 0;
      })

  }

  var mouseleave = function(event, d){
    tooltip.style('opacity', 0);
  }

  svg
  .selectAll('path')
  .data(topojson.feature(us, us.objects.counties).features)
  .enter()
  .append('path')
  .attr("d", d3.geoPath())
  .attr("class", "county")
  .attr('data-fips', function (d) {
    return d.id;
  })
  .attr("data-education", function(d){
    let result =  education.filter((x) => x.fips == d.id);
    result = result[0].bachelorsOrHigher;
    return result;
  })
  .attr("fill", function(d){
    let result =  education.filter((x) => x.fips == d.id);
    result = result[0].bachelorsOrHigher;

    return color(result);
  })
  .on("mouseover", mouseover)
  .on("mouseleave", mouseleave)

  svg
  .append('path')
  .datum(
    topojson.mesh(us, us.objects.states, function (a, b) {
      return a !== b;
    })
  )
  .attr('class', 'states')
  .attr('d', d3.geoPath());

}