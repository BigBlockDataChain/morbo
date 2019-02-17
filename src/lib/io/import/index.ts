import {remote} from 'electron'
import {basename, join} from 'path'

import {
  IGraphIndex,
  IGraphMetadata,
  NoteDataType,
} from '@lib/types'

const fs = remote.require('fs')

export function importDirectory(path: string):
    {index: IGraphIndex, metadata: IGraphMetadata} {
  const tree: any[] = []
  _walkSync(path, tree)

  const index: IGraphIndex = {}
  const metadata: IGraphMetadata = {}
  createNodes(1, index, metadata, tree, 0)
  return {index, metadata}
}

function createNodes(
  nextId: number,
  index: IGraphIndex,
  metadata: IGraphMetadata,
  tree: any[],
  depth: number,
): [number, number[]] {
  const children: number[] = []
  for (const f of tree) {
    children.push(nextId)
    if (typeof f === 'string') {
      metadata[nextId] = {
        id: nextId,
        title: basename(f),
        lastModified: new Date().toString(),
        created: new Date().toString(),
        x: 100 * depth,
        y: 100 * (children.length - 1),
        tags: [],
        type: NoteDataType.TEXT, // TODO Handle file type
        isExpanded: true,
      }
      index[nextId] = []
      nextId++
    } else {
      metadata[nextId] = {
        id: nextId,
        title: basename(f.name),
        lastModified: new Date().toString(),
        created: new Date().toString(),
        x: 100 * depth,
        y: 100 * (children.length - 1),
        tags: [],
        type: NoteDataType.TEXT, // TODO Handle file type
        isExpanded: true,
      }
      const [nextNextId, subchildren] = createNodes(
        nextId + 1, index, metadata, f.tree, depth + 1)
      index[nextId] = subchildren
      nextId = nextNextId
    }
  }

  return [nextId, children]
}

function _walkSync(path: string, tree: any[]) {
  const contents = fs.readdirSync(path)
  contents.forEach((f: string) => {
    const full = join(path, f)
    if (!fs.statSync(full).isDirectory()) {
      tree.push(full)
      return
    }

    const subtree: any[] = []
    _walkSync(full, subtree)
    tree.push({name: f, tree: subtree})
  })
}
