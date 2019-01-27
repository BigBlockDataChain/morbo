import {homedir} from 'os'
import {join} from 'path'

import {getLogger} from '@lib/logger'
import {
  GraphNodeId,
  IGraphIndex,
  IGraphMetadata,
  NoteDataType,
} from '@lib/types'
import {
  initDataDirectory as _initDataDirectory,
  readFile,
  writeFile,
  deleteFile,
} from './io-utils'
import {
  getFileExtensionFromNoteDataType,
} from './utils'

const logger = getLogger('io')

const BASE_DIR = process.env.MORBO_HOME || join(homedir(), 'morbo')

const INDEX_PATH = join(BASE_DIR, 'index')
const METADATA_PATH = join(BASE_DIR, 'metadata')

export async function initDataDirectory(): Promise<void> {
  return await _initDataDirectory(BASE_DIR)
}

export async function loadIndex(): Promise<IGraphIndex> {
  try {
    const raw = await readFile(INDEX_PATH)
    return JSON.parse(raw) as IGraphIndex
  } catch (err) {
    logger.warn('Failed to load index. Returning empty index')
    return {} as IGraphIndex
  }
}

export function writeIndex(index: IGraphIndex): Promise<void> {
  return writeFile(INDEX_PATH, JSON.stringify(index))
}

export async function loadMetadata(): Promise<IGraphMetadata> {
  try {
    const raw = await readFile(METADATA_PATH)
    return JSON.parse(raw) as IGraphMetadata
  } catch (err) {
      logger.warn('Failed to load metadata. Returning empty metadata')
      return {} as IGraphMetadata
  }
}

export function writeMetadata(metadata: IGraphMetadata): Promise<void> {
  return writeFile(METADATA_PATH, JSON.stringify(metadata))
}

export function loadNote(id: GraphNodeId, dataType: NoteDataType): Promise<string> {
  const ext = getFileExtensionFromNoteDataType(dataType)
  const notePath = join(BASE_DIR, `file${id}.${ext}`)
  return readFile(notePath)
}

export function deleteNote (id: GraphNodeId) {
  const notePath = join(BASE_DIR, `file${id}.txt`)
  return deleteFile(notePath)
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
