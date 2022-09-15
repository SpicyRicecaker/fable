import * as THREE from 'three'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
// import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { Enemy } from './lib'
import { Monad, Option } from './monad'

export enum Mode {
  Camera,
  Gameplay
}

interface KeyBinding {
  name: string
  key: string
  keyDown: () => void
  keyUp: () => void
}

interface Player {
  // position: Vector3;
  destination: Option<THREE.Vector3>
  // distance that the player is allowed to travel per unit time
  speed: number
  mesh: THREE.Mesh
}

// interface Keys {
//   KeyW: boolean
//   KeyA: boolean
//   KeyS: boolean
//   KeyD: boolean
//   Space: boolean
//   ShiftLeft: boolean
//   F1: boolean
// }

export class Game {
  buffer: THREE.Vector3
  player: Player
  mouse: {
    locked: boolean
    mousedown: boolean
    pointer: THREE.Vector2
    realPointer: THREE.Vector2
    raycaster: THREE.Raycaster
  }

  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  ratio: number
  width: number
  height: number
  mode: Mode
  objectStore: any
  objects: THREE.Object3D[]
  userFacingKeybindings: KeyBinding[]
  // we need to store an array of held keys, because that way on tab out or focusout, we can easily iterate through the keys and 'unpress' them
  // this does add some overhead though, because on every keydown we have to push to a stack and on every keyup we have to expunge an element
  // we use a set because then all we have to type is a string -> boolean
  // could be a bug where if the config changes while we have a queue, there's a leakage of actions
  pressedKeys: Map<string, boolean>
  upKeybindings: Map<string, Array<() => void>>
  downKeybindings: Map<string, Array<() => void>>
  staticSpawnCooldown: number
  currentSpawnRecharge: number

  loader: THREE.Loader
  centerCamera: boolean
  entities: Enemy[]
  constructor(renderer: THREE.Renderer, ratio: number) {
    // three.js vectors cannot be modified without mutating, so we'll just use one vector and copy into it when needed
    this.buffer = new THREE.Vector3()
    this.player = {
      // position: new THREE.Vector3(0, 0, 0),
      destination: Monad.none(),
      // destination: new None(),
      speed: 10,
      mesh: (() => {
        const radius = 70
        const geometry = new THREE.SphereGeometry(radius)
        const material = new THREE.MeshPhongMaterial({ color: 0xffffff })

        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(0, 0, 0)
        return mesh
      })()
    }
    this.mouse = {
      locked: false,
      mousedown: false,
      pointer: new THREE.Vector2(0, 0),
      realPointer: new THREE.Vector2(0, 0),
      raycaster: new THREE.Raycaster()
    }
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(
      50,
      renderer.domElement.width / renderer.domElement.height,
      // 1,
      0.1,
      10000
    )
    this.ratio = ratio
    this.width = this.ratio * window.innerWidth
    this.height = this.ratio * window.innerHeight
    this.objects = []
    this.mode = Mode.Gameplay
    this.objectStore = {}
    this.centerCamera = false
    this.userFacingKeybindings = [
      {
        name: 'Center Camera On Champion',
        key: 'Space',
        keyDown: () => {
          console.log('keydown')
          this.centerCamera = true
        },
        keyUp: () => {
          console.log('keyup')
          this.centerCamera = false
        }
      },
      {
        name: 'Debug Toggle Camera Mode',
        key: 'F1',
        keyDown: () => {
          switch (this.mode) {
            case Mode.Camera: {
              this.mode = Mode.Gameplay
              break
            }
            case Mode.Gameplay: {
              this.mode = Mode.Camera
              break
            }
            // unreachable default
            default: {
              console.error('Did not implement current mode')
              break
            }
          }
        },
        keyUp: () => {}
        // if (keys.KeyW) {
        //   camera.position.y += 2
        // }
        // if (keys.KeyA) {
        //   camera.position.x -= 2
        // }
        // if (keys.KeyS) {
        //   camera.position.y -= 2
        // }
        // if (keys.KeyD) {
        //   camera.position.x += 2
        // }
        // if (keys.Space) {
        //   camera.position.z += 5
        // }
        // if (keys.ShiftLeft) {
        //   camera.position.z -= 5
        // }
      }
    ]
    this.pressedKeys = new Map()
    this.upKeybindings = new Map()
    this.downKeybindings = new Map()
    this.staticSpawnCooldown = 2000
    this.currentSpawnRecharge = 0
    this.loader = new GLTFLoader()
    this.entities = []
    this.regenKeybindings()
  }

