import * as html from '@hyperapp/html'
import {getLogger} from '@lib/logger'
import {ActionResult} from 'hyperapp'
import {Page, Progress} from 'tesseract.js'
import './ocr-editor-component.css'
import {LANGUAGES} from './languages'
/* note: "import Tesseract from 'teseract.js'" doesn't load the worker properly */
const tesseract = require('../../../../node_modules/tesseract.js/dist/tesseract.js')

type CanvasContext = CanvasRenderingContext2D

const logger = getLogger('ocr-editor-component')

export type IOcrEditorState = IState
export type IOcrEditorActions = IActions

const OCR_CANVAS_WIDTH = 400
const OCR_CANVAS_HEIGHT = 400

interface IState {
  isOpen: boolean
  ocrProgress?: Progress
  selectedOCRLanguage: string /* keyof LANGUAGES */
  canvasEl: null | HTMLCanvasElement
  canvasCtx: null | CanvasContext
  color: string
  stroke_width: number
  isMouseDown: boolean
  mouseLastLocation: [number, number]
}

interface IActions {
  clear: () => (state: IState) => ActionResult<IState>,
  selectOCRLanguage: (languageCode: string) => () => ActionResult<IState>
  canvasCreated: (el: HTMLCanvasElement) => () => ActionResult<IState>
  mouseDownOnCanvas: (event: MouseEvent) => () => ActionResult<IState>
  mouseUpOnCanvas: (event: MouseEvent) => () => ActionResult<IState>
  mouseMoveOnCanvas: (event: MouseEvent) => (state: IState) => ActionResult<IState>
  open: () => () => ActionResult<IState>
  done: (args: {editor: any, result: Page}) => () => ActionResult<IState>
  submit: (mirrorMarkEditor: any) => (state: IState, actions: IActions)
    => Promise<ActionResult<IState>>
  updateProgress: (progress: Progress) => () => ActionResult<IState>
  cancel: () => () => ActionResult<IState>
}

export const ocrState: IState = {
  isOpen: false,
  selectedOCRLanguage: LANGUAGES.English.langCode,
  canvasEl: null,
  canvasCtx: null,
  color: 'black',
  stroke_width: 3,
  isMouseDown: false,
  mouseLastLocation: [0, 0],
}

export const ocrActions: IActions = {
  submit: (mirrorMarkEditor: any) => (state: IState, actions: IActions) => {
    if (!state.canvasEl) {
      return Promise.reject()
    }

    /* tesseract.recognize doesn't return a promise -- it needs to be wrapped*/
    return new Promise((resolve, reject) => {
      tesseract.recognize(state.canvasEl, {lang: state.selectedOCRLanguage})
        .progress((p: Progress) => actions.updateProgress(p))
        .catch(reject)
        .then((r: Page) => {
          actions.done({editor: mirrorMarkEditor, result: r})
          resolve()
        })
    })
  },

  open: () => () => {
    return {
      isOpen: true,
      ocrProgress: undefined,
    }
  },

  /** @param editor is a mirrorMark editor */
  done: (args: {editor: any, result: Page}) => () => {
    // trim leading/trailing spaces detected by OCR
    const textToInsert = args.result.text.trim()

    console.log(args.editor, textToInsert);

    if(args.editor) {
      args.editor.insert(textToInsert)
    }

    return {
      isOpen: false,
      lastTextSubmitted: textToInsert,
    }
  },

  cancel: () => () => {
    return {
      isOpen: false,
      lastTextSubmitted: null,
    }
  },

  updateProgress: (progress: Progress) => () => {
    return {
      ocrProgress: progress,
    }
  },

  clear: () => (state: IState) => {
    if (state.canvasCtx) {
      state.canvasCtx.clearRect(
        0,
        0,
        state.canvasCtx.canvas.width,
        state.canvasCtx.canvas.height
      )
    }

    return {}
  },

  selectOCRLanguage: (langCode: string) => () => ({selectedOCRLanguage: langCode}),

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

  mouseUpOnCanvas: (event: MouseEvent) => () => {
    return ({
      isMouseDown: false,
      event_type: event.type,
    })
  },

  mouseMoveOnCanvas: (event: MouseEvent) => (state: IState) => {
    const newMouseLocation: [number, number] = [event.offsetX, event.offsetY]
    const nextState = {mouseLastLocation: newMouseLocation}

    if (state.canvasEl === null || state.canvasCtx === null)
      return logger.warn('Canvas is not initialized')

    if (!state.isMouseDown) return nextState

    const ctx = state.canvasCtx

    ctx.strokeStyle = 'black'
    ctx.lineWidth = Math.max(state.stroke_width, 1)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(...state.mouseLastLocation)
    ctx.lineTo(...newMouseLocation)
    ctx.stroke()

    return nextState
  },
}

