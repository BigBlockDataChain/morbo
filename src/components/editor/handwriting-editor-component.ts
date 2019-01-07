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
  save: (imageData: any, noteId: number) => (compState: IState) => ActionResult<IState>
  setImage: (imageBytes: string) => (compState: IState, compActions: IActions)
    => ActionResult<IState>
  changeColor: (color: string) => () => ActionResult<IState>
  strokeWidthChange: (width: number) => () => ActionResult<IState>
  selectTool: (tool: Tool) => () => ActionResult<IState>
  canvasCreated: (el: HTMLCanvasElement) => () => ActionResult<IState>
  mouseDownOnCanvas: (event: MouseEvent) => () => ActionResult<IState>
  mouseUpOnCanvas: (event: MouseEvent, noteId: number) => (compState: IState, compActions: IActions) => ActionResult<IState>
  mouseMoveOnCanvas: (event: MouseEvent) => (compState: IState) => ActionResult<IState>
  done: () => () => ActionResult<IState>
  submit: () => (compState: IState, compActions: IActions)
    => Promise<ActionResult<IState>>
  cancel: () => () => ActionResult<IState>
}

const BASE64_MARKER = ';base64,';

function convertDataURIToBinary(dataURI: string) {
  const base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length
  const base64 = dataURI.substring(base64Index)
  const raw = window.atob(base64)
  const rawLength = raw.length
  const array = new Uint8Array(new ArrayBuffer(rawLength))

  for(let i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i)
  }
  return array
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
  save: (imageData: any, noteId: number) => (compState: IState) => {
    writeNote(
      noteId,
      NoteDataType.HANDWRITING,
      imageData
    )
  },

  setImage: (imageBytes: any) => (compState: IState, compActions: IActions) => {
    if (!compState.canvasCtx) return {}

    const base64Image = btoa(String.fromCharCode.apply(null, imageBytes));

    const image = new Image()
    image.onload = () => {
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

  mouseUpOnCanvas: (event: MouseEvent, noteId: number) => (compState: IState, compActions: IActions) => {
    if (compState.canvasEl) {
      const imageData = compState.canvasEl.toDataURL('image/png')

      compActions.save(imageData, noteId)
    }

    return ({
      isMouseDown: false,
      event_type: event.type,
    })
  },

  mouseMoveOnCanvas: (event: MouseEvent) => (compState: IState) => {
    const newMouseLocation: [number, number] = [event.offsetX, event.offsetY]
    const nextState = {mouseLastLocation: newMouseLocation}

    if (compState.canvasEl === null || compState.canvasCtx === null)
      return logger.warn('Canvas is not initialized')

    if (!compState.isMouseDown) return nextState

    const ctx = compState.canvasCtx

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
}

export default function view(compState: IState, compActions: IActions, noteId: number) {
  console.log(noteId)

  return html.div(
    {
      id: 'handwriting-editor-component',
      class: 'handwriting-editor-component-wrapper',
      onmouseup: (event: MouseEvent) => compActions.mouseUpOnCanvas(event, noteId),
    },
    [
      html.div(
        {
          class: 'toolbox',
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
            {class: 'palette'},
            [
              viewPaletteItem(compState.color, emptyFunction, 'palette_current_color'),
              viewPaletteItem('white', () => compActions.changeColor('white')),
              viewPaletteItem('black', () => compActions.changeColor('black')),
              viewPaletteItem('red', () => compActions.changeColor('red')),
              viewPaletteItem('green', () => compActions.changeColor('green')),
              viewPaletteItem('blue', () => compActions.changeColor('blue')),
            ],
          ),
          html.br(),
          html.div(
            {class: 'ocr'},
            [
              html.button({onclick: compActions.submit}, 'Insert'),
              html.button({onclick: compActions.cancel}, 'Cancel'),
            ],
          ),
        ],
      ),
      html.canvas(
        {
          class: 'canvas',
          width: 400,
          height: 400,
          oncreate: (el: HTMLCanvasElement) => compActions.canvasCreated(el),
          onmousedown: (event: MouseEvent) => compActions.mouseDownOnCanvas(event),
          onmouseup: (event: MouseEvent) => compActions.mouseUpOnCanvas(event, noteId),
          onmousemove: (event: MouseEvent) => compActions.mouseMoveOnCanvas(event),
        },
      ),
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
