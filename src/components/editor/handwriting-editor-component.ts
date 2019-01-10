import * as html from '@hyperapp/html'
import {getLogger} from '@lib/logger'
import {El, IGraphNodeData, NoteDataType} from '@lib/types'
import {emptyFunction} from '@lib/utils'
import classname from 'classnames'
import {ActionResult} from 'hyperapp'
import './handwriting-editor-component.css'
import { writeNote } from '@lib/io';

type CanvasContext = CanvasRenderingContext2D

const logger = getLogger('handwriting-editor-component')

enum Tool {
  ERASER,
  PEN,
}

export type IHandwritingEditorState = IState
export type IHandwritingEditorActions = IActions

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
  save: (data: {imageData: any, noteId: number}) => (compState: IState) => ActionResult<IState>
  setImage: (imageBytes: string) => (compState: IState, compActions: IActions)
    => ActionResult<IState>
  changeColor: (color: string) => () => ActionResult<IState>
  strokeWidthChange: (width: number) => () => ActionResult<IState>
  selectTool: (tool: Tool) => () => ActionResult<IState>
  canvasCreated: (el: HTMLCanvasElement) => () => ActionResult<IState>
  mouseDownOnCanvas: (event: MouseEvent) => () => ActionResult<IState>
  mouseUpOnCanvas: (args: {event: MouseEvent, noteId: number}) => (compState: IState, compActions: IActions) => ActionResult<IState>
  mouseMoveOnCanvas: (event: MouseEvent) => (compState: IState, compActions: IActions) => ActionResult<IState>
  done: () => () => ActionResult<IState>
  submit: () => (compState: IState, compActions: IActions)
    => Promise<ActionResult<IState>>
  updateCanvasSize: (size: {width: number, height: number})
    => (compState: IState, compActions: IActions)
    => ActionResult<IState>
  cancel: () => () => ActionResult<IState>
  uploadFile: () => (compState: IState) => ActionResult<IState>
  clearImage: () => (compState: IState) => ActionResult<IState>
}

const SIZE_INCREASE_THRESHOLD = 50;
const SIZE_INCREASE_ON_THRESHOLD_REACH = 150

export const state: IState = {
  selectedTool: Tool.PEN,
  canvasEl: null,
  canvasCtx: null,
  color: 'black',
  stroke_width: 2,
  isMouseDown: false,
  mouseLastLocation: [0, 0],
}

