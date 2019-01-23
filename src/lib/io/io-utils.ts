import {remote} from 'electron'

import {getLogger} from '@lib/logger'

const fs = remote.require('fs')

const {ipcMain} = require('electron')

const logger = getLogger('io')

/**
 * @returns Either resolves or rejects promise with data or error based on
 * success of read operation
 */
export function readFile(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err: any, data: string) => {
      if (err) {
        reject(err)
        return
      }
      resolve(data.toString())
    })
  })
}

/**
 * @returns Either resolves or rejects promise with void or error based on
 * success of write operation
 */
export function writeFile(path: string, data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, (err: any) => {
      if (err) {
        reject(err)
        return
      }
      resolve()
    })
  })
}

export function deleteFile(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err: any) => {
      if (err) {
        reject (err)
        return
      }
      resolve()
    })
  })
}

export function initDataDirectory(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err: any, stat: any) => {
      let makeDirectory = false
      let rejectIfFalseResolveIfTrue = false

      if (err) {
        if (err.code === 'ENOENT') {
          // Directory does not exist
          makeDirectory = true
        } else {
          // Other error
          logger.error(err)
          rejectIfFalseResolveIfTrue = false
        }
      } else if (stat) {
        if (stat.isDirectory) {
          // Directory already exists
          rejectIfFalseResolveIfTrue = true
        } else {
          // Assuming this will never happen since an error is thrown with ENOENT instead
        }
      }

      if (makeDirectory) {
        fs.mkdir(path, (_err: any) => {
          if (_err) reject(_err)
          resolve()
        })
        return
      }

      if (rejectIfFalseResolveIfTrue)
          resolve()
      else
          reject(err)
    })
  })
}