  // takes in this.keybindings, and for every keybinding, maps it to an array of actions
  regenKeybindings(): void {
    this.upKeybindings.clear()
    this.downKeybindings.clear()

    for (const keybinding of this.userFacingKeybindings) {
      {
        const t = ((): Array<() => void> => {
          const t = this.upKeybindings.get(keybinding.key)
          if (t === undefined) {
            this.upKeybindings.set(keybinding.key, [])
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return this.upKeybindings.get(keybinding.key)!
          } else {
            return t
          }
        })()
        t.push(keybinding.keyUp)
      }
      {
        const t = ((): Array<() => void> => {
          const t = this.downKeybindings.get(keybinding.key)
          if (t === undefined) {
            this.downKeybindings.set(keybinding.key, [])
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return this.downKeybindings.get(keybinding.key)!
          } else {
            return t
          }
        })()
        t.push(keybinding.keyDown)
      }
    }
    // console.log(this.up)
  }
}

// what runs before the game starts
export const init = (renderer: THREE.WebGLRenderer): Game => {
  const g = new Game(renderer, window.devicePixelRatio)
  const [scene, camera] = [g.scene, g.camera]

  renderer.setSize(g.width, g.height, false)

  camera.position.z = 1285
  camera.position.y = 0
  camera.position.x = 0

  // spawn a cursor

  // let cursorRenderer = new CSS2DRenderer()

  // spawn a couple players
  {
    const geometry = new THREE.BoxGeometry(100, 100, 100)
    const material = new THREE.MeshDepthMaterial()
    for (const [x, y] of [
      [1000, 0],
      [-1000, 0],
      [0, 1000],
      [0, -1000]
    ]) {
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(x, y, 0)

      scene.add(mesh)
    }
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(-1530, 0, 0)

    scene.add(mesh)
  }

  // spawn a spotlight on top of the player
  {
    const color = 0xffffff
    const intensity = 0.7
    const light = new THREE.DirectionalLight(color, intensity)
    light.position.set(0, 0, 1)
    scene.add(light)
  }

  // Spawn a floor for the player to walk on
  {
    const geometry = new THREE.PlaneGeometry(4000, 4000, 1, 1)
    const material = new THREE.MeshPhongMaterial({ color: 0x000000 })

    const floor = new THREE.Mesh(geometry, material)

    scene.add(floor)
    // i wonder if checking reference or uuid is better.
    g.objectStore.floorUuid = floor.uuid
  }

  // spawn player
  scene.add(g.player.mesh)

  return g
}

