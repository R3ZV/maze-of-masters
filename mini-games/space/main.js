import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// ─── 3D UI Manager (VR Compatible) ───
class WebGLUI {
    constructor(camera) {
        this.camera = camera;

        this.hudCanvas = document.createElement('canvas');
        this.hudCanvas.width = 512; this.hudCanvas.height = 256;
        this.hudCtx = this.hudCanvas.getContext('2d');
        this.hudTex = new THREE.CanvasTexture(this.hudCanvas);

        const hudMat = new THREE.MeshBasicMaterial({ map: this.hudTex, transparent: true, depthTest: false });
        this.hudMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), hudMat);
        this.hudMesh.position.set(0, 0.8, -2);
        this.hudMesh.renderOrder = 999;
        this.camera.add(this.hudMesh);

        this.menuCanvas = document.createElement('canvas');
        this.menuCanvas.width = 1024; this.menuCanvas.height = 1024;
        this.menuCtx = this.menuCanvas.getContext('2d');
        this.menuTex = new THREE.CanvasTexture(this.menuCanvas);

        const menuMat = new THREE.MeshBasicMaterial({ map: this.menuTex, transparent: true, depthTest: false });
        this.menuMesh = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), menuMat);
        this.menuMesh.position.set(0, 0, -2.5);
        this.menuMesh.renderOrder = 1000;
        this.camera.add(this.menuMesh);

        this.drawStartScreen();
        this.hudMesh.visible = false;
    }

    drawStartScreen() {
        const ctx = this.menuCtx;
        ctx.clearRect(0, 0, 1024, 1024);
        ctx.fillStyle = 'rgba(0, 0, 15, 0.85)';
        ctx.fillRect(0, 0, 1024, 1024);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#00eaff';
        ctx.font = 'bold 90px "Courier New"';
        ctx.fillText("ASTRO DRIFT", 512, 350);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '35px "Courier New"';
        ctx.fillText("VR: Thumbsticks to fly, Trigger to start", 512, 500);
        ctx.fillText("PC: WASD to fly, Click to start", 512, 580);

        this.menuTex.needsUpdate = true;
        this.menuMesh.visible = true;
        this.hudMesh.visible = false;
    }

    drawGameOverScreen(score) {
        const ctx = this.menuCtx;
        ctx.clearRect(0, 0, 1024, 1024);
        ctx.fillStyle = 'rgba(20, 0, 0, 0.85)';
        ctx.fillRect(0, 0, 1024, 1024);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff3366';
        ctx.font = 'bold 90px "Courier New"';
        ctx.fillText("HULL BREACH", 512, 350);

        ctx.fillStyle = '#00eaff';
        ctx.font = '60px "Courier New"';
        ctx.fillText(`SURVIVED: ${score.toFixed(1)}s`, 512, 500);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '30px "Courier New"';
        ctx.fillText("PULL TRIGGER OR CLICK TO RETRY", 512, 650);

        this.menuTex.needsUpdate = true;
        this.menuMesh.visible = true;
        this.hudMesh.visible = false;
    }

    updateHUD(score, dangerZone) {
        const ctx = this.hudCtx;
        ctx.clearRect(0, 0, 512, 256);

        ctx.textAlign = 'center';
        ctx.fillStyle = dangerZone ? '#ff3366' : '#00eaff';
        ctx.font = 'bold 30px "Courier New"';
        ctx.fillText(dangerZone ? "DANGER ZONE" : "SURVIVE", 256, 80);

        ctx.font = 'bold 60px "Courier New"';
        ctx.fillText(`${score.toFixed(1)}s`, 256, 150);
        this.hudTex.needsUpdate = true;
    }

    showHUD() {
        this.menuMesh.visible = false;
        this.hudMesh.visible = true;
    }
}

// ─── Input Manager (PC Fallback) ───
class InputManager {
    constructor() {
        this.keys = { w: false, a: false, s: false, d: false };
        window.addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (k in this.keys) this.keys[k] = true; });
        window.addEventListener('keyup',   e => { const k = e.key.toLowerCase(); if (k in this.keys) this.keys[k] = false; });
    }
}

