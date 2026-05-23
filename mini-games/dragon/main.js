import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

class WebGLUI {
    constructor(camera) {
        this.camera = camera;

        this.hudCanvas = document.createElement('canvas');
        this.hudCanvas.width = 600; this.hudCanvas.height = 128;
        this.hudCtx = this.hudCanvas.getContext('2d');
        this.hudTex = new THREE.CanvasTexture(this.hudCanvas);

        const hudMat = new THREE.MeshBasicMaterial({ map: this.hudTex, transparent: true, depthTest: false });
        this.hudMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.32), hudMat);
        this.hudMesh.position.set(0, 0.5, -1.5);
        this.hudMesh.renderOrder = 999;
        this.camera.add(this.hudMesh);

        this.menuCanvas = document.createElement('canvas');
        this.menuCanvas.width = 1024; this.menuCanvas.height = 512;
        this.menuCtx = this.menuCanvas.getContext('2d');
        this.menuTex = new THREE.CanvasTexture(this.menuCanvas);

        const menuMat = new THREE.MeshBasicMaterial({ map: this.menuTex, transparent: true, depthTest: false });
        this.menuMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.25), menuMat);
        this.menuMesh.position.set(0, 0, -1.6);
        this.menuMesh.renderOrder = 1000;
        this.camera.add(this.menuMesh);

        this.menuMesh.visible = false;
        this.updateHUD("Safe... for now.", "white");
    }

    updateHUD(text, color) {
        const ctx = this.hudCtx;
        ctx.clearRect(0, 0, 600, 128);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.roundRect(20, 20, 560, 88, 15);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;
        ctx.font = 'bold 32px Arial';

        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(text, 300, 64);

        this.hudTex.needsUpdate = true;
    }

    showScreen(bgColor, textColor, title, subtitle) {
        this.hudMesh.visible = false;
        this.menuMesh.visible = true;

        const ctx = this.menuCtx;
        ctx.clearRect(0, 0, 1024, 512);

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 1024, 512);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 8;

        ctx.fillStyle = textColor;
        ctx.font = 'bold 60px Arial';
        ctx.fillText(title, 512, 180);

        ctx.fillStyle = 'white';
        ctx.font = '36px Arial';
        ctx.fillText(subtitle, 512, 260);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '24px Arial';
        ctx.fillText("VR: Pull Trigger to Retry  |  PC: Press R to Retry", 512, 400);

        this.menuTex.needsUpdate = true;
    }

    showWin() { this.showScreen('rgba(0, 30, 0, 0.9)', '#50C878', "YOU ESCAPED!", "Without destroying the equipment."); }
    showLose() { this.showScreen('rgba(40, 0, 0, 0.9)', '#FF4444', "THE DRAGON SPOTTED YOU!", "Game Over."); }
    hideMenu() { this.menuMesh.visible = false; this.hudMesh.visible = true; }
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
            loader.load(`assets/foot_${i}.wav`, buf => audio.setBuffer(buf), undefined, () => {});
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
        this.state = { onChair: false };
        this.rig = new THREE.Group();
        this.rig.position.set(-15, 0, 30);
        this.rig.add(camera);
        this.camera = camera;

        this.standingHeight = 1.6;
        this.camera.position.y = this.standingHeight;

        this.speed = 3.5; 
        this.currentChairPos = new THREE.Vector3();
        this.footsteps = new FootstepAudio(camera);
    }

    sitDown(chairWorldPos) {
        this.state.onChair = true;
        this.currentChairPos.copy(chairWorldPos);
        this.rig.position.set(chairWorldPos.x, -0.6, chairWorldPos.z); 
    }

    standUp() {
        this.state.onChair = false;
        const stepOutDistance = this.currentChairPos.x > 0 ? -2 : 2;
        this.rig.position.set(this.currentChairPos.x + stepOutDistance, 0, this.currentChairPos.z);
    }

    updateMovement(keys, renderer, delta) {
        if (this.state.onChair) { this.footsteps.update(false, delta); return; }

        let inX = 0, inY = 0;

        if (keys.a) inX = -1; if (keys.d) inX = 1;
        if (keys.w) inY =  1; if (keys.s) inY = -1;

        const session = renderer.xr.getSession();
        if (session) {
            for (const source of session.inputSources) {
                if (source.gamepad && source.gamepad.axes.length >= 4) {
                    const ax = source.gamepad.axes[2];
                    const ay = source.gamepad.axes[3];
                    if (Math.abs(ax) > 0.1) inX = ax;
                    if (Math.abs(ay) > 0.1) inY = -ay;
                }
            }
        }

        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(this.camera.quaternion);
        const direction = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, euler.y, 0));
        const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, euler.y, 0));

        const moveSpeed = this.speed * delta;
        if (inY !== 0) this.rig.position.addScaledVector(direction, inY * moveSpeed);
        if (inX !== 0) this.rig.position.addScaledVector(right, inX * moveSpeed);

        this.rig.position.x = Math.max(-24, Math.min(24, this.rig.position.x));
        this.rig.position.z = Math.max(-34, Math.min(34, this.rig.position.z));
        this.rig.position.y = 0;

        const isMoving = inX !== 0 || inY !== 0;
        this.footsteps.update(isMoving, delta);
    }
}

