import * as electron from 'electron'
console.log(electron)
electron.remote.require = (name: string) => name + ' pandas'

import {getFileExtensionFromNoteDataType} from './io-utils'
import {NoteDataType} from '../types'

describe('getFileExtensionFromNoteDataType', () => {
  test('get text extension for text note data type', () => {
    expect(getFileExtensionFromNoteDataType(NoteDataType.TEXT)).toBe('txt')
  })

  test('get image extension for handwritten note data type', () => {
    expect(getFileExtensionFromNoteDataType(NoteDataType.HANDWRITING)).toBe('png')
  })
})