export const actions: IActions = {
  save: (data: {imageData: any, noteId: number}) => (compState: IState) => {
    writeNote(
      data.noteId,
      NoteDataType.HANDWRITING,
      data.imageData
    )
  },

  updateCanvasSize: (size: {width: number, height: number}) =>
  (state: IState, actions: IActions) => {

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

  setImage: (buffer: any) => (compState: IState, compActions: IActions) => {
    if (!compState.canvasCtx) return {}

    const base64Image = btoa(String.fromCharCode.apply(null, buffer));

    const image = new Image()
    image.onload = () => {
      const height = image.naturalHeight
      const width = image.naturalWidth
      compActions.updateCanvasSize({width, height})
      compState.canvasCtx!.drawImage(image, 0, 0)
    }
    image.src = `data:image/png;base64,${base64Image}`

    return {}
  },

  submit: () => (compState: IState, compActions: IActions) => {
    if (!compState.canvasEl) {
      return Promise.reject()
    }
    // TODO
    return Promise.reject()
  },

  done: () => () => {
    /* TODO: formalize the method by which editor can be accessed */
    const editor = document.getElementById('editor')
    if (editor) {
      editor.focus()
      // document.execCommand('insertText', false, result.text.trim())
    }

    return {
    }
  },

  cancel: () => () => {
    return { }
  },

  changeColor: (color: string) => () => ({color}),

  strokeWidthChange: (width: number) => () => ({stroke_width: width}),

  selectTool: (tool: Tool) => () => ({selectedTool: tool}),

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

  mouseUpOnCanvas: (args: {event: MouseEvent, noteId: number}) => (compState: IState, compActions: IActions) => {
    if (compState.canvasEl) {
      const dataURI = compState.canvasEl.toDataURL('image/png')

      const base64Data = dataURI.replace(/^data:image\/png;base64,/, '');
      const buffer = new Buffer(base64Data, 'base64')

      compActions.save({imageData:buffer, noteId: args.noteId})
    }

    return ({
      isMouseDown: false,
      event_type: args.event.type,
    })
  },

  mouseMoveOnCanvas: (event: MouseEvent) => (compState: IState, compActions: IActions) => {
    const newMouseLocation: [number, number] = [event.offsetX, event.offsetY]
    const nextState = {mouseLastLocation: newMouseLocation}

    if (compState.canvasEl === null || compState.canvasCtx === null)
      return logger.warn('Canvas is not initialized')

    if (!compState.isMouseDown) return nextState

    const ctx = compState.canvasCtx
    const canvasEl = compState.canvasEl

    const rect = canvasEl.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;// relative to canvas 0, 0
    const mouseY = event.clientY - rect.top; // relative to canvas 0, 0
    const canvasWidth = canvasEl.width
    const canvasHeight = canvasEl.height
    if (mouseX > canvasWidth - SIZE_INCREASE_THRESHOLD) {
      console.log('HEIGHT=', canvasHeight);
      compActions.updateCanvasSize({width: canvasWidth + SIZE_INCREASE_ON_THRESHOLD_REACH, height:canvasHeight})
    }

    if (mouseY > canvasHeight - SIZE_INCREASE_THRESHOLD) {
      compActions.updateCanvasSize({width:canvasWidth, height:canvasHeight + SIZE_INCREASE_ON_THRESHOLD_REACH})
    }


    switch (compState.selectedTool) {
      case Tool.PEN:
        ctx.strokeStyle
          = compState.selectedTool === Tool.PEN ? compState.color : 'white'
        ctx.lineWidth = Math.max(compState.stroke_width, 1)
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(...compState.mouseLastLocation)
        ctx.lineTo(...newMouseLocation)
        ctx.stroke()
        break
      case Tool.ERASER:
        const mouseX = compState.mouseLastLocation[0]
        const mouseY = compState.mouseLastLocation[1]
        const eraserSize = Math.max(compState.stroke_width, 1)
        const x = mouseX - eraserSize / 2
        const y = mouseY - eraserSize / 2
        const width = eraserSize
        const height = eraserSize
        ctx.clearRect(x, y, width, height)
        break
    }

    return nextState
  },

  uploadFile: () => (compState: IState) => {},
  clearImage: () => (compState: IState) => {
    if (compState.canvasCtx) {
      compState.canvasCtx.clearRect(
        0,
        0,
        compState.canvasCtx.canvas.width,
        compState.canvasCtx.canvas.height
      )
    }
  },

}

export default function view(compState: IState, compActions: IActions, noteId: number) {
  return html.div(
    {
      id: 'handwriting-editor-component',
      class: 'handwriting-editor-component-wrapper',
      onmouseup: (event: MouseEvent) => compActions.mouseUpOnCanvas({event, noteId}),
    },
    [
      html.div(
        {class: 'handwriting-editor-component-menu'},
        [
          html.button({onclick: compActions.uploadFile}, 'Upload File'),
          html.button({disabled: true, onclick: compActions.clearImage}, 'Clear'),
        ],
      ),
      html.div(
        {
          class: 'toolbox',
        },
        [
          html.div(
            {
              class: `tool ${compState.selectedTool === Tool.PEN ? 'tool_pen' : 'tool_eraser'}`,
              onclick: () => compActions.selectTool(compState.selectedTool === Tool.PEN ? Tool.ERASER : Tool.PEN),
            },
            [compState.selectedTool === Tool.PEN ? '✎' : '✗'],
          ),

          html.div({class: `handwriting-editor-size small ${compState.selectedTool === Tool.ERASER ? 'eraser' : 'pen'} ${compState.stroke_width === 2 ? 'selected' : ''}`, onclick: () => compActions.strokeWidthChange(2)}),
          html.div({class: `handwriting-editor-size medium ${compState.selectedTool === Tool.ERASER ? 'eraser' : 'pen'} ${compState.stroke_width === 16 ? 'selected' : ''}`, onclick: () => compActions.strokeWidthChange(16)}),
          html.div({class: `handwriting-editor-size large ${compState.selectedTool === Tool.ERASER ? 'eraser' : 'pen'} ${compState.stroke_width === 32 ? 'selected' : ''}`, onclick: () => compActions.strokeWidthChange(32)}),
          // html.input(
          //   {
          //     className: 'tool tool_stroke_width',
          //     type: 'range',
          //     min: 1,
          //     max: 100,
          //     value: compState.stroke_width,
          //     onchange: (event: Event) =>
          //       compActions.strokeWidthChange(
          //         +(event.target! as HTMLInputElement).value), // `+`: string -> number
          //   },
          // ),
          html.div(
            {class: 'palette'},
            [
              viewPaletteItem('white', () => compActions.changeColor('white')),
              viewPaletteItem('black', () => compActions.changeColor('black')),
              viewPaletteItem('red', () => compActions.changeColor('red')),
              viewPaletteItem('orange', () => compActions.changeColor('orange')),
              viewPaletteItem('yellow', () => compActions.changeColor('yellow')),
              viewPaletteItem('green', () => compActions.changeColor('green')),
              viewPaletteItem('blue', () => compActions.changeColor('blue')),
              viewPaletteItem('indigo', () => compActions.changeColor('indigo')),
              viewPaletteItem('violet', () => compActions.changeColor('violet')),
              viewPaletteItem(compState.color, emptyFunction, 'palette_current_color'),
            ],
          ),
        ],
      ),
      html.div(
        {
          class: 'handwriting-component-canvas-wrapper'
        },
        [
          html.canvas(
            {
              class: 'canvas',
              width: 400,
              height: 400,
              oncreate: (el: HTMLCanvasElement) => compActions.canvasCreated(el),
              onmousedown: (event: MouseEvent) => compActions.mouseDownOnCanvas(event),
              onmouseup: (event: MouseEvent) => compActions.mouseUpOnCanvas({event, noteId}),
              onmousemove: (event: MouseEvent) => compActions.mouseMoveOnCanvas(event),
            },
          ),
        ],
      )
    ],
  )
}

function viewPaletteItem(color: string, onclick: (el: El) => any, classNames?: string) {
  return html.div(
    {
      className: `palette_item palette_item_${color} ${classNames ? classNames : ''}`,
      onclick,
    },
  )
}
