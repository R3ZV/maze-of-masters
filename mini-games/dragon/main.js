import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

class UIManager {
    constructor() {
        const hint = '<div style="font-size:.9rem;color:#aaa;margin-top:32px;letter-spacing:.15em">PRESS <span style="color:#fff">R</span> TO RETRY &nbsp;·&nbsp; <span style="color:#fff">L</span> FOR LOBBY</div>';
        this.winScreen  = this.createOverlay('#000000', '#50C878', 'You escaped the dragon lair,<br>without destroying the equipment!' + hint);
        this.loseScreen = this.createOverlay('#220000', '#FF4444', 'THE DRAGON SPOTTED YOU!<br>Game Over.' + hint);
        this.hud = document.createElement('div');
        this.hud.style.position = 'absolute';
        this.hud.style.top = '20px'; this.hud.style.width = '100vw';
        this.hud.style.color = 'white'; this.hud.style.fontSize = '2rem';
        this.hud.style.fontFamily = 'Arial, sans-serif'; this.hud.style.textAlign = 'center';
        this.hud.style.textShadow = '2px 2px 4px #000000';
        this.hud.innerHTML = 'Safe... for now.';
        document.body.appendChild(this.hud);
    }

    createOverlay(bgColor, textColor, text) {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.top = '0'; div.style.left = '0';
        div.style.width = '100vw'; div.style.height = '100vh';
        div.style.backgroundColor = bgColor; div.style.color = textColor;
        div.style.display = 'none'; div.style.flexDirection = 'column';
        div.style.alignItems = 'center'; div.style.justifyContent = 'center';
        div.style.fontSize = '3rem';
        div.style.fontFamily = 'Arial, sans-serif'; div.style.textAlign = 'center';
        div.innerHTML = text;
        document.body.appendChild(div);
        return div;
    }

    updateHUD(text, color) {
        this.hud.innerHTML = text;
        this.hud.style.color = color;
    }

    showWin() {
        this.hud.style.display = 'none';
        this.winScreen.style.display = 'flex';
    }

    showLose() {
        this.hud.style.display = 'none';
        this.loseScreen.style.display = 'flex';
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
        this.state = { onChair: false };
        this.rig = new THREE.Group();
        this.rig.position.set(-15, 0, 30);
        this.rig.add(camera);
        this.camera = camera;

        this.standingHeight = 1.6;
        this.sittingHeight = 1.0;
        this.camera.position.y = this.standingHeight;

        this.speed = 0.05;
        this.currentChairPos = new THREE.Vector3();
        this.footsteps = new FootstepAudio(camera);
    }

    sitDown(chairWorldPos) {
        this.state.onChair = true;
        this.currentChairPos.copy(chairWorldPos);
        this.rig.position.set(chairWorldPos.x, 0, chairWorldPos.z);
        this.camera.position.y = this.sittingHeight;
    }

    standUp() {
        this.state.onChair = false;
        const stepOutDistance = this.currentChairPos.x > 0 ? -2 : 2;
        this.rig.position.set(this.currentChairPos.x + stepOutDistance, 0, this.currentChairPos.z);
        this.camera.position.y = this.standingHeight;
    }

    updateMovement(keys, delta) {
        if (this.state.onChair) { this.footsteps.update(false, delta); return; }

        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(this.camera.quaternion);
        const direction = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, euler.y, 0));
        const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, euler.y, 0));

        if (keys.w) this.rig.position.addScaledVector(direction, this.speed);
        if (keys.s) this.rig.position.addScaledVector(direction, -this.speed);
        if (keys.a) this.rig.position.addScaledVector(right, -this.speed);
        if (keys.d) this.rig.position.addScaledVector(right, this.speed);

        this.rig.position.x = Math.max(-24, Math.min(24, this.rig.position.x));
        this.rig.position.z = Math.max(-34, Math.min(34, this.rig.position.z));
        this.rig.position.y = 0;

        const isMoving = keys.w || keys.s || keys.a || keys.d;
        this.footsteps.update(isMoving, delta);
    }
}

class Game {
    constructor() {
        this.clock = new THREE.Clock();
        this.ui = new UIManager();
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
            .then(b => { this.musicBuf = b; })
            .catch(() => null);

        this.initRenderer();
        this.initScene();
        this.buildWorld();
        this.loadAssets();

        window.addEventListener('keydown', e => {
            const k = e.key.toLowerCase();
            if (k === 'r' && (this.state === 'WON' || this.state === 'LOST')) this.restart();
            if (k === 'l' && (this.state === 'WON' || this.state === 'LOST')) window.location.href = '/lobby';
        });

        this.renderer.setAnimationLoop(() => this.tick());
    }

    getRandomSafeTime() {
        return Math.random() * (7.0 - 3.0) + 3.0;
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

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(0, 20, 10);
        this.scene.add(directionalLight);

        this.controls = new PointerLockControls(this.camera, document.body);
        document.body.addEventListener('click', () => {
            if (this.state === 'PLAYING') {
                this.controls.lock();
                if (!this.musicSrc) this._playMusic();
            }
        });
    }

    createTextSprite(message) {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.roundRect(10, 20, 236, 88, 15);
        ctx.fill();
        ctx.font = 'bold 36px Arial'; ctx.fillStyle = 'white';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
        sprite.scale.set(1.5, 0.75, 1);
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

        this.doorText = this.createTextSprite("[E]: Exit");
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

            const text = this.createTextSprite("[E]: Sit/Stand");
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

        if (this.state === 'PLAYING' && this.controls.isLocked) {
            this.update(dt);
        }

        if (this.state === 'LOSING') {
            this.updateLosingSequence(dt);
        }

        this.render();
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

    update(dt) {
        this.player.updateMovement(this.input.keys, dt);
        this.updateUIProximity();
        this.updateDragonLogic(dt);
    }

    updateUIProximity() {
        const pPos = this.player.rig.position;
        const isSitting = this.player.state.onChair;

        this.doorText.visible = (pPos.distanceTo(this.door.position) < 3.0 && !isSitting);

        for (let chair of this.chairsList) {
            let wp = new THREE.Vector3();
            chair.getWorldPosition(wp);
            chair.userData.sprite.visible = (pPos.distanceTo(wp) < 2.5 && !isSitting);
        }
    }

    updateDragonLogic(dt) {
        this.cycleTime += dt;
        const totalCycle = this.safeDuration + this.lookDuration;

        if (this.cycleTime > totalCycle) {
            this.cycleTime -=totalCycle;
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

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    _playMusic() {
        this.musicCtx.resume();
        this._stopMusic();
        if (this.musicBuf) {
            this.musicSrc = this.musicCtx.createBufferSource();
            this.musicSrc.buffer = this.musicBuf;
            this.musicSrc.loop = true;
            const gain = this.musicCtx.createGain();
            gain.gain.value = 0.4; // ← change volume here (0.0 – 1.0)
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
        this.ui.winScreen.style.display  = 'none';
        this.ui.loseScreen.style.display = 'none';
        this.ui.hud.style.display        = '';
        this.player.rig.position.set(-15, 0, 30);
        this.player.state.onChair        = false;
        this.player.camera.position.y    = this.player.standingHeight;
        this.cycleTime    = 0;
        this.safeDuration = this.getRandomSafeTime();
        this.scene.background.setHex(0xD3D3D3);
        this.scene.fog.color.setHex(0xD3D3D3);
        if (this.scientist) this.scientist.position.set(0, 0, -30);
        this.state = 'PLAYING';
        this._playMusic();
    }
}

const game = new Game();
