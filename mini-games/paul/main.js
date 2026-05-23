import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

class UIManager {
    constructor() {
        this.loseScreen = this.createOverlay('#220000', '#FF4444', 'CUSTOMER LEFT ANGRY.<br><span style="font-size:1.5rem; margin-top:20px;">Press L to go to Lobby or R to Replay</span>');
        this.transitionScreen = this.createOverlay('#111111', '#FFFFFF', '');

        this.hud = document.createElement('div');
        this.hud.style.position = 'absolute';
        this.hud.style.top = '20px'; 
        this.hud.style.right = '20px';
        this.hud.style.color = 'white'; 
        this.hud.style.fontFamily = 'Arial, sans-serif'; 
        this.hud.style.textShadow = '2px 2px 4px #000000';
        document.body.appendChild(this.hud);

        this.crosshair = document.createElement('div');
        this.crosshair.style.position = 'absolute';
        this.crosshair.style.top = '50%'; this.crosshair.style.left = '50%';
        this.crosshair.style.width = '8px'; this.crosshair.style.height = '8px';
        this.crosshair.style.backgroundColor = 'white';
        this.crosshair.style.borderRadius = '50%';
        this.crosshair.style.transform = 'translate(-50%, -50%)';
        this.crosshair.style.pointerEvents = 'none';
        document.body.appendChild(this.crosshair);
    }

    createOverlay(bgColor, textColor, text) {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.top = '0'; div.style.left = '0';
        div.style.width = '100vw'; div.style.height = '100vh';
        div.style.backgroundColor = bgColor; div.style.color = textColor;
        div.style.display = 'none'; div.style.flexDirection = 'column';
        div.style.alignItems = 'center'; div.style.justifyContent = 'center'; 
        div.style.fontSize = '3rem'; div.style.fontFamily = 'Arial, sans-serif'; 
        div.style.textAlign = 'center'; div.style.padding = '0 10%'; div.style.boxSizing = 'border-box';
        div.innerHTML = text;
        document.body.appendChild(div);
        return div;
    }

    updateQueueHUD(queue, currentLevel) {
        let html = `<div style="font-size: 1.5rem; text-align: right; margin-bottom: 10px; color: #ffcc00;">LEVEL ${currentLevel}</div>`;

        if (queue.length === 0) {
            this.hud.innerHTML = html + 'Queue Empty';
            return;
        }

        html += '<div style="display: flex; gap: 10px; flex-wrap: wrap; width: 300px; justify-content: flex-end;">';
        queue.forEach((customer, index) => {
            let emoji = '😊';
            if (customer.mood === 1) emoji = '😐';
            if (customer.mood === 0) emoji = '😠';

            const border = index === 0 ? '3px solid yellow' : '2px solid #444';

            html += `<div style="text-align: center; background: rgba(0,0,0,0.5); padding: 5px; border-radius: 8px;">
                <div style="width: 40px; height: 40px; background: ${customer.colorStr}; border-radius: 5px; margin-bottom: 5px; border: ${border}; line-height: 40px; font-size: 1.5rem;">👤</div>
                <div style="font-size: 1.5rem;">${emoji}</div>
            </div>`;
        });
        html += '</div>';
        this.hud.innerHTML = html;
    }

    showTransition(quote) {
        this.hud.style.display = 'none';
        this.crosshair.style.display = 'none';
        this.transitionScreen.innerHTML = `
            <div style="font-style: italic; max-width: 1200px;">"${quote}"</div>
            <div style="font-size: 2rem; color: #aaaaaa; margin-top: 40px;">- Paul Irofti</div>
        `;
        this.transitionScreen.style.display = 'flex';
    }

    hideTransition() {
        this.hud.style.display = 'block';
        this.crosshair.style.display = 'block';
        this.transitionScreen.style.display = 'none';
    }

    showLose() { 
        this.hud.style.display = 'none'; 
        this.crosshair.style.display = 'none'; 
        this.loseScreen.style.display = 'flex'; 
    }

    hideLose() {
        this.hud.style.display = 'block'; 
        this.crosshair.style.display = 'block'; 
        this.loseScreen.style.display = 'none'; 
    }
}