export const initListeners = (renderer: THREE.Renderer, g: Game): void => {
  const [camera] = [g.camera]

  window.addEventListener('resize', () => {
    g.ratio = window.devicePixelRatio
    g.width = g.ratio * window.innerWidth
    g.height = g.ratio * window.innerHeight

    renderer.setSize(g.width, g.height, false)

    camera.aspect = g.width / g.height
    camera.updateProjectionMatrix()
  })

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    switch (e.code) {
      case 'ShiftLeft':
      case 'Space':
      case 'KeyW':
      case 'KeyA':
      case 'KeyS':
      case 'KeyD':
      case 'KeyY': {
        // in javascript the keydown event gets fired on repeat for some reason
        // potentially gets executed 60 times per second
        if (g.pressedKeys.get(e.code) !== undefined) {
          return
        }
        const t = g.downKeybindings.get(e.code)
        if (t !== undefined) {
          for (let i = 0; i < t.length; i++) {
            t[i]()
          }
        }
        g.pressedKeys.set(e.code, true)
        break
      }
      default: {
        break
      }
    }
  })

  window.addEventListener('keyup', (e: KeyboardEvent) => {
    switch (e.code) {
      case 'ShiftLeft':
      case 'Space':
      case 'KeyW':
      case 'KeyA':
      case 'KeyS':
      case 'KeyD':
      case 'KeyY': {
        if (g.pressedKeys.get(e.code) !== undefined) {
          g.pressedKeys.delete(e.code)
          const t = g.upKeybindings.get(e.code)
          if (t !== undefined) {
            for (let i = 0; i < t.length; i++) {
              t[i]()
            }
          }
        }
        break
      }
      default: {
        break
      }
    }
  })

  // window.addEventListener('mousemove', (event) => {
  //   // g.mouse.pointer.x += event.movementX
  //   // g.mouse.pointer.y += event.movementY
  //   if (g.mouse.mousedown) {
  //     const movementY = (-event.movementY * Math.PI * 0.3) / 180
  //     const movementX = (-event.movementX * Math.PI * 0.3) / 180
  //     camera.rotateX(movementY)
  //     camera.rotateY(movementX)
  //   }
  // })

  // // need to record mousemove, because when we're clicking q for example, we don't necessarily know where the cursor is
  // window.addEventListener('mousemove', (e: MouseEvent) => {
  //   // code copied straight from https://threejs.org/docs/index.html?q=raycas#api/en/core/Raycaster
  //   g.mouse.pointer.set(
  //     (e.x / window.innerWidth) * 2 - 1,
  //     -(e.y / window.innerHeight) * 2 + 1
  //   )
  // })

  // code from https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener

  // keep in mind that when the pointer is locked, the cursor basically
  // disappears, so this event is never fired again during gameplay
  // window.addEventListener('mousedown', (e: MouseEvent) => {
  // })

  const lockChange = () => {
    if (document.pointerLockElement === renderer.domElement) {
      window.addEventListener('mousemove', updatePosition)
      // window.addEventListener('mousedown', clickDown)
      // window.addEventListener('mouseup', clickUp)
    } else {
      window.removeEventListener('mousemove', updatePosition)
      // window.removeEventListener('mousedown', clickDown)
      // window.removeEventListener('mouseup', clickUp)
    }
  }

  const updatePosition = (e: MouseEvent) => {
    g.mouse.realPointer.x += e.movementX
    g.mouse.realPointer.y += e.movementY
    // console.log(g.mouse.realPointer)
    // console.log(e)
    // console.log(e)
    // g.mouse.pointer.set(
    //   (e.x / window.innerWidth) * 2 - 1,
    //   -(e.y / window.innerHeight) * 2 + 1
    // )
    g.mouse.pointer.set(
      (g.mouse.realPointer.x / window.innerWidth) * 2 - 1,
      -(g.mouse.realPointer.y / window.innerHeight) * 2 + 1
    )
  }

  // const clickDown = (e: MouseEvent) => {
  //   console.log('fast click down')
  // }

  // const clickUp = (e: MouseEvent) => {
  //   console.log('fast click up')
  // }

  window.addEventListener('pointerlockchange', lockChange, false)
  window.addEventListener('mozpointerlockchange', lockChange, false)

  window.addEventListener('mousedown', (e: MouseEvent) => {
    if (document.pointerLockElement === null) {
      renderer.domElement.requestPointerLock()
    }
    switch (e.buttons) {
      case 1: {
        g.mouse.mousedown = true
        break
      }
      case 2: {
        // assign pointer
        g.mouse.raycaster.setFromCamera(g.mouse.pointer, camera)

        const intersects = g.mouse.raycaster.intersectObjects(g.scene.children)

        for (let i = 0; i < intersects.length; i++) {
          if (intersects[i].object.uuid === g.objectStore.floorUuid) {
            g.player.destination = Monad.some(intersects[i].point)
          } else {
            // object clicked! For now ignore and treat as floor, in the
            // future implement some particles
            // console.log("object clicked");
          }

          // TODO we have to consider autoattacking objects, but for now we'll just get the latest i, which is the floor, because we want to get movement down.
          // TODO also want to spawn some sort of particle here when clicking.
          // I think that's probably an animation best done in blender

          // const geometry = new THREE.BoxGeometry(100, 100, 10);
          // const material = new THREE.MeshPhongMaterial({ color: 0x123456 });

          // const mesh = new THREE.Mesh(geometry, material);
          // mesh.position.set(intersects[i].point.x, intersects[i].point.y, 0);
          // scene.add(mesh);
        }
        break
      }
      case 4: {
        break
      }
      default: {
        break
      }
    }
  })

  window.addEventListener('mouseup', (e: MouseEvent) => {
    // for some reason the mouseup keycode is different than the mousedown keycode, too lazy to debug for now
    g.mouse.mousedown = false
  })
}
