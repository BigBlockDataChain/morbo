import {remote} from 'electron'

const fs = remote.require('fs')

export function exportData(path: string, nodeIndex: any, nodeMetadata: any): void {
  path = path + '/exportedData'
  fs.mkdir(path, { recursive: true }, (err: any) => {
    if (err) throw err
  })

  interface IChildToParent {
    [child: number]: null | number
  }

  const parentOf: IChildToParent = {}
  for (const node of Object.keys(nodeIndex)) {
    for (const parent of Object.keys(nodeIndex)) {
      if (nodeIndex[parent].includes(parseInt(node, 10))) {
        parentOf[parseInt(node, 10)] = parseInt(parent, 10)
        break
      }
    }
    if (!parentOf[parseInt(node, 10)]) {
      parentOf[parseInt(node, 10)] = null
    }
  }

  writeTree(parseToTree(parentOf), path, nodeMetadata)
}

function parseToTree(parentOf: any, root: any = null): any {
  const res = []
  for (const i of Object.keys(parentOf)) {
    const node = parseInt(i, 10)
    if (parentOf[node] === root) {
      delete parentOf[node]
      res.push( {id: node, children: parseToTree(parentOf, node)})
    }
  }
  return res === [] ? null : res
}

// ToDo get the file data and write that into the files
function writeTree(tree: any, path: string, nodeMetadata: any): void {
  if (tree !== [] && tree.length) {
    tree.forEach((node: any) => {
      if (node.children.length === 0) {
        // make file
        if (nodeMetadata[node.id].type === 'text') {
          fs.writeFile(path + '/' + nodeMetadata[node.id].title + '.md',
            'ToDo', (err: any) => {
            if (err) throw err
          })
        } else if (nodeMetadata[node.id].type === 'handwriting') {
          fs.writeFile(path + '/' + nodeMetadata[node.id].title + '.png',
            'ToDo', (err: any) => {
            if (err) throw err
          })
        }
      } else {
        // make directory
        fs.mkdir(path + '/' + nodeMetadata[node.id].title,
          { recursive: true }, (err: any) => {
          if (err) throw err
        })
        // write index file
        if (nodeMetadata[node.id].type === 'text') {
          fs.writeFile(path + '/' + nodeMetadata[node.id].title + '/index.md',
            'ToDo', (err: any) => {
            if (err) throw err
          })
        } else if (nodeMetadata[node.id].type === 'handwriting') {
          fs.writeFile(path + '/' + nodeMetadata[node.id].title + '/index.png',
            'ToDo', (err: any) => {
            if (err) throw err
          })
        }
        writeTree(node.children, path + '/' + nodeMetadata[node.id].title, nodeMetadata)
      }
    })
  }
}
