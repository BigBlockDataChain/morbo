// Imports
import { getLogger } from './logger'
const logger = getLogger('default_module_template')

import { Globals } from './supporting_modules/Globals'
import * as d3 from 'd3'

// Always include this line so that the system loads it up upon startup
export const moduleName = 'DefaultModule'

// Use this function to initialize any variables, as well as define any
// global variables that are used if they are not already defined
export function start() {
    // Example
    if (Trans.getTransform(Globals.getGraph()) === null || Trans.getTransform(Globals.getGraph()) === undefined) {
        // Define global variable
    }
    return 1
}

// Use this function to add events and such to the system
export function update() {
    return 1
}

// Add classes and other functions here as needed


// Template without comments
// import { getLogger } from './../logger'
// const logger = getLogger('default_module_template')

// import { Globals } from './../supporting_modules/Globals'
// import * as d3 from 'd3'

// export const moduleName = 'NodeHighlight'

// export function start() {
//     return 1
// }
// export function update() {
//     return 1
// }
