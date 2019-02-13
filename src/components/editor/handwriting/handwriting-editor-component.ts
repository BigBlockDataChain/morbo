import * as html from '@hyperapp/html'
import classNames from 'classnames'
import {ActionResult} from 'hyperapp'
import {Subject} from 'rxjs'

import {getLogger} from '@lib/logger'
import {GraphNodeId} from '@lib/types'
import './handwriting-editor-component.css'

const logger = getLogger('handwriting-editor-component')

const INITIAL_CANVAS_WIDTH = 1024
const INITIAL_CANVAS_HEIGHT = 910

enum Tool {
  ERASER = 'ERASER',
  PEN = 'PEN',
}

interface IState {
  canvasEl: null | HTMLCanvasElement
  canvasCtx: null | CanvasRenderingContext2D
  selectedTool: Tool
  color: string
  width: number
  isMouseDown: boolean
  mouseLastLocation: [number, number]
}

interface IActions {
  setImage: (imageBytes: string) => (state: IState, actions: IActions)
    => ActionResult<IState>

  getImage: (callback: (data: any) => void) => (state: IState) => ActionResult<IState>,

  _canvasCreated: (element: HTMLCanvasElement) => () => ActionResult<IState>

  _mouseDownOnCanvas: (ev: MouseEvent) => () => ActionResult<IState>

  _mouseUpOnCanvas: () =>
    (state: IState, actions: IActions) =>
      ActionResult<IState>

  _mouseMoveOnCanvas: (event: MouseEvent) =>
    (state: IState, actions: IActions) =>
      ActionResult<IState>

  _setColor: (color: string) => () => ActionResult<IState>,

  _setSize: (size: string) => () => ActionResult<IState>,

  _setTool: (tool: Tool) => () => ActionResult<IState>,
}

export const componentState: IState = {
  canvasEl: null,
  canvasCtx: null,
  isMouseDown: false,
  selectedTool: Tool.PEN,
  color: 'black',
  width: 2,
  mouseLastLocation: [0, 0],
}

export const componentActions: IActions = {
  setImage: (buffer: any) => (state: IState, actions: IActions) => {
    if (!state.canvasCtx) return

    const base64Image = btoa(String.fromCharCode.apply(null, buffer))

    const image = new Image()
    image.onload = () => {
      state.canvasCtx!.drawImage(image, 0, 0)
    }
    image.src = `data:image/png;base64,${base64Image}`
  },

  getImage: (callback: (data: any) => void) => (state: IState) => {
    const dataURI = state.canvasEl!.toDataURL('image/png')

    const base64Data = dataURI.replace(/^data:image\/png;base64,/, '')
    const buffer = new Buffer(base64Data, 'base64')
    callback(buffer)
  },

  _canvasCreated: (canvas: HTMLCanvasElement) => () => {
    logger.debug('creating handwriting canvas')
    canvas.width = INITIAL_CANVAS_WIDTH
    canvas.height = INITIAL_CANVAS_HEIGHT
    const ctx = canvas.getContext('2d')

    return ({
      canvasEl: canvas,
      canvasCtx: ctx,
    })
  },

  _mouseDownOnCanvas: (ev: MouseEvent) => () => {
    return ({
      mouseLastLocation: [ev.offsetX, ev.offsetY],
      isMouseDown: true,
    })
  },

  _mouseUpOnCanvas: () => (state: IState, actions: IActions) => {
    return {
      isMouseDown: false,
    }
  },

  _mouseMoveOnCanvas: (ev: MouseEvent) => (state: IState, actions: IActions) => {
    const newMouseLocation: [number, number] = [ev.offsetX, ev.offsetY]
    const nextState = {mouseLastLocation: newMouseLocation}

    if (state.canvasEl === null || state.canvasCtx === null)
      return logger.warn('Canvas is not initialized')

    if (!state.isMouseDown) return nextState

    const ctx = state.canvasCtx

    switch (state.selectedTool) {
      case Tool.PEN:
        ctx.strokeStyle = state.color
        ctx.lineWidth = state.width
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(...state.mouseLastLocation)
        ctx.lineTo(...newMouseLocation)
        ctx.stroke()
        break
      case Tool.ERASER:
        const mouseX_ = state.mouseLastLocation[0]
        const mouseY_ = state.mouseLastLocation[1]
        const eraserSize = state.width * 4
        const x = mouseX_ - eraserSize / 2
        const y = mouseY_ - eraserSize / 2
        const width = eraserSize
        const height = eraserSize
        ctx.clearRect(x, y, width, height)
        break
    }

    return nextState
  },

  _setColor: (color: string) => () => ({color}),

  _setSize: (size: string) => () => {
    switch (size) {
      case 'xs': return {width: 1}
      case 's': return {width: 2}
      case 'm': return {width: 4}
      case 'l': return {width: 8}
      case 'xl': return {width: 16}
    }
  },

  _setTool: (tool: Tool) => () => ({selectedTool: tool}),
}

