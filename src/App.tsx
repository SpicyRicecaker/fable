import { Component, Show, onMount } from 'solid-js'
import * as THREE from 'three'
import { init, initListeners, Mode } from './init'
import { run } from './lib'

const App: Component = () => {
  const renderer = new THREE.WebGLRenderer({ antialias: true })

  const g = init(renderer)
  // wonder if we need onmount here
  onMount(() => {
    initListeners(renderer, g)
  })

  let start: null | number = null

  let canvas: HTMLCanvasElement

  onMount(() => {
    const ctx = canvas.getContext('2d')!
    canvas.width = g.width / g.ratio
    canvas.height = g.height / g.ratio

    const gameLoop = (timestamp: number): void => {
      if (start === null) {
        start = timestamp
      }
      const elapsed = timestamp - start
      start = timestamp

      run(elapsed, g, renderer, ctx)

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
      <canvas
        ref={canvas!}
        style={{ position: 'absolute', top: 0, left: 0 }}
      ></canvas>
      {renderer.domElement}
    </>
  )
}

export default App
