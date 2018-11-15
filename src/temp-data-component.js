import * as html from '@hyperapp/html'

let nodes = [{
    nodeId: 1,
    name: 'N1',
    x: 300,
    y: 150,
    content: 'blank1',
}, {
    nodeId: 2,
    name: 'N2',
    x: 140,
    y: 300,
    content: 'blank2',
}, {
    nodeId: 3,
    name: 'N3',
    x: 300,
    y: 300,
    content: 'blank3',
}, {
    nodeId: 4,
    name: 'N4',
    x: 300,
    y: 180,
    content: 'blank4',
}]

let links = [{
        source: 0,
        target: 1,
    }, {
        source: 1,
        target: 2,
    }, {
        source: 2,
        target: 3,
    }]

export function retrieveNodes() {
    return {nodes}
}
