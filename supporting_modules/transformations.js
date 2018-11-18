/**
 * Module used to get transforms of objects, as well as convert
 * from local to global coordinates
 * Local coordinates: the graph position(the coords to specify where nodes, links, etc are)
 * Global coordinates: the absolute position relative to the app width and height
 */

import { getLogger } from './../logger'
const logger = getLogger('transformations')

import { Globals } from './../supporting_modules/Globals'
import * as d3 from 'd3'

export function getTransform(obj) {
    let str = obj.attr('transform')
    const temp = str.substring(str.indexOf('(') + 1, str.indexOf(')')).split(',')
    str = str.substring(str.indexOf(')') + 1).trim()
    temp[2] = str.substring(str.indexOf('(') + 1, str.indexOf(')'))
    return [parseFloat(temp[0]), parseFloat(temp[1]), parseFloat(temp[2])]
}

export function localToGlobalCoord(coord) {
    const winSize = Globals.getWinSize()
    const temp = {
        x: document.documentElement.clientWidth * (coord.x - winSize.minX) / (winSize.maxX - winSize.minX),
        y: document.documentElement.clientHeight * (coord.y - winSize.minY) / (winSize.maxY - winSize.minY)
    }
    return temp
}

export function globalToLocalCoord(coord) {
    const winSize = Globals.getWinSize()
    const temp = {
        x: (coord.x / document.documentElement.clientWidth) * (winSize.maxX - winSize.minX) + winSize.minX,
        y: (coord.y / document.documentElement.clientHeight) * (winSize.maxY - winSize.minY) + winSize.minY
    }
    return temp
}
