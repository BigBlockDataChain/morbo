const readFileMock = jest.fn()
const writeFileMock = jest.fn()
const mkdirMock = jest.fn()
const statMock = jest.fn()

import * as electron from 'electron'
// @ts-ignore // no unused variable
const remoteSpy = setupElectronRemoteSpy()

import {initDataDirectory, readFile, writeFile} from './io-utils'

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

describe('initDataDirectory', () => {

  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('resolves when directory does not exist and directory created', async () => {
    statMock.mockImplementation(
      (path: string, callback: (err?: any, stat?: any) => void) =>
        callback({code: 'ENOENT'}),
    )
    mkdirMock.mockImplementation(
      (path: string, callback: (err?: any) => void) =>
        callback(),
    )

    await expect(initDataDirectory('./')).resolves.toBe(undefined)
  })

  test('resolves when directory already exists', async () => {
    statMock.mockImplementation(
      (path: string, callback: (err?: any, stat?: any) => void) =>
        callback(undefined, {isDirectory: () => true}),
    )
    mkdirMock.mockImplementation(
      (path: string, callback: (err?: any) => void) =>
        callback(),
    )

    await expect(initDataDirectory('./')).resolves.toBe(undefined)
    expect(mkdirMock.mock.calls.length).toBe(0)
  })

  test('rejects if can\'t check directory already exists due to other err', async () => {
    statMock.mockImplementation(
      (path: string, callback: (err?: any, stat?: any) => void) =>
        callback({code: 'OTHER_ERR'}),
    )
    mkdirMock.mockImplementation((path: string, callback: (err?: any) => void) =>
      callback('Can not make directory'),
    )

    await expect(initDataDirectory('./')).rejects
      .toEqual({code: 'OTHER_ERR'})
    expect(mkdirMock.mock.calls.length).toBe(0)
  })

})

function setupElectronRemoteSpy() {
  const remoteSpy_ = jest.spyOn(electron.remote, 'require')
  remoteSpy_.mockImplementation((name: string) => {
    if (name === 'fs')
      return {
        readFile: readFileMock,
        writeFile: writeFileMock,
        mkdir: mkdirMock,
        stat: statMock,
      }

    return {}
  })
  return remoteSpy_
}