// ─── Starfield, Sun, AsteroidManager (Same logic, slightly condensed) ───
class Starfield {
    constructor(scene) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(3000 * 3);
        for (let i = 0; i < 3000 * 3; i++) pos[i] = (Math.random() - 0.5) * 800;
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
        this.points = new THREE.Points(geo, mat);
        scene.add(this.points);
    }
    update(dt) { this.points.rotation.y += dt * 0.005; }
}

class Sun {
    constructor(scene) {
        this.group = new THREE.Group();
        this.group.position.set(2, -22, -80);
        scene.add(this.group);
        const light = new THREE.PointLight(0xff8822, 2.5, 600);
        this.group.add(light);
    }
    update(dt) {}
}

class AsteroidManager {
    constructor(scene, baseModel) {
        this.scene = scene;
        this.baseModel = baseModel;
        this.active = [];
        this.pool = [];
        this.spawnTimer = 0;
        this.speed = 25;
        this.spawnInterval = 1.5;
    }
    update(dt, elapsed) {
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
            if (a.mesh.position.z > 20) this._recycle(i);
        }
    }
    _spawn() {
        let mesh = this.pool.length > 0 ? this.pool.pop() : this.baseModel.clone();
        mesh.scale.setScalar(1.8 + Math.random() * 2.2);
        this.scene.add(mesh);
        mesh.position.set((Math.random() - 0.5) * 28, (Math.random() - 0.5) * 16, -120);
        mesh.visible = true;
        this.active.push({ mesh, rotX: (Math.random() - 0.5) * 2.0, rotY: (Math.random() - 0.5) * 2.0 });
    }
    _recycle(i) {
        const a = this.active.splice(i, 1)[0];
        a.mesh.visible = false;
        this.pool.push(a.mesh);
    }
    checkCollision(rocketPos) {
        for (const a of this.active) {
            if (a.mesh.position.distanceTo(rocketPos) < 1.4 + (a.mesh.scale.x * 0.9)) return true;
        }
        return false;
    }
    reset() {
        for (let i = this.active.length - 1; i >= 0; i--) this._recycle(i);
        this.spawnTimer = 0; this.speed = 25; this.spawnInterval = 1.5;
    }
}

// ─── Rocket ───
class Rocket {
    constructor(scene, model) {
        this.mesh = new THREE.Group();
        model.rotation.x = -Math.PI / 2;
        model.scale.setScalar(0.5);
        this.mesh.add(model);
        scene.add(this.mesh);
        this.velX = 0; this.velY = 0;
    }

    update(dt, inputX, inputY) {
        const accel = 22; const friction = 5;
        this.velX += inputX * accel * dt;
        this.velY += inputY * accel * dt;
        this.velX -= this.velX * friction * dt;
        this.velY -= this.velY * friction * dt;

        this.mesh.position.x = THREE.MathUtils.clamp(this.mesh.position.x + this.velX * dt, -13, 13);
        this.mesh.position.y = THREE.MathUtils.clamp(this.mesh.position.y + this.velY * dt, -7, 7);

        this.mesh.rotation.z = THREE.MathUtils.clamp(-this.velX * 0.065, -0.55, 0.55);
        this.mesh.rotation.x = THREE.MathUtils.clamp( this.velY * 0.050, -0.38, 0.38);
    }
    getPosition() { return this.mesh.position; }
    reset() {
        this.mesh.position.set(0, 0, 0);
        this.mesh.rotation.set(0, 0, 0);
        this.velX = 0; this.velY = 0;
    }
}

// ─── Main Game Controller ───
class Game {
    constructor() {
        this.clock = new THREE.Clock(false);
        this.input = new InputManager();

        this.state = 'START';
        this.elapsed = 0;

        this.initRenderer();
        this.initScene();
        this.loadAssets();

        document.body.addEventListener('click', () => this.handleInteraction());
        this.initVRControllers();

        this.renderer.setAnimationLoop(() => this.tick());
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true; // ENABLES VR
        document.body.appendChild(this.renderer.domElement);
        document.body.appendChild(VRButton.createButton(this.renderer));
        document.body.style.margin = '0';
        document.body.style.overflow = 'hidden';

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000010, 0.012);

