import { Component, Show, onMount } from 'solid-js'
import * as THREE from 'three'
import { Game, init, initListeners, Mode } from './init'
import { run } from './lib'

export class UICanvas {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D

  constructor(g: Game) {
    this.canvas = document.createElement('canvas')
    this.canvas.style.position = 'absolute'
    this.canvas.style.top = '0'
    this.canvas.style.left = '0'

    this.ctx = this.canvas.getContext('2d')!
    this.resize(g)
  }

  resize(g: Game) {
    this.canvas.width = g.width / g.ratio
    this.canvas.height = g.height / g.ratio
  }
}

const App: Component = () => {
  const renderer = new THREE.WebGLRenderer({ antialias: true })

  const g = init(renderer)
  const uICanvas = new UICanvas(g)

  let start: null | number = null

  onMount(() => {
    initListeners(renderer, g, uICanvas)

    const gameLoop = (timestamp: number): void => {
      if (start === null) {
        start = timestamp
      }
      const elapsed = timestamp - start
      start = timestamp

      run(elapsed, g, renderer, uICanvas.ctx)

      renderer.render(g.scene, g.camera)

      requestAnimationFrame(gameLoop)
    }
    // await renderer.domElement.requestFullscreen()
    requestAnimationFrame(gameLoop)
  })

  return (
    <>
      {/* <div style="position: fixed; top: 0; left: 0; color: white;">
        <Show when={g.mode === Mode.Camera}>
          <div>Hi</div>
        </Show>
        <div></div>
      </div> */}
      {uICanvas.canvas}
      {/* <canvas ref={uICanvas.canvas}
        style={{ position: 'absolute', top: 0, left: 0 }}
      ></canvas> */}
      {renderer.domElement}
    </>
  )
}

export default App
