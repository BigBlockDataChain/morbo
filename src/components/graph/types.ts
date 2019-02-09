import {GraphNodeId, IGraphNodeData, IPosition} from '@lib/types'

export const DELETE_LINK_TYPE = 'deleteLink'
type DeleteLinkType           = 'deleteLink'
export interface IDeleteLinkAction {
  readonly kind: DeleteLinkType
  readonly source: GraphNodeId
  readonly target: GraphNodeId
}
export class DeleteLinkAction implements IDeleteLinkAction {
  public readonly kind = DELETE_LINK_TYPE
  public constructor(
    public readonly source: GraphNodeId,
    public readonly target: GraphNodeId,
  ) {}
}

export const SET_NODE_PARENT_TYPE = 'setParent'
type SetNodeParentType            = 'setParent'
export interface ISetNodeParentType {
  readonly kind: SetNodeParentType
  readonly parent: GraphNodeId
  readonly child: GraphNodeId
}
export class SetNodeParentAction implements ISetNodeParentType {
  public readonly kind = SET_NODE_PARENT_TYPE
  public constructor(
    public readonly parent: GraphNodeId,
    public readonly child: GraphNodeId,
  ) {}
}

export const NODE_CLICK_TYPE = 'nodeClick'
type NodeClickType           = 'nodeClick'
export interface INodeClickAction {
  readonly kind: NodeClickType
  readonly nodeId: GraphNodeId
}
export class NodeClickAction implements INodeClickAction {
  public readonly kind = NODE_CLICK_TYPE
  public constructor(public readonly nodeId: GraphNodeId) {}
}

export const NODE_RIGHT_CLICK_TYPE = 'nodeRightClick'
type NodeRightClickType            = 'nodeRightClick'
export interface INodeRightClickAction {
  readonly kind: NodeRightClickType,
  readonly nodeId: GraphNodeId
}
export class NodeRightClickAction implements INodeRightClickAction {
  public readonly kind = NODE_RIGHT_CLICK_TYPE
  public constructor(public readonly nodeId: GraphNodeId) {}
}

export const NODE_DBL_CLICK_TYPE = 'nodeDblClick'
export type NodeDblClickType     = 'nodeDblClick'
export interface INodeDblClickAction {
  readonly kind: NodeDblClickType,
  readonly nodeId: GraphNodeId
}
export class NodeDblClickAction implements INodeDblClickAction {
  public readonly kind = NODE_DBL_CLICK_TYPE
  public constructor(public readonly nodeId: GraphNodeId) {}
}

export const NODE_DRAG_TYPE = 'nodeDrag'
export type NodeDragType    = 'nodeDrag'
export interface INodeDragAction {
  readonly kind: NodeDragType
  readonly nodeId: GraphNodeId
  readonly position: IPosition
}
export class NodeDragAction implements INodeDragAction {
  public readonly kind = NODE_DRAG_TYPE
  public constructor(
    public readonly nodeId: GraphNodeId,
    public readonly position: IPosition,
  ) {}
}

// NOTE Not implemented yet
// export const NODE_DBL_DRAG_TYPE = 'nodeDblDrag'
// export type NodeDblDragType     = 'nodeDblDrag'
// export interface INodeDblDragAction { kind: NodeDblDragType, node: GraphNodeId }
// export class NodeDblDragAction implements INodeDblDragAction {
//   public readonly kind = NODE_DBL_DRAG_TYPE
//   public constructor(public node: GraphNodeId) {}
// }

export const NODE_HOVER_SHORT_TYPE = 'nodeHoverShort'
export type NodeHoverShortType     = 'nodeHoverShort'
export interface INodeHoverShortAction {
  readonly kind: NodeHoverShortType
  readonly nodeId: GraphNodeId
}
export class NodeHoverShortAction implements INodeHoverShortAction {
  public readonly kind = NODE_HOVER_SHORT_TYPE
  public constructor(public readonly nodeId: GraphNodeId) {}
}

// NOTE Not implemented yet
// export const NODE_HOVER_LONG_TYPE = 'nodeHoverLong'
// export type NodeHoverLongType     = 'nodeHoverLong'
// export interface INodeHoverLongAction { kind: NodeHoverLongType, nodeId: GraphNodeId }
// export class NodeHoverLongAction implements INodeHoverLongAction {
//   public readonly kind = NODE_HOVER_LONG_TYPE
//   public constructor(public nodeId: GraphNodeId) {}
// }

export const NODE_HOVER_END_TYPE = 'nodeHoverEnd'
export type NodeHoverEndType     = 'nodeHoverEnd'
export interface INodeHoverEndAction {
  readonly kind: NodeHoverEndType
  readonly nodeId: GraphNodeId
}
export class NodeHoverEndAction implements INodeHoverEndAction {
  public readonly kind = NODE_HOVER_END_TYPE
  public constructor(public readonly nodeId: GraphNodeId) {}
}

