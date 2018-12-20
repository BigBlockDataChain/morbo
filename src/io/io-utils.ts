import {remote} from 'electron'

console.log(remote)

import {
  GraphNodeId,
  NoteDataType,
  GraphNodeIndex,
  GraphIndex,
  GraphMetadata,
  GraphMetadatum,
} from '../types'

const fs = remote.require('fs')

console.log(remote.require('fuzz'))

/**
 * @param {string} path Path to file
 * @returns {Promise<void>} Either resolves or rejects promise with data or error based on
 *   success of read operation
 */
export function readFile(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err: any, data: string) => {
      if (err) reject(err)
      resolve(data.toString())
    })
  })
}

/**
 * @param {string} path Path to file
 * @param {string | number} data Data to write
 * @returns {Promise<void>} Either resolves or rejects promise with void or error based on
 *   success of write operation
 */
export function writeFile(path: string, data: string | number): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, (err: any) => {
      if (err) reject(err)
      resolve()
    })
  })
}

export function getFileExtensionFromNoteDataType(dataType: NoteDataType): string {
  switch (dataType) {
    case NoteDataType.TEXT:
      return 'txt'
    case NoteDataType.HANDWRITING:
      return 'png'
    default:
      return 'invalid'
  }
}
