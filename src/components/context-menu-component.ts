import * as d3 from 'd3'

const nodeOptions = new Map()

export default function(position: any) {

  // dummy menu options, will eventually need to populate based on who calls it
  nodeOptions.set('New text node', `console.log('item1 clicked')`)
  nodeOptions.set('New handwritten node', `console.log('item2 clicked')`)
  nodeOptions.set('Delete node', `console.log('item3 clicked')`)

  const rmenu = document.createElement('div')
  const rmenuItems = document.createElement('ul')

  for (const [itemName, calling] of nodeOptions) {
    const item = document.createElement('li')
    const itemContent = document.createElement('button')
    itemContent.innerHTML = itemName
    itemContent.setAttribute('onClick', calling)
    item.appendChild(itemContent)
    rmenuItems.appendChild(item)
  }

  rmenu.appendChild(rmenuItems)
  rmenu.setAttribute('id', 'right-click-menu')
  document.body.appendChild(rmenu)

  d3.select('#right-click-menu')
    .style('position', 'absolute')
    .style('left', position[0] + 'px')
    .style('top', position[1] + 'px')
    .style('display', 'block')
}
