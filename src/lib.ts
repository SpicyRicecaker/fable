// // milliseconds after the start of the game
// const spawn = (passed: number): number => {
//   // after x amount of time from the beginning of the game,
//   // set the amount of time something spawns?
// }
import * as THREE from 'three'
import { type Game } from './init'
import { Monad } from './monad'

// what runs inside the game loop
export const run = (
  elapsed: number,
  g: Game,
  renderer: THREE.WebGLRenderer
): void => {
  const [player, buffer] = [g.player, g.buffer]

  // tick part
  // factor in player input
  // handle player movement
  // this implementation, if we don't use dy/dx and timestamp, will be
  // laggy and occasionally jitter
  player.destination = Monad.map(player.destination, (destination) => {
    // keep in mind that this solution doesn't work if we ever plan on using more than one thread, cause we can't guarantee buffer won't be written to.
    buffer.copy(destination)
    buffer.sub(player.mesh.position)

    // if the player speed would go over the buffer
    if (player.speed > buffer.length()) {
      // set the mesh position to the destination
      player.mesh.position.copy(destination)
      // then set the player destination to nothing
      return Monad.none<THREE.Vector3>()
    } else {
      buffer.normalize().multiplyScalar(player.speed).add(player.mesh.position)
      player.mesh.position.copy(buffer)
      return player.destination
    }
  })
  // if the camera is locked, also update it to focus the player's new positionk
  if (g.centerCamera) {
    console.log('CAMERA IS CENTERED')
    // move camera x y position to player's mesh x y position
    g.camera.position.setX(g.player.mesh.position.x)
    g.camera.position.setY(g.player.mesh.position.y)
  }
  // render cursor as triangle for now, will with replace with
  // sprite
  // console.log(g.mouse.pointer)
  // console.log('player', g.player.mesh.position)
  {
    // assign pointer
    g.mouse.raycaster.setFromCamera(g.mouse.pointer, g.camera)

    const intersects = g.mouse.raycaster.intersectObjects(g.scene.children)

    for (let i = 0; i < intersects.length; i++) {
      if (intersects[i].object.uuid === g.objectStore.floorUuid) {
        g.mouse.mesh.position.setX(intersects[i].point.x)
        g.mouse.mesh.position.setY(intersects[i].point.y)
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
  }
  g.currentSpawnRecharge += elapsed
}

export class Enemy {
  hp: number
  direction: THREE.Vector3
  speed: number
  mesh: THREE.Mesh
  alive: boolean
  constructor(
    x: number,
    y: number,
    direction: THREE.Vector3,
    speed: number,
    hp: number
  ) {
    const material = new THREE.BoxGeometry(100, 100, 100)
    const geometry = new THREE.MeshPhongMaterial({ color: 0xab0000 })
    this.mesh = new THREE.Mesh()
    this.mesh.position.set(x, y, 0)
    this.speed = speed
    this.direction = direction
    this.hp = hp
    this.alive = true
  }

  generate(playerPos: THREE.Vector3, radius: number): Enemy {
    // generate a random number somewhere within the circle of the current
    // player position
    const angle = Math.random() * Math.PI * 2

    const unitX = Math.cos(angle)
    const unitY = Math.sin(angle)
    const direction = new THREE.Vector3(unitX, unitY, 0).negate()

    const x = unitX * 500
    const y = unitY * 500

    // the speed of almost any projectile is greater than the speed of the
    // player, so at a baseline we'll try 20
    // the projectile should be removed probably when it goes offscreen rather
    // than give a lifetime, but we'll just do 5 seconds for now
    return new Enemy(x, y, direction, 20, 5000)
  }

  tick(elapsed: number) {
    // buffer.copy(player.destination)
    // buffer.sub(player.mesh.position)
    this.hp -= elapsed
    if (this.hp > 0) {
      this.mesh.position
        .normalize()
        .multiplyScalar(this.speed)
        .add(this.mesh.position)
    } else {
      // how do we queue this enemy to be destroyed?
      // this.mesh.removeFromParent()
      this.alive = false
    }
  }
}
