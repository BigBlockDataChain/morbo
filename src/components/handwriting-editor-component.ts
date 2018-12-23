import * as html from '@hyperapp/html'
import classname from 'classnames'
import {ActionResult} from 'hyperapp'

import {getLogger} from '../logger'
import {El} from '../types'
import {emptyFunction} from '../utils'

type CanvasContext = CanvasRenderingContext2D

const logger = getLogger('handwriting-editor-component')

enum Tool {
  ERASER,
  PEN,
}

interface IState {
  selectedTool: Tool
  canvasEl: null | HTMLCanvasElement
  canvasCtx: null | CanvasContext
  color: string
  stroke_width: number
  isMouseDown: boolean
  mouseLastLocation: [number, number]
}

interface IActions {
  changeColor: (color: string) => () => ActionResult<IState>
  strokeWidthChange: (width: number) => () => ActionResult<IState>
  selectTool: (tool: Tool) => () => ActionResult<IState>
  canvasCreated: (el: HTMLCanvasElement) => () => ActionResult<IState>
  mouseDownOnCanvas: (event: MouseEvent) => () => ActionResult<IState>
  mouseUpOnCanvas: (event: MouseEvent) => () => ActionResult<IState>
  mouseMoveOnCanvas: (event: MouseEvent) => (compState: IState) => ActionResult<IState>
}

export const state: IState = {
  selectedTool: Tool.PEN,
  canvasEl: null,
  canvasCtx: null,
  color: 'black',
  stroke_width: 3,
  isMouseDown: false,
  mouseLastLocation: [0, 0],
}

export const actions: IActions = {
  changeColor: (color: string) => () => ({color}),

  strokeWidthChange: (width: number) => () => ({stroke_width: width}),

  selectTool: (tool: Tool) => () => ({selectedTool: tool}),

  canvasCreated: (el: HTMLCanvasElement) => () => ({
    canvasEl: el,
    canvasCtx: el.getContext('2d'),
  }),

  mouseDownOnCanvas: (event: MouseEvent) => () => ({
    mouseLastLocation: [event.offsetX, event.offsetY],
    isMouseDown: true,
    event_type: event.type,
  }),

  mouseUpOnCanvas: (event: MouseEvent) => () => ({
    isMouseDown: false,
    event_type: event.type,
  }),

  mouseMoveOnCanvas: (event: MouseEvent) => (compState: IState) => {
    const newMouseLocation: [number, number] = [event.offsetX, event.offsetY]
    const nextState = {mouseLastLocation: newMouseLocation}

    if (compState.canvasEl === null || compState.canvasCtx === null)
      return logger.warn('Canvas is not initialized')

    if (!compState.isMouseDown) return nextState

    const ctx = compState.canvasCtx

    ctx.strokeStyle
      = compState.selectedTool === Tool.PEN ? compState.color : 'white'
    ctx.lineWidth = compState.stroke_width
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(...compState.mouseLastLocation)
    ctx.lineTo(...newMouseLocation)
    ctx.stroke()

    return nextState
  },
}

export function view(compState: IState, compActions: IActions) {
  return html.div(
    {
      onmouseup: (event: MouseEvent) => compActions.mouseUpOnCanvas(event),
    },
    [
      html.div(
        {
          id: 'toolbox',
        },
        [
          html.div(
            {
              className: classname(
                'tool',
                'tool_pen',
                {'tool-active': compState.selectedTool === Tool.PEN},
              ),
              onclick: () => compActions.selectTool(Tool.PEN),
            },
            ['✎'],
          ),
          html.div(
            {
              className: classname(
                'tool',
                'tool_eraser',
                {'tool-active': compState.selectedTool === Tool.ERASER},
              ),
              onclick: () => compActions.selectTool(Tool.ERASER),
            },
            ['✗'],
          ),
          html.input(
            {
              className: 'tool tool_stroke_width',
              type: 'range',
              min: 1,
              max: 100,
              value: compState.stroke_width,
              onchange: (event: Event) =>
                compActions.strokeWidthChange(
                  +(event.target! as HTMLInputElement).value), // `+`: string -> number
            },
          ),
          html.div(
            {id: 'palette'},
            [
              viewPaletteItem(compState.color, emptyFunction, 'palette_current_color'),
              viewPaletteItem('white', () => compActions.changeColor('white')),
              viewPaletteItem('black', () => compActions.changeColor('black')),
              viewPaletteItem('red', () => compActions.changeColor('red')),
              viewPaletteItem('green', () => compActions.changeColor('green')),
              viewPaletteItem('blue', () => compActions.changeColor('blue')),
            ],
          ),
        ],
      ),
      html.canvas(
        {
          id: 'canvas',
          width: 400,
          height: 400,
          oncreate: (el: HTMLCanvasElement) => compActions.canvasCreated(el),

          onmousedown: (event: MouseEvent) => compActions.mouseDownOnCanvas(event),
          onmouseup: (event: MouseEvent) => compActions.mouseUpOnCanvas(event),
          onmousemove: (event: MouseEvent) => compActions.mouseMoveOnCanvas(event),
        },
      ),
    ],
  )
}

function viewPaletteItem(color: string, onclick: (el: El) => any, classNames?: string) {
  return html.div(
    {
      className: `palette_item palette_item_${color} ` + classNames,
      onclick,
    },
  )
}
