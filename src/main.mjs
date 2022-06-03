import { DfwadFrom } from './df-wad.mjs'
import { DFParser } from './df-parser.mjs'
import { DFMap } from './df-map.mjs'
import { DatabaseFrom } from './db.mjs'
import { DFRender, DFRenderOptions } from './render.mjs'
import { mapForRender } from './prepare-map-for-render.mjs'
import { preloadWad } from './save-to-db.mjs'
import { handleParsedMap } from './handle-parsed-map.mjs'
import { clamp, getFileNameWithoutExtension } from './utility.mjs'
import Camera from './camera.mjs'
import { CameraWrapper } from './camera-wrapper.mjs'
import { DfMapFromBuffer } from './map-from-buffer.mjs'
import { getFileNameWithoutExtension } from './utility.mjs'
const div = document.createElement('div')
const canvas = document.createElement('canvas')
const input = document.createElement('input')
input.type = 'file'
let /** @type {Database | null} */ db = null
DatabaseFrom().then((database) => {
  db = database
  init()
}).catch((error) => {
  window.alert(error)
})

input.onchange = function () {
  if (input === null || input.files === null) return false
  const file = input.files[0]
  if (file === undefined) return false
  const reader = new window.FileReader()
  reader.readAsArrayBuffer(file)
  reader.onload = async function (event) {
    canvas.onmousedown = function () {}
    const mapName = file.name.toLowerCase() // lower case for now
    const selectId = 'map-select'
    const buttonId = 'load-button'
    const cacheButtonId = 'cache-button'
    const flagsDivId = 'flags'
    const zipButtonId = 'zip-button'
    const mapImageId = 'mapimage-button'
    const deleteArray = [selectId, buttonId, cacheButtonId, flagsDivId, zipButtonId, mapImageId]
    for (const elementid of deleteArray) {
      deleteElementById(elementid)
    }
    if (event.target === null) return false
    const content = event.target.result
    if (content === null || typeof content === 'string') return false
    const view = new Uint8Array(content)
    const wad = await DfwadFrom(view)
    const cacheButton = document.createElement('button')
    cacheButton.innerHTML = 'Save resources'
    cacheButton.id = 'cache-button'
    cacheButton.onclick = async function () {
      const promises = preloadWad(wad, mapName, db)
      await Promise.allSettled(promises)
      return true
    }
    div.appendChild(cacheButton)
    const zipButton = document.createElement('button')
    zipButton.innerHTML = 'Convert to .dfz and .txt'
    zipButton.id = zipButtonId
    zipButton.onclick = async function () {
      const zip = await wad.saveAsZip()
      const blob = await zip.generateAsync({ type: 'blob' })
      download(blob, 'convert-' + file.name.toLowerCase())
    }
    div.appendChild(zipButton)
    const maps = wad.maps.sort((a, b) => a.path.localeCompare(b.path))
    if (maps.length === 0) return true
    const select = document.createElement('select')
    select.id = selectId
    div.appendChild(select)
    for (const map of maps) {
      const option = document.createElement('option')
      option.value = map.path
      option.text = map.path
      select.appendChild(option)
    }
    const button = document.createElement('button')
    button.innerHTML = 'Load map'
    button.id = 'load-button'
    button.onclick = async () => {
      deleteElementById(flagsDivId)
      deleteElementById(mapImageId)
      const context = canvas.getContext('2d')
      if (context === null) return false
      const value = select.value
      const resource = wad.findResourceByPath(value)
      if (resource === null) return false
      const map = DfMapFromBuffer(resource.buffer, mapName)
      console.log(map)
      console.log(map.asText())
      const options = new DFRenderOptions()
      const render = new DFRender()
      const flagsDiv = document.createElement('div')
      flagsDiv.id = flagsDivId
      const allOptions = options.all
      const width = map.size.x
      const height = map.size.y
      let cameraX = 400
      let cameraY = 400
      let scale = 1
      let zoom = 1000
      // const camera = new Camera(context)
      for (const renderOption of allOptions) {
        const object = renderOption[0]
        const set = renderOption[1]
        const input = document.createElement('input')
        input.type = 'checkbox'
        input.name = object.id
        input.id = object.id
        input.value = ''
        input.checked = set
        const label = document.createElement('label')
        label.htmlFor = input.id
        label.appendChild(document.createTextNode(object.full))
        input.onchange = () => {
          options.setFlag(input.id, input.checked)
          const mapView = mapForRender(map, options)
          const renderedMap = render.render1(mapView, width, height)
          // camera.zoomTo(zoom)
          // camera.moveTo(cameraX, cameraY)
          // camera.begin()
          // context.drawImage(renderedMap, 0, 0)
          // camera.end()
          // draw1(canvas, context, map, render, options)
          // const camera = new Camera(context)
        }
        flagsDiv.appendChild(input)
        flagsDiv.appendChild(label)
      }
      div.appendChild(flagsDiv)
      await prepareForMap(map, options, render)
      canvas.width = width
      const scrollHeight = Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight,
        document.body.clientHeight, document.documentElement.clientHeight
      )
      canvas.height = height
      const camera = new CameraWrapper(context, width, height, canvas)
      // camera.setCameraCoords(500, 500)
      // camera.setZoom(500)
      // cameraX = clamp(cameraX, (0 + camera.viewport.width) / 2, (width) - (camera.viewport.width) / 2)
      // cameraY = clamp(cameraY, (0 + camera.viewport.height) / 2, (height) - (camera.viewport.height) / 2)

      // canvas.height = window.screen.availHeight * 0.8
      // canvas.width = window.screen.availWidth * 0.8
      canvas.height = 600
      canvas.width = 800
      const mapView = mapForRender(map, options)
      const renderedMap = await render.render1(mapView, width, height)
      // camera.zoomTo(zoom)
      // camera.moveTo(cameraX, cameraY)
      // camera.begin()
      // context.drawImage(renderedMap, 0, 0)
      camera.setCameraCoords(700, 700)
      camera.setZoom(4000)
      camera.drawImage(renderedMap, 0, 0)
      canvas.onmousedown = function (event) {
        canvas.onmousemove = (event) => {
          // cameraX -= event.movementX
          // cameraY -= event.movementY
          camera.setCameraCoords(-event.movementX, -event.movementY)
          camera.setZoom(0)
          camera.drawImage(renderedMap, 0, 0)
          // debugger
          // camera.setCameraCoords(event.movementY)
          /*
          console.log(camera)
          camera.zoomTo(zoom)
          console.log(camera)
          cameraX = clamp(cameraX, (0 + camera.viewport.width) / 2, (width) - (camera.viewport.width) / 2)
          cameraY = clamp(cameraY, (0 + camera.viewport.height) / 2, (height) - (camera.viewport.height) / 2)
          camera.moveTo(cameraX, cameraY)
          camera.begin()
          context.drawImage(renderedMap, 0, 0)
          camera.end() */
        }
      }
      canvas.onmouseup = function (event) {
        canvas.onmousemove = null
      }
      document.onkeydown = function (event) {
        if (event.code === 'KeyR') {
          camera.setZoom(100)
          camera.drawImage(renderedMap, 0, 0)
        } else if (event.code === 'KeyX') {
          camera.setZoom(-100)
          camera.drawImage(renderedMap, 0, 0)
        }
      }
      // camera.end()
      /*
      canvas.onmousedown = function (event) {
        canvas.onmousemove = (event) => {
          cameraX -= event.movementX
          cameraY -= event.movementY
          console.log(camera)
          camera.zoomTo(zoom)
          console.log(camera)
          cameraX = clamp(cameraX, (0 + camera.viewport.width) / 2, (width) - (camera.viewport.width) / 2)
          cameraY = clamp(cameraY, (0 + camera.viewport.height) / 2, (height) - (camera.viewport.height) / 2)
          camera.moveTo(cameraX, cameraY)
          camera.begin()
          context.drawImage(renderedMap, 0, 0)
          camera.end()
        }
      }
      document.onkeydown = function (event) {
        if (event.code === 'KeyR') {
          zoom += 100
          zoom = clamp(zoom, 100, 3000)
          scale += 0.1
          scale = clamp(scale, 0.1, 4)
          camera.zoomTo(zoom)
          cameraX = clamp(cameraX, (0 + camera.viewport.width) / 2, (width) - (camera.viewport.width) / 2)
          cameraY = clamp(cameraY, (0 + camera.viewport.height) / 2, (height) - (camera.viewport.height) / 2)
          camera.moveTo(cameraX, cameraY)
          camera.begin()
          if ((camera.viewport.left < 0) || (camera.viewport.right > (canvas.width))) {
            zoom -= 100
            camera.end()
            camera.zoomTo(zoom)
            camera.begin(); camera.end()
            cameraX = clamp(cameraX, (0 + camera.viewport.width) / 2, (width) - (camera.viewport.width) / 2)
            cameraY = clamp(cameraY, (0 + camera.viewport.height) / 2, (height) - (camera.viewport.height) / 2)
            camera.moveTo(cameraX, cameraY)
            camera.begin(); camera.end()
            // debugger
            // camera.begin()
            // context.drawImage(renderedMap, 0, 0)
            // camera.end()
            return
          }
          context.drawImage(renderedMap, 0, 0)
          camera.end()
        } 
        if (event.code === 'KeyX') {
          zoom -= 100
          zoom = clamp(zoom, 100, 3000)
          scale -= 0.1
          scale = clamp(scale, 0.1, 4)
          camera.zoomTo(zoom)
          cameraX = clamp(cameraX, (0 + camera.viewport.width) / 2, (width) - (camera.viewport.width) / 2)
          cameraY = clamp(cameraY, (0 + camera.viewport.height) / 2, (height) - (camera.viewport.height) / 2)
          camera.moveTo(cameraX, cameraY)
          camera.begin()
          context.drawImage(renderedMap, 0, 0)
          camera.end()
        }
      }
      canvas.onmouseup = function (event) {
        canvas.onmousemove = null
      }
      */
      const button = document.createElement('button')
      button.innerHTML = 'Save map as an image'
      button.id = mapImageId
      button.onclick = () => {
        downloadDataURL(canvas.toDataURL(), getFileNameWithoutExtension(mapName) + '.png')
      }
      div.appendChild(button)
      return true
    }
    div.appendChild(button)
    return true
  }
  return true
}

