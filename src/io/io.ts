import {
  GraphNodeId,
  NoteDataType,
} from '../types'
import {
  getFileExtensionFromNoteDataType,
  readFile,
  writeFile,
} from './io-utils'

// export function loadIndex(): Promise<GraphIndex> {
//   const filePath = './index'
//   return readFile(filePath)
// }

// export function loadMetadata(): Promise<GraphMetadata> {
//
// }

export function loadNote(id: GraphNodeId, dataType: NoteDataType): Promise<string> {
  const notePath = `./file${id}.${getFileExtensionFromNoteDataType(dataType)}`
  return readFile(notePath)
}

/**
 * @param {GraphNodeId} id Id of note
 * @param {NoteDataType} data Data to write
 * @returns {Promise<void>} Either resolves or rejects promise with data or error based on
 *   success of write operation
 */
export function writeNote(id: GraphNodeId, data: NoteDataType): Promise<void> {
  // TODO
  // if type of TextNodeData
  //   return writeFile
  // else
  //   write binary data
  return Promise.reject()
}
