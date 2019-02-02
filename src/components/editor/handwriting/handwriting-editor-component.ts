import * as html from '@hyperapp/html'
import { writeNote } from '@lib/io'
import {getLogger} from '@lib/logger'
import {NoteDataType} from '@lib/types'
import {ActionResult} from 'hyperapp'
import './handwriting-editor-component.css'
import Toolbox, {
  initialToolboxState,
  IToolboxActions,
  IToolboxState,
  Tool,
  toolboxActions,
} from './toolbox'

const logger = getLogger('handwriting-editor-component')

export type IHandwritingEditorState = IState
export type IHandwritingEditorActions = IActions

interface IState {
  toolbox: IToolboxState
  canvasEl: null | HTMLCanvasElement
  canvasCtx: null | CanvasRenderingContext2D
  isMouseDown: boolean
  mouseLastLocation: [number, number]
}

interface IActions {
  toolbox: IToolboxActions

  save: (data: {imageData: any, noteId: number}) =>
    (state: IState) =>
      ActionResult<IState>

  setImage: (imageBytes: string) => (state: IState, actions: IActions)
    => ActionResult<IState>

  canvasCreated: (element: HTMLCanvasElement) => () => ActionResult<IState>

  mouseDownOnCanvas: (event: MouseEvent) => () => ActionResult<IState>

  mouseUpOnCanvas: (args: {event: MouseEvent, noteId: number}) =>
    (state: IState, actions: IActions) =>
      ActionResult<IState>

  mouseMoveOnCanvas: (event: MouseEvent) =>
    (state: IState, actions: IActions) =>
      ActionResult<IState>

  updateCanvasSize: (size: {width: number, height: number}) =>
    (state: IState, actions: IActions) =>
      ActionResult<IState>

  clearImage: () =>
    (state: IState, actions: IActions) =>
      ActionResult<IState>
}

const SIZE_INCREASE_THRESHOLD = 150
const SIZE_INCREASE_ON_THRESHOLD_REACH = 500
const INITIAL_CANVAS_WIDTH = 400
const INITIAL_CANVAS_HEIGHT = 400

export const handwritingState: IState = {
  toolbox: initialToolboxState,
  canvasEl: null,
  canvasCtx: null,
  isMouseDown: false,
  mouseLastLocation: [0, 0],
}

