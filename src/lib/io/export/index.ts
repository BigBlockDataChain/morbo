import {remote} from 'electron'
//import {basename, join} from 'path'

// import {
//   IGraphIndex,
//   IGraphMetadata,
//   NoteDataType,
// } from '@lib/types'
//import getGraphData from '@lib/types'

const fs = remote.require('fs')

export function exportData(path: string, nodeIndex: any, nodeMetadata: any): void {
  path = path+'/exportedData'
  fs.mkdir(path, { recursive: true }, (err: any) => {
    if (err) throw err;
  });
  // nodeIndex.forEach((node: any) => {
  //   console.log(node)
  // });
  for (let node of Object.keys(nodeIndex)) {
    console.log(nodeMetadata[node])
    console.log(nodeIndex[node])
  }
  writeDir()
}

function writeDir(): void {
  console.log('writing')
}