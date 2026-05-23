import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// ─── UI Manager ───────────────────────────────────────────────────────────────
class UIManager {
    constructor() {
        this.injectStyles();

        this.hud = this._el('div', {
            position: 'absolute', top: '24px', width: '100vw',
            color: '#ffffff', fontSize: '1.4rem',
            fontFamily: '"Orbitron", "Courier New", monospace',
            textAlign: 'center', pointerEvents: 'none',
            textShadow: '0 0 12px #00eaff, 0 0 30px #00eaff88',
            letterSpacing: '0.12em',
        });
        this.hud.innerHTML = 'SURVIVE';
        document.body.appendChild(this.hud);

        this.scoreEl = this._el('div', {
            position: 'absolute', top: '60px', width: '100vw',
            color: '#00eaff', fontSize: '2.4rem',
            fontFamily: '"Orbitron", "Courier New", monospace',
            textAlign: 'center', pointerEvents: 'none',
            textShadow: '0 0 20px #00eaff',
            letterSpacing: '0.08em',
        });
        document.body.appendChild(this.scoreEl);

        this.gameOverScreen = this._overlay(
            'linear-gradient(135deg, #000010 60%, #1a0030)',
            '#ff3366',
            `<div style="font-size:3.5rem;letter-spacing:.2em;text-shadow:0 0 40px #ff3366,0 0 80px #ff336688;">HULL BREACH</div>
             <div style="font-size:1.1rem;color:#aaa;margin-top:18px;letter-spacing:.15em;">ASTEROID IMPACT DETECTED</div>
             <div id="final-score" style="font-size:2rem;color:#00eaff;margin-top:30px;letter-spacing:.1em;text-shadow:0 0 20px #00eaff;"></div>
             <div style="font-size:.9rem;color:#666;margin-top:40px;letter-spacing:.2em;">PRESS <span style="color:#fff">R</span> TO RETRY &nbsp;·&nbsp; <span style="color:#fff">L</span> FOR LOBBY</div>`
        );

        this.startScreen = this._overlay(
            'linear-gradient(135deg, #000010 60%, #0a001a)',
            '#00eaff',
            `<div style="font-size:3.8rem;letter-spacing:.25em;text-shadow:0 0 40px #00eaff,0 0 80px #00eaff66;font-family:'Orbitron','Courier New',monospace;">ASTRO DRIFT</div>
             <div style="font-size:1rem;color:#aaa;margin-top:16px;letter-spacing:.2em;">PILOT YOUR ROCKET — DODGE THE FIELD</div>
             <div style="font-size:.9rem;color:#555;margin-top:50px;letter-spacing:.2em;">CLICK TO BEGIN · WASD TO FLY · MOUSE TO AIM</div>`
        );
        this.startScreen.style.display = 'flex';
    }

    injectStyles() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap';
        document.head.appendChild(link);

        const style = document.createElement('style');
        style.textContent = `
            body { margin:0; overflow:hidden; background:#000; cursor:none; }
            canvas { display:block; }
            @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        `;
        document.head.appendChild(style);
    }

    _el(tag, styles) {
        const el = document.createElement(tag);
        Object.assign(el.style, styles);
        return el;
    }

    _overlay(bg, color, html) {
        const div = this._el('div', {
            position: 'absolute', top: '0', left: '0',
            width: '100vw', height: '100vh',
            background: bg, color,
            display: 'none', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column',
            fontFamily: '"Orbitron","Courier New",monospace',
            textAlign: 'center',
        });
        div.innerHTML = html;
        document.body.appendChild(div);
        return div;
    }

    updateHUD(text, color = '#ffffff') {
        this.hud.innerHTML = text;
        this.hud.style.color = color;
    }

    updateScore(seconds) {
        this.scoreEl.innerHTML = `${seconds.toFixed(1)}<span style="font-size:.8rem;opacity:.6;margin-left:8px">SEC</span>`;
    }

    showGameOver(score) {
        this.hud.style.display = 'none';
        this.scoreEl.style.display = 'none';
        this.gameOverScreen.style.display = 'flex';
        document.getElementById('final-score').textContent = `SURVIVED ${score.toFixed(1)}s`;
    }

    hideGameOver() {
        this.gameOverScreen.style.display = 'none';
        this.hud.style.display = '';
        this.scoreEl.style.display = '';
    }

    hideStart() {
        this.startScreen.style.display = 'none';
    }
}

