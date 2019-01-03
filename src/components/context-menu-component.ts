import { remote } from 'electron'

export function buildMenu(menuItems: any[]) {
  const Menu = remote.Menu
  const MenuItem = remote.MenuItem

  const ctxMenu = new Menu()

  menuItems.forEach(item => {
    ctxMenu.append(new MenuItem({ label: item.label, click: item.click }))
  })

  ctxMenu.popup({ window: remote.getCurrentWindow() })
}