class ShopItem {
    constructor(id, name, normalizedGroup, x, z) {
        this.id = id;
        this.name = name;

        this.mesh = normalizedGroup;

        const baseY = 1.1; 
        this.mesh.position.set(x, baseY, z); 

        this.mesh.traverse(child => {
            if (child.isMesh) {
                child.userData = { isItem: true, id: this.id };
                if (child.material) {
                    child.material = child.material.clone();
                }
            }
        });

        this.targetEmissive = 0;
    }

    setHover(isHovered) {
        this.targetEmissive = isHovered ? 0.15 : 0; 
    }

    update(dt) {
        this.mesh.traverse(child => {
            if (child.isMesh && child.material && child.material.emissiveIntensity !== undefined) {
                child.material.emissiveIntensity += (this.targetEmissive - child.material.emissiveIntensity) * 15 * dt;
            }
        });
    }
}

class Game {
    constructor() {
        this.clock = new THREE.Clock();
        this.ui = new UIManager();

        this.currentLevel = 1;
        this.items = [];
        this.queue = [];

        this.customerGroup = null;
        this.requestSprite = null;
        this.customerState = 'IDLE'; 

        this.hoveredItem = null;
        this.stallTimer = 0; 

        this.models = {};
        this.sounds = {};

        this.quotes = [
            "scopul nostru este sa nu va pregatim pt viata reala",
            "eu sunt un vierme mic si fricos",
            "Paul Irofti exista undeva in Bucuresti. Gaseste-l",
            "tre' sa fim stalkeri, sa aflam unde locuieste, sa mergem la ea acasa si fara sa batem la usa [...]",
            "sa pun semintele urii devreme",
            "nu spune tot, geamul e deschis, calea e directa",
            "daca suntem in scenariul clasic cand omoram copilul",
            "daca n-ar exista legi ti-as face mult rau",
            "cei care dezvolta un sindrom Stockholm despre mine...",
            "va fi notificat Cristian Rusu, primeste automat [...] o sa vorbesc cu Rusu sa va pice retroactiv",
            "o sa le punem aici desi e o minciuna... sunteti obisnuiti sa va mint",
            "programatorii, in general, sunt niste oameni groaznici [...] presupun ca acest programator este infect",
            "este un calcul intreg pentru care va astept in anul 3 in care nu vom vorbii despre asta",
            "te comporti ca un round robin cu o cuanta mica",
            "e un copil de 10 ani, nu-mi pasa de el, il pun la loc la munca",
            "daca intalnes unu care scrie in rust incerc sa trec strada",
            "programele sunt niste mortaciuni pe discul vostru",
            "daca exista biti ca n-a vazut nimeni un bit niciodata",
            "s-a mirat mama ca am intrat si la liceu si la facultate",
            "ati facut curs de oop, da? Imi pare rau",
            "nu stii niciodata cand folosesti pe cineva ultima data",
            "o adresa logica este absolut orice dar nu logic",
            "tipuri mai Chichi-Chan de fisiere",
            "in 2038 se va sfarsi lumea",
            "buna seara, perioada este frecventa"
        ];

        this.initRenderer();
        this.initScene();

        Promise.all([this.loadModels(), this.loadAudio()]).then(() => {
            this.buildShopEnvironment();
            this.buildInteractables();

            // Desktop click
            window.addEventListener('mousedown', () => this.handleInteraction());
            this.setupKeys();

            this.startLevel();
            this.renderer.setAnimationLoop(() => this.tick());
        });
    }

    async loadModels() {
        const loader = new GLTFLoader();
        const modelNames = ['burger', 'counter', 'npc', 'pizza', 'soda'];

        await Promise.all(modelNames.map(name => {
            return new Promise((resolve, reject) => {
                loader.load(
                    `assets/${name}.glb`,
                    (gltf) => {
                        this.models[name] = gltf.scene;
                        resolve();
                    },
                    undefined,
                    (error) => {
                        console.error(`Failed to load ${name}.glb`, error);
                        reject(error);
                    }
                );
            });
        }));
    }

    async loadAudio() {
        const audioLoader = new THREE.AudioLoader();
        const soundNames = ['click', 'door', 'mumble'];

        await Promise.all(soundNames.map(name => {
            return new Promise((resolve) => {
                audioLoader.load(
                    `assets/${name}.wav`,
                    (buffer) => {
                        const sound = new THREE.Audio(this.audioListener);
                        sound.setBuffer(buffer);
                        sound.setVolume(0.5);
                        this.sounds[name] = sound;
                        resolve();
                    },
                    undefined,
                    (error) => {
                        console.error(`Failed to load ${name}.wav`, error);
                        resolve();
                    }
                );
            });
        }));
    }