// ─── Input Manager ────────────────────────────────────────────────────────────
class InputManager {
    constructor() {
        this.keys = { w: false, a: false, s: false, d: false, q: false, e: false };
        this.mouse = { x: 0, y: 0 };
        window.addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (k in this.keys) this.keys[k] = true; });
        window.addEventListener('keyup',   e => { const k = e.key.toLowerCase(); if (k in this.keys) this.keys[k] = false; });
        document.addEventListener('mousemove', e => {
            this.mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
            this.mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
        });
    }
}

// ─── Starfield ────────────────────────────────────────────────────────────────
class Starfield {
    constructor(scene) {
        const geo = new THREE.BufferGeometry();
        const count = 3000;
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 800;
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, sizeAttenuation: true });
        this.points = new THREE.Points(geo, mat);
        scene.add(this.points);
    }
    update(dt) { this.points.rotation.y += dt * 0.005; }
}

// ─── Sun ──────────────────────────────────────────────────────────────────────
class Sun {
    constructor(scene) {
        this.group = new THREE.Group();
        this.group.position.set(2, -22, -80);
        scene.add(this.group);
        this.time = 0;

        // Build a sprite material from a canvas radial gradient
        const makeSprite = (size, stops, scale) => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = size;
            const ctx  = canvas.getContext('2d');
            const half = size / 2;
            const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
            stops.forEach(([t, c]) => grad.addColorStop(t, c));
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, size, size);
            const mat = new THREE.SpriteMaterial({
                map: new THREE.CanvasTexture(canvas),
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                transparent: true,
            });
            mat.fog = false;
            const sprite = new THREE.Sprite(mat);
            sprite.scale.setScalar(scale);
            this.group.add(sprite);
            return sprite;
        };

        // White-hot disk with very slight limb darkening
        this.core = makeSprite(256, [
            [0.00, 'rgba(255,255,255,1.00)'],
            [0.30, 'rgba(255,255,220,1.00)'],
            [0.60, 'rgba(255,230,120,0.80)'],
            [0.85, 'rgba(255,160, 40,0.20)'],
            [1.00, 'rgba(255, 80,  0,0.00)'],
        ], 12);

        // Inner corona — tight, warm yellow
        this.mid = makeSprite(512, [
            [0.00, 'rgba(255,220, 80,0.60)'],
            [0.25, 'rgba(255,160, 20,0.35)'],
            [0.55, 'rgba(255, 80,  0,0.12)'],
            [0.80, 'rgba(200, 40,  0,0.03)'],
            [1.00, 'rgba(150, 20,  0,0.00)'],
        ], 36);

        // Outer diffuse glow — barely-there atmospheric halo
        this.outer = makeSprite(512, [
            [0.00, 'rgba(255,100,  0,0.18)'],
            [0.35, 'rgba(220, 60,  0,0.07)'],
            [0.65, 'rgba(180, 30,  0,0.02)'],
            [1.00, 'rgba(100, 10,  0,0.00)'],
        ], 90);

        const light = new THREE.PointLight(0xff8822, 2.5, 600);
        this.group.add(light);
    }

    update(dt) {
        this.time += dt;

        // Core subtle flicker (like solar granulation)
        this.core.material.opacity  = 0.93 + Math.sin(this.time * 5.1) * 0.07;

        // Corona slow breath
        const breathe = 1 + Math.sin(this.time * 0.7) * 0.04;
        this.mid.scale.setScalar(36 * breathe);
        this.outer.scale.setScalar(90 * (1 + Math.sin(this.time * 0.45 + 1.2) * 0.05));
    }
}

// ─── Asteroid Pool ────────────────────────────────────────────────────────────
class AsteroidManager {
    constructor(scene, baseModel) {
        this.scene = scene;
        this.baseModel = baseModel;
        this.pool = [];
        this.active = [];

        this.spawnInterval = 1.5;
        this.spawnTimer = 0;
        this.speed = 25;
        this.SPAWN_Z = -120;
        this.DESPAWN_Z = 20;

        this.SPREAD_X = 14;
        this.SPREAD_Y = 8;
    }

    update(dt, elapsed) {
        // Ramp up difficulty
        this.spawnInterval = Math.max(0.45, 1.5 - elapsed * 0.022);
        this.speed = Math.min(55, 25 + elapsed * 0.55);

        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this._spawn();
        }

