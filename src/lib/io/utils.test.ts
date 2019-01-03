import {NoteDataType} from '@lib/types'
import {getFileExtensionFromNoteDataType} from './utils'

describe('getFileExtensionFromNoteDataType', () => {
  test('get text extension for text note data type', () => {
    expect(getFileExtensionFromNoteDataType(NoteDataType.TEXT)).toBe('txt')
  })

  test('get image extension for handwritten note data type', () => {
    expect(getFileExtensionFromNoteDataType(NoteDataType.HANDWRITING)).toBe('png')
  })
})
