import {homedir} from 'os'
import {join} from 'path'

import {
  GraphNodeId,
  IGraphIndex,
  IGraphMetadata,
  NoteDataType,
} from '@lib/types'
import {
  readFile,
  writeFile,
} from './io-utils'
import {
  getFileExtensionFromNoteDataType,
} from './utils'

const BASE_DIR = process.env.MORBO_HOME || join(homedir(), 'morbo')

const INDEX_PATH = join(BASE_DIR, 'index')
const METADATA_PATH = join(BASE_DIR, 'metadata')

export async function loadIndex(): Promise<IGraphIndex> {
  const raw = await readFile(INDEX_PATH)
  return JSON.parse(raw) as IGraphIndex
}

export function writeIndex(index: IGraphIndex): Promise<void> {
  return writeFile(INDEX_PATH, JSON.stringify(index, null, 4))
}

export async function loadMetadata(): Promise<IGraphMetadata> {
  const raw = await readFile(METADATA_PATH)
  return JSON.parse(raw) as IGraphMetadata
}

export function writeMetadata(metadata: IGraphMetadata): Promise<void> {
  return writeFile(METADATA_PATH, JSON.stringify(metadata, null, 4))
}

export function loadNote(id: GraphNodeId, dataType: NoteDataType): Promise<string> {
  const ext = getFileExtensionFromNoteDataType(dataType)
  const notePath = join(BASE_DIR, `file${id}.${ext}`)
  return readFile(notePath)
}

export function writeNote(
  id: GraphNodeId,
  dataType: NoteDataType,
  data: any,
): Promise<void> {
  // FIXME data type annotation
  const ext = getFileExtensionFromNoteDataType(dataType)
  const notePath = join(BASE_DIR, `file${id}.${ext}`)
  return writeFile(notePath, data)
}
