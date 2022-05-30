import { DFArea } from './df-area.mjs'
import { DFItem } from './df-item.mjs'
import { DFMonster } from './df-monster.mjs'
import { DFPanel } from './df-panel.mjs'
import { DFTexture } from './df-texture.mjs'
import { DFTrigger } from './df-trigger.mjs'
import { parse2Ints } from './utility.mjs'

class DFMap {
  constructor (/** @type {any} */ parsed, /** @type {string} */ fileName) {
    /** @type {DFTexture[]} */ this.textures = []
    /** @type {DFPanel[]} */ this.panels = []
    /** @type {DFMonster[]} */ this.monsters = []
    /** @type {DFArea[]} */ this.areas = []
    /** @type {DFItem[]} */ this.items = []
    /** @type {DFTrigger[]} */ this.triggers = []
    this.name = ''
    this.author = ''
    this.description = ''
    this.music = ''
    this.sky = ''
    this.size = { x: 0, y: 0 }
    this.fileName = fileName
    for (const i in parsed) {
      const element = parsed[i]
      if (element === undefined) continue
      if (i === 'name') this.name = element
      else if (i === 'author') this.author = element
      else if (i === 'description') this.description = element
      else if (i === 'music') this.music = element
      else if (i === 'sky') this.sky = element
      else if (i === 'size') {
        const numbers = parse2Ints(element)
        if (numbers === null || numbers[0] === undefined || numbers[1] === undefined) continue
        this.size.x = numbers[0]
        this.size.y = numbers[1]
      } else {
        if (element._hint === undefined) continue
        if (element._hint === 'texture') {
          const animated = /true/i.test(element.animated)
          const path = element.path
          const texture = new DFTexture(path, animated)
          texture.id = element._token.value
          this.textures.push(texture)
        } else if (element._hint === 'panel') {
          const position = element.position
          const numbers = parse2Ints(position)
          if (numbers == null || numbers[0] === undefined || numbers[1] === undefined) continue
          const x = numbers[0]
          const y = numbers[1]
          const size = element.size
          const dimensions = parse2Ints(size)
          if (dimensions === null || dimensions[0] === undefined || dimensions[1] === undefined) continue
          const width = dimensions[0]
          const height = dimensions[1]
          const texture = element.texture
          let type = (element.type === undefined || element.type === '' ? 'PANEL_NONE' : element.type)
          type = type.replace(/\s+/g, '').split('|')
          const alpha = (element.alpha === undefined ? -1 : element.alpha) // if unset, then -1
          let flags = (element.flags === undefined || element.flags === '' ? 'PANEL_FLAG_NONE' : element.flags)
          flags = flags.replace(/\s+/g, '').split('|')
          const panel = new DFPanel(x, y, width, height, texture, type, alpha, flags)
          panel.id = element._token.value
          this.panels.push(panel)
        } else if (element._hint === 'monster') {
          const position = element.position
          const numbers = parse2Ints(position)
          if (numbers === null || numbers[0] === undefined || numbers[1] === undefined) continue
          const x = numbers[0]
          const y = numbers[1]
          const type = element.type
          const direction = element.direction
          const monster = new DFMonster(x, y, type, direction)
          monster.id = element._token.value
          this.monsters.push(monster)
        } else if (element._hint === 'area') {
          const position = element.position
          const numbers = parse2Ints(position)
          if (numbers === null || numbers[0] === undefined || numbers[1] === undefined) continue
          const x = numbers[0]
          const y = numbers[1]
          const type = element.type
          const direction = element.direction
          const area = new DFArea(x, y, type, direction)
          area.id = element._token.value
          this.areas.push(area)
        } else if (element._hint === 'item') {
          const position = element.position
          const numbers = parse2Ints(position)
          if (numbers === null || numbers[0] === undefined || numbers[1] === undefined) continue
          const x = numbers[0]
          const y = numbers[1]
          const type = element.type
          let options = element.options ?? 'ITEM_OPTION_NONE'
          options = options.replace(/\s+/g, '').split('|')
          const item = new DFItem(x, y, type, options)
          item.id = element._token.value
          this.items.push(item)
        } else if (element._hint === 'trigger') {
          const position = parse2Ints(element.position)
          if (position === null || position[0] === undefined || position[1] === undefined) continue
          const x = position[0]
          const y = position[1]
          const size = parse2Ints(element.size)
          if (size === null || size[0] === undefined || size[1] === undefined) continue
          const width = size[0]
          const height = size[1]
          const enabled = element.enabled
          const texturePanel = element.texturepanel
          const type = element.type
          const activateType = (element.activate_type && element.activate_type !== '' ? element.activate_type : 'ACTIVATE_NONE').replace(/\s+/g, '').split('|')
          const keys = (element.keys && element.keys !== '' ? element.keys : 'KEY_NONE').replace(/\s+/g, '').split('|')
          const triggerData = element.triggerdata
          const trigger = new DFTrigger(x, y, width, height, enabled, texturePanel, type, activateType, keys, triggerData)
          trigger.id = element._token.value
          this.triggers.push(trigger)
        }
      }
    }
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
    body = body + ' '.repeat(2) + 'name' + ' ' + "'" + (this.name === '' ? 'Unnamed' : this.name).replaceAll("'", '"') + "'" + ';' + '\n'
    if (this.author !== '') body = body + ' '.repeat(2) + 'author' + ' ' + "'" + this.author.replaceAll("'", '"') + "'" + ';' + '\n'
    if (this.description !== '') body = body + ' '.repeat(2) + 'description' + ' ' + "'" + this.description.replaceAll("'", '"') + "'" + ';' + '\n'
    if (this.music !== '') body = body + ' '.repeat(2) + 'music' + ' ' + "'" + this.music.replaceAll("'", '"') + "'" + ';' + '\n'
    if (this.sky !== '') body = body + ' '.repeat(2) + 'sky' + ' ' + "'" + this.sky.replaceAll("'", '"') + "'" + ';' + '\n'
    body = body + ' '.repeat(2) + 'size' + ' ' + '(' + (this.size.x ?? 0).toString(10) + ' ' + (this.size.y ?? 0).toString(10) + ')' + ';' + '\n'
    for (const texture of this.textures) {
      let msg = ''
      msg = msg + '\n'
      msg = msg + ' '.repeat(2) + 'texture' + ' ' + texture.id + ' ' + '{' + '\n'
      msg = msg + ' '.repeat(4) + 'path' + ' ' + "'" + texture.path + "'" + ';' + '\n'
      msg = msg + ' '.repeat(4) + 'animated' + ' ' + (texture.animated ? 'true' : 'false') + ';' + '\n'
      msg = msg + ' '.repeat(2) + '}' + '\n'
      body = body + msg
    }
    for (const panel of this.panels) {
      let msg = ''
      msg = msg + '\n'
      msg = msg + ' '.repeat(2) + 'panel' + ' ' + panel.id + ' ' + '{' + '\n'
      msg = msg + ' '.repeat(4) + 'position' + ' ' + '(' + (panel.pos.x).toString(10) + ' ' + (panel.pos.y).toString(10) + ')' + ';' + '\n'
      msg = msg + ' '.repeat(4) + 'size' + ' ' + '(' + (panel.size.width).toString(10) + ' ' + (panel.size.height).toString(10) + ')' + ';' + '\n'
      msg = msg + ' '.repeat(4) + 'texture' + ' ' + panel.texture + ';' + '\n'
      msg = msg + ' '.repeat(4) + 'type' + ' ' + panel.type[0] + ';' + '\n'
      msg = msg + ' '.repeat(4) + 'alpha' + ' ' + (panel.alpha === -1 ? 0 : panel.alpha) + ';' + '\n'
      msg = msg + ' '.repeat(4) + 'flags' + ' ' + panel.flags.join(' | ') + ';' + '\n'
      msg = msg + ' '.repeat(2) + '}' + '\n'
      body = body + msg
    }
    for (const item of this.items) {
      let msg = ''
      msg = msg + '\n'
      msg = msg + ' '.repeat(2) + 'item' + ' ' + item.id + ' ' + '{' + '\n'
      msg = msg + ' '.repeat(4) + 'position' + ' ' + '(' + (item.pos.x).toString(10) + ' ' + (item.pos.y).toString(10) + ')' + ';' + '\n'
      msg = msg + ' '.repeat(4) + 'type' + ' ' + item.type + ';' + '\n'
      msg = msg + ' '.repeat(4) + 'options' + ' ' + item.options.join(' | ') + ';' + '\n'
      msg = msg + ' '.repeat(2) + '}' + '\n'
      body = body + msg
    }
    for (const monster of this.monsters) {
      let msg = ''
      msg = msg + '\n'
      msg = msg + ' '.repeat(2) + 'monster' + ' ' + monster.id + ' ' + '{' + '\n'
      msg = msg + ' '.repeat(4) + 'position' + ' ' + '(' + (monster.pos.x).toString(10) + ' ' + (monster.pos.y).toString(10) + ')' + ';' + '\n'
      msg = msg + ' '.repeat(4) + 'type' + ' ' + monster.type + ';' + '\n'
      msg = msg + ' '.repeat(4) + 'direction' + ' ' + (monster.direction === '' ? 'DIR_LEFT' : monster.direction) + ';' + '\n'
      msg = msg + ' '.repeat(2) + '}' + '\n'
      body = body + msg
    }
    for (const area of this.areas) {
      let msg = ''
      msg = msg + '\n'
      msg = msg + ' '.repeat(2) + 'area' + ' ' + area.id + ' ' + '{' + '\n'
      msg = msg + ' '.repeat(4) + 'position' + ' ' + '(' + (area.pos.x).toString(10) + ' ' + (area.pos.y).toString(10) + ')' + ';' + '\n'
      msg = msg + ' '.repeat(4) + 'type' + ' ' + area.type + ';' + '\n'
      msg = msg + ' '.repeat(4) + 'direction' + ' ' + (area.direction === '' ? 'DIR_LEFT' : area.direction) + ';' + '\n'
      msg = msg + ' '.repeat(2) + '}' + '\n'
      body = body + msg
    }
    for (const trigger of this.triggers) {
      let msg = ''
      msg = msg + '\n'
      msg = msg + ' '.repeat(2) + 'trigger' + ' ' + trigger.id + ' ' + '{' + '\n'
      msg = msg + ' '.repeat(4) + 'position' + ' ' + '(' + (trigger.position.x).toString(10) + ' ' + (trigger.position.y).toString(10) + ')' + ';' + '\n'
      msg = msg + ' '.repeat(4) + 'size' + ' ' + '(' + (trigger.size.width).toString(10) + ' ' + (trigger.size.height).toString(10) + ')' + ';' + '\n'
      msg = msg + ' '.repeat(4) + 'enabled' + ' ' + (trigger.enabled ? 'true' : 'false') + ';' + '\n'
      if (trigger.texturePanel !== '') msg = msg + ' '.repeat(4) + 'texture_panel' + ' ' + trigger.texturePanel + ';' + '\n'
      msg = msg + ' '.repeat(4) + 'type' + ' ' + (trigger.type) + ';' + '\n'
      msg = msg + ' '.repeat(4) + 'activate_type' + ' ' + (trigger.activateType).join(' | ') + ';' + '\n'
      msg = msg + ' '.repeat(4) + 'keys' + ' ' + trigger.key.join(' | ') + ';' + '\n'
      if (trigger.options.length >= 0) {
        msg = msg + ' '.repeat(4) + 'triggerdata' + ' ' + '{' + '\n'
        for (const option of trigger.options) {
          if (option.value === null) continue
          msg = msg + ' '.repeat(6) + option.path + ' '
          if (option.handler === 'char') msg = msg + "'" + option.value + "'"
          else if (option.handler === 'double_longword' || option.handler === 'double_word') msg = msg + '(' + option.value[0] + ' ' + option.value[1] + ')'
          else if (option.handler === 'bool') msg = msg + (option.value ? 'true' : 'false')
          else msg = msg + option.value
          msg = msg + ';' + '\n'
        }
        msg = msg + ' '.repeat(4) + '}' + '\n'
      }
      msg = msg + ' '.repeat(2) + '}' + '\n'
      body = body + msg
    }
    const end = '}'
    return start + body + end
  }
}

export { DFMap }
