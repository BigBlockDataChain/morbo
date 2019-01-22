import * as html from '@hyperapp/html'
import {ActionResult} from 'hyperapp'
import classNames from 'classnames'
import './toolbox.css'

export enum Tool {
  ERASER = 'ERASER',
  PEN = 'PEN',
}

export interface IToolboxState {
  stroke_width: number
  selectedTool: Tool
  color: string
}

export interface IToolboxActions {
  strokeWidthChange: (width: number) => () => ActionResult<IToolboxState>
  changeColor: (color: string) => () => ActionResult<IToolboxState>
  selectTool: (tool: Tool) => () => ActionResult<IToolboxState>
}

export const initialToolboxState: IToolboxState = {
  selectedTool: Tool.PEN,
  stroke_width: 2,
  color: 'black',
}

export const toolboxActions: IToolboxActions = {
  changeColor: (color: string) => () => ({color}),
  strokeWidthChange: (width: number) => () => ({stroke_width: width}),
  selectTool: (tool: Tool) => () => ({selectedTool: tool}),
}

const colors = [
  "white",
  "black",
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "indigo",
  "violet",
]

export default function view(state: IToolboxState, actions: IToolboxActions) {
  return html.div({}, [
      html.div(
        {
          class: 'toolbox',
        },
        [
          /*--------------------------------------------------------------------
            Tool Controls
          --------------------------------------------------------------------*/
          html.div(
            {
              class: classNames(
                'toolbox-tool',
                {
                  'toolbox-tool-pen': state.selectedTool === Tool.PEN,
                  'toolbox-tool-eraser': state.selectedTool === Tool.ERASER
                }
              ),
              onclick: () => actions.selectTool(state.selectedTool === Tool.PEN ? Tool.ERASER : Tool.PEN),
            },
            [state.selectedTool === Tool.PEN ? '✎' : '✗'],
          ),

          /*--------------------------------------------------------------------
            Stroke Width Controls
          --------------------------------------------------------------------*/
          html.div({
            class: `toolbox-size small ${state.selectedTool === Tool.ERASER ? 'toolbox-size-eraser' : 'toolbox-size-pen'} ${state.stroke_width === 2 ? 'selected' : ''}`,
            onclick: () => actions.strokeWidthChange(2)
          }),
          html.div({
            class: `toolbox-size medium ${state.selectedTool === Tool.ERASER ? 'toolbox-size-eraser' : 'toolbox-size-pen'} ${state.stroke_width === 16 ? 'selected' : ''}`,
            onclick: () => actions.strokeWidthChange(16)
          }),
          html.div({
            class: `toolbox-size large ${state.selectedTool === Tool.ERASER ? 'toolbox-size-eraser' : 'toolbox-size-pen'} ${state.stroke_width === 32 ? 'selected' : ''}`,
            onclick: () => actions.strokeWidthChange(32)
          }),

          /*--------------------------------------------------------------------
            Color Controls
          --------------------------------------------------------------------*/
          html.div(
            {class: 'toolbox-palette'},
            [
              ...colors.map(color => html.div({
                  class: `toolbox-palette-item toolbox-palette-item-${color}`,
                  onclick: () => actions.changeColor(color),
                },
              )),
              html.div({
                className: `toolbox-palette-item toolbox-palette-current-color toolbox-palette-item-${state.color}`
              })
            ],
          ),
        ],
      ),
    ],
  )
}
