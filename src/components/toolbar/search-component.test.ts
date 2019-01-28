// import * as html from '@hyperapp/html'
// import {app as hyperapp} from 'hyperapp'
//
// import {actions, view} from './search-component'

test('TODO', () => {})
// describe('actions', () => {
//
//   describe('onInput', () => {
//     it('update query on input', () => {
//       const inputValue = 'helloWorld'
//       const partialState = actions.onInput(inputValue)()
//       expect(partialState).toEqual({query: inputValue})
//     })
//   })
//
//   describe('searchResults', () => {
//     it('set search results', () => {
//       const results = [
//         {
//           title: 'hello',
//         },
//         {
//           title: 'goodbye',
//         },
//       ]
//       const partialState = actions.searchResults(results)()
//       expect(partialState).toEqual({results})
//     })
//   })
//
//   describe('clearSearch', () => {
//     it('set search results', () => {
//       const partialState = actions.clearSearch()()
//       expect(partialState).toEqual({results: [], query: null})
//     })
//   })
//
// })
//
// describe('view', () => {
//
//   it('display query', done => {
//     function testView(_state: any, _actions: any) {
//       return html.div(
//         {
//           oncreate: (el: HTMLElement) => {
//             const inputEl = document.querySelector('input')
//             expect(inputEl).not.toBeNull()
//             expect(inputEl!.value).toBe('hello')
//             done()
//           },
//         },
//         [
//           view(
//             {query: 'hello', results: []},
//             {},
//             () => {},
//             query => Promise.resolve(),
//             (_: any) => {},
//           ),
//         ],
//       )
//     }
//     hyperapp({}, {}, testView, document.body)
//   })
//
//   it('display no results when none to display', done => {
//     function testView(_state: any, _actions: any) {
//       return html.div(
//         {
//           oncreate: (el: HTMLElement) => {
//             const resultsContainerEl = document.querySelector('.result-container')
//             expect(resultsContainerEl).toBeNull()
//             expect(el.querySelector('.empty')).not.toBeNull()
//             done()
//           },
//         },
//         [
//           view(
//             {query: 'hello', results: []},
//             {},
//             () => {},
//             query => Promise.resolve(),
//             (_: any) => {},
//           ),
//         ],
//       )
//     }
//     hyperapp({}, {}, testView, document.body)
//   })
//
//   it('display results', done => {
//     const results = [
//       {
//         title: 'hello',
//       },
//       {
//         title: 'goodbye',
//       },
//     ]
//
//     function testView(_state: any, _actions: any) {
//       return html.div(
//         {
//           oncreate: (el: HTMLElement) => {
//             const resultsContainerEl = document.querySelector('.result-container')
//             expect(resultsContainerEl).not.toBeNull()
//             const searchResultEls = resultsContainerEl!.querySelectorAll('.search-result')
//             expect(searchResultEls.length).toBe(2)
//             expect(searchResultEls[0]!.innerHTML).toBe(results[0].title)
//             done()
//           },
//         },
//         [
//           view(
//             {query: 'hello', results},
//             {},
//             () => {},
//             query => Promise.resolve(),
//             (_: any) => {},
//           ),
//         ],
//       )
//     }
//     hyperapp({}, {}, testView, document.body)
//   })
//
// })
