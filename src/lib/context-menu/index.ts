import {remote} from 'electron'

import {getLogger} from '@lib/logger'

const logger = getLogger('context-menu-component')

const menus: Map<string, any[]> = new Map()

export function registerContextMenu(label: string, menuItems: any[]): void {
  menus.set(label, menuItems.map(item => new remote.MenuItem(item)))
}

export function showContextMenu(label: string): void {
  if (!menus.has(label)) {
    logger.warn(`${label} is not a registered menu`)
    return
  }

  const ctxMenu = new remote.Menu()
  menus.get(label)!.forEach(ctxMenu.append)
  ctxMenu.popup({window: remote.getCurrentWindow()})
}