        for (let i = this.active.length - 1; i >= 0; i--) {
            const a = this.active[i];
            a.mesh.position.z += this.speed * dt;
            a.mesh.rotation.x += a.rotX * dt;
            a.mesh.rotation.y += a.rotY * dt;

            if (a.mesh.position.z > this.DESPAWN_Z) {
                this._recycle(i);
            }
        }
    }

    _spawn() {
        let mesh;
        if (this.pool.length > 0) {
            mesh = this.pool.pop();
        } else {
            mesh = this.baseModel.clone();
            const s = 1.8 + Math.random() * 2.2;
            mesh.scale.setScalar(s);
            this.scene.add(mesh);
        }

        mesh.position.set(
            (Math.random() - 0.5) * this.SPREAD_X * 2,
            (Math.random() - 0.5) * this.SPREAD_Y * 2,
            this.SPAWN_Z
        );
        mesh.visible = true;

        this.active.push({
            mesh,
            rotX: (Math.random() - 0.5) * 2.0,
            rotY: (Math.random() - 0.5) * 2.0,
        });
    }

    _recycle(i) {
        const a = this.active.splice(i, 1)[0];
        a.mesh.visible = false;
        this.pool.push(a.mesh);
    }

    checkCollision(rocketPos, radius = 1.4) {
        for (const a of this.active) {
            if (a.mesh.position.distanceTo(rocketPos) < radius + (a.mesh.scale.x * 0.9)) {
                return true;
            }
        }
        return false;
    }

    reset() {
        for (let i = this.active.length - 1; i >= 0; i--) this._recycle(i);
        this.spawnTimer = 0;
        this.speed = 25;
        this.spawnInterval = 1.5;
    }
}

// ─── Rocket ───────────────────────────────────────────────────────────────────
class Rocket {
    constructor(scene, model) {
        // Wrap model in a pivot so banking rotations don't fight the orientation fix
        this.pivot = new THREE.Group();
        model.rotation.x = -Math.PI / 2; // rotate from facing +Y to facing -Z (toward asteroids)
        model.scale.setScalar(0.5);
        this.pivot.add(model);
        this.mesh = this.pivot;
        this.mesh.position.set(0, 0, 0);
        scene.add(this.mesh);

        // Thruster glow
        const glowGeo = new THREE.SphereGeometry(0.3, 12, 12);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.85 });
        this.thrusterGlow = new THREE.Mesh(glowGeo, glowMat);
        this.thrusterGlow.position.z = 0.9;
        this.mesh.add(this.thrusterGlow);

        this.BOUNDS_X = 13;
        this.BOUNDS_Y = 7;
        this.velX = 0;
        this.velY = 0;
    }

    update(dt, keys, mouse) {
        // WASD controls tilt; tilt drives velocity (acceleration in the tilted direction)
        let inputX = 0, inputY = 0;
        if (keys.a) inputX = -1;
        if (keys.d) inputX =  1;
        if (keys.w) inputY =  1;
        if (keys.s) inputY = -1;

        const accel = 22;
        const friction = 5;

        this.velX += inputX * accel * dt;
        this.velY += inputY * accel * dt;
        this.velX -= this.velX * friction * dt;
        this.velY -= this.velY * friction * dt;

        this.mesh.position.x = THREE.MathUtils.clamp(
            this.mesh.position.x + this.velX * dt, -this.BOUNDS_X, this.BOUNDS_X
        );
        this.mesh.position.y = THREE.MathUtils.clamp(
            this.mesh.position.y + this.velY * dt, -this.BOUNDS_Y, this.BOUNDS_Y
        );

        // Tilt visually matches current velocity direction
        const maxTilt = 0.55;
        this.mesh.rotation.z = THREE.MathUtils.clamp(-this.velX * 0.065, -maxTilt, maxTilt);
        this.mesh.rotation.x = THREE.MathUtils.clamp( this.velY * 0.050, -maxTilt * 0.7, maxTilt * 0.7);

        // Thruster flicker
        const flicker = 0.75 + Math.random() * 0.5;
        this.thrusterGlow.scale.setScalar(flicker);
        this.thrusterGlow.material.opacity = 0.6 + Math.random() * 0.4;
    }

    getPosition() { return this.mesh.position; }

    reset() {
        this.mesh.position.set(0, 0, 0);
        this.mesh.rotation.set(0, 0, 0);
        this.velX = 0;
        this.velY = 0;
    }
}

