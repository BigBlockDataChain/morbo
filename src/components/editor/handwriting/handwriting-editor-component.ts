
import * as html from '@hyperapp/html'
import {getLogger} from '@lib/logger'
import {NoteDataType} from '@lib/types'
import {ActionResult} from 'hyperapp'
import './handwriting-editor-component.css'
import { writeNote } from '@lib/io';
import Toolbox, {
  Tool,
  initialToolboxState,
  toolboxActions,
  IToolboxState,
  IToolboxActions
} from './toolbox'
import { LANGUAGES } from '../ocr/languages';
import {Page, Progress} from 'tesseract.js'
const tesseract = require('../../../../node_modules/tesseract.js/dist/tesseract.js')

const logger = getLogger('handwriting-editor-component')

export type IHandwritingEditorState = IState
export type IHandwritingEditorActions = IActions

interface IState {
  toolbox: IToolboxState
  canvasEl: null | HTMLCanvasElement
  canvasCtx: null | CanvasRenderingContext2D
  isMouseDown: boolean
  mouseLastLocation: [number, number]
  ocrProgress: Progress | null
  modified: boolean
}

interface IActions {
  toolbox: IToolboxActions
  save: (data: {imageData: any, noteId: number}) => (state: IState, actions: IActions) => Promise<ActionResult<IState>>
  setImage: (imageBytes: string) => (state: IState, actions: IActions)
    => ActionResult<IState>
  canvasCreated: (element: HTMLCanvasElement) => () => ActionResult<IState>
  mouseDownOnCanvas: (event: MouseEvent) => () => ActionResult<IState>
  mouseUpOnCanvas: (args: {event: MouseEvent, noteId: number}) => (state: IState, actions: IActions) => ActionResult<IState>
  mouseMoveOnCanvas: (event: MouseEvent) => (state: IState, actions: IActions) => ActionResult<IState>
  updateCanvasSize: (size: {width: number, height: number})
    => (state: IState, actions: IActions)
    => ActionResult<IState>
  clearImage: () => (state: IState, actions: IActions) => ActionResult<IState>
  runOCR: () => (state: IState, actions: IActions) => Promise<Page | null>
  updateProgress: (progress: Progress | null) => () => ActionResult<IState>
  setModified: (modified: boolean) => () => ActionResult<IState>
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
  ocrProgress: null,
  modified: false
}

export const handwritingActions: IActions = {
  toolbox: toolboxActions,

  updateProgress: (progress: Progress | null) => () => {
    return {
      ocrProgress: progress,
    }
  },

  setModified: (modified: boolean) => () => {
    return { modified }
  },

  save: (args: {imageData: any, noteId: number}) => async (state: IState, actions: IActions) => {
    writeNote(
      args.noteId,
      NoteDataType.HANDWRITING,
      args.imageData
    )

    actions.setModified(false)
  },

  runOCR: () => async (state: IState, actions: IActions) => {
    /* tesseract.recognize doesn't return a promise -- it needs to be wrapped*/
    return new Promise((resolve, reject) => {
      tesseract.recognize(state.canvasEl, {lang: LANGUAGES.English.langCode})
        .progress((p: Progress) => actions.updateProgress(p))
        .catch(() => reject(null))
        .then((r: Page) => { actions.updateProgress(null); resolve(r) })
    })
  },

  updateCanvasSize: (size: {width: number, height: number}) =>
  (state: IState, _actions: IActions) => {

    if (state.canvasEl) {
      // get current image data
      const imageData = state.canvasCtx!.getImageData(
        0, 0, state.canvasEl.width, state.canvasEl.height
      )

      console.log('Updating canvas size to', size.width, size.height);

      if (size.width) state.canvasEl.width = size.width
      if (size.height) state.canvasEl.height = size.height

      // restore image after resize
      state.canvasCtx!.putImageData(imageData, 0, 0)
    }

    return {}
  },

  setImage: (buffer: any) => (state: IState, actions: IActions) => {
    if (!state.canvasCtx) return {}

    const base64Image = btoa(String.fromCharCode.apply(null, buffer));

    const image = new Image()
    image.onload = () => {
      const height = image.naturalHeight
      const width = image.naturalWidth
      actions.updateCanvasSize({width, height})
      state.canvasCtx!.drawImage(image, 0, 0)
    }
    image.src = `data:image/png;base64,${base64Image}`

    return {modified: false}
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

  mouseUpOnCanvas: (args: {event: MouseEvent, noteId: number}) => (state: IState, actions: IActions) => {
    return ({
      isMouseDown: false,
      event_type: args.event.type,
    })
  },

  mouseMoveOnCanvas: (event: MouseEvent) => (state: IState, actions: IActions) => {
    const newMouseLocation: [number, number] = [event.offsetX, event.offsetY]
    const nextState = {mouseLastLocation: newMouseLocation}

    if (state.canvasEl === null || state.canvasCtx === null)
      return logger.warn('Canvas is not initialized')

    if (!state.isMouseDown) return nextState

    const ctx = state.canvasCtx
    const canvasEl = state.canvasEl

    const rect = canvasEl.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;// relative to canvas 0, 0
    const mouseY = event.clientY - rect.top; // relative to canvas 0, 0
    const canvasWidth = canvasEl.width
    const canvasHeight = canvasEl.height
    if (mouseX > canvasWidth - SIZE_INCREASE_THRESHOLD) {
      console.log('HEIGHT=', canvasHeight);
      actions.updateCanvasSize({width: canvasWidth + SIZE_INCREASE_ON_THRESHOLD_REACH, height:canvasHeight})
    }

    if (mouseY > canvasHeight - SIZE_INCREASE_THRESHOLD) {
      actions.updateCanvasSize({width:canvasWidth, height:canvasHeight + SIZE_INCREASE_ON_THRESHOLD_REACH})
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
        const mouseX = state.mouseLastLocation[0]
        const mouseY = state.mouseLastLocation[1]
        const eraserSize = Math.max(state.toolbox.stroke_width, 1)
        const x = mouseX - eraserSize / 2
        const y = mouseY - eraserSize / 2
        const width = eraserSize
        const height = eraserSize
        ctx.clearRect(x, y, width, height)
        break
    }

    return {
      ...nextState,
      modified: true
    }
  },

  clearImage: () => (state: IState, actions: IActions) => {
    if (state.canvasCtx) {
      state.canvasCtx.clearRect(
        0,
        0,
        state.canvasCtx.canvas.width,
        state.canvasCtx.canvas.height
      )

      actions.updateCanvasSize({width: INITIAL_CANVAS_WIDTH, height: INITIAL_CANVAS_HEIGHT})
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
        class: 'handwriting-editor-component-menu-wrapper'
      }, [
        html.div(
          {class: 'handwriting-editor-component-menu'},
          [
            html.button({onclick: actions.clearImage}, '♻'),
            Toolbox(state.toolbox, actions.toolbox)
          ],
        ),
      ]),

      html.div(
        {
          class: 'handwriting-component-canvas-wrapper'
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
      )
    ],
  )
}