export const handwritingActions: IActions = {
  toolbox: toolboxActions,

  save: (data: {imageData: any, noteId: number}) => (state: IState) => {
    writeNote(
      data.noteId,
      NoteDataType.HANDWRITING,
      data.imageData,
    )
  },

  updateCanvasSize: (size: {width: number, height: number}) =>
  (state: IState, _actions: IActions) => {

    if (state.canvasEl) {
      // get current image data
      const imageData = state.canvasCtx!.getImageData(
        0, 0, state.canvasEl.width, state.canvasEl.height,
      )

      logger.debug('Updating canvas size to', size.width, size.height)

      if (size.width) state.canvasEl.width = size.width
      if (size.height) state.canvasEl.height = size.height

      // restore image after resize
      state.canvasCtx!.putImageData(imageData, 0, 0)
    }

    return {}
  },

  setImage: (buffer: any) => (state: IState, actions: IActions) => {
    if (!state.canvasCtx) return {}

    const base64Image = btoa(String.fromCharCode.apply(null, buffer))

    const image = new Image()
    image.onload = () => {
      const height = image.naturalHeight
      const width = image.naturalWidth
      actions.updateCanvasSize({width, height})
      state.canvasCtx!.drawImage(image, 0, 0)
    }
    image.src = `data:image/png;base64,${base64Image}`

    return {}
  },

  canvasCreated: (el: HTMLCanvasElement) => () => {
    return ({
      canvasEl: el,
      canvasCtx: el.getContext('2d'),
    })
  },

  mouseDownOnCanvas: (event: MouseEvent) => () => {
    return ({
      mouseLastLocation: [event.offsetX, event.offsetY],
      isMouseDown: true,
      event_type: event.type,
    })
  },

  mouseUpOnCanvas: (args: {event: MouseEvent, noteId: number}) =>
    (state: IState, actions: IActions) => {
      if (state.canvasEl) {
        const dataURI = state.canvasEl.toDataURL('image/png')

        const base64Data = dataURI.replace(/^data:image\/png;base64,/, '')
        const buffer = new Buffer(base64Data, 'base64')

        actions.save({imageData: buffer, noteId: args.noteId})
      }

      return {
        isMouseDown: false,
        event_type: args.event.type,
      }
    },

  mouseMoveOnCanvas: (event: MouseEvent) => (state: IState, actions: IActions) => {
    const newMouseLocation: [number, number] = [event.offsetX, event.offsetY]
    const nextState = {mouseLastLocation: newMouseLocation}

    if (state.canvasEl === null || state.canvasCtx === null)
      return logger.warn('Canvas is not initialized')

    if (!state.isMouseDown) return nextState

    const ctx = state.canvasCtx
    const canvasEl = state.canvasEl

    const rect = canvasEl.getBoundingClientRect()
    const mouseX = event.clientX - rect.left// relative to canvas 0, 0
    const mouseY = event.clientY - rect.top // relative to canvas 0, 0
    const canvasWidth = canvasEl.width
    const canvasHeight = canvasEl.height
    if (mouseX > canvasWidth - SIZE_INCREASE_THRESHOLD) {
      logger.debug('HEIGHT=', canvasHeight)
      actions.updateCanvasSize({
        width: canvasWidth + SIZE_INCREASE_ON_THRESHOLD_REACH,
        height: canvasHeight,
      })
    }

    if (mouseY > canvasHeight - SIZE_INCREASE_THRESHOLD) {
      actions.updateCanvasSize({
        width: canvasWidth,
        height: canvasHeight + SIZE_INCREASE_ON_THRESHOLD_REACH,
      })
    }

    switch (state.toolbox.selectedTool) {
      case Tool.PEN:
        ctx.strokeStyle
          = state.toolbox.selectedTool === Tool.PEN ? state.toolbox.color : 'white'
        ctx.lineWidth = Math.max(state.toolbox.stroke_width, 1)
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(...state.mouseLastLocation)
        ctx.lineTo(...newMouseLocation)
        ctx.stroke()
        break
      case Tool.ERASER:
        const mouseX_ = state.mouseLastLocation[0]
        const mouseY_ = state.mouseLastLocation[1]
        const eraserSize = Math.max(state.toolbox.stroke_width, 1)
        const x = mouseX_ - eraserSize / 2
        const y = mouseY_ - eraserSize / 2
        const width = eraserSize
        const height = eraserSize
        ctx.clearRect(x, y, width, height)
        break
    }

    return nextState
  },

  clearImage: () => (state: IState, actions: IActions) => {
    if (state.canvasCtx) {
      state.canvasCtx.clearRect(
        0,
        0,
        state.canvasCtx.canvas.width,
        state.canvasCtx.canvas.height,
      )

      actions.updateCanvasSize({
        width: INITIAL_CANVAS_WIDTH,
        height: INITIAL_CANVAS_HEIGHT,
      })
    }
  },

}

export default function view(state: IState, actions: IActions, noteId: number) {
  return html.div(
    {
      id: 'handwriting-editor-component',
      class: 'handwriting-editor-component-wrapper',
      onmouseup: (event: MouseEvent) => actions.mouseUpOnCanvas({event, noteId}),
    },
    [
      html.div({
        class: 'handwriting-editor-component-menu-wrapper',
      }, [
        html.div(
          {class: 'handwriting-editor-component-menu'},
          [
            html.button({onclick: actions.clearImage}, '♻'),
            Toolbox(state.toolbox, actions.toolbox),
          ],
        ),
      ]),

      html.div(
        {
          class: 'handwriting-component-canvas-wrapper',
        },
        [
          html.canvas(
            {
              class: 'canvas',
              width: INITIAL_CANVAS_WIDTH,
              height: INITIAL_CANVAS_HEIGHT,
              oncreate: (el: HTMLCanvasElement) => actions.canvasCreated(el),
              onmousedown: (event: MouseEvent) => actions.mouseDownOnCanvas(event),
              onmouseup: (event: MouseEvent) => actions.mouseUpOnCanvas({event, noteId}),
              onmousemove: (event: MouseEvent) => actions.mouseMoveOnCanvas(event),
            },
          ),
        ],
      ),
    ],
  )
}
