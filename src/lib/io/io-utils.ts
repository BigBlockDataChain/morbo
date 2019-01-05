import {remote} from 'electron'

const fs = remote.require('fs')

/**
 * @returns Either resolves or rejects promise with data or error based on
 * success of read operation
 */
export function readFile(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err: any, data: string) => {
      if (err) reject(err)
      resolve(path.endsWith('.png') ? data : data.toString())
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
      if (err) reject(err)
      resolve()
    })
  })
}
