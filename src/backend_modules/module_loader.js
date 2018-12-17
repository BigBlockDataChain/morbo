import { getLogger } from './../logger'
const logger = getLogger('module_loader')

import { Globals } from './../supporting_modules/Globals'

// All module imports
import * as GraphZoom from './../graph_modules/graph_zoom'
import * as NodeHighlight from './../graph_modules/node_highlight'
import * as DragNodes from './../graph_modules/drag_nodes'
import * as NodeCenter from './../graph_modules/center_node'
import * as GraphMove from './../graph_modules/graph_move'

// Holds all import objects
const modules = [
  NodeHighlight,
  GraphZoom,
  DragNodes,
  NodeCenter,
  GraphMove,
]

// Used to load all modules to be run in the system
export function loadModules() {
  const opt = Globals.getModuleRun()

  for (const i in opt) {
    if (opt[i] === true) {
      for (let j = 0; j < modules.length; j += 1) {
        if (i === modules[j].moduleName) {
          modules[j].start()
          modules[j].update()
          logger.debug(i + ' loaded')
        }
      }
    }
  }

  setTimeout(function () {
    logger.debug('Finished loading all modules')
  }, 100)

  return true
}
