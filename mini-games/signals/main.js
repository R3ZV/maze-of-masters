import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const TOTAL_RADIOS = 5;
const TIME_LIMIT = 120; // seconds
const INTERACT_DIST = 2.5;
const TUNE_RANGE = 100;       // full dial spans 0–100
const TUNE_ZONE_SIZE = 8;     // width of the "tuned" sweet-spot window
const SCROLL_SENSITIVITY = 1; // how many units one scroll tick moves the dial

// ─────────────────────────────────────────────
// UIManager
// ─────────────────────────────────────────────
class UIManager {
    constructor() {
        const hint = '<div style="font-size:.9rem;color:#aaa;margin-top:32px;letter-spacing:.15em">PRESS <span style="color:#fff">R</span> TO RETRY &nbsp;·&nbsp; <span style="color:#fff">L</span> FOR LOBBY</div>';
        this.winScreen  = this._overlay('#000', '#50C878',
            'All radios tuned!<br>The music plays on.' + hint);
        this.loseScreen = this._overlay('#1a0000', '#FF4444',
            'Time\'s up!<br>The static wins.' + hint);

        this.hud = document.createElement('div');
        Object.assign(this.hud.style, {
            position: 'absolute', top: '16px', width: '100vw',
            color: 'white', fontSize: '1.6rem', fontFamily: 'Arial, sans-serif',
            textAlign: 'center', textShadow: '2px 2px 4px #000',
            pointerEvents: 'none'
        });
        document.body.appendChild(this.hud);

        this.tuningUI = document.createElement('div');
        Object.assign(this.tuningUI.style, {
            position: 'absolute', bottom: '40px', left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.65)', color: 'white',
            padding: '12px 24px', borderRadius: '12px',
            fontFamily: 'Arial, sans-serif', fontSize: '1.1rem',
            textAlign: 'center', display: 'none', pointerEvents: 'none'
        });
        document.body.appendChild(this.tuningUI);

        this.keypadUI = document.createElement('div');
        Object.assign(this.keypadUI.style, {
            position: 'absolute', bottom: '40px', left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)', color: '#00ff00',
            padding: '20px 40px', borderRadius: '8px',
            fontFamily: 'monospace', fontSize: '1.6rem',
            textAlign: 'center', display: 'none', pointerEvents: 'none',
            border: '2px solid #00ff00', minWidth: '200px'
        });
        document.body.appendChild(this.keypadUI);
    }

    _overlay(bg, color, html) {
        const d = document.createElement('div');
        Object.assign(d.style, {
            position: 'absolute', top: '0', left: '0',
            width: '100vw', height: '100vh',
            backgroundColor: bg, color, display: 'none',
            flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem', fontFamily: 'Arial, sans-serif',
            textAlign: 'center'
        });
        d.innerHTML = html;
        document.body.appendChild(d);
        return d;
    }

    updateHUD(text, color = 'white') {
        this.hud.innerHTML = text;
        this.hud.style.color = color;
    }

    showTuning(radio) {
        this.tuningUI.style.display = 'block';
        this._refreshTuning(radio);
        radio.sprite.visible = true; // show the sprite with updated instructions
    }

    refreshTuning(radio) {
        this._refreshTuning(radio);
    }

    _refreshTuning(radio) {
        const BAR_CHARS = 30; // number of characters in the bar

        // Map values to bar positions
        const posIdx  = Math.round((radio.position / TUNE_RANGE) * (BAR_CHARS - 1));
        const zoneL   = Math.round((radio.tuneZoneStart / TUNE_RANGE) * (BAR_CHARS - 1));
        const zoneR   = Math.round((radio.tuneZoneEnd   / TUNE_RANGE) * (BAR_CHARS - 1));

        let bar = '';
        for (let i = 0; i < BAR_CHARS; i++) {
            const inZone   = i >= zoneL && i <= zoneR;
            const isCursor = i === posIdx;
            if (isCursor) {
                bar += `<span style="color:${inZone ? '#00ff88' : '#ffffff'};font-weight:bold">▼</span>`;
            } else if (inZone) {
                bar += `<span style="color:#FFD700">█</span>`;
            } else {
                bar += `<span style="opacity:0.35">░</span>`;
            }
        }

        const inZone = radio.position >= radio.tuneZoneStart && radio.position <= radio.tuneZoneEnd;
        const status = radio.tuned ? '✓ TUNED' : (inZone ? '⚡ LOCKED ON' : `target: ${radio.targetFreq} MHz`);
        const channelStr = `CH${radio.channel} ${radio.channel === radio.tuningChannel ? '(target)' : '(wrong ch)'}`;
        const numberDisplay = radio.assignedNumber && radio.tuned
            ? `<span style="font-size:1.4rem;color:#FFD700;margin-bottom:8px;font-family:monospace">Code: ${parseInt(radio.assignedNumber, 10).toString(2).padStart(5, '0')}</span><br>`
            : '';

        this.tuningUI.innerHTML =
            `${numberDisplay}Radio ${radio.id + 1} &nbsp;|&nbsp; ${channelStr} &nbsp;|&nbsp; ${status}<br>` +
            `<span style="font-family:monospace;font-size:1.05rem;letter-spacing:1px">[${bar}]</span><br>` +
            `<span style="font-size:0.85rem;opacity:0.7">Scroll to tune &nbsp;·&nbsp; Right Click to change channel &nbsp;·&nbsp; [E] to step away</span>`;
    }

    hideTuning() {
        this.tuningUI.style.display = 'none';
    }

    showKeypad() {
        this.keypadUI.style.display = 'block';
        this.updateKeypadDisplay('', true);
    }

    hideKeypad() {
        this.keypadUI.style.display = 'none';
    }

    updateKeypadDisplay(code, success = true) {
        const display = code.length > 0 ? code : '____';
        const status = success ? 'ENTER CODE' : 'INCORRECT!';
        this.keypadUI.innerHTML = `${display}<br><span style="font-size:0.8rem;opacity:0.8">${status}</span>`;
        if (!success) {
            this.keypadUI.style.color = '#ff4444';
            setTimeout(() => {
                this.keypadUI.style.color = '#00ff00';
            }, 500);
        }
    }

    showWin()  { this.hud.style.display = 'none'; this.keypadUI.style.display = 'none'; this.winScreen.style.display  = 'flex'; }
    showLose() { this.hud.style.display = 'none'; this.keypadUI.style.display = 'none'; this.loseScreen.style.display = 'flex'; }
}