    normalizeModel(model, targetSize, normalizeBy = 'max') {
        const wrapper = new THREE.Group();
        const clone = model.clone();

        clone.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(clone);
        const size = new THREE.Vector3();
        box.getSize(size);

        let scale = 1;
        if (normalizeBy === 'height') {
            scale = size.y > 0 ? (targetSize / size.y) : 1;
        } else {
            const maxDim = Math.max(size.x, size.y, size.z);
            scale = maxDim > 0 ? (targetSize / maxDim) : 1;
        }

        clone.scale.setScalar(scale);
        clone.updateMatrixWorld(true);

        const scaledBox = new THREE.Box3().setFromObject(clone);
        const scaledCenter = new THREE.Vector3();
        scaledBox.getCenter(scaledCenter);

        clone.position.x = -scaledCenter.x;
        clone.position.y = -scaledBox.min.y;
        clone.position.z = -scaledCenter.z;

        wrapper.add(clone);
        return wrapper;
    }

    setupKeys() {
        window.addEventListener('keydown', (e) => {
            if (this.state === 'LOST') {
                const key = e.key.toLowerCase();
                if (key === 'l') {
                    window.location.href = '/lobby';
                } else if (key === 'r') {
                    this.ui.hideLose();
                    if (this.customerGroup) this.scene.remove(this.customerGroup);
                    this.currentLevel = 1;
                    this.startLevel();
                }
            }
        });
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
        this.scene.background = new THREE.Color(0x000000); 
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

        this.audioListener = new THREE.AudioListener();
        this.camera.add(this.audioListener);

        const ambientLight = new THREE.AmbientLight(0xffeedd, 0.9);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffbb88, 1.5);
        pointLight.position.set(0, 3, -1);
        this.scene.add(pointLight);

        this.rig = new THREE.Group();
        this.rig.position.set(0, 1.6, 0.4); 
        this.rig.add(this.camera);
        this.scene.add(this.rig);

        this.controls = new PointerLockControls(this.camera, document.body);
        document.body.addEventListener('click', () => {
            if (this.state === 'PLAYING' && !this.renderer.xr.isPresenting) {
                this.controls.lock();
                if (this.audioListener.context.state === 'suspended') {
                    this.audioListener.context.resume();
                }
            }
        });