class Game {
    constructor() {
        this.clock = new THREE.Clock();
        this.input = new InputManager(() => this.handleInteraction());

        this.state = 'PLAYING';
        this.cycleTime = 0;
        this.lookDuration = 2.0;
        this.safeDuration = this.getRandomSafeTime();

        this.chairsList = [];
        this.door = null;
        this.doorText = null;
        this.scientist = null;

        this.musicCtx = new AudioContext();
        this.musicBuf = null;
        this.musicSrc = null;
        fetch('assets/horror.wav')
            .then(r => r.arrayBuffer())
            .then(b => this.musicCtx.decodeAudioData(b))
            .then(b => { this.musicBuf = b; if (this.musicCtx.state === 'running' && !this.musicSrc) this._playMusic(); })
            .catch(() => null);

        this.initRenderer();
        this.initScene();
        this.buildWorld();
        this.loadAssets();
        this.initVRControllers();

        window.addEventListener('keydown', e => {
            const k = e.key.toLowerCase();
            if (k === 'r' && (this.state === 'WON' || this.state === 'LOST')) this.restart();
            if (k === 'l' && (this.state === 'WON' || this.state === 'LOST')) window.location.href = '/lobby';
        });

        this.renderer.setAnimationLoop(() => this.tick());
    }

    getRandomSafeTime() {
        return Math.random() * (8 - 5) + 5;
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
        this.scene.background = new THREE.Color(0xD3D3D3);
        this.scene.fog = new THREE.Fog(0xD3D3D3, 10, 50);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        this.player = new Player(this.camera);
        this.scene.add(this.player.rig);

        this.ui = new WebGLUI(this.camera);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(0, 20, 10);
        this.scene.add(directionalLight);

        this.controls = new PointerLockControls(this.camera, document.body);
        document.body.addEventListener('click', () => {
            if (this.state === 'PLAYING' && !this.renderer.xr.isPresenting) {
                this.controls.lock();
                if (!this.musicSrc) this._playMusic();
            }
        });
    }

    initVRControllers() {
        const onSelect = () => {
            if (this.state === 'WON' || this.state === 'LOST') {
                this.restart();
            } else {
                this.handleInteraction();
            }
        };

        for (let i = 0; i < 2; i++) {
            const controller = this.renderer.xr.getController(i);
            controller.addEventListener('selectstart', onSelect);
            this.player.rig.add(controller);
        }
    }

    createTextSprite(message) {
        const canvas = document.createElement('canvas');
        canvas.width = 600; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.roundRect(10, 20, 580, 88, 15);
        ctx.fill();
        ctx.font = 'bold 36px Arial'; ctx.fillStyle = 'white';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
        sprite.scale.set(3.5, 0.75, 1);
        return sprite;
    }