// ─────────────────────────────────────────────
// InputManager
// ─────────────────────────────────────────────
class InputManager {
    constructor(onInteract, onScroll, onRightClick, onKeypadInput) {
        this.keys = { w: false, a: false, s: false, d: false };
        window.addEventListener('keydown', e => {
            const k = e.key.toLowerCase();
            if (k in this.keys) this.keys[k] = true;
            if (k === 'e') onInteract();
            if (/^[0-9]$/.test(k)) onKeypadInput(k);
            if (k === 'enter') onKeypadInput('enter');
            if (k === 'backspace') onKeypadInput('backspace');
        });
        window.addEventListener('keyup', e => {
            const k = e.key.toLowerCase();
            if (k in this.keys) this.keys[k] = false;
        });
        // Scroll wheel to turn knob
        window.addEventListener('wheel', e => onScroll(e.deltaY > 0 ? 1 : -1));
        // Right-click (button 2) to change channel
        window.addEventListener('mousedown', e => {
            if (e.button === 2) {
                e.preventDefault();
                onRightClick();
            }
        });
        // Prevent context menu from appearing
        window.addEventListener('contextmenu', e => e.preventDefault());
    }
}

// ─────────────────────────────────────────────
// FootstepAudio
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Player
// ─────────────────────────────────────────────
class Player {
    constructor(camera) {
        this.rig = new THREE.Group();
        this.rig.position.set(0, 0, 5);
        this.rig.add(camera);
        this.camera = camera;
        this.camera.position.y = 1.6;
        this.speed = 0.1;
        this.isTuning = false; // locked to a radio
        this.collisionChecker = null; // will be set by Game
        this.collisionRadius = 0.3; // collision sphere radius
        this.footsteps = new FootstepAudio(camera);
    }

