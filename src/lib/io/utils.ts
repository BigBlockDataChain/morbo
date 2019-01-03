import {NoteDataType} from '@lib/types'

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