// ─── Game ─────────────────────────────────────────────────────────────────────
class Game {
    constructor() {
        this.clock  = new THREE.Clock(false);
        this.ui     = new UIManager();
        this.input  = new InputManager();

        this.state   = 'START'; // START | PLAYING | DEAD
        this.elapsed = 0;

        this.rocketModel   = null;
        this.asteroidModel = null;
        this.rocket        = null;
        this.asteroids     = null;

        this.initRenderer();
        this.initScene();
        this.loadAssets();

        this.audioCtx      = new AudioContext();
        this.explodeBuf    = null;
        this.musicBuf      = null;
        this.rocketBuf     = null;
        this.musicSrc      = null;
        this.rocketSrc     = null;
        this.rocketPanner  = null;
        const loadAudio = path => fetch(path)
            .then(r => r.arrayBuffer())
            .then(b => this.audioCtx.decodeAudioData(b))
            .catch(() => null);
        loadAudio('assets/explode.wav').then(b => { this.explodeBuf = b; });
        loadAudio('assets/space_adventure.wav').then(b => { this.musicBuf = b; if (this.audioCtx.state === 'running' && !this.musicSrc) this._playMusic(); });
        loadAudio('assets/rocket_flying.wav').then(b => { this.rocketBuf = b; });

        // Click-to-start / retry
        document.body.addEventListener('click', () => {
            this.audioCtx.resume();
            this.handleClick();
        });
        window.addEventListener('keydown', e => {
            const k = e.key.toLowerCase();
            if (k === 'r' && this.state === 'DEAD') { this.audioCtx.resume(); this.restart(); }
            if (k === 'l' && this.state === 'DEAD') window.location.href = '../../lobby/index.html';
        });

        this.renderer.setAnimationLoop(() => this.tick());
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
        this.scene.fog = new THREE.FogExp2(0x000010, 0.012);

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 600);
        this.camera.position.set(0, 2.5, 10);
        this.camera.lookAt(0, 0, 0);
        this.scene.add(this.camera);

        // Lighting
        this.scene.add(new THREE.AmbientLight(0x334466, 1.2));
        const sun = new THREE.DirectionalLight(0xffffff, 2.0);
        sun.position.set(5, 10, 8);
        this.scene.add(sun);

        const backLight = new THREE.PointLight(0x0044ff, 3, 30);
        backLight.position.set(-5, 3, 5);
        this.scene.add(backLight);

        this.engineLight = new THREE.PointLight(0xff4400, 4, 8);
        this.engineLight.position.set(0, 0, 1);
        this.scene.add(this.engineLight);

        this.starfield = new Starfield(this.scene);
        this.sun = new Sun(this.scene);