    updateMovement(keys, delta) {
        if (this.isTuning) { this.footsteps.update(false, delta); return; }
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(this.camera.quaternion);
        const fwd   = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, euler.y, 0));
        const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, euler.y, 0));
        
        const newPos = this.rig.position.clone();
        if (keys.w) newPos.addScaledVector(fwd, this.speed);
        if (keys.s) newPos.addScaledVector(fwd, -this.speed);
        if (keys.a) newPos.addScaledVector(right, -this.speed);
        if (keys.d) newPos.addScaledVector(right, this.speed);
        
        // Check collision on each axis independently to allow sliding
        const testXOnly = this.rig.position.clone();
        testXOnly.x = newPos.x;
        const testZOnly = this.rig.position.clone();
        testZOnly.z = newPos.z;
        
        if (!this.collisionChecker || !this.collisionChecker(testXOnly, this.collisionRadius)) {
            this.rig.position.x = newPos.x;
        }
        if (!this.collisionChecker || !this.collisionChecker(testZOnly, this.collisionRadius)) {
            this.rig.position.z = newPos.z;
        }

        const isMoving = keys.w || keys.s || keys.a || keys.d;
        this.footsteps.update(isMoving, delta);
    }
}

// ─────────────────────────────────────────────
// Radio
// ─────────────────────────────────────────────
class Radio {
    constructor(id, position, scene, baseModel) {
        this.id = id;
        this.channel = 0;                            // 0 or 1
        this.tuningChannel = Math.floor(Math.random() * 2); // randomly pick channel to tune
        this.targetFreq = (88 + Math.floor(Math.random() * 20) + Math.random()).toFixed(1);
        this.tuned = false;
        this.assignedNumber = null;                  // assigned code number to display when tuned

        // Tuning zone: a random sweet-spot window within the dial range
        const margin = TUNE_ZONE_SIZE + 2;
        this.tuneZoneStart = margin + Math.random() * (TUNE_RANGE - margin * 2);
        this.tuneZoneEnd   = this.tuneZoneStart + TUNE_ZONE_SIZE;

        // Starting position: randomized, guaranteed outside the tune zone
        this._resetPosition();

        // 3D group
        this.group = new THREE.Group();
        this.group.position.copy(position);

        // Load model or use placeholder
        if (baseModel) {
            const radioClone = baseModel.clone();
            radioClone.scale.set(1.75, 1.75, 1.75); // Scale up radio model
            this.group.add(radioClone);
            // Find the knob in the model by searching through hierarchy
            this.knob = this._findKnob(radioClone);
        } else {
            // Placeholder geometry (fallback if model fails to load)
            const body = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.28, 0.22),
                new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
            );
            body.position.y = 0.14;
            this.group.add(body);

            // Speaker grille face
            const grille = new THREE.Mesh(
                new THREE.PlaneGeometry(0.3, 0.18),
                new THREE.MeshStandardMaterial({ color: 0x111111 })
            );
            grille.position.set(0, 0.14, 0.112);
            this.group.add(grille);