export function view(
  state: IState,
  actions: IActions,
  noteId: GraphNodeId,
  saveSubject: Subject<void>,
) {
  return html.div(
    {
      id: 'handwriting-editor-component',
      class: 'handwriting-editor-component-wrapper',
      onmouseup: (ev: MouseEvent) => actions._mouseUpOnCanvas(),
    },
    [
      menuView(state, actions),
      canvasView(state, actions, noteId, saveSubject),
    ],
  )
}

function menuView(state: IState, actions: IActions) {
  return html.div(
    {class: 'handwriting-editor-component-menu'},
    [
      html.div(
        {id: 'tools'},
        [
          toolIcon(
            'Pen', state.selectedTool === Tool.PEN, () => actions._setTool(Tool.PEN)),
          toolIcon(
            'Eraser',
            state.selectedTool === Tool.ERASER,
            () => actions._setTool(Tool.ERASER),
          ),
          toolIcon('Size-xs', state.width === 1, () => actions._setSize('xs')),
          toolIcon('Size-s', state.width === 2, () => actions._setSize('s')),
          toolIcon('Size-m', state.width === 4, () => actions._setSize('m')),
          toolIcon('Size-l', state.width === 8, () => actions._setSize('l')),
          toolIcon('Size-xl', state.width === 16, () => actions._setSize('xl')),
        ],
      ),
      html.div(
        {id: 'colors'},
        [
          colorIcon('black', state.color === 'black', () => actions._setColor('black')),
          colorIcon('gray', state.color === 'gray', () => actions._setColor('gray')),
          colorIcon('blue', state.color === 'blue', () => actions._setColor('blue')),
          colorIcon('green', state.color === 'green', () => actions._setColor('green')),
          colorIcon('red', state.color === 'red', () => actions._setColor('red')),
        ],
      ),
    ],
  )
}

function colorIcon(color: string, selected: boolean, onClick: () => any) {
  return html.div({
    class: classNames('icon color-icon', {selected}),
    onclick: () => onClick(),
    style: {background: color},
  })
}

function toolIcon(label: string, selected: boolean, onClick: () => any) {
  return html.div(
    {
      class: classNames('icon', 'tool-icon', {selected}),
      onclick: () => onClick(),
    },
    label,
  )
}

function canvasView(
  state: IState,
  actions: IActions,
  noteId: GraphNodeId,
  saveSubject: Subject<void>,
) {
  return html.div(
    {id: 'handwriting-component-canvas-wrapper'},
    [
      html.canvas(
        {
          class: 'canvas',
          width: INITIAL_CANVAS_WIDTH,
          height: INITIAL_CANVAS_HEIGHT,
          oncreate: (el: HTMLCanvasElement) => actions._canvasCreated(el),
          onmousedown: (ev: MouseEvent) => actions._mouseDownOnCanvas(ev),
          onmouseup: (ev: MouseEvent) => {
            actions._mouseUpOnCanvas()
            saveSubject.next()
          },
          onmousemove: (ev: MouseEvent) => actions._mouseMoveOnCanvas(ev),
        },
      ),
    ],
  )
}