    buildWorld() {
        const floor = new THREE.Mesh(new THREE.BoxGeometry(50, 0.2, 70), new THREE.MeshStandardMaterial({ color: 0xE0E0E0 }));
        floor.position.y = -0.1; 
        this.scene.add(floor);

        const board = new THREE.Mesh(new THREE.BoxGeometry(30, 5, 0.2), new THREE.MeshStandardMaterial({ color: 0x2E8B57 }));
        board.position.set(0, 2.5, -34.8); 
        this.scene.add(board);

        this.door = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 2), new THREE.MeshStandardMaterial({ color: 0xB22222 }));
        this.door.position.set(24.9, 1.5, -15); 
        this.scene.add(this.door);

        this.doorText = this.createTextSprite("[E / Trigger]: Exit");
        this.doorText.position.set(24.7, 1.5, -15);
        this.doorText.visible = false; 
        this.scene.add(this.doorText);
    }

    loadAssets() {
        const gltfLoader = new GLTFLoader();

        gltfLoader.load('assets/scientist.glb', (gltf) => {
            this.scientist = gltf.scene;
            this.scientist.position.set(0, 0, -30);
            this.scene.add(this.scientist);
        }, undefined, (error) => console.error('Error loading scientist:', error));

        gltfLoader.load('assets/teacher_desk.glb', (gltf) => {
            const desk = gltf.scene;
            desk.position.set(0, 1, -28.5);
            desk.scale.setScalar(1.5);
            desk.rotation.y = -Math.PI / 2;
            this.scene.add(desk);
        }, undefined, (error) => console.error('Error loading teacher_desk:', error));

        gltfLoader.load('assets/chair.glb', (gltf) => {
            const loadedChair = gltf.scene;
            loadedChair.rotation.y = Math.PI;
            const columns = [-12, 12];
            const rows = [-20, -5, 10, 25];

            columns.forEach(c => rows.forEach(r => this.spawnDesk(c, r, loadedChair)));
        }, undefined, (error) => console.error('Error loading chair:', error));
    }

    spawnDesk(x, z, baseChairModel) {
        const group = new THREE.Group();
        const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 1), new THREE.MeshStandardMaterial({ color: 0x4682B4 }));
        deskTop.position.set(0, 0.4, 0);
        group.add(deskTop);

        const offsets = [-0.6, 0.6];
        offsets.forEach(offsetX => {
            const chair = baseChairModel.clone();
            chair.position.set(offsetX, 0, 0.8);

            const text = this.createTextSprite("[E / Trigger]: Sit/Stand");
            text.position.set(0, 1.2, 0);
            text.visible = false;
            chair.add(text);
            chair.userData.sprite = text;

            group.add(chair);
            this.chairsList.push(chair);
        });

        group.position.set(x, 0, z);
        this.scene.add(group);
    }

    handleInteraction() {
        if (this.state !== 'PLAYING') return;

        if (!this.musicSrc) this._playMusic();

        if (this.player.state.onChair) {
            this.player.standUp();
            return;
        }

        if (this.player.rig.position.distanceTo(this.door.position) < 3.0) {
            this.endGame('WON');
            return;
        }

        let nearestChair = null;
        let minDistance = 2.0;

        for (let chair of this.chairsList) {
            let wp = new THREE.Vector3();
            chair.getWorldPosition(wp);
            let d = this.player.rig.position.distanceTo(wp);

            if (d < minDistance) {
                minDistance = d;
                nearestChair = wp;
            }
        }

        if (nearestChair) {
            this.player.sitDown(nearestChair);
        }
    }

    tick() {
        const dt = this.clock.getDelta();

        const isActive = this.controls.isLocked || this.renderer.xr.isPresenting;

        if (this.state === 'PLAYING' && isActive) {
            this.update(dt);
        }

        if (this.state === 'LOSING') {
            this.updateLosingSequence(dt);
        }

        this.renderer.render(this.scene, this.camera);
    }

    update(dt) {
        this.player.updateMovement(this.input.keys, this.renderer, dt);
        this.updateUIProximity();
        this.updateDragonLogic(dt);
    }

    updateUIProximity() {
        const pPos = this.player.rig.position;
        const isSitting = this.player.state.onChair;

        this.doorText.visible = (pPos.distanceTo(this.door.position) < 3.0 && !isSitting);
        this.doorText.lookAt(this.camera.position);

        for (let chair of this.chairsList) {
            let wp = new THREE.Vector3();
            chair.getWorldPosition(wp);
            chair.userData.sprite.visible = (pPos.distanceTo(wp) < 2.5 && !isSitting);
            chair.userData.sprite.lookAt(this.camera.position);
        }
    }

    updateDragonLogic(dt) {
        this.cycleTime += dt;
        const totalCycle = this.safeDuration + this.lookDuration;

        if (this.cycleTime > totalCycle) {
            this.cycleTime = 0;
            this.safeDuration = this.getRandomSafeTime();
        }

        if (this.cycleTime < this.safeDuration) {
            this.scene.background.setHex(0xD3D3D3);
            this.scene.fog.color.setHex(0xD3D3D3);

            let timeLeft = this.safeDuration - this.cycleTime;
            if (timeLeft <= 3.0) {
                this.ui.updateHUD(`Dragon looks in: ${Math.ceil(timeLeft)}s!`, '#FFA500');
            } else {
                this.ui.updateHUD("Safe... for now.", 'white');
            }
        } else {
            this.scene.background.setHex(0x8B0000);
            this.scene.fog.color.setHex(0x8B0000);
            this.ui.updateHUD("DRAGON IS LOOKING! HIDE!", '#FF0000');

            if (!this.player.state.onChair) {
                this.endGame('LOST');
            }
        }
    }

    updateLosingSequence(dt) {
        if (!this.scientist) {
            this.state = 'LOST';
            this.controls.unlock();
            this.ui.showLose();
            return;
        }

        const playerPos = this.player.rig.position;
        const npcPos = this.scientist.position;
        const dx = playerPos.x - npcPos.x;
        const dz = playerPos.z - npcPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        this.scientist.lookAt(playerPos.x, npcPos.y, playerPos.z);

        if (dist < 1.5) {
            this.state = 'LOST';
            this.controls.unlock();
            this.ui.showLose();
            return;
        }

        const speed = 20.0;
        npcPos.x += (dx / dist) * speed * dt;
        npcPos.z += (dz / dist) * speed * dt;
    }

    async _playMusic() {
        await this.musicCtx.resume();
        this._stopMusic();
        if (this.musicBuf) {
            this.musicSrc = this.musicCtx.createBufferSource();
            this.musicSrc.buffer = this.musicBuf;
            this.musicSrc.loop = true;
            const gain = this.musicCtx.createGain();
            gain.gain.value = 0.4;
            this.musicSrc.connect(gain).connect(this.musicCtx.destination);
            this.musicSrc.start();
        }
    }

    _stopMusic() {
        if (this.musicSrc) {
            this.musicSrc.stop();
            this.musicSrc.disconnect();
            this.musicSrc = null;
        }
    }

    endGame(result) {
        if (result === 'LOST') {
            this.state = 'LOSING';
            this._stopMusic();
            return;
        }
        this.state = result;
        this.controls.unlock();
        this._stopMusic();
        if (result === 'WON') this.ui.showWin();
    }

    restart() {
        this.ui.hideMenu();
        this.player.rig.position.set(-15, 0, 30);
        this.player.state.onChair = false;

        this.cycleTime = 0;
        this.safeDuration = this.getRandomSafeTime();

        this.scene.background.setHex(0xD3D3D3);
        this.scene.fog.color.setHex(0xD3D3D3);

        if (this.scientist) this.scientist.position.set(0, 0, -30);

        this.state = 'PLAYING';
        this._playMusic();

        if (!this.renderer.xr.isPresenting) this.controls.lock();
    }
}

const game = new Game();
