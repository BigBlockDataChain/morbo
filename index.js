import * as html from '@hyperapp/html'
import {app as hyperapp} from 'hyperapp'
import * as d3 from 'd3'
import * as d3select from 'd3-selection'
import { scale } from 'd3-scale'


main()


function main() {
  const state = {
    screenHeight: 0,
    screenWidth: 0,
  }

  const actions = {
    onInit: el => (state, actions) => {
      console.log('app create', state)
      return {screenHeight: el.offsetHeight, screenWidth: el.offsetWidth}
    },

    onD3ContainerCreate: el => (state, actions) => {
      console.log('d3 create', state)
      var data = {
        nodes: [{
          name: 'A',
          x: 200,
          y: 150
        }, {
          name: 'B',
          x: 140,
          y: 300
        }, {
          name: 'C',
          x: 300,
          y: 300
        }, {
          name: 'D',
          x: 300,
          y: 180
        }],
        links: [{
          source: 0,
          target: 1
        }, {
          source: 1,
          target: 2
        }, {
          source: 2,
          target: 3
        }, ]
      };

      // // Data
      // var countriesData = [
      //   { name:'Ireland',  income:53000, life: 78, pop:6378, color: 'black'},
      //   { name:'Norway',   income:73000, life: 87, pop:5084, color: 'blue' },
      //   { name:'Tanzania', income:27000, life: 50, pop:3407, color: 'grey' }
      // ];
      // // Create SVG container
      // var svg = d3.select(el).append('svg')
      //   .attr('width', 500)
      //   .attr('height', 500)
      //   .style('background-color', '#D0D0D0');
      // // Create SVG elements from data
      // svg.selectAll('circle')                  // create virtual circle template
      //   .data(countriesData)                   // bind data
      //   .enter()                                 // for each row in data...
      //   .append('circle')                      // bind circle & data row such that...
      //   .attr('id', function(d) { return d.name })            // set the circle's id according to the country name
      //   .attr('cx', function(d) { return 2 * d.income / 1000  })  // set the circle's horizontal position according to income
      //   .attr('cy', function(d) { return d.life * 2 })            // set the circle's vertical position according to life expectancy
      //   .attr('r',  function(d) { return d.pop / 1000 *2 })   // set the circle's radius according to country's population
      //   .attr('fill', function(d) { return d.color });        // set the circle's color according to country's color

      var c10 = d3.scaleOrdinal(d3.schemeCategory10);
      var svg = d3.select(el)
        .append('svg')
        .attr('width', state.screenWidth / 2)
        .attr('height', state.screenHeight)
        .on('tick', tick)

      var drag = d3.drag()
        .on('drag', function(d, i) {
          d.x += d3.event.dx
          d.y += d3.event.dy
          d3.select(this).attr('cx', d.x).attr('cy', d.y)
          links.each(function(l, li) {
            if (l.source == i) {
              d3.select(this).attr('x1', d.x).attr('y1', d.y)
            } else if (l.target == i) {
              d3.select(this).attr('x2', d.x).attr('y2', d.y)
            }
          });
        });

      var links = svg.selectAll('.link')
        .data(data.links)
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('x1', function(l) {
          var sourceNode = data.nodes.filter(function(d, i) {
            return i == l.source
          })[0];
          d3.select(this).attr('y1', sourceNode.y);
          return sourceNode.x
        })
        .attr('x2', function(l) {
          var targetNode = data.nodes.filter(function(d, i) {
            return i == l.target
          })[0];
          d3.select(this).attr('y2', targetNode.y);
          return targetNode.x
        })
        .attr('fill', 'none')
        .attr('stroke', 'white');

      var nodes = svg.selectAll('.node')
        .data(data.nodes)
        .enter()
        .append('circle')
        .attr('class', 'node')
        .attr('cx', function(d) {
          return d.x
        })
        .attr('cy', function(d) {
          return d.y
        })
        .attr('r', 15)
        .attr('fill', function(d, i) {
          return c10(i);
        })
        .call(drag);

      function tick() {
        link.attr('x1', function(d) { return d.source.x; })
          .attr('y1', function(d) { return d.source.y; })
          .attr('x2', function(d) { return d.target.x; })
          .attr('y2', function(d) { return d.target.y; });

        node.attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });
      }
    },
  }

  const view = function(state, actions) {
    return html.div(
      {
        id: 'app',
        oncreate: el => {
          console.log('app oncreate', el)
          actions.onInit(el)
        }
      },
      [
        viewGraph(actions),
        viewEditor(state, actions),
        viewDebugPanel(state),
      ]
    )
  }

  const app = hyperapp(state, actions, view, document.querySelector('#root'))
}


function viewGraph(actions) {
  return html.div(
    {
      id: 'd3-container',
      onupdate: el => {
        console.log('graph oncreate', el)
        actions.onD3ContainerCreate(el)
      },
    },
  )
}


function viewEditor(state, actions) {
  return html.div(
    {
      id: 'editor-container'
    },
    [
      html.textarea(
        {
          id: 'editor',
        }
      )
    ]
  )
}


function viewDebugPanel(state) {
  return html.div(
    {
      id: 'debug-panel',
      style: {
        display: 'flex',
        flexDirection: 'column',
      }
    },
    [
      html.div(['height ', state.screenHeight]),
      html.div(['width ', state.screenWidth]),
    ]
  )
}