            // Knob
            this.knob = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04, 0.04, 0.04, 16),
                new THREE.MeshStandardMaterial({ color: 0x888888 })
            );
            this.knob.rotation.z = Math.PI / 2;
            this.knob.position.set(0.18, 0.14, 0.115);
            this.group.add(this.knob);
        }

        // Proximity label sprite
        this.sprite = this._makeSprite('[E] Tune  •  [Right Click] Switch Channel');
        this.sprite.position.set(0, 0.55, 0);
        this.sprite.visible = false;
        this.group.add(this.sprite);

        // Static audio
        this.audioCtx  = null;
        this.staticNode = null;
        this.musicOsc   = null;
        this.gainNode   = null;

        scene.add(this.group);
    }

    // Pick a random starting position that is outside the tune zone
    _resetPosition() {
        let pos;
        do {
            pos = Math.random() * TUNE_RANGE;
        } while (pos >= this.tuneZoneStart - 4 && pos <= this.tuneZoneEnd + 4);
        this.position = pos;
    }

    _makeSprite(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 80;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.roundRect(8, 8, 240, 64, 10);
        ctx.fill();
        ctx.font = 'bold 26px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 42);
        const tex = new THREE.CanvasTexture(canvas);
        return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    }

    _findKnob(model) {
        // Search for knob by name patterns
        const knobNames = ['knob', 'Knob', 'KNOB', 'dial', 'Dial', 'DIAL'];
        for (const name of knobNames) {
            const found = model.getObjectByName(name);
            if (found) {
                console.log(`Found knob: ${name}`);
                return found;
            }
        }
        
        // If no named knob, search by mesh hierarchy (find smallest mesh)
        let smallestMesh = null;
        let smallestSize = Infinity;
        model.traverse((child) => {
            if (child.isMesh) {
                const box = new THREE.Box3().setFromObject(child);
                const size = box.getSize(new THREE.Vector3()).length();
                if (size < smallestSize && size > 0) {
                    smallestSize = size;
                    smallestMesh = child;
                }
            }
        });
        
        if (smallestMesh) {
            console.log('Found knob by size heuristic');
            return smallestMesh;
        }
        
        console.warn('Could not find knob in model, using placeholder');
        return null;
    }

    // Called every scroll tick while player is tuning this radio
    adjustKnob(delta) {
        this.position = Math.max(0, Math.min(TUNE_RANGE, this.position + delta * SCROLL_SENSITIVITY));

        // Update audio mix: static → music as we approach the zone centre
        this._updateAudio();

        const inZone = this.position >= this.tuneZoneStart && this.position <= this.tuneZoneEnd;

        if (inZone && this.channel === this.tuningChannel) {
            if (!this.tuned) {
                this.tuned = true;
                this.sprite.visible = false;
            }
        } else if (this.tuned) {
            this.tuned = false;
            this.sprite.visible = true;
        }
    }

    // Switch to the other channel
    adjustChannel() {
        this.channel = 1 - this.channel; // toggle between 0 and 1
        this._resetPosition();            // reset dial to a random out-of-zone position
        this.tuned = false;               // not tuned on new channel
        this._updateAudio();
    }

    _updateAudio() {
        if (!this.audioCtx) this._initAudio();
        const zoneCentre = (this.tuneZoneStart + this.tuneZoneEnd) / 2;
        const halfZone   = (this.tuneZoneEnd - this.tuneZoneStart) / 2 + 10; // fade starts 10 units out
        const dist = Math.abs(this.position - zoneCentre);
        const t = Math.max(0, 1 - dist / halfZone);
        this.staticGain.gain.setTargetAtTime(1 - t, this.audioCtx.currentTime, 0.05);
        this.musicGain.gain.setTargetAtTime(t,       this.audioCtx.currentTime, 0.05);
    }

    _initAudio() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // White noise static
        const bufSize = this.audioCtx.sampleRate * 2;
        const buf = this.audioCtx.createBuffer(1, bufSize, this.audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        this.staticNode = this.audioCtx.createBufferSource();
        this.staticNode.buffer = buf;
        this.staticNode.loop = true;
        this.staticGain = this.audioCtx.createGain();
        this.staticGain.gain.value = 1;
        const staticMaster = this.audioCtx.createGain();
        staticMaster.gain.value = 0.05;
        this.staticNode.connect(this.staticGain).connect(staticMaster).connect(this.audioCtx.destination);
        this.staticNode.start();

        // Simple music: a little chord (root + major third + fifth)
        const freqs = [261.63, 329.63, 392.00]; // C4, E4, G4
        this.musicGain = this.audioCtx.createGain();
        this.musicGain.gain.value = 0;
        freqs.forEach(f => {
            const osc = this.audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = f;
            const g = this.audioCtx.createGain();
            g.gain.value = 0.15;
            osc.connect(g).connect(this.musicGain);
            osc.start();
        });
        const musicMaster = this.audioCtx.createGain();
        musicMaster.gain.value = 0.25;
        this.musicGain.connect(musicMaster).connect(this.audioCtx.destination);
    }

    suspendAudio() { this.audioCtx?.suspend(); }
    resumeAudio()  { this.audioCtx?.resume(); }

    stopAudio() {
        this.staticNode?.stop();
        this.audioCtx?.close();
    }

    getWorldPosition() {
        const wp = new THREE.Vector3();
        this.group.getWorldPosition(wp);
        return wp;
    }
}

