/* eslint-disable max-statements */
import * as d3 from 'd3'

import { getLogger } from './logger'
const logger = getLogger('renderer')

import { Globals } from './supporting_modules/Globals'
import * as MLoader from './backend_modules/module_loader'

export function render(data, callbacks) {
    logger.debug('Drawing graph nodes and links')

    const svg = Globals.getSVG()
    const g = Globals.getGraph()
    const c10 = d3.scaleOrdinal(d3.schemeCategory10)

    const links = g.selectAll('.link')
        .data(data.links)
        .enter()

    Globals.setLinks(links)

    const lines = links.append('line')
        .attr('class', 'link')
        .attr('x1', function (l) {
            const sourceNode = data.nodes.filter(function (d, i) {
                return i == l.source
            })[0]
            d3.select(this).attr('y1', sourceNode.y)
            return sourceNode.x
        })
        .attr('x2', function (l) {
            const targetNode = data.nodes.filter(function (d, i) {
                return i == l.target
            })[0]
            d3.select(this).attr('y2', targetNode.y)
            return targetNode.x
        })
        .attr('fill', 'none')
        .attr('stroke', 'black')

    const nodes = g.attr('class', 'node')
        .selectAll('.node')
        .data(data.nodes)
        .enter()

    Globals.setNodes(nodes)

    const circles = nodes.append('circle')
        .attr('cx', function (d) {
            return d.x
        })
        .attr('cy', function (d) {
            return d.y
        })
        .attr('r', 10)
        .attr('fill', function (d, i) {
            return c10(i)
        })
        .attr('orig_color', function (d, i) {
            return c10(i)
        })
        // .on('click', (ev) => callbacks.onclick !== undefined ? callbacks.onclick(ev) : null)
        // .on('dblclick', (ev) =>
        //     callbacks.ondblclick !== undefined ? callbacks.ondblclick(ev) : null)
        // .on('dblclick.zoom', null)

    const labels = nodes.select('text')
        .data(data.nodes)
        .enter()

    Globals.setNodeLabels(labels)

    const textbox = labels.append('text')
        .text(d => d.content)
        .attr('x', d => d.x - d.content.length * 4)
        .attr('y', d => d.y - 10)
        .attr('font-size', 16)
        .attr('font-family', 'Arial')
        .attr('fill', 'blue')
        .attr('stroke', 'blue')
        .attr('stroke-width', 0.1)

        logger.debug()
        
    setTimeout(function () {
        MLoader.loadModules()
    }, 1000)

    return { links, nodes }
}
