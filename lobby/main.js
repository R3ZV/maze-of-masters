import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { WebPdSocket } from '../music/interface.js';

class UIManager {
    constructor() {
        this.crosshair = document.createElement('div');
        this.crosshair.style.position = 'absolute';
        this.crosshair.style.top = '50%'; this.crosshair.style.left = '50%';
        this.crosshair.style.width = '10px'; this.crosshair.style.height = '10px';
        this.crosshair.style.backgroundColor = 'white';
        this.crosshair.style.borderRadius = '50%';
        this.crosshair.style.transform = 'translate(-50%, -50%)';
        this.crosshair.style.pointerEvents = 'none';
        document.body.appendChild(this.crosshair);
    }
}

class InputManager {
    constructor(onInteractCallback) {
        this.keys = { w: false, a: false, s: false, d: false };
        this.onInteract = onInteractCallback;

        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    handleKeyDown(e) {
        const key = e.key.toLowerCase();
        if (this.keys.hasOwnProperty(key)) this.keys[key] = true;
        if (key === 'e' && this.onInteract) this.onInteract();
    }

    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        if (this.keys.hasOwnProperty(key)) this.keys[key] = false;
    }
}

class FootstepAudio {
    constructor(camera) {
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);
        this.sounds = [];
        this.stepInterval = 0.42;
        this.timer = 0;
        this.lastIndex = -1;

        const loader = new THREE.AudioLoader();
        for (let i = 1; i <= 6; i++) {
            const audio = new THREE.Audio(this.listener);
            loader.load(`assets/foot_${i}.wav`, buf => audio.setBuffer(buf));
            this.sounds.push(audio);
        }
    }

    _playStep() {
        if (this.sounds.every(s => !s.buffer)) return;
        const ready = this.sounds.filter((s, i) => s.buffer && i !== this.lastIndex);
        if (!ready.length) return;
        const snd = ready[Math.floor(Math.random() * ready.length)];
        this.lastIndex = this.sounds.indexOf(snd);
        if (snd.isPlaying) snd.stop();
        snd.setVolume(0.6);
        snd.play();
    }

    update(isMoving, delta) {
        if (!isMoving) { this.timer = this.stepInterval; return; }
        this.timer += delta;
        if (this.timer >= this.stepInterval) {
            this._playStep();
            this.timer = 0;
        }
    }
}

class Player {
    constructor(camera) {
        this.rig = new THREE.Group();
        this.rig.position.set(0, 0, 0);
        this.rig.add(camera);
        this.camera = camera;
        this.desktopHeight = 1.6;
        this.camera.position.y = this.desktopHeight;
        this.speed = 0.08;
        this.radius = 0.5;
        this.footsteps = new FootstepAudio(camera);
    }

    updateMovement(keys, walls, renderer, delta) {
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(this.camera.quaternion);
        const direction = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, euler.y, 0)).normalize();
        const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, euler.y, 0)).normalize();

        const moveVec = new THREE.Vector3(0, 0, 0);

        if (keys.w) moveVec.add(direction);
        if (keys.s) moveVec.sub(direction);
        if (keys.a) moveVec.sub(right);
        if (keys.d) moveVec.add(right);

        const session = renderer.xr.getSession();
        if (session) {
            this.camera.position.y = 0;
            for (const source of session.inputSources) {
                if (source.gamepad && source.gamepad.axes.length >= 4) {
                    const xAxis = source.gamepad.axes[2];
                    const yAxis = source.gamepad.axes[3];
                    if (Math.abs(yAxis) > 0.1) moveVec.addScaledVector(direction, -yAxis);
                    if (Math.abs(xAxis) > 0.1) moveVec.addScaledVector(right, xAxis);
                }
            }
        } else {
            this.camera.position.y = this.desktopHeight;
        }

        const isMoving = moveVec.lengthSq() > 0;
        if (isMoving) {
            moveVec.normalize().multiplyScalar(this.speed);
            this.rig.position.x += moveVec.x;
            if (this.checkCollisions(walls)) {
                this.rig.position.x -= moveVec.x;
            }

            this.rig.position.z += moveVec.z;
            if (this.checkCollisions(walls)) {
                this.rig.position.z -= moveVec.z;
            }
        }

        this.footsteps.update(isMoving, delta);
    }

    checkCollisions(walls) {
        const playerSphere = new THREE.Sphere(this.rig.position, this.radius);
        for (let wall of walls) {
            const wallBox = new THREE.Box3().setFromObject(wall);
            wallBox.min.y = -10; 
            wallBox.max.y = 10;
            if (wallBox.intersectsSphere(playerSphere)) return true;
        }
        return false;
    }
}