export default function view(state: IState, actions: IActions, mirrorMarkEditor: any) {
  return html.div(
    {
      id: 'ocr-editor-component',
      class: 'ocr-editor-component-wrapper',
      oncreate: (e: HTMLDivElement) => {
        dragElement(e)
      },
      onmouseup: (event: MouseEvent) => actions.mouseUpOnCanvas(event),
    },
    [
      html.div(
        {
          id: 'ocr-editor-component-header',
          class: 'ocr-editor-component-wrapper-header',
        },
      ),
      html.div(
        {},
        [
          html.select(
            {
              value: state.selectedOCRLanguage,
              onchange: (e: any) => { actions.selectOCRLanguage(e.target.value)},
            },
            Object.values(LANGUAGES).map(language => html.option(
              {
                value: language.langCode,
              },
              language.description,
            )),
          ),
          html.button({onclick: (_e: any) => actions.submit(mirrorMarkEditor)}, 'Insert'),
          html.button({onclick: actions.clear}, 'Clear'),
          html.button({onclick: actions.cancel}, 'Cancel'),
          /* OCR Progress */
          html.div({}, [
            state.ocrProgress &&
            state.ocrProgress.progress !== 1 ?
              html.p({}, state.ocrProgress.status) : html.p(),
          ])
        ],
      ),
      html.canvas(
        {
          class: 'canvas',
          width: OCR_CANVAS_WIDTH,
          height: OCR_CANVAS_HEIGHT,
          oncreate: (el: HTMLCanvasElement) => actions.canvasCreated(el),
          onmousedown: (event: MouseEvent) => actions.mouseDownOnCanvas(event),
          onmouseup: (event: MouseEvent) => actions.mouseUpOnCanvas(event),
          onmousemove: (event: MouseEvent) => actions.mouseMoveOnCanvas(event),
        },
      ),
    ],
  )
}

// ref: https://www.w3schools.com/howto/howto_js_draggable.asp
function dragElement(element: HTMLElement) {
  if (!element) { return }
  const elementHeader = document.getElementById(element.id + '-header')

  let pos1 = 0
  let pos2 = 0
  let pos3 = 0
  let pos4 = 0

  if (elementHeader) {
    elementHeader.onmousedown = dragMouseDown
  } else {
    element.onmousedown = dragMouseDown
  }

  function dragMouseDown(event: MouseEvent) {
    event = event || window.event
    event.preventDefault()
    // get the mouse cursor position at startup:
    pos3 = event.clientX
    pos4 = event.clientY

    document.onmouseup = closeDragElement
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag
  }

  function elementDrag(event: MouseEvent) {
    event = event || window.event
    event.preventDefault()
    // calculate the new cursor position:
    pos1 = pos3 - event.clientX
    pos2 = pos4 - event.clientY
    pos3 = event.clientX
    pos4 = event.clientY

    // set the element's new position:
    element.style.top = `${(element.offsetTop - pos2)}px`
    element.style.left = `${(element.offsetLeft - pos1)}px`
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null
    document.onmousemove = null
  }
}
