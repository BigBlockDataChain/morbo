import * as html from '@hyperapp/html'
import {getLogger} from '@lib/logger'
import {El} from '@lib/types'
import {emptyFunction} from '@lib/utils'
import classname from 'classnames'
import {ActionResult} from 'hyperapp'
import {Page, Progress} from 'tesseract.js'
import './ocr-editor-component.css'
/* note: "import Tesseract from 'teseract.js'" doesn't load the worker properly */
const tesseract = require('../../../node_modules/tesseract.js/dist/tesseract.js')

type CanvasContext = CanvasRenderingContext2D

const logger = getLogger('ocr-editor-component')

enum Tool {
  ERASER,
  PEN,
}

const LANGUAGE = {
  Afrikaans: {
    langCode: 'afr',
    description: 'Afrikaans',
  },
  Arabic: {
    langCode: 'ara',
    description: 'Arabic',
  },
  Azerbaijani: {
    langCode: 'aze',
    description: 'Azerbaijani',
  },
  Belarusian: {
    langCode: 'bel',
    description: 'Belarusian',
  },
  Bengali: {
    langCode: 'ben',
    description: 'Bengali',
  },
  Bulgarian: {
    langCode: 'bul',
    description: 'Bulgarian',
  },
  Catalan: {
    langCode: 'cat',
    description: 'Catalan',
  },
  Czech: {
    langCode: 'ces',
    description: 'Czech',
  },
  Chinese: {
    langCode: 'chi_sim',
    description: 'Chinese',
  },
  Traditional_Chinese: {
    langCode: 'chi_tra',
    description: 'Traditional Chinese',
  },
  Cherokee: {
    langCode: 'chr',
    description: 'Cherokee',
  },
  Danish: {
    langCode: 'dan',
    description: 'Danish',
  },
  German: {
    langCode: 'deu',
    description: 'German',
  },
  Greek: {
    langCode: 'ell',
    description: 'Greek',
  },
  English: {
    langCode: 'eng',
    description: 'English',
  },
  English_Old: {
    langCode: 'enm',
    description: 'English (Old)',
  },
  Esperanto: {
    langCode: 'epo',
    description: 'Esperanto',
  },
  Esperanto_Alternative: {
    langCode: 'epo_alt',
    description: 'Esperanto alternative',
  },
  Math: {
    langCode: 'equ',
    description: 'Math',
  },
  Estonian: {
    langCode: 'est',
    description: 'Estonian',
  },
  Basque: {
    langCode: 'eus',
    description: 'Basque',
  },
  Persian_Farsi: {
    langCode: 'fas',
    description: 'Persian (Farsi)',
  },
  Finnish: {
    langCode: 'fin',
    description: 'Finnish',
  },
  French: {
    langCode: 'fra',
    description: 'French',
  },
  Frankish: {
    langCode: 'frk',
    description: 'Frankish',
  },
  French_Old: {
    langCode: 'frm',
    description: 'French (Old)',
  },
  Galician: {
    langCode: 'glg',
    description: 'Galician',
  },
  Ancient_Greek: {
    langCode: 'grc',
    description: 'Ancient Greek',
  },
  Hebrew: {
    langCode: 'heb',
    description: 'Hebrew',
  },
  Hindi: {
    langCode: 'hin',
    description: 'Hindi',
  },
  Croatian: {
    langCode: 'hrv',
    description: 'Croatian',
  },
  Hungarian: {
    langCode: 'hun',
    description: 'Hungarian',
  },
  Indonesian: {
    langCode: 'ind',
    description: 'Indonesian',
  },
  Icelandic: {
    langCode: 'isl',
    description: 'Icelandic',
  },
  Italian: {
    langCode: 'ita',
    description: 'Italian',
  },
  Italian_Old: {
    langCode: 'ita_old',
    description: 'Italian (Old)',
  },
  Japanese: {
    langCode: 'jpn',
    description: 'Japanese',
  },
  Kannada: {
    langCode: 'kan',
    description: 'Kannada',
  },
  Korean: {
    langCode: 'kor',
    description: 'Korean',
  },
  Latvian: {
    langCode: 'lav',
    description: 'Latvian',
  },
  Lithuanian: {
    langCode: 'lit',
    description: 'Lithuanian',
  },
  Malayalam: {
    langCode: 'mal',
    description: 'Malayalam',
  },
  Macedonian: {
    langCode: 'mkd',
    description: 'Macedonian',
  },
  Maltese: {
    langCode: 'mlt',
    description: 'Maltese',
  },
  Malay: {
    langCode: 'msa',
    description: 'Malay',
  },
  Dutch: {
    langCode: 'nld',
    description: 'Dutch',
  },
  Norwegian: {
    langCode: 'nor',
    description: 'Norwegian',
  },
  Polish: {
    langCode: 'pol',
    description: 'Polish',
  },
  Portuguese: {
    langCode: 'por',
    description: 'Portuguese',
  },
  Romanian: {
    langCode: 'ron',
    description: 'Romanian',
  },
  Russian: {
    langCode: 'rus',
    description: 'Russian',
  },
  Slovakian: {
    langCode: 'slk',
    description: 'Slovakian',
  },
  Slovenian: {
    langCode: 'slv',
    description: 'Slovenian',
  },
  Spanish: {
    langCode: 'spa',
    description: 'Spanish',
  },
  Spanish_Old: {
    langCode: 'spa_old',
    description: 'Old Spanish',
  },
  Albanian: {
    langCode: 'sqi',
    description: 'Albanian',
  },
  Serbian_Latin: {
    langCode: 'srp',
    description: 'Serbian (Latin)',
  },
  Swahili: {
    langCode: 'swa',
    description: 'Swahili',
  },
  Swedish: {
    langCode: 'swe',
    description: 'Swedish',
  },
  Tamil: {
    langCode: 'tam',
    description: 'Tamil',
  },
  Telugu: {
    langCode: 'tel',
    description: 'Telugu',
  },
  Tagalog: {
    langCode: 'tgl',
    description: 'Tagalog',
  },
  Thai: {
    langCode: 'tha',
    description: 'Thai',
  },
  Turkish: {
    langCode: 'tur',
    description: 'Turkish',
  },
  Ukrainian: {
    langCode: 'ukr',
    description: 'Ukrainian',
  },
  Vietnamese: {
    langCode: 'vie',
    description: 'Vietnamese',
  },
}

