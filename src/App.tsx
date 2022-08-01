import {
  Component,
  onCleanup,
  createEffect,
  createSignal,
  Show,
} from "solid-js";
import { createStore } from "solid-js/store";
import { onMount } from "solid-js";
import * as THREE from "three";
// import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
// import { FlyControls } from "three/examples/jsm/controls/FlyControls";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import type { Vector3 } from "three";
// import GUI from "lil-gui";

// import logo from "./logo.svg";
// import styles from "./App.module.css";

// milliseconds after the start of the game
const spawn = (passed: number): number => {
  // after x amount of time from the beginning of the game,

  // set the amount of time something spawns?
}

const App: Component = () => {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  let vector = new THREE.Vector3();

  enum Mode {
    Camera,
    Gameplay,
  }

  interface Game {
    player: Player;
    mode: Mode;
  }


  interface Player {
    // position: Vector3;
    destination: Vector3 | null;
    // distance that the player is allowed to travel per unit time
    speed: number;
    mesh: THREE.Mesh;
  }

  const player: Player = {
    // position: new THREE.Vector3(0, 0, 0),
    destination: null,
    speed: 10,
    mesh: (() => {
      const radius = 70;
      const material = new THREE.SphereGeometry(radius);
      const geometry = new THREE.MeshPhongMaterial({ color: 0xffffff });

      const mesh = new THREE.Mesh(material, geometry);
      mesh.position.set(0, 0, 0);
      return mesh;
    })(),
  };

  let ratio = window.devicePixelRatio;
  let width = ratio * window.innerWidth;
  let height = ratio * window.innerHeight;

  const pointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();

  const game: Game = { player, mode: Mode.Gameplay };
  const [mode, setMode] = createSignal(game.mode);

  interface ObjectWithDebug {
    axes: THREE.AxesHelper;
    grid: THREE.GridHelper;
  }

  const objectWithDebug: ObjectWithDebug[] = [];

  const objectStore: any = {};

  // three.js vectors cannot be modified without mutating, so we'll just use one vector and copy into it when needed
  const buffer = new THREE.Vector3();

  // let [array, setArray] = createStore([1, 2, 3]);

  // createEffect(() => {
  //   console.log(array);
  // });

  onMount(async () => {
    renderer.setSize(width, height, false);
    // renderer.setPixelRatio(window.devicePixelRatio);

    window.addEventListener("resize", () => {
      ratio = window.devicePixelRatio;
      width = ratio * window.innerWidth;
      height = ratio * window.innerHeight;

      renderer.setSize(width, height, false);

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      renderer.domElement.width / renderer.domElement.height,
      // 1,
      0.1,
      10000
    );

    camera.position.z = 1285;
    camera.position.y = 0;
    camera.position.x = 0;
    // camera.lookAt(new THREE.Vector3(0, 0, 0));
    // camera.updateProjectionMatrix();

    // camera.rotation.order = "YXZ";

    // const controls = new OrbitControls( camera, renderer.domElement );
    // const controls = new PointerLockControls( camera, renderer.domElement );

    const loader = new GLTFLoader();

    // const dracoLoader = new DRACOLoader();
    // dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.4.1/");
    // loader.setDRACOLoader(dracoLoader);

    {
      // const data = await loader.loadAsync("/static/Player.glb");
      // data.scene.scale.set(25, 25, 25);
      // scene.add(data.scene);

      const geometry = new THREE.BoxGeometry(100, 100, 100);
      const material = new THREE.MeshDepthMaterial();
      for (const [x, y] of [
        [1000, 0],
        [-1000, 0],
        [0, 1000],
        [0, -1000],
      ]) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, 0);

        scene.add(mesh);
      }
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(-1530, 0, 0);

      scene.add(mesh);
    }

    // const light = new THREE.AmbientLight(0x909090); // soft white light
    // scene.add(light);

    {
      const color = 0xffffff;
      const intensity = 0.7;
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(0, 0, 1);
      scene.add(light);
    }

    // floor
    {
      const geometry = new THREE.PlaneGeometry(4000, 4000, 1, 1);
      const material = new THREE.MeshPhongMaterial({ color: 0x000000 });

      const floor = new THREE.Mesh(geometry, material);

      scene.add(floor);
      // i wonder if checking reference or uuid is better.
      objectStore.floorUuid = floor.uuid;
    }

    // spawn player
    {
      scene.add(player.mesh);
    }

    // // spawn solar system
    const objects: any[] = [];
    // {
    //   // sun
    //   const sun = (() => {
    //     const material = new THREE.MeshPhongMaterial({ color: 0xe3d796 });
    //     const geometry = new THREE.SphereGeometry(70);

    //     return new THREE.Mesh(geometry, material);
    //   })();
    //   sun.position.set(300, 0, 0);
    //   // forget how java gc works but I guess it does???
    //   objects.push(sun);
    //   scene.add(sun);

    //   // earth
    //   const earth = (() => {
    //     const material = new THREE.MeshPhongMaterial({ color: 0xc9e396 });
    //     const geometry = new THREE.SphereGeometry(10);

    //     return new THREE.Mesh(geometry, material);
    //   })();
    //   earth.position.set(300, 0, 0);
    //   // forget how java gc works but I guess it does???
    //   objects.push(earth);
    //   sun.add(earth);

    //   const moon = (() => {
    //     const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
    //     const geometry = new THREE.SphereGeometry(5);

    //     return new THREE.Mesh(geometry, material);
    //   })();
    //   moon.position.set(50, 0, 0);
    //   // forget how java gc works but I guess it does???
    //   objects.push(moon);
    //   earth.add(moon);
    // }

    // objects.forEach((o) => {
    //   const axeshelper = new THREE.AxesHelper(100);
    //   (axeshelper.material as THREE.Material).depthTest = false;

    //   const gridhelper = new THREE.GridHelper(200);
    //   (gridhelper.material as THREE.Material).depthTest = false;
    //   gridhelper.rotateX(Math.PI / 2);

    //   o.add(axeshelper);
    //   o.add(gridhelper);

    //   objectWithDebug.push({ axes: axeshelper, grid: gridhelper });
    // });

    // scene.add(light);
    // {
    //   const data = await loader.loadAsync("static/Parrot.glb");
    //   scene.add(data.scene);
    // }

    // {
    //   const data = await loader.loadAsync("static/blade.glb");
    //   data.scene.position.set(0, 0, 0);
    //   data.scene.scale.set(2, 2, 2);
    //   scene.add(data.scene);

    //   // console.log(data.scene.normalMatrix);
    //   // console.log(data.scene.matrixWorld);
    // }

    let start: number | null = null;
    const gameLoop = (timestamp: number) => {
      if (start === null) {
        start = timestamp;
      }
      const elapsed = timestamp - start;
      start = timestamp;

      // tick part
      {
        // factor in player input
        doKeys();
        camera.getWorldDirection(vector);
        // handle player movement
        // this implementation, if we don't use dy/dx and timestamp, will be
        // laggy and occasionally jitter
        if (player.destination) {
          // keep in mind that this solution doesn't work if we ever plan on using more than one thread, cause we can't guarantee buffer won't be written to.
          buffer.copy(player.destination);
          buffer.sub(player.mesh.position);

          if (player.speed > buffer.length()) {
            // Don't know how else to set read-only property
            // console.log(player.destination, player.destination.toArray());
            // player.mesh.position.fromArray(player.destination.toArray());
            // player.mesh.position.set(player.mesh.position.x + 50, 0, 0);
            player.mesh.position.copy(player.destination);
            player.destination = null;
            // console.log('1')
          } else {
            // console.log(player.destination);
            buffer
              .normalize()
              .multiplyScalar(player.speed)
              .add(player.mesh.position);

            player.mesh.position.copy(buffer);
            // const direction = vectorPositionDestination.normalize();
            // const vectorPositionNewPosition = direction.multiplyScalar(
            //   player.speed
            // );

            // player.mesh.position.fromArray(
            //   player.mesh.position.add(vectorPositionNewPosition).toArray()
            // );
            // console.log('2')
          }
        }
        // {
        //   // update earth moon positions
        //   const time = elapsed * 0.00001;
        //   // console.log(time);
        //   for (let i = 0; i < objects.length; i++) {
        //     objects[i].rotateZ(0.01);
        //   }
        // }
        // get unit vector of
      }

      // render part
      {
        renderer.render(scene, camera);
      }

      frame = requestAnimationFrame(gameLoop);
    };

    let frame = requestAnimationFrame(gameLoop);

    const keys: { [key: string]: boolean } = {
      KeyW: false,
      KeyA: false,
      KeyS: false,
      KeyD: false,
      Space: false,
      ShiftLeft: false,
    };

    const doKeys = () => {
      // not sure if using switch case here will be jank
      switch (game.mode) {
        case Mode.Gameplay: {
          if (keys.F1) {
            game.mode = Mode.Camera;
          }
          break;
        }
        case Mode.Camera: {
          if (keys.KeyW) {
            // camera.position.y += 0.05{vector.y}{vector.z};
            // camera.position.x += vector.x;
            // camera.position.y += vector.y;
            // camera.position.z += vector.z;
            camera.position.y += 2;
          }
          if (keys.KeyA) {
            // camera.position.x -= 0.05;
            camera.position.x -= 2;
          }
          if (keys.KeyS) {
            camera.position.y -= 2;
            // camera.position.x -= vector.x;
            // camera.position.y -= vector.y;
            // camera.position.z -= vector.z;
          }
          if (keys.KeyD) {
            // camera.position.x += 0.05;
            camera.position.x += 2;
          }
          if (keys.Space) {
            camera.position.z += 5;
            // camera.position.y += 2;
          }
          if (keys.ShiftLeft) {
            camera.position.z -= 5;
            // camera.position.y -= 2;
          }
          if (keys.F1) {
            game.mode = Mode.Gameplay;
          }

          break;
        }
        default: {
          break;
        }
      }
    };

    window.addEventListener("keydown", (e: KeyboardEvent) => {
      switch (e.code) {
        case "ShiftLeft":
        case "Space":
        case "KeyW":
        case "KeyA":
        case "KeyS":
        case "KeyD": {
          keys[e.code] = true;
          break;
        }
        default: {
          break;
        }
      }
    });

    window.addEventListener("keyup", (e: KeyboardEvent) => {
      switch (e.code) {
        case "ShiftLeft":
        case "Space":
        case "KeyW":
        case "KeyA":
        case "KeyS":
        case "KeyD": {
          keys[e.code] = false;
          break;
        }
        default: {
          break;
        }
      }
    });

    window.addEventListener("mousemove", (event) => {
      if (keys.mousedown) {
        const movementY = (-event.movementY * Math.PI * 0.3) / 180;
        const movementX = (-event.movementX * Math.PI * 0.3) / 180;
        camera.rotateX(movementY);
        camera.rotateY(movementX);
      }
    });

    // need to record mousemove, because when we're clicking q for example, we don't necessarily know where the cursor is
    window.addEventListener("mousemove", (e: MouseEvent) => {
      // code copied straight from https://threejs.org/docs/index.html?q=raycas#api/en/core/Raycaster
      pointer.set(
        (e.x / window.innerWidth) * 2 - 1,
        -(e.y / window.innerHeight) * 2 + 1
      );
    });

    // let prevX: number | null = null;
    // let prevY: number | null = null;
    window.addEventListener("mousedown", (e: MouseEvent) => {
      // e.preventDefault();
      // e.stopPropagation();

      switch (e.buttons) {
        case 1: {
          keys.mousedown = true;
          break;
        }
        case 2: {
          // assign pointer
          raycaster.setFromCamera(pointer, camera);

          const intersects = raycaster.intersectObjects(scene.children);

          for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].object.uuid === objectStore.floorUuid) {
              // console.log("hi");
              // console.log(intersects[i].point);
              player.destination = intersects[i].point;
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

          // on right click, assign player direction
          // player.destination = new THREE.Vector3(e.x, e.y, 0);
          // create new sprite at the player destination

          break;
        }
        case 4: {
          break;
        }
        default: {
          break;
        }
      }
      // console.log(e);
      // if (prevX && prevY) {
      //   let [dx, dy] = [e.x - prevX, e.y - prevY];
      // } else {
      //   prevX = e.y;
      //   prevY = e.x;
      // }
    });

    window.addEventListener("mouseup", (e: MouseEvent) => {
      keys.mousedown = false;
      // switch (e.buttons) {
      //   case 1: {
      //     keys.mousedown = false;
      //     break;
      //   }
      //   case 2: {
      //     break;
      //   }
      //   case 4: {
      //     break;
      //   }
      //   default: {
      //     break;
      //   }
      // }
      // if (prevX && prevY) {
      //   let [dx, dy] = [e.x - prevX, e.y - prevY];
      // } else {
      //   prevX = e.y;
      //   prevY = e.x;
      // }
    });

    // onCleanup(() => {
    //   cancelAnimationFrame(frame);
    // });
  });

  return (
    <>
      <div style="position: fixed; top: 0; left: 0; color: white;">
        <div>
          <input
            id="grid"
            type="checkbox"
            onchange={() => {
              objectWithDebug.forEach(
                (o) => (o.grid.visible = !o.grid.visible)
              );
            }}
          ></input>
          <label for="grid">enable debug grids</label>
        </div>
        <div>
          <input
            id="axes"
            type="checkbox"
            onchange={() => {
              objectWithDebug.forEach(
                (o) => (o.axes.visible = !o.axes.visible)
              );
            }}
          ></input>
          <label for="axes">enable debug axes</label>
        </div>
        <Show when={mode() === Mode.Camera}>
          <div>FUCK</div>
        </Show>
        <div></div>
      </div>
      {renderer.domElement}
    </>
  );
};

export default App;