function deleteElementById (/** @type {string} */ elementid) {
  const deleteElement = document.getElementById(elementid)
  if (deleteElement !== null) {
    deleteElement.innerHTML = ''
    div.removeChild(deleteElement)
  }
  return true
}

function downloadDataURL (/** @type {string} */ dataURL, /** @type {string} */ name) {
  const a = document.createElement('a')
  a.href = dataURL
  a.download = name
  a.click()
}

function download (/** @type {Blob} */ blob, /** @type {string} */ name) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
}

async function prepareForMap(/** @type {DFMap} */ map, /** @type {DFRenderOptions} */ options, /** @type {DFRender} */ render) {
  const allElements = map.allElements
  const sky = map.sky
  const prefix = map.fileName
  await render.preload(allElements, db, sky, prefix)
}

async function draw1 (/** @type {HTMLCanvasElement} */ canvas, /** @type {CanvasRenderingContext2D} */ context, /** @type {DFMap} */ map, /** @type {DFRender} */ render, /** @type {DFRenderOptions} */ options) {
  const mapView = mapForRender(map, options)
  const allElements = map.allElements
  const sky = map.sky
  const prefix = map.fileName
  await render.preload(allElements, db, sky, prefix)
  const width = map.size.x
  const height = map.size.y
  const mapCanvas = await render.render1(mapView, width, height)
  canvas.width = map.size.x
  canvas.height = map.size.y
  context.drawImage(mapCanvas, 0, 0)
  return true
}

