import * as d3 from 'd3'
import * as d3zoom from 'd3-zoom'
import * as html from '@hyperapp/html'

import {getLogger} from 'logger.js'

const logger = getLogger('graph-view-component.js')

export default function() {
  const _state = {
    initialized: false,
    d3Initialized: false,
    d3El: null,
    width: 0,
    height: 0,
  }

  const _actions = {
    oncreate: el => state => {
      logger.debug('oncreate graph', el)
      return {...state, d3El: el}
    },
  }

  function _view(state, actions) {
    return html.div(
      {
        id: 'd3-container',
        style: {
          width: state.width + 'px',
          height: state.height + 'px',
        },
        oncreate: el => actions.oncreate(el),
      }
    )
  }

  function setDimensions(state, height, width) {
    return {...state, initialized: true, height, width}
  }

  function setData(state, data) {
    if (!state.d3Initialized)
      return _initD3({...state, d3Initialized: true, data})

    _createGraph(state, state.d3State.g, state.d3State.c10)
    return {...state}
  }

  function _initD3(state) {
    // Used for node coloring
    const c10 = d3.scaleOrdinal(d3.schemeCategory10)

    const svg = d3.select(state.d3El)
      .append('svg')
      .attr('width', state.width)
      .attr('height', state.height)
      .on('click', () => logger.debug('click'))
      .on('dblclick', () => {
        logger.debug('dblclick')
      })
    const g = svg.append('g')
      .attr('class', 'everything')

    _createGraph(state, g, c10)

    function zoomActions() {
      g.attr('transform', d3.event.transform)
    }
    const zoomHandler = d3zoom.zoom()
      .on('zoom', zoomActions)

    zoomHandler(svg)

    return {
      ...state,
      d3State: {
        c10,
        g,
        svg,
      },
    }
  }

  function _createGraph(state, g, c10) {
    const links = g.selectAll('.link')
      .data(state.data.links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('x1', function(l) {
        const sourceNode = state.data.nodes.filter(function(d, i) {
          return i == l.source
        })[0]
        d3.select(this).attr('y1', sourceNode.y)
        return sourceNode.x
      })
      .attr('x2', function(l) {
        const targetNode = state.data.nodes.filter(function(d, i) {
          return i == l.target
        })[0]
        d3.select(this).attr('y2', targetNode.y)
        return targetNode.x
      })
      .attr('fill', 'none')
      .attr('stroke', 'white')

    const drag = d3.drag()
      .on('drag', function(d, i) {
        d.x += d3.event.dx
        d.y += d3.event.dy
        d3.select(this).attr('cx', d.x).attr('cy', d.y)
        links.each(function(l) {
          if (l.source == i) {
            d3.select(this).attr('x1', d.x).attr('y1', d.y)
          } else if (l.target == i) {
            d3.select(this).attr('x2', d.x).attr('y2', d.y)
          }
        })
      })

    const nodes = g.selectAll('.node')
      .data(state.data.nodes)
      .enter()
      .append('circle')
      .attr('class', 'node')
      .attr('cx', function(d) {
        return d.x
      })
      .attr('cy', function(d) {
        return d.y
      })
      .attr('r', 10)
      .attr('fill', function(d, i) {
        return c10(i)
      })
      .call(drag)
      .on('click', () => {
        logger.debug('click on node')
      })
      .on('dblclick', () => {
        logger.debug('dblclick on node')
      })

    return {links, nodes}
  }

  return {state: _state, actions: _actions, view: _view, setDimensions, setData}
}