export type IOcrEditorState = IState
export type IOcrEditorActions = IActions

interface IState {
  isOpen: boolean
  ocrProgress?: Progress
  selectedTool: Tool
  selectedOCRLanguage: string /* keyof LANGUAGE */
  canvasEl: null | HTMLCanvasElement
  canvasCtx: null | CanvasContext
  color: string
  stroke_width: number
  isMouseDown: boolean
  mouseLastLocation: [number, number]
  lastTextSubmitted: null | string
}

interface IActions {
  changeColor: (color: string) => () => ActionResult<IState>
  strokeWidthChange: (width: number) => () => ActionResult<IState>
  selectTool: (tool: Tool) => () => ActionResult<IState>
  selectOCRLanguage: (languageCode: string) => () => ActionResult<IState>
  canvasCreated: (el: HTMLCanvasElement) => () => ActionResult<IState>
  mouseDownOnCanvas: (event: MouseEvent) => () => ActionResult<IState>
  mouseUpOnCanvas: (event: MouseEvent) => () => ActionResult<IState>
  mouseMoveOnCanvas: (event: MouseEvent) => (compState: IState) => ActionResult<IState>
  open: () => () => ActionResult<IState>
  done: (result: Page) => () => ActionResult<IState>
  submit: () => (compState: IState, compActions: IActions)
    => Promise<ActionResult<IState>>
  updateProgress: (progress: Progress) => () => ActionResult<IState>
  cancel: () => () => ActionResult<IState>
}

export const state: IState = {
  isOpen: false,
  lastTextSubmitted: null,
  selectedTool: Tool.PEN,
  selectedOCRLanguage: LANGUAGE.English.langCode,
  canvasEl: null,
  canvasCtx: null,
  color: 'black',
  stroke_width: 3,
  isMouseDown: false,
  mouseLastLocation: [0, 0],
}

export const actions: IActions = {
  submit: () => (compState: IState, compActions: IActions) => {
    if (!compState.canvasEl) {
      return Promise.reject()
    }

    /* tesseract.recognize doesn't return a promise -- it needs to be wrapped*/
    return new Promise((resolve, reject) => {
      tesseract.recognize(compState.canvasEl, {lang: compState.selectedOCRLanguage})
        .progress((p: Progress) => compActions.updateProgress(p))
        .catch(reject)
        .then(compActions.done)
    })
  },

  open: () => () => {
    console.log('ASDF');

    return {
      isOpen: true,
      ocrProgress: undefined,
    }
  },

  done: (result: Page) => () => {
    /* TODO: formalize the method by which editor can be accessed */
    const editor = document.getElementById('editor')
    if (editor) {
      editor.focus()
      document.execCommand('insertText', false, result.text.trim())
    }

    return {
      isOpen: false,
      lastTextSubmitted: result.text,
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

  changeColor: (color: string) => () => ({color}),

  strokeWidthChange: (width: number) => () => ({stroke_width: width}),

  selectTool: (tool: Tool) => () => ({selectedTool: tool}),

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

export default function view(compState: IState, compActions: IActions) {
  return html.div(
    {
      id: 'ocr-editor-component',
      class: 'ocr-editor-component-wrapper',
      oncreate: (e: HTMLDivElement) => {
        dragElement(e)
      },
      onmouseup: (event: MouseEvent) => compActions.mouseUpOnCanvas(event),
    },
    [
      html.div(
        {
          id: 'ocr-editor-component-header',
          class: 'ocr-editor-component-wrapper-header',
        },
      ),
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
              compState.ocrProgress &&
              compState.ocrProgress.progress !== 1 ?
                html.p({}, compState.ocrProgress.status) : html.p(),
            ],
          ),
        ],
      ),
      html.div(
        {},
        [
          html.select(
            {
              value: compState.selectedOCRLanguage,
              onchange: (e: any) => { compActions.selectOCRLanguage(e.target.value)},
            },
            Object.values(LANGUAGE).map(language => html.option(
              {
                value: language.langCode,
              },
              language.description,
            )),
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
      className: `palette_item palette_item_${color} ${classNames ? classNames : ''}`,
      onclick,
    },
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