// ─────────────────────────────────────────────
// Game
// ─────────────────────────────────────────────
class Game {
    constructor() {
        this.clock   = new THREE.Clock();
        this.ui      = new UIManager();
        this.input   = new InputManager(
            () => this.handleInteraction(),
            delta => this.handleScroll(delta),
            () => this.handleChannelChange(),
            key => this.handleKeypadInput(key)
        );
        this.state       = 'PLAYING';
        this.timeLeft    = TIME_LIMIT;
        this.radios      = [];
        this.tablePositions = []; // store table positions for collision
        this.activeRadio = null; // the radio the player is currently tuning
        this.keypadActive = false; // is player using keypad
        this.keypadPosition = new THREE.Vector3(-1.5, 1.5, -8.89); // keypad location
        this.enteredCode = ''; // code being entered
        this.codeParts = []; // array of 3 code parts
        this.correctCode = this._generateCode(); // generate 6-digit code needed to win
        this.radioModel  = null; // will be loaded from assets
        this.tableModel  = null; // will be loaded from assets
        this.doorModel   = null; // will be loaded from assets
        this.keypadModel = null; // will be loaded from assets

        this.initRenderer();
        this.initScene();
        this.buildWorld();
        this.player.collisionChecker = (pos, radius) => this.checkCollision(pos, radius);
        this.loadRadioModel(() => {
            this.loadTableModel(() => {
                this.loadDoorModel(() => {
                    this.loadKeypadModel(() => {
                        this.spawnDoor();
                        this.spawnKeypad();
                        this.spawnRadios();
                        this.assignCodeNumbersToRadios();
                    });
                });
            });
        });
        this.renderer.setAnimationLoop(() => this.tick());
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
        document.body.appendChild(this.renderer.domElement);
        document.body.appendChild(VRButton.createButton(this.renderer));
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 12, 40);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        this.player = new Player(this.camera);
        this.scene.add(this.player.rig);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.08));

        this.controls = new PointerLockControls(this.camera, document.body);
        document.body.addEventListener('click', () => {
            if (this.state === 'PLAYING') this.controls.lock();
        });
    }

    loadRadioModel(onComplete) {
        const loader = new GLTFLoader();
        loader.load('assets/radio.glb', (gltf) => {
            this.radioModel = gltf.scene;
            onComplete();
        }, undefined, (error) => {
            console.error('Failed to load radio model:', error);
            onComplete(); // Fallback: spawn with placeholders
        });
    }

    loadTableModel(onComplete) {
        const loader = new GLTFLoader();
        loader.load('assets/table.glb', (gltf) => {
            this.tableModel = gltf.scene;
            onComplete();
        }, undefined, (error) => {
            console.error('Failed to load table model:', error);
            onComplete(); // Fallback: spawn with default boxes
        });
    }

    loadDoorModel(onComplete) {
        const loader = new GLTFLoader();
        loader.load('assets/door.glb', (gltf) => {
            this.doorModel = gltf.scene;
            onComplete();
        }, undefined, (error) => {
            console.error('Failed to load door model:', error);
            onComplete(); // Fallback: continue without door
        });
    }

    loadKeypadModel(onComplete) {
        const loader = new GLTFLoader();
        loader.load('assets/keypad.glb', (gltf) => {
            this.keypadModel = gltf.scene;
            onComplete();
        }, undefined, (error) => {
            console.error('Failed to load keypad model:', error);
            onComplete(); // Fallback: continue without keypad
        });
    }

    buildWorld() {
        // Floor
        const floor = new THREE.Mesh(
            new THREE.BoxGeometry(18, 0.2, 18),
            new THREE.MeshStandardMaterial({ color: 0x777777 })
        );
        floor.position.y = -0.1;
        this.scene.add(floor);

        // Walls
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xf0e8d8 });
        const wallData = [
            { s: [18, 4, 0.2], p: [0, 2, -9] },
            { s: [18, 4, 0.2], p: [0, 2,  9] },
            { s: [0.2, 4, 18], p: [-9, 2, 0] },
            { s: [0.2, 4, 18], p: [ 9, 2, 0] },
        ];
        wallData.forEach(({ s, p }) => {
            const w = new THREE.Mesh(new THREE.BoxGeometry(...s), wallMat);
            w.position.set(...p);
            this.scene.add(w);
        });

        // Ceiling
        const ceiling = new THREE.Mesh(
            new THREE.BoxGeometry(18, 0.2, 18),
            new THREE.MeshStandardMaterial({ color: 0x555555 })
        );
        ceiling.position.y = 4;
        this.scene.add(ceiling);

    }

    spawnDoor() {
        if (this.doorModel) {
            const doorClone = this.doorModel.clone();
            doorClone.position.set(0, 0, -8.93);
            doorClone.scale.set(2.5, 2.5, 2.5);
            console.log('Door spawned at position:', doorClone.position, 'with scale:', doorClone.scale);
            this.scene.add(doorClone);
        } else {
            console.warn('Door model not loaded');
        }

        // Greenish spotlight over the door
        const doorSpot = new THREE.SpotLight(0x90ffb0, 6, 10, Math.PI / 6, 0.5, 1.5);
        doorSpot.position.set(-0.6, 4.0, -8.0);
        doorSpot.target.position.set(-0.6, 0, -8.93);
        this.scene.add(doorSpot);
        this.scene.add(doorSpot.target);
    }

    spawnKeypad() {
        if (this.keypadModel) {
            const keypadClone = this.keypadModel.clone();
            keypadClone.position.set(-1.5, 1.5, -8.89);
            keypadClone.scale.set(0.25, 0.25, 0.25);
            keypadClone.rotation.y = Math.PI; // 180 degrees towards the door
            console.log('Keypad spawned at position:', keypadClone.position, 'with scale:', keypadClone.scale);
            this.scene.add(keypadClone);
        } else {
            console.warn('Keypad model not loaded');
        }
    }

    spawnRadios() {
        // Place 5 radios in a star pattern: one in center, four in corners
        const positions = [
            new THREE.Vector3(0, 0.625, 0),        // Center
            new THREE.Vector3(-6.5, 0.625, -6.5),  // Top-left corner
            new THREE.Vector3(6.5, 0.625, -6.5),   // Top-right corner
            new THREE.Vector3(-6.5, 0.625, 6.5),   // Bottom-left corner
            new THREE.Vector3(6.5, 0.625, 6.5),    // Bottom-right corner
        ];
        positions.forEach((pos, i) => {
            // Store table position for collision
            this.tablePositions.push(new THREE.Vector3(pos.x, 0, pos.z));
            // Add table
            if (this.tableModel) {
                const tableClone = this.tableModel.clone();
                tableClone.scale.set(0.0875, 0.0875, 0.0875); // Scale down the oversized model
                tableClone.rotation.y = Math.PI / 2; // Rotate 90 degrees
                tableClone.position.set(pos.x, 0, pos.z);
                this.scene.add(tableClone);
            } else {
                // Fallback: default box geometry
                const table = new THREE.Mesh(
                    new THREE.BoxGeometry(1.2, 0.8, 0.8),
                    new THREE.MeshStandardMaterial({ color: 0x4a3728 })
                );
                table.position.set(pos.x, 0, pos.z);
                this.scene.add(table);
            }

            this.radios.push(new Radio(i, pos, this.scene, this.radioModel));

            // Spotlight shining down onto this radio
            const spot = new THREE.SpotLight(0xffe8c0, 8, 12, Math.PI / 7, 0.4, 1.5);
            spot.position.set(pos.x, 3.8, pos.z);
            spot.target.position.set(pos.x, 0, pos.z);
            this.scene.add(spot);
            this.scene.add(spot.target);
            
            // Rotate top and middle radios180 degrees to face player
            if (0 <= i && i <= 2) {
                this.radios[i].group.rotation.y = Math.PI;
            }
        });
    }

    handleInteraction() {
        if (this.state !== 'PLAYING') return;

        // If already tuning radio, step away
        if (this.activeRadio !== null) {
            this.activeRadio.suspendAudio();
            this.player.isTuning = false;
            this.ui.hideTuning();
            this.activeRadio = null;
            return;
        }

        // If already using keypad, step away
        if (this.keypadActive) {
            this.keypadActive = false;
            this.player.isTuning = false;
            this.ui.hideKeypad();
            return;
        }

        // Check if near keypad
        const keypadDist = this.player.rig.position.distanceTo(this.keypadPosition);
        if (keypadDist < INTERACT_DIST) {
            this.keypadActive = true;
            this.player.isTuning = true;
            this.enteredCode = '';
            this.ui.showKeypad();
            return;
        }

        // Find nearest radio within range
        let nearest = null, minDist = INTERACT_DIST;
        for (const radio of this.radios) {
            const d = this.player.rig.position.distanceTo(radio.getWorldPosition());
            if (d < minDist) { minDist = d; nearest = radio; }
        }
        if (nearest) {
            this.activeRadio = nearest;
            nearest.resumeAudio();
            this.player.isTuning = true;
            this.ui.showTuning(nearest);
        }
    }

    handleScroll(delta) {
        if (this.state !== 'PLAYING' || this.activeRadio === null) return;
        this.activeRadio.adjustKnob(delta);
        this.ui.refreshTuning(this.activeRadio);
    }

    handleChannelChange() {
        if (this.state !== 'PLAYING' || this.activeRadio === null) return;
        this.activeRadio.adjustChannel();
        this.ui.refreshTuning(this.activeRadio);
    }

    handleKeypadInput(key) {
        if (!this.keypadActive) return;

        if (key === 'backspace') {
            this.enteredCode = this.enteredCode.slice(0, -1);
        } else if (key === 'enter') {
            if (this.enteredCode === this.correctCode) {
                this.endGame('WON');
            } else {
                this.enteredCode = '';
                this.ui.updateKeypadDisplay(this.enteredCode, false); // show error
                return;
            }
        } else if (/^[0-9]$/.test(key) && this.enteredCode.length < 6) {
            this.enteredCode += key;
        }
        this.ui.updateKeypadDisplay(this.enteredCode, true);
    }

    tick() {
        const dt = this.clock.getDelta();
        if (this.state === 'PLAYING' && this.controls.isLocked) {
            this.update(dt);
        }
        this.renderer.render(this.scene, this.camera);
    }

    update(dt) {
        this.player.updateMovement(this.input.keys, dt);
        this.updateProximity();
        this.updateTimer(dt);
    }

    updateProximity() {
        const pPos = this.player.rig.position;
        for (const radio of this.radios) {
            if (radio.tuned) continue;
            const d = pPos.distanceTo(radio.getWorldPosition());
            radio.sprite.visible = (d < INTERACT_DIST && !this.player.isTuning);
        }
    }

    updateTimer(dt) {
        this.timeLeft -= dt;
        const t = Math.ceil(this.timeLeft);
        const hudColor = t <= 30 ? '#FF6B35' : 'white';

        if (t <= 30) {
            this.ui.updateHUD(`⚠ ${t}s`, hudColor);
        } else {
            this.ui.updateHUD(`${t}s`, hudColor);
        }

        if (this.timeLeft <= 0) this.endGame('LOST');
    }

    endGame(result) {
        this.state = result;
        this.controls.unlock();
        this.radios.forEach(r => r.stopAudio());
        if (result === 'WON')  this.ui.showWin();
        if (result === 'LOST') this.ui.showLose();

        window.addEventListener('keydown', e => {
            const k = e.key.toLowerCase();
            if (k === 'r') window.location.reload();
            if (k === 'l') window.location.href = '/lobby';
        }, { once: false });
    }

    checkCollision(pos, radius) {
        // Check wall boundaries (room is 18x18, centered at 0,0, so bounds are -9 to 9)
        const roomBounds = 8.7; // slightly less than 9 to keep player away from walls
        if (Math.abs(pos.x) + radius > roomBounds || Math.abs(pos.z) + radius > roomBounds) {
            return true; // collision detected
        }

        // Check table collisions
        const tableRadius = 0.6; // collision radius for tables
        for (const tablePos of this.tablePositions) {
            const dist = Math.sqrt(
                Math.pow(pos.x - tablePos.x, 2) + Math.pow(pos.z - tablePos.z, 2)
            );
            if (dist < radius + tableRadius) {
                return true; // collision detected
            }
        }

        return false; // no collision
    }

    _generateCode() {
        const code = [];
        for (let i = 0; i < 3; i++) {
            const num = Math.floor(Math.random() * 32);
            const paddedNum = String(num).padStart(2, '0');
            code.push(paddedNum);
            this.codeParts.push(paddedNum);
        }
        return code.join('');
    }

    assignCodeNumbersToRadios() {
        // Radio indices by layout:
        //   0 = center (middle)
        //   1 = top-left  (z=-6.5, near door)
        //   2 = top-right (z=-6.5, near door)
        //   3 = bottom-left  (z=+6.5, far from door)
        //   4 = bottom-right (z=+6.5, far from door)

        const nearDoor = [this.radios[1], this.radios[2]];
        const middle   = [this.radios[0]];
        const farDoor  = [this.radios[3], this.radios[4]];

        // Pick one random radio from each group
        const pick = arr => arr[Math.floor(Math.random() * arr.length)];

        pick(farDoor).assignedNumber  = this.codeParts[0]; // first third
        pick(middle).assignedNumber   = this.codeParts[1]; // second third
        pick(nearDoor).assignedNumber = this.codeParts[2]; // last third
    }
}

const game = new Game();