import * as html from '@hyperapp/html'
import {getLogger} from '@lib/logger'
import {El, IGraphNodeData} from '@lib/types'
import {emptyFunction} from '@lib/utils'
import classname from 'classnames'
import {ActionResult} from 'hyperapp'
import './handwriting-editor-component.css'
import { fabric } from 'fabric'

type CanvasContext = CanvasRenderingContext2D

const logger = getLogger('handwriting-editor-component')

enum Tool {
  ERASER,
  PEN,
}

export type IHandwritingEditorState = IState
export type IHandwritingEditorActions = IActions

interface IState {
  imageBytes?: any,
  canvas?: fabric.Canvas
  selectedTool: Tool
  canvasEl: null | HTMLCanvasElement
  canvasCtx: null | CanvasContext
  color: string
  stroke_width: number
}

interface IActions {
  setImage: (imageBytes: any) => () => ActionResult<IState>
  changeColor: (color: string) => (compState: IState) => ActionResult<IState>
  strokeWidthChange: (width: number) => (compState: IState) => ActionResult<IState>
  selectTool: (tool: Tool) => (compState: IState) => ActionResult<IState>
  canvasCreated: (el: HTMLCanvasElement) => (compState: IState) => ActionResult<IState>
  save: () => () => ActionResult<IState>
  done: () => () => ActionResult<IState>
  submit: () => (compState: IState, compActions: IActions)
    => Promise<ActionResult<IState>>
  cancel: () => () => ActionResult<IState>
}

export const state: IState = {
  selectedTool: Tool.PEN,
  canvasEl: null,
  canvasCtx: null,
  color: 'black',
  stroke_width: 3,
}

export const actions: IActions = {
  save: () => () => {
    /* TODO: save png */

  },

  setImage: (imageBytes: any) => () => ({ imageBytes }),

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

  changeColor: (color: string) => (compState: IState) => {
    if (compState.canvas) {
      compState.canvas.freeDrawingColor = color
    }

    return {color}
  },

  strokeWidthChange: (width: number) => (compState: IState) => {
    if (compState.canvas) {
      compState.canvas.freeDrawingLineWidth = width
    }

    return {stroke_width: width}
  },

  selectTool: (tool: Tool) => (compState: IState) => {
    if (compState.canvas) {
      compState.canvas.isDrawingMode = tool === Tool.PEN
    }

    return {selectedTool: tool}
  },

  canvasCreated: (el: HTMLCanvasElement) => (compState: IState) => {
    console.log('CREATED....', el)
    const canvas = new fabric.Canvas('handwriting-canvas', {
      isDrawingMode: compState.selectedTool === Tool.PEN,
      freeDrawingColor: compState.color,
      freeDrawingLineWidth: compState.stroke_width,
    })
    canvas.setWidth(el.clientWidth)

    let obj = {} as any

    // zooming/panning
    canvas.on('mouse:down', function(opt: any) {
      var evt = opt.e
      if (evt.altKey === true) {
        obj.isDragging = true
        obj.selection = false
        obj.lastPosX = evt.clientX
        obj.lastPosY = evt.clientY
      }
    })
    canvas.on('mouse:move', function(opt: any) {
      if (obj.isDragging) {
        var e = opt.e
        obj.viewportTransform[4] += e.clientX - obj.lastPosX
        obj.viewportTransform[5] += e.clientY - obj.lastPosY
        obj.requestRenderAll()
        obj.lastPosX = e.clientX
        obj.lastPosY = e.clientY
      }
    })
    canvas.on('mouse:up', function(opt: any) {
      obj.isDragging = false
      obj.selection = true
    })

    canvas.on('mouse:wheel', function(opt: any) {
      const delta = opt.e.deltaY
      const pointer = canvas.getPointer(opt.e)
      var zoom = canvas.getZoom()
      zoom = zoom + delta/200
      if (zoom > 20) zoom = 20
      if (zoom < 0.01) zoom = 0.01
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY } as any, zoom)
      opt.e.preventDefault()
      opt.e.stopPropagation()
    })

    if (compState.imageBytes) {
      // Load existing image into the canvas
      const imageBytes = compState.imageBytes
      if (!compState.canvasCtx) return {}

      const base64Image = btoa(String.fromCharCode.apply(null, imageBytes))

      const image = new Image()
      image.onload = () => {
        compState.canvasCtx!.drawImage(image, 0, 0)
      }
      image.src = `data:image/png;base64,${base64Image}`
    }

    return ({
      canvas,
      canvasEl: el,
      canvasCtx: el.getContext('2d'),
    })
  },
}

export default function view(compState: IState, compActions: IActions) {
  return html.div(
    {
      id: 'handwriting-editor-component',
      class: 'handwriting-editor-component-wrapper',
      // onmouseup: compActions.save,
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
          id: 'handwriting-canvas',
          class: 'canvas',
          oncreate: (el: HTMLCanvasElement) => compActions.canvasCreated(el),
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