const resources = ['game.wad', 'standart.wad', 'shrshade.wad', 'editor.wad']

async function checkEssentialResources () {
  try {
    const all = await db.getAll()
    for (const resource of resources) {
      if (!all.some((/** @type {string} */ element) => element.includes(resource))) return false
    }
    return true
  } catch (e) {
    return false
  }
}

async function init () {
  if (window.indexedDB === null || db === null || canvas === null || input === null || div === null) {
    window.alert('Your browser lacks the required features.')
    return false
  }
  const check = await checkEssentialResources()
  if (check) {
    div.appendChild(input)
    document.body.appendChild(div)
    document.body.appendChild(canvas)
  } else {
    const text = document.createTextNode('Doom 2D: Forever resources have not been found!')
    const br = document.createElement('br')
    const button = document.createElement('button')
    button.innerHTML = 'Download game resources from doom2d.org'
    button.id = 'download-button'
    button.onclick = async () => {
      const baseLink = 'https://doom2d.org/doom2d_forever/mapview/'
      // const baseLink = './assets/'
      for (const resource of resources) {
        const link = baseLink + resource
        try {
          const response = await fetch(link)
          const buffer = await response.arrayBuffer()
          const view = new Uint8Array(buffer)
          const wad = await DfwadFrom(view)
          await Promise.all(preloadWad(wad, resource, db))
        } catch (error) {
          window.alert(error)
          return false
        }
      }
      document.body.removeChild(text)
      document.body.removeChild(br)
      document.body.removeChild(button)
      div.appendChild(input)
      document.body.appendChild(div)
      document.body.appendChild(canvas)
      return true
    }
    document.body.appendChild(text)
    document.body.appendChild(br)
    document.body.appendChild(button)
  }
  return true
}
