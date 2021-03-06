var parliamentApp = function(){

  /*Encapsulated vars*/
  var active_user
  var data_object
  var baseHeatMapChart
  var colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58","#000000"]
  var matrix
  var chords
  /* /Encapsulated vars*/


  /*Private methods*/
  //
  //
  function initialize(data){
    //encapsulate the external data object
    data_object = data.users
    matrix = data.matrix
    chords = data.chords

    generateGradient()
    append3DGroup()
    baseHeatMapChart = heatmapChart()
    baseBubbleChart = bubbleChart()

    $('#check-it-out-button').toggleClass('btn-primary', 1000).toggleClass('btn-success', 1000);
    $('#check-it-out-button').html("&nbsp;Let's see it!&nbsp;")
    $('#check-it-out-button').removeClass('disabled')

    $('.void').on('click', function(e){
      e.preventDefault()
    })

    //add event listener to check it out button
    document.getElementById('check-it-out-button').addEventListener('click', function(){
      $('#loading-container').fadeOut('fast', function(){
        $('#content-container').fadeIn()
      })
    })

  }
  //
  //

  //
  //
  var heatmapChart = function() {

    var margin = { top: 40, right: 20, bottom: 100, left: 20 },
          width = 700 - margin.left - margin.right,
          height = 350 - margin.top - margin.bottom,
          gridSize = Math.floor(width / 24),
          legendElementWidth = gridSize*2,
          buckets = 10,
          days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
          times = ["12p","1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12a", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p"];

      var svg = d3.select("#chart").append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var dayLabels = svg.selectAll(".dayLabel")
          .data(days)
          .enter().append("text")
            .text(function (d) { return d; })
            .attr("x", 0)
            .attr("y", function (d, i) { return i * gridSize; })
            .style("text-anchor", "end")
            .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
            .attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); });

      var timeLabels = svg.selectAll(".timeLabel")
          .data(times)
          .enter().append("text")
            .text(function(d) { return d; })
            .attr("x", function(d, i) { return i * gridSize; })
            .attr("y", 0)
            .style("text-anchor", "middle")
            .attr("transform", "translate(" + gridSize / 2 + ", -6)")
            .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });

      //this creates a relative scale based on the data
      //it's somehwat intensive for what it does so I don't
      //want to repeat this process each time I'm rendering a user
      function setHeatMapColorScale(){

        var median_word_count_user_activity
        var data = []
        var users = []

        //get ready to organize users
        Object.keys(data_object).map( function(user){
          var user = [ data_object[user].total_words , user ]
          users.push(user)
        });
        //

        //sort our array
        users.sort(function (a, b) {

          if (a[0] > b[0]) {
            return 1;
          }
          if (a[0] < b[0]) {
            return -1;
          }
          // a must be equal to b
          return 0;
        });
        //

        var middle_index = parseInt(users.length/2)
        var middle_user_id = users[middle_index][1]
        median_word_count_user_activity = data_object[middle_user_id].activity

        Object.keys(median_word_count_user_activity).map(
          function(day) {
            for(var hour = 1; hour <= 24 ; hour++) {
              if(!median_word_count_user_activity[day]) median_word_count_user_activity[day] = {}
              if(!median_word_count_user_activity[day][hour]) median_word_count_user_activity[day][hour] = 0
              data.push({day: +day+1,hour: +hour,value: +median_word_count_user_activity[day][hour]})
            }
          }
        );

        return d3.scale.quantile()
            .domain([0, buckets - 1, d3.max(data, function (d) { return d.value; })])
            .range(colors);
      }

      //capture the scale for repeated quick use
      var colorScale = setHeatMapColorScale()

      return {
        render: function(userNode){
          var data = []

          for(var day = 0; day <= 6 ; day++) {
            for(var hour = 1; hour <= 24 ; hour++) {
              if(!userNode[day]) userNode[day] = {}
              if(!userNode[day][hour]) userNode[day][hour] = 0
              data.push({day: +day+1,hour: +hour,value: +userNode[day][hour]})
            }
          }

          var cards = svg.selectAll(".hour")
              .data(data, function(d) {return d.day+':'+d.hour;});

          cards.append("title");

          cards.enter().append("rect")
              .attr("x", function(d) { return (d.hour - 1) * gridSize; })
              .attr("y", function(d) { return (d.day - 1) * gridSize; })
              .attr("rx", 4)
              .attr("ry", 4)
              .attr("class", "hour bordered")
              .attr("width", gridSize)
              .attr("height", gridSize)
              .style("fill", colors[0]);

          cards.transition().duration(1000)
              .style("fill", function(d) { return colorScale(d.value); });

          cards.select("title").text(function(d) { return d.value; });

          cards.exit().remove();

          var legend = svg.selectAll(".legend")
              .data([0].concat(colorScale.quantiles()), function(d) { return d; });

          legend.enter().append("g")
              .attr("class", "legend");

          legend.append("rect")
            .attr("x", function(d, i) { return legendElementWidth * i; })
            .attr("y", height)
            .attr("width", legendElementWidth)
            .attr("height", gridSize / 2)
            .style("fill", function(d, i) { return colors[i]; });

          legend.append("text")
            .attr("class", "mono")
            .text(function(d) {return "≥ " + Math.round(d);})
            .attr("x", function(d, i) { return legendElementWidth * i; })
            .attr("y", height + gridSize);

          legend.exit().remove();
        }
      }

    }
  //
  //

  //
  //
  var bubbleChart = function() {

    var diameter = 700,
        format = d3.format(",d"),
        buckets = 10

    var bubble = d3.layout.pack()
        .sort(null)
        .size([diameter, diameter])
        .padding(1.5);

    function setBubbleMapColorScale(words){

      return d3.scale.quantile()
          .domain([0, buckets - 1, d3.max(words, function (d) { return parseInt(d.size); })])
          .range(colors);
    }

    return{
      render: function(words){

        $('#bubble').html('')

        var svg = d3.select("#bubble").append("svg")
            .attr("width", diameter)
            .attr("height", diameter)
            .attr("class", "bubble");

        var data = {"name": "events","children": []}

        //get ready to organize users
        Object.keys(words).map( function(word){

          var circle = {"name": word, "size": words[word]}
          data.children.push(circle)

        });

        var colorScale = setBubbleMapColorScale(data.children)

        var node = svg.selectAll(".node")
            .data(bubble.nodes(classes(data))
            .filter(function(d) { return !d.children; }))
          .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

        node.append("title")
            .text(function(d) { return d.className + ": " + format(d.value); });

        node.append("circle")
            .attr("r", function(d) { return d.r; })
            .style("fill", function(d) { return colorScale( parseInt(d.value) ); });

        node.transition().duration(1000)
            .style("fill", function(d) { return colorScale( -parseInt(d.value) ); });

        node.append("text")
            .attr("dy", ".3em")
            .style("text-anchor", "middle")
            .text(function(d) { return d.className.substring(0, d.r / 3); });

      // Returns a flattened hierarchy containing all leaf nodes under the root.
      function classes(data) {
        var classes = [];

        function recurse(name, node) {
          if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
          else classes.push({packageName: name, className: node.name, value: node.size});
        }

        recurse(null, data);
        return {children: classes};
      }

      d3.select(self.frameElement).style("height", diameter + "px");
      }
    }

  }
  //
  //

  //
  //
  function append3DGroup(){
    var data = []
    Object.keys(data_object).map(function(value) {

      var name = data_object[value].name
      var id = data_object[value].id
      var total_words = data_object[value].total_words
      var total_posts = data_object[value].total_posts
      var total_likes = data_object[value].total_likes
      var words_per_like = (total_words/total_likes).toFixed(2)
      appendUserLi(id,name)

      var colorValue =  parseFloat( ( words_per_like / 45 ).toFixed(2) )
      var color = getColor(colorValue)
      var userPlot = {
        x: [ total_likes ],
        y: [ total_words ],
        z: [ total_posts ],
        mode: 'markers',
        marker: {
          color: color,
          size: (total_words/3000).toFixed(2),
          symbol: 'circle',
          line: {
            color: 'rgb(204, 204, 204)',
            width: 1
          },
          opacity: 1
        },
        type: 'scatter3d',
        name: data_object[value].name,
        hoverinfo: "name"
      };

      data.push(userPlot)
    });

    var layout = {
      margin: {
        l: 0,
        r: 0,
        b: 10,
        t: 0
      },
      scene: {
        camera: {
          eye: {
            x: 1.4,
            y: 1.4,
            z: 1.4
          }
        },
        xaxis: {
            title: 'Total Likes',
            ticks: '',
            tickfont: {
              color: 'rgb(204, 204, 204)',
              size: 11,
            },
            showexponent: 'all',
            zeroline: false
        },
        yaxis: {
            title: 'Total Words',
            ticks: '',
            tickfont: {
              color: 'rgb(204, 204, 204)',
              size: 11,
            },
            showexponent: 'all',
            zeroline: false
        },
        zaxis: {
          title: 'Total Posts',
          ticks: '',
          tickfont: {
            color: 'rgb(204, 204, 204)',
            size: 11,
          },
          showexponent: 'all',
          zeroline: false
        }
      },
      showlegend: false
    }

    Plotly.newPlot('group-graph', data, layout, {scrollZoom: false})
  }
  //
  //

  //
  //
  function generateGradient(){
    var len=20
    for(var i=0; i<len; i++){
        var value=i/len;
        var d=document.createElement('div')
        d.className = 'gradient-step'
        d.style.backgroundColor=getColor(value)
        document.getElementById('gradient').appendChild(d)
    }
  }
  //
  //

  //
  //
  function getColor(value){
      //value from 0 to 1
      if(value>=1){
        return colors[9]
      }else if(value<=0){
        return colors[0]
      }else{
        var index = parseInt( value*10 )
        return colors[index]
      }
      //the below code returns a color value
      //from red to green while avoiding the weird
      //brown color that lies between the two colors
      //and replaces that with a nice yellow
      // var hue=((1-value)*120).toString(10);
      // return ["hsl(",hue,",100%,50%)"].join("")
  }
  //
  //

  //
  //
  function appendUserLi(id,name){
    var elementId = 'user-list-'+id
    var li = '<li class="user-list-element" id="'+elementId+'"><a href="#user" data-toggle="tab" class="void"><small>'+name+'</small></a></li>'
    //insertAdjacentHTML is WAY faster than jquery
    document.getElementById('user-list').insertAdjacentHTML( 'beforeend', li )
    attachUserClickEvent( elementId , id )
  }
  //
  //

  //
  //
  function attachUserClickEvent( elementId , id ){
    document.getElementById(elementId).addEventListener('click', function(){
      var total_words = data_object[id].total_words
      var total_posts = data_object[id].total_posts
      var total_likes = data_object[id].total_likes
      var words_per_like = (total_words/total_likes).toFixed(2)
      $('#current-user-name').html(data_object[id].name)
      $('#current-user-words').html(total_words+' total words')
      $('#current-user-posts').html(total_posts+' posts')
      $('#current-user-likes').html(total_likes+' likes earned')
      $('#current-user-words-per-like').html(words_per_like+' words/like')
      renderUserHeatMap(id)
      renderUserBubbleChart(id)
    })
  }
  //
  //

  //
  //
  function renderUserBubbleChart(id){
    baseBubbleChart.render(data_object[id].words)
  }
  //
  //

  //
  //
  function renderUserHeatMap(id){
    baseHeatMapChart.render(data_object[id].activity)
  }
  //
  //
  /* /Private methods*/

  /*Public methods*/
  return{
    /*
    initialize()
    */
    initialize : function(data){
      initialize(data)
    },
    fetchMatrix: function(){
      return matrix
    },
    fetchChords: function(){
      return chords
    }
    // /initialize()

  }// /return
  /* /Public methods*/

}
