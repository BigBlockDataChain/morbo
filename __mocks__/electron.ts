/*
 * NOTE(francium): Haven't found a way to nicely mock out all of the Electron module
 * inline (such as in a beforeAll in the test file). This file provides a basic mock of
 * the top level exports and then Jest can be used to mock out the internal functionality
 * inline
 */
export const remote = {
  require: () => {},
}