        this.rig = new THREE.Group();
        this.rig.position.set(0, 1.5, 10);
        this.scene.add(this.rig);

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 600);
        this.rig.add(this.camera); 

        this.ui = new WebGLUI(this.camera);

        this.scene.add(new THREE.AmbientLight(0x334466, 1.2));
        const sun = new THREE.DirectionalLight(0xffffff, 2.0);
        sun.position.set(5, 10, 8);
        this.scene.add(sun);

        this.engineLight = new THREE.PointLight(0xff4400, 4, 8);
        this.engineLight.position.set(0, 0, 1);
        this.scene.add(this.engineLight);

        this.starfield = new Starfield(this.scene);
        this.sun = new Sun(this.scene);
    }

    initVRControllers() {
        const onSelect = () => this.handleInteraction();

        for (let i = 0; i < 2; i++) {
            const controller = this.renderer.xr.getController(i);
            controller.addEventListener('selectstart', onSelect);
            this.rig.add(controller);
        }
    }

    loadAssets() {
        const loader = new GLTFLoader();
        let loaded = 0;
        const onLoad = () => { loaded++; if (loaded === 2) this.onAssetsReady(); };

        const fbRock = () => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.5, 8), new THREE.MeshStandardMaterial({color: 0xcccccc}))); g.children[0].rotation.x = Math.PI; return g; };
        const fbAst = () => new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({color: 0x776655, roughness: 1}));

        loader.load('assets/rocket.glb', g => { this.rocketModel = g.scene; onLoad(); }, undefined, () => { this.rocketModel = fbRock(); onLoad(); });
        loader.load('assets/asteroid.glb', g => { this.asteroidModel = g.scene; onLoad(); }, undefined, () => { this.asteroidModel = fbAst(); onLoad(); });
    }

    onAssetsReady() {
        this.rocket = new Rocket(this.scene, this.rocketModel);
        this.asteroids = new AsteroidManager(this.scene, this.asteroidModel);
    }

    handleInteraction() {
        if (this.state === 'START' || this.state === 'DEAD') {
            this.start();
        }
    }

    start() {
        this.state = 'PLAYING';
        this.elapsed = 0;
        this.clock.start();

        this.rocket?.reset();
        this.asteroids?.reset();
        this.scene.background = null;
        this.scene.fog.color.setHex(0x000010);

        this.ui.showHUD();
    }

    die() {
        this.state = 'DEAD';
        this.clock.stop();
        this.scene.fog.color.setHex(0x330000);
        this.ui.drawGameOverScreen(this.elapsed);
    }

    tick() {
        const dt = Math.min(this.clock.getDelta(), 0.05);

        if (this.state === 'PLAYING' && this.rocket && this.asteroids) {
            this.elapsed += dt;

            let inX = 0, inY = 0;
            if (this.input.keys.a) inX = -1;
            if (this.input.keys.d) inX =  1;
            if (this.input.keys.w) inY =  1;
            if (this.input.keys.s) inY = -1;

            const session = this.renderer.xr.getSession();
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

            this.rocket.update(dt, inX, inY);
            this.asteroids.update(dt, this.elapsed);

            const rp = this.rocket.getPosition();
            this.engineLight.position.set(rp.x, rp.y, rp.z + 1.2);

            const danger = this.elapsed > 30;
            this.ui.updateHUD(this.elapsed, danger);
            if (danger) {
                const alpha = Math.min(1, (this.elapsed - 30) / 30) * 0.15;
                this.scene.background = new THREE.Color(alpha * 0.3, 0, alpha * 0.05);
            }

            if (this.asteroids.checkCollision(rp)) {
                this.die();
            }

            this.rig.position.x += (rp.x * 0.05 - this.rig.position.x) * dt * 2;
            this.rig.position.y += (rp.y * 0.05 + 1.5 - this.rig.position.y) * dt * 2;
        }

        this.starfield?.update(dt);
        this.sun?.update(dt);
        this.renderer.render(this.scene, this.camera);
    }
}

new Game();