        // Nebula backdrop quads
        this._addNebulaPlane(0x1a0050, -200, 0);
        this._addNebulaPlane(0x001a40, -200, 30);
    }

    _addNebulaPlane(color, z, rx) {
        const geo = new THREE.PlaneGeometry(600, 300);
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = z;
        mesh.rotation.x = THREE.MathUtils.degToRad(rx);
        this.scene.add(mesh);
    }

    loadAssets() {
        const loader = new GLTFLoader();
        let loaded = 0;
        const onLoad = () => { loaded++; if (loaded === 2) this.onAssetsReady(); };

        loader.load('assets/rocket.glb',   g => { this.rocketModel   = g.scene; onLoad(); },
            undefined, e => { console.error('rocket.glb:', e); this.rocketModel   = this._fallbackRocket();   onLoad(); });
        loader.load('assets/asteroid.glb', g => { this.asteroidModel = g.scene; onLoad(); },
            undefined, e => { console.error('asteroid.glb:', e); this.asteroidModel = this._fallbackAsteroid(); onLoad(); });
    }

    _fallbackRocket() {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.5, 8), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
        body.rotation.x = Math.PI;
        g.add(body);
        return g;
    }

    _fallbackAsteroid() {
        return new THREE.Mesh(
            new THREE.DodecahedronGeometry(1, 0),
            new THREE.MeshStandardMaterial({ color: 0x776655, roughness: 1 })
        );
    }

    onAssetsReady() {
        this.rocket    = new Rocket(this.scene, this.rocketModel);
        this.asteroids = new AsteroidManager(this.scene, this.asteroidModel);
        // Scene ready — waiting for click
    }

    handleClick() {
        if (this.state === 'START') {
            this.ui.hideStart();
            this.start();
        } else if (this.state === 'PLAYING') {
            // pointer lock style — ignore
        }
    }

    start() {
        this.state   = 'PLAYING';
        this.elapsed = 0;
        this.clock.start();
        this._playMusic();
    }

    async _playMusic() {
        await this.audioCtx.resume();
        this._stopMusic();
        if (this.musicBuf) {
            this.musicSrc = this.audioCtx.createBufferSource();
            this.musicSrc.buffer = this.musicBuf;
            this.musicSrc.loop = true;
            this.musicSrc.connect(this.audioCtx.destination);
            this.musicSrc.start();
        }
        if (this.rocketBuf) {
            this.rocketPanner = this.audioCtx.createStereoPanner();
            const rocketGain = this.audioCtx.createGain();
            rocketGain.gain.value = 0.4;
            rocketGain.connect(this.rocketPanner);
            this.rocketPanner.connect(this.audioCtx.destination);
            this.rocketSrc = this.audioCtx.createBufferSource();
            this.rocketSrc.buffer = this.rocketBuf;
            this.rocketSrc.loop = true;
            this.rocketSrc.connect(rocketGain);
            this.rocketSrc.start();
        }
    }

    _stopMusic() {
        if (this.musicSrc) {
            this.musicSrc.stop();
            this.musicSrc.disconnect();
            this.musicSrc = null;
        }
        if (this.rocketSrc) {
            this.rocketSrc.stop();
            this.rocketSrc.disconnect();
            this.rocketSrc = null;
            this.rocketPanner.disconnect();
            this.rocketPanner = null;
        }
    }

    restart() {
        this.ui.hideGameOver();
        this.rocket?.reset();
        this.asteroids?.reset();
        this.scene.background = null;
        this.scene.fog = new THREE.FogExp2(0x000010, 0.012);
        this.start();
    }

    tick() {
        const dt = Math.min(this.clock.getDelta(), 0.05);

        if (this.state === 'PLAYING' && this.rocket && this.asteroids) {
            this.elapsed += dt;
            this.update(dt);
        }

        this.renderer.render(this.scene, this.camera);
    }

    update(dt) {
        this.starfield.update(dt);
        this.sun.update(dt);
        this.rocket.update(dt, this.input.keys, this.input.mouse);

        // Sync engine glow light
        const rp = this.rocket.getPosition();
        this.engineLight.position.set(rp.x, rp.y, rp.z + 1.2);

        // Pan rocket sound with horizontal position (-1 left → +1 right)
        if (this.rocketPanner) {
            this.rocketPanner.pan.value = rp.x / this.rocket.BOUNDS_X;
        }

        this.asteroids.update(dt, this.elapsed);

        // HUD
        this.ui.updateScore(this.elapsed);
        this._updateWarning();

        // Collision
        if (this.asteroids.checkCollision(rp)) {
            this.die();
        }

        // Camera subtle drift
        this.camera.position.x += (rp.x * 0.05 - this.camera.position.x) * dt * 2;
        this.camera.position.y += (rp.y * 0.05 + 2.5 - this.camera.position.y) * dt * 2;
    }

    _updateWarning() {
        // Flash red tint as density ramps up
        const danger = Math.min(1, this.elapsed / 60);
        if (danger > 0.5) {
            const alpha = (danger - 0.5) * 0.15;
            this.scene.background = new THREE.Color(alpha * 0.3, 0, alpha * 0.05);
            this.ui.updateHUD(`DANGER ZONE — ${this.elapsed.toFixed(1)}s`, `hsl(${10 - danger*10}, 100%, 65%)`);
        } else {
            this.scene.background = null;
            this.ui.updateHUD('SURVIVE', '#00eaff');
        }
    }

    die() {
        this.state = 'DEAD';
        this.clock.stop();
        this._stopMusic();
        this.scene.fog.color.setHex(0x330000);
        this.ui.showGameOver(this.elapsed);
        if (this.explodeBuf) {
            const src = this.audioCtx.createBufferSource();
            src.buffer = this.explodeBuf;
            src.connect(this.audioCtx.destination);
            src.start();
        }
    }
}

new Game();
