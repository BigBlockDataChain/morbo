/**
 * The ultimate class that holds all global variables during runtime.
 * These values are read from the database during startup and must
 * then be stored back in the database on shutdown of the system
 */
export class Globals {
    // SVG element that is drawn on
    static setSVG(i) { this.svg = i }

    static getSVG() { return this.svg }

    // Graph that holds all nodes, links, etc
    static setGraph(i) { this.graph = i }

    static getGraph() { return this.graph }

    // Sets which modules should run upon startup
    static setModuleRun(i) { this.mRun = i }

    static getModuleRun() { return this.mRun }

    // Min and max height and width in local coordinates,
    // that dictates whether a drawn object will be seen
    static setWinSize(i) { this.winSize = i }

    static getWinSize() { return this.winSize }

    // Holds all nodes and their data
    static setNodes(i) { this.nodes = i }

    static getNodes() { return this.nodes }

    // Holds all links and their data
    static setLinks(i) { this.linkss = i }

    static getLinks() { return this.linkss }

    // Holds all node labels
    static setNodeLabels(i) { this.nodeLabels = i }

    static getNodeLabels() { return this.nodeLabels }

    // Holds zoom handler
    static setZoomHandler(i) { this.zoomHandler = i }

    static getZoomHandler() { return this.zoomHandler }
}
