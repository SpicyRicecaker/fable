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

  onMount(() => {
    const gameLoop = (timestamp: number): void => {
      if (start === null) {
        start = timestamp
      }
      const elapsed = timestamp - start
      start = timestamp

      run(elapsed, g)

      renderer.render(g.scene, g.camera)

      requestAnimationFrame(gameLoop)
    }
    requestAnimationFrame(gameLoop)
  })

  return (
    <>
      <div style="position: fixed; top: 0; left: 0; color: white;">
        <div> </div>
        <Show when={g.mode === Mode.Camera}>
          <div>Hi</div>
        </Show>
        <div></div>
      </div>
      {renderer.domElement}
    </>
  )
}

export default App