        this.controllers = [];
        const controllerModelFactory = new XRControllerModelFactory();

        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -1)
        ]);
        const line = new THREE.Line(geometry);
        line.name = 'line';
        line.scale.z = 5;

        for (let i = 0; i < 2; i++) {
            const controller = this.renderer.xr.getController(i);
            controller.addEventListener('selectstart', () => this.handleInteraction());
            this.rig.add(controller);
            this.controllers.push(controller);

            const controllerGrip = this.renderer.xr.getControllerGrip(i);
            controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));
            this.rig.add(controllerGrip);

            controller.add(line.clone());
        }

        this.raycaster = new THREE.Raycaster();
    }

    buildShopEnvironment() {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 128, 128); 
        ctx.fillStyle = '#111111'; 
        ctx.fillRect(0, 0, 64, 64); 
        ctx.fillRect(64, 64, 64, 64); 

        const floorTex = new THREE.CanvasTexture(canvas);
        floorTex.wrapS = THREE.RepeatWrapping;
        floorTex.wrapT = THREE.RepeatWrapping;
        floorTex.repeat.set(10, 10); 
        floorTex.magFilter = THREE.NearestFilter; 

        const floorGeo = new THREE.PlaneGeometry(20, 20);
        const floorMat = new THREE.MeshStandardMaterial({ map: floorTex });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        this.scene.add(floor);

        const wallMat = new THREE.MeshStandardMaterial({ color: 0x333333 }); 
        const backWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMat);
        backWall.position.set(0, 5, -10);
        this.scene.add(backWall);

        const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMat);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-10, 5, 0);
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMat);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(10, 5, 0);
        this.scene.add(rightWall);

        const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMat);
        frontWall.rotation.y = Math.PI;
        frontWall.position.set(0, 5, 10);
        this.scene.add(frontWall);

        const doorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        const door = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.5), doorMat);
        door.position.set(0, 1.25, -9.9); 
        this.scene.add(door);

        const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(0, 10, 0); 
        this.scene.add(ceiling);

        const counterWrapper = this.normalizeModel(this.models.counter, 3.0); 
        counterWrapper.position.set(0, 0, -1.2); 
        this.scene.add(counterWrapper);

        const shelfGeo = new THREE.BoxGeometry(5, 0.1, 0.6);
        const shelfMat = new THREE.MeshStandardMaterial({ color: 0x4a3b2c });
        const shelf = new THREE.Mesh(shelfGeo, shelfMat);
        shelf.position.set(0, 2.0, -2.5);
        this.scene.add(shelf);

        for(let i = -2; i <= 2; i += 1) {
            const decPizza = this.normalizeModel(this.models.pizza, 0.3);
            decPizza.position.set(i, 2.05, -2.5);
            decPizza.children[0].rotation.x = Math.PI / 4; 
            this.scene.add(decPizza);
        }

        const signCanvas = document.createElement('canvas');
        signCanvas.width = 1024; signCanvas.height = 256;
        const sCtx = signCanvas.getContext('2d');

        sCtx.fillStyle = 'black'; 
        sCtx.fillRect(0, 0, 1024, 256);

        sCtx.fillStyle = 'yellow'; 
        sCtx.font = 'bold 120px Arial';
        sCtx.textAlign = 'center'; sCtx.textBaseline = 'middle';
        sCtx.fillText('PAUL', 512, 128);

        const signTexture = new THREE.CanvasTexture(signCanvas);
        const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.0), new THREE.MeshBasicMaterial({ map: signTexture }));
        signMesh.position.set(0, 3.5, -2.5);
        this.scene.add(signMesh);
    }

    buildInteractables() {
        const burger = new ShopItem('burger', 'Burger', this.normalizeModel(this.models.burger, 0.35), -0.6, -0.7);
        const pizza = new ShopItem('pizza', 'Pizza', this.normalizeModel(this.models.pizza, 0.45), 0, -0.7);
        const soda = new ShopItem('soda', 'Soda', this.normalizeModel(this.models.soda, 0.25, 'height'), 0.6, -0.7);

        this.items.push(burger, pizza, soda);
        this.items.forEach(item => this.scene.add(item.mesh));
    }

    createSpeechBubble(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(10, 10, 236, 70, 15);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(128, 80);
        ctx.lineTo(110, 110);
        ctx.lineTo(146, 80);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`"${text.toUpperCase()}"`, 128, 45);

        const tex = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
        sprite.scale.set(1.5, 0.75, 1);
        sprite.position.set(0, 2.0, 0); 
        return sprite;
    }

    spawnNextCustomer() {
        if (this.queue.length === 0) {
            this.triggerWin();
            return;
        }

        if (this.sounds.door) {
            if (this.sounds.door.isPlaying) this.sounds.door.stop();
            this.sounds.door.play();
        }

        this.customerState = 'DOOR_OPENING';
        setTimeout(() => {
            if (this.state !== 'PLAYING') return; 

            const currentCustomer = this.queue[0];
            this.customerGroup = new THREE.Group();
            this.customerGroup.position.set(0, 0, -10); 

            const targetHeight = 1.6;
            const npcMesh = this.normalizeModel(this.models['npc'], targetHeight, 'height');
            this.customerGroup.add(npcMesh);

            this.requestSprite = this.createSpeechBubble(currentCustomer.wants);
            this.requestSprite.visible = false;

            this.requestSprite.position.set(0, targetHeight + 0.4, 0);
            this.customerGroup.add(this.requestSprite);

            this.scene.add(this.customerGroup);
            this.customerState = 'APPROACHING';

            this.ui.updateQueueHUD(this.queue, this.currentLevel);
        }, 1000);
    }

    startLevel() {
        this.state = 'PLAYING';
        this.queue = [];
        const itemKeys = ['burger', 'pizza', 'soda'];
        const colors = [
            { hex: 0x44aaff, str: '#44aaff' }, 
            { hex: 0xff44aa, str: '#ff44aa' }, 
            { hex: 0xaa44ff, str: '#aa44ff' }, 
            { hex: 0xffaa44, str: '#ffaa44' },
            { hex: 0x44ffaa, str: '#44ffaa' }  
        ];

        // --- DIFFICULTY SCALING ---
        this.totalCustomers = Math.min(30, 2 + (this.currentLevel * 2));
        this.degradeInterval = Math.max(1.5, 6.5 - (this.currentLevel * 0.5));
        this.customerSpeed = 6 + (this.currentLevel * 0.5);

        for (let i = 0; i < this.totalCustomers; i++) {
            const colorObj = colors[Math.floor(Math.random() * colors.length)];
            this.queue.push({
                id: i,
                mood: 2, 
                wants: itemKeys[Math.floor(Math.random() * itemKeys.length)],
                colorHex: colorObj.hex,
                colorStr: colorObj.str
            });
        }

        this.degradeTimer = this.degradeInterval;
        this.spawnNextCustomer();
    }

    handleInteraction() {
        if (this.state !== 'PLAYING' || this.stallTimer > 0) return;
        if (!this.renderer.xr.isPresenting && !this.controls.isLocked) return;

        if (this.hoveredItem && this.queue.length > 0 && this.customerState === 'WAITING') {
            if (this.sounds.click) {
                if (this.sounds.click.isPlaying) this.sounds.click.stop();
                this.sounds.click.play();
            }

            const currentCustomer = this.queue[0];
            if (this.hoveredItem.id === currentCustomer.wants) {
                this.queue.shift();
                this.requestSprite.visible = false;
                this.customerState = 'LEAVING';

                this.scene.background.setHex(0x1a331a);
                setTimeout(() => this.scene.background.setHex(0x2a1a10), 150);
            } else {
                this.stallTimer = 1.0;
                this.scene.background.setHex(0x440000);
                setTimeout(() => this.scene.background.setHex(0x2a1a10), 200);
            }
        }
    }

    triggerLose() {
        this.state = 'LOST';
        this.controls.unlock();
        this.ui.showLose();
    }

    triggerWin() {
        this.state = 'TRANSITION';
        if (this.customerGroup) this.scene.remove(this.customerGroup);

        const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
        this.ui.showTransition(randomQuote);

        setTimeout(() => {
            if (this.state !== 'LOST') {
                this.ui.hideTransition();
                this.currentLevel++;
                this.startLevel();
            }
        }, 4000);
    }

    tick() {
        const dt = this.clock.getDelta();

        if (this.state === 'PLAYING') {
            if (this.stallTimer > 0) this.stallTimer -= dt;

            if (this.customerState === 'APPROACHING') {
                this.customerGroup.position.z += this.customerSpeed * dt;
                if (this.customerGroup.position.z >= -2.0) {
                    this.customerGroup.position.z = -2.0;
                    this.customerState = 'WAITING';
                    this.requestSprite.visible = true;

                    if (this.sounds.mumble) {
                        if (this.sounds.mumble.isPlaying) this.sounds.mumble.stop();
                        this.sounds.mumble.play();
                    }
                }
            } else if (this.customerState === 'LEAVING') {
                this.customerGroup.position.x += (this.customerSpeed + 2) * dt;
                if (this.customerGroup.position.x > 5) {
                    this.scene.remove(this.customerGroup);
                    this.spawnNextCustomer();
                }
            }

            if (this.customerState === 'WAITING') {
                this.degradeTimer -= dt;
                if (this.degradeTimer <= 0) {
                    this.degradeTimer = this.degradeInterval;
                    let failed = false;

                    this.queue.forEach(customer => {
                        customer.mood--;
                        if (customer.mood < 0) failed = true;
                    });

                    if (failed) {
                        this.triggerLose();
                    } else {
                        this.ui.updateQueueHUD(this.queue, this.currentLevel);
                    }
                }
            }

            if (this.renderer.xr.isPresenting && this.controllers.length > 0) {
                const tempMatrix = new THREE.Matrix4();
                tempMatrix.identity().extractRotation(this.controllers[0].matrixWorld);
                this.raycaster.ray.origin.setFromMatrixPosition(this.controllers[0].matrixWorld);
                this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
            } else {
                this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
            }

            const intersects = this.raycaster.intersectObjects(this.items.map(i => i.mesh), true);

            this.hoveredItem = null;
            if (intersects.length > 0) {
                const hoveredId = intersects[0].object.userData.id;
                this.hoveredItem = this.items.find(i => i.id === hoveredId);
            }

            this.items.forEach(item => {
                item.setHover(item === this.hoveredItem);
                item.update(dt);
            });
        }

        this.renderer.render(this.scene, this.camera);
    }
}

const game = new Game();