class Game {
    constructor() {
        this.clock = new THREE.Clock();
        this.ui = new UIManager();
        this.input = new InputManager(() => this.handleInteraction());
        this.walls = [];
        this.npcs = [];
        this.hoveredNPC = null;
        this.audioSocket = new WebPdSocket("ws://localhost:8765");
        this.volume = 0.13;
        this.initRenderer();
        this.initScene();
        this.initVRControllers();

        const layout = [
            "#############",
            "#A..#.F.#..B#",
            "#.........###",
            "###..#####.E#",
            "#...........#",
            "#C....#....D#",
            "#############"
        ];
        this.buildMaze(layout);

        this.audioSocket.listen()
            .then(() => this.audioSocket.send('lobbyVolume', this.volume))
            .catch(err => console.error("[Audio] init failed:", err));

        window.addEventListener('beforeunload', () => {
            this.audioSocket.send('lobbyVolume', 0);
        });
        
        this.renderer.setAnimationLoop(() => this.tick());
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        this.vrButton = VRButton.createButton(this.renderer);
        document.body.appendChild(this.vrButton);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); 
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        this.scene.add(dirLight);

        this.player = new Player(this.camera);
        this.scene.add(this.player.rig);

        this.controls = new PointerLockControls(this.camera, document.body);
        document.body.addEventListener('click', () => {
            if (!this.renderer.xr.isPresenting) this.controls.lock();
        });
    }

    initVRControllers() {
        const onSelect = () => this.handleInteraction();

        this.controllers = [];
        for (let i = 0; i < 2; i++) {
            const controller = this.renderer.xr.getController(i);
            controller.addEventListener('selectstart', onSelect);
            this.player.rig.add(controller);
            this.controllers.push(controller);

            const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
            const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xffffff }));
            line.scale.z = 2;
            controller.add(line);
        }
    }

    createTextSprite(message) {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.roundRect(10, 20, 492, 88, 15);
        ctx.fill();
        ctx.font = 'bold 40px Arial'; ctx.fillStyle = 'white';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
        sprite.scale.set(3, 0.75, 1);
        return sprite;
    }

    getGameData(id) {
        switch(id) {
            case 'A': return { name: `Dragon's lair`,       url: '/mini-games/dragon' };
            case 'B': return { name: 'Match the Sipos',     url: '/mini-games/cards' };
            case 'C': return { name: `Paul's shop`,         url: '/mini-games/paul' };
            case 'D': return { name: `Rusu's radio`,        url: '/mini-games/signals' };
            case 'E': return { name: `Paun's room`,         url: '/mini-games/bird' };
            case 'F': return { name: `Chirita's rocket`,    url: '/mini-games/space' };
            default: return { name: 'unknown',              url: '#' };
        }
    }

    buildMaze(matrix) {
        const cellSize = 4;
        const wallHeight = 4;
        const rows = matrix.length;
        const cols = matrix[0].length;

        const floorGeo = new THREE.PlaneGeometry(cols * cellSize, rows * cellSize);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        this.scene.add(floor);

        const wallGeo = new THREE.BoxGeometry(cellSize, wallHeight, cellSize);
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const char = matrix[r][c];
                const x = (c - cols / 2 + 0.5) * cellSize;
                const z = (r - rows / 2 + 0.5) * cellSize;

                if (char === '#') {
                    const wall = new THREE.Mesh(wallGeo, wallMat);
                    wall.position.set(x, wallHeight / 2, z);
                    this.scene.add(wall);
                    this.walls.push(wall);
                } 
                else if (char !== '.') {
                    this.spawnNPC(char, x, z);
                }
            }
        }

        this.player.rig.position.set(0, 0, 4);
    }

    spawnNPC(id, x, z) {
        const group = new THREE.Group();
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.6);
        const bodyMat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.8;
        group.add(body);

        const gameData = this.getGameData(id);
        const text = this.createTextSprite(`[E]: Enter ${gameData.name}`);
        text.position.set(0, 2.2, 0);
        text.visible = false;
        group.add(text);

        group.position.set(x, 0, z);
        this.scene.add(group);

        this.npcs.push({ id: id, data: gameData, mesh: group, sprite: text, position: new THREE.Vector3(x, 0, z) });
    }

    handleInteraction() {
        if (!this.hoveredNPC) return;
        if (this.hoveredNPC.data.url !== '#') {
            this.audioSocket.send('lobbyVolume', 0);
            window.location.href = this.hoveredNPC.data.url;
        }
    }

    tick() {
        const delta = this.clock.getDelta();
        if (this.controls.isLocked || this.renderer.xr.isPresenting) {
            this.player.updateMovement(this.input.keys, this.walls, this.renderer, delta);

            this.hoveredNPC = null;
            let closestDist = 3.0;

            for (let npc of this.npcs) {
                npc.sprite.visible = false;
                npc.sprite.lookAt(this.camera.position);

                const dist = this.player.rig.position.distanceTo(npc.position);
                if (dist < closestDist) {
                    closestDist = dist;
                    this.hoveredNPC = npc;
                }
            }

            if (this.hoveredNPC) {
                this.hoveredNPC.sprite.visible = true;
            }
            this.audioSocket.send('lobbyVolume', this.volume);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

const game = new Game();
