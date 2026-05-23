import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import {
    ROUND_CONFIGS, SYMBOL_NAMES, COLOR_TYPES,
    SYMBOL_SOUNDS, RANDOM_MATCH_SOUNDS,
    START_OF_ROUND_SOUNDS, END_OF_ROUND_SOUNDS,
} from './config.js';

class WebGLUI {
    constructor(camera) {
        this.camera = camera;

        this.hudCanvas = document.createElement('canvas');
        this.hudCanvas.width = 1024; this.hudCanvas.height = 256;
        this.hudCtx = this.hudCanvas.getContext('2d');
        this.hudTex = new THREE.CanvasTexture(this.hudCanvas);

        const hudMat = new THREE.MeshBasicMaterial({ map: this.hudTex, transparent: true, depthTest: false });
        this.hudMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.375), hudMat);
        this.hudMesh.position.set(0, 0.8, -2);
        this.hudMesh.renderOrder = 999;
        this.camera.add(this.hudMesh);

        this.menuCanvas = document.createElement('canvas');
        this.menuCanvas.width = 1024; this.menuCanvas.height = 512;
        this.menuCtx = this.menuCanvas.getContext('2d');
        this.menuTex = new THREE.CanvasTexture(this.menuCanvas);

        const menuMat = new THREE.MeshBasicMaterial({ map: this.menuTex, transparent: true, depthTest: false });
        this.menuMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.25), menuMat);
        this.menuMesh.position.set(0, 0, -1.8);
        this.menuMesh.renderOrder = 1000;
        this.camera.add(this.menuMesh);
        this.menuMesh.visible = false;

        this.crosshair = document.createElement('div');
        this.crosshair.style.position = 'absolute';
        this.crosshair.style.top = '50%'; this.crosshair.style.left = '50%';
        this.crosshair.style.width = '10px'; this.crosshair.style.height = '10px';
        this.crosshair.style.backgroundColor = 'white';
        this.crosshair.style.borderRadius = '50%';
        this.crosshair.style.transform = 'translate(-50%, -50%)';
        this.crosshair.style.pointerEvents = 'none';
        document.body.appendChild(this.crosshair);

        this.owlImg = new Image();
        this.owlImg.src = '/mini-games/cards/prolog_owl.svg';
        this.owlImgLoaded = false;
        this.owlImg.onload = () => { this.owlImgLoaded = true; this.lastStateStr = null; };

        this.lastStateStr = "";
    }

    updateHUD(status, lives, maxLives) {
        const stateStr = status + lives + maxLives;
        if (this.lastStateStr === stateStr && this.owlImgLoaded) return;
        this.lastStateStr = stateStr;

        const ctx = this.hudCtx;
        ctx.clearRect(0, 0, 1024, 256);

        // Background Pill
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.roundRect(112, 20, 800, 180, 30);
        ctx.fill();

        // Text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.font = 'bold 45px Arial';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 6;
        ctx.fillText(status, 512, 75);

        ctx.font = '35px Arial';
        ctx.fillText("Lives: ", 400, 150);

        // Draw Owls
        const startX = 460;
        for(let i = 0; i < maxLives; i++) {
            if (this.owlImgLoaded) {
                ctx.globalAlpha = (i < lives) ? 1.0 : 0.25;
                if (i < lives) {
                    ctx.filter = 'invert(15%) sepia(93%) saturate(6397%) hue-rotate(3deg) brightness(94%) contrast(119%)';
                } else {
                    ctx.filter = 'none';
                }
                ctx.drawImage(this.owlImg, startX + i * 55, 125, 45, 45);
                ctx.filter = 'none';
                ctx.globalAlpha = 1.0;
            } else {
                ctx.fillStyle = (i < lives) ? '#44ff44' : '#555555';
                ctx.beginPath();
                ctx.arc(startX + 25 + i * 55, 145, 18, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        this.hudTex.needsUpdate = true;
    }

    showScreen(bgColor, textColor, title) {
        this.hudMesh.visible = false;
        this.crosshair.style.display = 'none';
        this.menuMesh.visible = true;

        const ctx = this.menuCtx;
        ctx.clearRect(0, 0, 1024, 512);
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 1024, 512);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = textColor;
        ctx.font = 'bold 80px Arial';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 8;
        ctx.fillText(title, 512, 200);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '32px Arial';
        ctx.fillText("VR: Pull Trigger to Retry", 512, 340);
        ctx.fillText("PC: Press R to Retry  |  L for Lobby", 512, 400);

        this.menuTex.needsUpdate = true;
    }

    showLose() { this.showScreen('rgba(40, 0, 0, 0.95)', '#FF4444', "OUT OF LIVES"); }
    showWin() { this.showScreen('rgba(0, 40, 0, 0.95)', '#44FF44', "YOU WIN!"); }
    hideMenu() { 
        this.menuMesh.visible = false; 
        this.hudMesh.visible = true; 
        this.lastStateStr = null; 
    }
}

class Card {
    constructor(id, type, texture, x, z) {
        this.id = id;
        this.type = type;
        this.isFaceUp = true;
        this.isMatched = false;

        const edgeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const backMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const frontMat = new THREE.MeshStandardMaterial({ map: texture, color: 0xffffff });

        const materials = [edgeMat, edgeMat, frontMat, backMat, edgeMat, edgeMat];
        const geometry = new THREE.BoxGeometry(0.6, 0.05, 0.8);

        this.mesh = new THREE.Mesh(geometry, materials);
        this.mesh.position.set(x, 1.05, z);
        this.mesh.userData = { cardObject: this };

        this.targetRotationZ = 0;
        this.targetPositionY = 1.05;
    }

    flipDown() {
        if (this.isMatched) return;
        this.isFaceUp = false;
        this.targetRotationZ = Math.PI;
    }

    flipUp() {
        this.isFaceUp = true;
        this.targetRotationZ = 0;
    }

    setHover(isHovered) {
        if (this.isMatched || this.isFaceUp) {
            this.targetPositionY = 1.05;
        } else {
            this.targetPositionY = isHovered ? 1.15 : 1.05;
        }
    }

    update(dt) {
        this.mesh.rotation.z += (this.targetRotationZ - this.mesh.rotation.z) * 10 * dt;
        this.mesh.position.y += (this.targetPositionY - this.mesh.position.y) * 10 * dt;
    }
}

class Game {
    constructor() {
        this.clock = new THREE.Clock();

        this.roundIndex = 0;
        this.memorizeDuration = 5.0;
        this.maxLives = 3;

        const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
        this.startSounds = shuffle(START_OF_ROUND_SOUNDS);
        this.endSounds   = shuffle(END_OF_ROUND_SOUNDS);

        this.cards = [];
        this.selectedCards = [];
        this.hoveredCard = null;

        this.initRenderer();
        this.initScene();
        this.initVRControllers();
        this.buildWorld();

        window.addEventListener('mousedown', () => this.handleInteraction());
        window.addEventListener('keydown', (e) => {
            const k = e.key.toLowerCase();
            if (k === 'e') this.handleInteraction();
            if (k === 'r' && (this.state === 'LOST' || this.state === 'WON')) this.restart();
            if (k === 'l' && (this.state === 'LOST' || this.state === 'WON')) window.location.href = '/lobby';
        });

        this.startRound();
        this.renderer.setAnimationLoop(() => this.tick());
    }

    startRound() {
        this.cards.forEach(c => this.scene.remove(c.mesh));
        this.cards = [];
        this.selectedCards = [];

        this.state = 'MEMORIZE';
        this.lives = this.maxLives;
        this.pairsFound = 0;
        this.pairsNeeded = ROUND_CONFIGS[this.roundIndex].pairs;
        this.memorizeTimer = this.memorizeDuration;
        this.checkTimer = 0;

        if (this.roundIndex === 0) {
            this.pendingStartSound = this.startSounds[0];
        } else {
            this.playSound('start_of_round', this.startSounds[this.roundIndex]);
        }
        this.buildCards();
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true; // ENABLE VR
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
        this.scene.background = new THREE.Color(0x202030);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

        this.ui = new WebGLUI(this.camera);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.8);
        pointLight.position.set(0, 3, 0);
        this.scene.add(pointLight);

        this.rig = new THREE.Group();
        this.rig.position.set(0, 0, 1.8);
        this.scene.add(this.rig);
        this.rig.add(this.camera);

        this.camera.position.set(0, 4.5, 0);
        this.camera.lookAt(0, 1.05, -1.8);

        this.renderer.xr.addEventListener('sessionstart', () => {
            this.rig.position.y = 2.0;
            this.rig.position.z = 2.5;
        });

        this.renderer.xr.addEventListener('sessionend', () => {
            this.rig.position.y = 0;
            this.rig.position.z = 1.8;
        });

        this.controls = new PointerLockControls(this.camera, document.body);
        document.body.addEventListener('click', () => {
            if (this.state !== 'LOST' && !this.renderer.xr.isPresenting) this.controls.lock();
        });
        this.controls.addEventListener('lock', () => {
            if (this.pendingStartSound) {
                this.playSound('start_of_round', this.pendingStartSound);
                this.pendingStartSound = null;
            }
        });

        this.raycaster = new THREE.Raycaster();
    }

    initVRControllers() {
        this.controllers = [];
        const onSelect = () => {
            if (this.state === 'LOST' || this.state === 'WON') {
                this.restart();
            } else {
                this.handleInteraction();
            }
        };

        for (let i = 0; i < 2; i++) {
            const controller = this.renderer.xr.getController(i);
            controller.addEventListener('selectstart', onSelect);
            this.rig.add(controller);
            this.controllers.push(controller);

            // Draw laser pointers on the controllers
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -5)
            ]);
            const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xffffff }));
            controller.add(line);
        }
    }

    buildWorld() {
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        floor.rotation.x = -Math.PI / 2;
        this.scene.add(floor);

        const table = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1, 3.5), new THREE.MeshStandardMaterial({ color: 0x462b15 }));
        table.position.set(0, 0.5, 0);
        this.scene.add(table);
    }

    playSound(subdir, filename) {
        const path = subdir
            ? `/mini-games/cards/cristi_samples/${subdir}/${encodeURIComponent(filename)}`
            : `/mini-games/cards/cristi_samples/${encodeURIComponent(filename)}`;
        new Audio(path).play().catch(() => { });
    }

    playMatchSound(symbol) {
        if (SYMBOL_SOUNDS.has(symbol)) {
            this.playSound('', `${symbol}.wav`);
        } else if (Math.random() < 0.5) {
            const file = RANDOM_MATCH_SOUNDS[Math.floor(Math.random() * RANDOM_MATCH_SOUNDS.length)];
            this.playSound('', file);
        }
    }

    buildCardTexture(colorHex, svgName) {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');

        const hex = '#' + colorHex.toString(16).padStart(6, '0');
        ctx.fillStyle = hex;
        ctx.fillRect(0, 0, size, size);

        const texture = new THREE.CanvasTexture(canvas);
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 16, 16, size - 32, size - 32);
            texture.needsUpdate = true;
        };
        img.src = `/mini-games/cards/symbols/${svgName}.svg`;

        return texture;
    }

    buildCards() {
        const config = ROUND_CONFIGS[this.roundIndex];
        const shuffledSymbols = [...SYMBOL_NAMES].sort(() => Math.random() - 0.5);
        const chosenSymbols = shuffledSymbols.slice(0, config.pairs);
        const colors = COLOR_TYPES.slice(0, config.pairs);

        const pairEntries = chosenSymbols.map((symbol, i) => ({ symbol, colorHex: colors[i].hex }));
        const pairs = [...pairEntries, ...pairEntries];
        for (let i = pairs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
        }

        config.positions.forEach((pos, index) => {
            const { symbol, colorHex } = pairs[index];
            const texture = this.buildCardTexture(colorHex, symbol);
            const card = new Card(index, symbol, texture, pos[0], pos[1]);
            this.cards.push(card);
            this.scene.add(card.mesh);
        });
    }

    handleInteraction() {
        const isVR = this.renderer.xr.isPresenting;

        if (this.state !== 'PLAYING') return;
        if (!isVR && !this.controls.isLocked) return; // Prevent PC clicks while unlocked
        if (!this.hoveredCard || this.hoveredCard.isFaceUp || this.hoveredCard.isMatched) return;

        this.hoveredCard.flipUp();
        this.selectedCards.push(this.hoveredCard);

        if (this.selectedCards.length === 2) {
            this.state = 'CHECKING';
            this.checkTimer = 2.0;
            const [card1, card2] = this.selectedCards;
            if (card1.type === card2.type) this.playMatchSound(card1.type);
        }
    }

    handleMistake() {
        this.lives--;
        this.scene.background.setHex(0x550000);
        setTimeout(() => this.scene.background.setHex(0x202030), 200);

        if (this.lives <= 0) {
            this.triggerLoseState();
        }
    }

    resolveCheck() {
        const [card1, card2] = this.selectedCards;

        if (card1.type === card2.type) {
            card1.isMatched = true;
            card2.isMatched = true;
            this.pairsFound++;
            if (this.pairsFound >= this.pairsNeeded) {
                this.triggerRoundWin();
                return;
            }
        } else {
            this.handleMistake();
            if (this.lives > 0) {
                card1.flipDown();
                card2.flipDown();
            }
        }

        this.selectedCards = [];
        if (this.state !== 'LOST' && this.state !== 'TRANSITION') {
            this.state = 'PLAYING';
        }
    }

    triggerRoundWin() {
        this.state = 'TRANSITION';
        this.playSound('end_of_round', this.endSounds[this.roundIndex]);
        this.roundIndex++;

        if (this.roundIndex >= ROUND_CONFIGS.length) {
            this.state = 'WON';
            this.controls.unlock();
            this.ui.showWin();
            return;
        }

        setTimeout(() => {
            if (this.state !== 'LOST') this.startRound();
        }, 6000);
    }

    triggerLoseState() {
        this.state = 'LOST';
        this.controls.unlock();
        this.playSound('fail', 'sad_horn.wav');
        this.ui.showLose();
    }

    restart() {
        this.ui.hideMenu();
        this.roundIndex  = 0;
        const shuffle    = arr => [...arr].sort(() => Math.random() - 0.5);
        this.startSounds = shuffle(START_OF_ROUND_SOUNDS);
        this.endSounds   = shuffle(END_OF_ROUND_SOUNDS);
        this.startRound();

        if (!this.renderer.xr.isPresenting) this.controls.lock();
    }

    tick() {
        const dt = this.clock.getDelta();
        const isVR = this.renderer.xr.isPresenting;

        if (isVR) {
            this.ui.crosshair.style.display = 'none';
        } else {
            this.ui.crosshair.style.display = (this.state === 'PLAYING' && this.controls.isLocked) ? 'block' : 'none';
        }

        let intersects = [];
        if (isVR && this.controllers) {
            for (let ctrl of this.controllers) {
                const tempMatrix = new THREE.Matrix4();
                tempMatrix.identity().extractRotation(ctrl.matrixWorld);
                this.raycaster.ray.origin.setFromMatrixPosition(ctrl.matrixWorld);
                this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

                const hits = this.raycaster.intersectObjects(this.cards.map(c => c.mesh));
                if (hits.length > 0) {
                    intersects = hits;
                    break;
                }
            }
        } else {
            this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
            intersects = this.raycaster.intersectObjects(this.cards.map(c => c.mesh));
        }

        this.hoveredCard = null;
        if (intersects.length > 0) {
            this.hoveredCard = intersects[0].object.userData.cardObject;
        }

        this.cards.forEach(card => {
            card.setHover(card === this.hoveredCard);
            card.update(dt);
        });

        const roundNum = this.roundIndex + 1;
        if (this.state === 'MEMORIZE') {
            this.memorizeTimer -= dt;
            this.ui.updateHUD(`Round ${roundNum} / ${ROUND_CONFIGS.length} - Memorize! Starting in: ${Math.ceil(this.memorizeTimer)}s`, this.lives, this.maxLives);
            if (this.memorizeTimer <= 0) {
                this.cards.forEach(c => c.flipDown());
                this.state = 'PLAYING';
            }
        }
        else if (this.state === 'PLAYING') {
            this.ui.updateHUD(`Round ${roundNum} / ${ROUND_CONFIGS.length}  |  Pairs: ${this.pairsFound} / ${this.pairsNeeded}`, this.lives, this.maxLives);
        }
        else if (this.state === 'CHECKING') {
            this.ui.updateHUD(`Checking...`, this.lives, this.maxLives);
            this.checkTimer -= dt;
            if (this.checkTimer <= 0) {
                this.resolveCheck();
            }
        }
        else if (this.state === 'TRANSITION') {
            const next = this.roundIndex < ROUND_CONFIGS.length ? `Preparing Round ${this.roundIndex + 1}...` : 'You win!';
            this.ui.updateHUD(`ROUND CLEAR! ${next}`, this.lives, this.maxLives);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

const game = new Game();
