const readFileMock = jest.fn()
const writeFileMock = jest.fn()

import * as electron from 'electron'
// tslint:disable-next-line
const remoteSpy = setupElectronRemoteSpy()

import {readFile, writeFile} from './io-utils'

describe('readFile', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('resolve when file read', async () => {
    readFileMock.mockImplementation(
      (path: string, callback: (err?: any, data?: string) => void) => {
        callback(undefined, 'hello world')
      },
    )

    await expect(readFile('./file.txt')).resolves.toBe('hello world')
    expect(readFileMock.mock.calls[0][0]).toBe('./file.txt')
  })

  test('reject when file can not be read', async () => {
    readFileMock.mockImplementation(
      (path: string, callback: (err?: any, data?: string) => void) => {
        // TODO Make sure this matches what the FS module actually returns on error
        callback('Can not read file')
      },
    )

    await expect(readFile('./file2.txt')).rejects.toBe('Can not read file')
    expect(readFileMock.mock.calls[0][0]).toBe('./file2.txt')
  })
})

describe('writeFile', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('resolves when file written', async () => {
    writeFileMock.mockImplementation(
      (path: string, data: string, callback: (err?: any) => void) => callback(),
    )

    await expect(writeFile('./file.txt', 'hello world')).resolves.toBe(undefined)
    expect(writeFileMock.mock.calls[0][0]).toBe('./file.txt')
    expect(writeFileMock.mock.calls[0][1]).toBe('hello world')
  })

  test('rejects when file can not be written', async () => {
    writeFileMock.mockImplementation(
      (path: string, data: string, callback: (err?: any) => void) =>
        callback('Can not write file'),
    )

    await expect(writeFile('./file2.txt', 'hello world')).rejects
      .toBe('Can not write file')
    expect(writeFileMock.mock.calls[0][0]).toBe('./file2.txt')
    expect(writeFileMock.mock.calls[0][1]).toBe('hello world')
  })
})

function setupElectronRemoteSpy() {
  const remoteSpy_ = jest.spyOn(electron.remote, 'require')
  remoteSpy_.mockImplementation((name: string) => {
    if (name === 'fs')
      return {
        readFile: readFileMock,
        writeFile: writeFileMock,
      }

    return {}
  })
  return remoteSpy_
}
