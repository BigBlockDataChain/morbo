// tslint:disable:no-empty
export const emptyFunction = () => {}

export function assertNever(x: never): never {
  throw new Error(`unexpected object: ${x}`)
}