export const BACKGROUND_CLICK_TYPE = 'backgroundClick'
export type BackgroundClickType    = 'backgroundClick'
export interface IBackgroundClickAction {
  readonly kind: BackgroundClickType
  readonly position: IPosition
}
export class BackgroundClickAction implements IBackgroundClickAction {
  public readonly kind = BACKGROUND_CLICK_TYPE
  public constructor(public readonly position: IPosition) {}
}

export const BACKGROUND_DBL_CLICK_TYPE = 'backgroundDblClick'
export type BackgroundDblClickType     = 'backgroundDblClick'
export interface IBackgroundDblClickAction {
  readonly kind: BackgroundDblClickType,
  readonly position: IPosition,
}
export class BackgroundDblClickAction implements IBackgroundDblClickAction {
  public readonly kind = BACKGROUND_DBL_CLICK_TYPE
  public constructor(public readonly position: IPosition) {}
}

export const ZOOM_TYPE = 'zoom'
export type ZoomType   = 'zoom'
export interface IZoomAction { kind: ZoomType }
export class ZoomAction implements IZoomAction {
  public readonly kind = ZOOM_TYPE
}

export const CREATE_NEW_NODE_TYPE = 'createNewNode'
export type CreateNewNodeType     = 'createNewNode'
export interface ICreateNewNodeAction {
  readonly kind: CreateNewNodeType,
  readonly position: IPosition,
  readonly parent: null | GraphNodeId,
}
export class CreateNewNodeAction implements ICreateNewNodeAction {
  public readonly kind = CREATE_NEW_NODE_TYPE
  public constructor(
    public readonly position: IPosition,
    public readonly parent: null | GraphNodeId,
  ) {}
}

export const EDIT_NODE_TYPE = 'editNode'
export type EditNodeType    = 'editNode'
export interface IEditNodeAction {
  readonly kind: EditNodeType,
  readonly id: GraphNodeId,
}
export class EditNodeAction implements IEditNodeAction {
  public readonly kind = EDIT_NODE_TYPE
  public constructor(public readonly id: GraphNodeId) {}
}

export const DELETE_NODE_TYPE = 'deleteNode'
export type DeleteNodeType    = 'deleteNode'
export interface IDeleteNodeAction {
  readonly kind: DeleteNodeType,
  readonly nodeId: GraphNodeId,
}
export class DeleteNodeAction implements IDeleteNodeAction {
  public readonly kind = DELETE_NODE_TYPE
  public constructor(public readonly nodeId: GraphNodeId) {}
}

export type GraphAction
  = INodeClickAction
  | INodeRightClickAction
  | INodeDblClickAction
  | INodeDragAction
  // | INodeDblDragAction
  | INodeHoverShortAction
  // | INodeHoverLongAction
  | INodeHoverEndAction
  | IBackgroundClickAction
  | IBackgroundDblClickAction
  | IZoomAction
  | ICreateNewNodeAction
  | IEditNodeAction
  | IDeleteNodeAction
  | IDeleteLinkAction
  | ISetNodeParentType

export const FOCUS_TYPE = 'focus'
export type FocusType   = 'focus'
export interface IFocusCommand {
  readonly kind: FocusType
  readonly position?: IPosition
  readonly nodeId?: GraphNodeId
}
export class FocusCommand implements IFocusCommand {
  public readonly kind = FOCUS_TYPE
  public readonly position?: IPosition
  public readonly nodeId?: GraphNodeId
  public constructor({position, nodeId}: {position?: IPosition, nodeId?: GraphNodeId}) {
    this.position = position
    this.nodeId = nodeId
  }
}

export const EDIT_NODE_METADATA_TYPE = 'editNodeMetadata'
export type EditNodeMetadataType   = 'editNodeMetadata'
export interface IEditNodeMetadataCommand {
  readonly kind: EditNodeMetadataType
  readonly node: IGraphNodeData
}
export class EditNodeMetadataCommand implements IEditNodeMetadataCommand {
  public readonly kind = EDIT_NODE_METADATA_TYPE
  public constructor(public readonly node: IGraphNodeData) {}
}

export const RESET_GRAPH_TYPE = 'resetGraph'
export type ResetGraphType   = 'resetGraph'
export interface IResetGraphCommand { readonly kind: ResetGraphType }
export class ResetGraphCommand implements IResetGraphCommand {
  public readonly kind = RESET_GRAPH_TYPE
}

export type GraphCommand
  = IEditNodeMetadataCommand
  | IFocusCommand
  | IResetGraphCommand
