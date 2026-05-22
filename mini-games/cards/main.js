import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import {
    ROUND_CONFIGS, SYMBOL_NAMES, COLOR_TYPES,
    SYMBOL_SOUNDS, RANDOM_MATCH_SOUNDS,
    START_OF_ROUND_SOUNDS, END_OF_ROUND_SOUNDS,
} from './config.js';

class UIManager {
    constructor() {
        this.loseScreen = this.createOverlay('#220000', '#FF4444', 'OUT OF LIVES.<br>Redirecting to lobby...');
        this.winScreen = this.createOverlay('#002200', '#44FF44', 'YOU WIN!<br>Redirecting to lobby...');
        this.hud = document.createElement('div');
        this.hud.style.position = 'absolute';
        this.hud.style.top = '20px'; this.hud.style.width = '100vw';
        this.hud.style.color = 'white'; this.hud.style.fontSize = '2rem';
        this.hud.style.fontFamily = 'Arial, sans-serif'; this.hud.style.textAlign = 'center';
        this.hud.style.textShadow = '2px 2px 4px #000000';
        document.body.appendChild(this.hud);

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

    createOverlay(bgColor, textColor, text) {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.top = '0'; div.style.left = '0';
        div.style.width = '100vw'; div.style.height = '100vh';
        div.style.backgroundColor = bgColor; div.style.color = textColor;
        div.style.display = 'none'; div.style.alignItems = 'center';
        div.style.justifyContent = 'center'; div.style.fontSize = '3rem';
        div.style.fontFamily = 'Arial, sans-serif'; div.style.textAlign = 'center';
        div.innerHTML = text;
        document.body.appendChild(div);
        return div;
    }

    updateHUD(status, lives, maxLives) {
        const src = '/mini-games/cards/prolog_owl.svg';
        const base = `width:2rem;height:2rem;vertical-align:middle;margin:0 2px;`;
        const activeOwl = `<img src="${src}" style="${base}filter:brightness(0) saturate(100%) invert(15%) sepia(93%) saturate(6397%) hue-rotate(3deg) brightness(94%) contrast(119%);">`;
        const emptyOwl  = `<img src="${src}" style="${base}filter:brightness(0) opacity(0.25);">`;
        const owls = activeOwl.repeat(lives) + emptyOwl.repeat(maxLives - lives);
        this.hud.innerHTML = `${status}<br><span style="font-size:1.5rem;">Lives: ${owls}</span>`;
    }

    showLose() {
        this.hud.style.display = 'none';
        this.crosshair.style.display = 'none';
        this.loseScreen.style.display = 'flex';
    }

    showWin() {
        this.hud.style.display = 'none';
        this.crosshair.style.display = 'none';
        this.winScreen.style.display = 'flex';
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
        this.ui = new UIManager();

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
        this.buildWorld();

        window.addEventListener('mousedown', () => this.handleInteraction());
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'e') this.handleInteraction();
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
        document.body.appendChild(this.renderer.domElement);

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

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.8);
        pointLight.position.set(0, 3, 0);
        this.scene.add(pointLight);

        this.rig = new THREE.Group();
        this.rig.position.set(0, 4.5, 1.5);
        this.rig.add(this.camera);
        this.scene.add(this.rig);
        this.camera.lookAt(0, 0, 0);

        this.controls = new PointerLockControls(this.camera, document.body);
        document.body.addEventListener('click', () => {
            if (this.state !== 'LOST') this.controls.lock();
        });
        this.controls.addEventListener('lock', () => {
            if (this.pendingStartSound) {
                this.playSound('start_of_round', this.pendingStartSound);
                this.pendingStartSound = null;
            }
        });
        this.raycaster = new THREE.Raycaster();
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
        canvas.width = size;
        canvas.height = size;
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
        if (this.state !== 'PLAYING' || !this.controls.isLocked) return;
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
            this.controls.unlock();
            this.ui.showWin();
            setTimeout(() => { window.location.href = '/lobby'; }, 3000);
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
        setTimeout(() => {
            window.location.href = '/lobby';
        }, 3000);
    }

    tick() {
        const dt = this.clock.getDelta();

        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.cards.map(c => c.mesh));

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
            this.ui.updateHUD(`Round ${roundNum} / ${ROUND_CONFIGS.length} | Pairs: ${this.pairsFound} / ${this.pairsNeeded}`, this.lives, this.maxLives);
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
            this.ui.updateHUD(`ROUND CLEAR!<br>${next}`, this.lives, this.maxLives);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

const game = new Game();
