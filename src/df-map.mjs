import { DFArea } from './df-area.mjs'
import { DFItem } from './df-item.mjs'
import { DFMonster } from './df-monster.mjs'
import { DFPanel } from './df-panel.mjs'
import { DFTexture } from './df-texture.mjs'
import { DFTrigger } from './df-trigger.mjs'
import { convertResourcePath, parse2Ints, trimStringBySize } from './utility.mjs'

class DFMap {
  // @ts-ignore
  constructor ({ name, author, description, music, sky, width, height, prefix, textures, panels, monsters, areas, items, triggers }) {
    /** @type {DFTexture[]} */ this.textures = textures
    /** @type {DFPanel[]} */ this.panels = panels
    /** @type {DFMonster[]} */ this.monsters = monsters
    /** @type {DFArea[]} */ this.areas = areas
    /** @type {DFItem[]} */ this.items = items
    /** @type {DFTrigger[]} */ this.triggers = triggers
    this.name = name
    this.author = author
    this.description = description
    this.music = music
    this.sky = sky
    this.size = { x: width, y: height }
    this.fileName = prefix
  }

  get allElements () {
    const /** @type {(DFArea | DFItem | DFMonster | DFPanel | DFTexture | DFTrigger)[]} */ items = []
    const toPush = [this.areas, this.items, this.monsters, this.panels, this.textures, this.triggers]
    for (const i of toPush) items.push(...i)
    return items
  }

  getTexturePath = (/** @type {String} */ arg) => {
    for (const texture of this.textures) {
      if (texture.id === arg) return texture.path
    }
    return null
  }

  asText () {
    const start = 'map' + ' {'
    let body = '\n'
    const name = trimStringBySize(this.name.replaceAll("'", '"'), 31)
    const author = trimStringBySize(this.author.replaceAll("'", '"'), 31)
    const description = trimStringBySize(this.description.replaceAll("'", '"'), 255)
    const music = trimStringBySize(this.music.replaceAll("'", '"'), 63)
    const sky = trimStringBySize(this.sky.replaceAll("'", '"'), 63)
    const x = this.size.x.toString(10)
    const y = this.size.y.toString(10)
    body = body + ' '.repeat(2) + 'name' + ' ' + "'" + name + "'" + ';' + '\n'
    body = body + ' '.repeat(2) + 'author' + ' ' + "'" + author + "'" + ';' + '\n'
    body = body + ' '.repeat(2) + 'description' + ' ' + "'" + description + "'" + ';' + '\n'
    body = body + ' '.repeat(2) + 'music' + ' ' + "'" + music + "'" + ';' + '\n'
    body = body + ' '.repeat(2) + 'sky' + ' ' + "'" + sky + "'" + ';' + '\n'
    body = body + ' '.repeat(2) + 'size' + ' ' + '(' + x + ' ' + y + ')' + ';' + '\n'
    for (const element of this.allElements) {
      body = body + element.asText()
    }
    const end = '}'
    return start + body + end
  }
}

export { DFMap }
