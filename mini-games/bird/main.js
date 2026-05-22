import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

class UIManager {
    constructor() {
        this.flashOverlay = this.createOverlay('rgba(0, 0, 0, 0.9)', '#ffffff', '');

        const hint = '<div style="font-size:.9rem;color:#aaa;margin-top:32px;letter-spacing:.15em">PRESS <span style="color:#fff">R</span> TO RETRY &nbsp;·&nbsp; <span style="color:#fff">L</span> FOR LOBBY</div>';
        this.loseScreen = this.createOverlay('#220000', '#FF4444', 'TIMP EXPIRAT.<br>' + hint);
        this.winScreen  = this.createOverlay('#001a00', '#00ffaa', 'END OF SEMESTER!<br><div style="font-size:1.5rem;color:#aaa;margin-top:16px;">You have completed all levels.</div>' + hint);

        // game info
        this.statusBox = document.createElement('div');
        this.statusBox.style.position = 'absolute';
        this.statusBox.style.top = '20px';
        this.statusBox.style.right = '30px';
        this.statusBox.style.color = '#ffffff';
        this.statusBox.style.fontSize = '2rem';
        this.statusBox.style.textAlign = 'right';
        this.statusBox.style.textShadow = '2px 2px 4px #000';
        document.body.appendChild(this.statusBox);

        // controls helper
        this.helperBox = document.createElement('div');
        this.helperBox.style.position = 'absolute';
        this.helperBox.style.bottom = '20px';
        this.helperBox.style.left = '50%';
        this.helperBox.style.transform = 'translateX(-50%)';
        this.helperBox.style.color = '#dddddd';
        this.helperBox.style.fontSize = '1.2rem';
        this.helperBox.style.textShadow = '1px 1px 2px #000';
        this.helperBox.innerHTML = "Press <b>D</b> to advance tape. Aim at the red button and <b>CLICK</b> to submit.";
        this.helperBox.style.textAlign = 'center';
        document.body.appendChild(this.helperBox);

        this.crosshair = document.createElement('div');
        this.crosshair.style.position = 'absolute';
        this.crosshair.style.top = '50%'; this.crosshair.style.left = '50%';
        this.crosshair.style.width = '8px'; this.crosshair.style.height = '8px';
        this.crosshair.style.backgroundColor = 'white';
        this.crosshair.style.borderRadius = '50%';
        this.crosshair.style.transform = 'translate(-50%, -50%)';

        // so clicks pass through to the game
        this.crosshair.style.pointerEvents = 'none';
        this.crosshair.style.boxShadow = '0 0 4px rgba(0,0,0,0.8)';
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
        div.style.fontSize = '2.5rem';
        div.style.textAlign = 'center'; div.style.padding = '0 10%'; div.style.boxSizing = 'border-box';
        div.style.zIndex = '100';
        div.innerHTML = text;
        document.body.appendChild(div);
        return div;
    }

    updateTimer(timeRemaining, level) {
        const color = timeRemaining <= 5 ? '#ff4444' : '#00a86b';
        this.statusBox.innerHTML = `
            <div style="font-size: 1.5rem;">Level ${level}</div>
            <div style="color: ${color}; font-weight: bold; font-size: 2.5rem;">${timeRemaining.toFixed(1)}s</div>
        `;
    }

    showMessage(quote, subtext, color = '#ffffff', duration = 3000, callback = null) {
        this.statusBox.style.display = 'none';
        this.helperBox.style.display = 'none';
        this.crosshair.style.display = 'none';

        this.flashOverlay.innerHTML = `
            <div style="font-style: italic; color: ${color}; max-width: 1000px; font-size: 3.5rem;">"${quote}"</div>
            <div style="font-size: 2rem; color: #aaaaaa; margin-top: 40px;">- Păun</div>
            <div style="font-size: 1.5rem; color: #888888; margin-top: 20px;">${subtext}</div>
        `;
        this.flashOverlay.style.display = 'flex';

        setTimeout(() => {
            this.flashOverlay.style.display = 'none';
            this.statusBox.style.display = 'block';
            this.helperBox.style.display = 'block';
            this.crosshair.style.display = 'block';
            if (callback) callback();
        }, duration);
    }
}

class TuringMachineGame {
    constructor() {
        this.clock = new THREE.Clock();
        this.ui = new UIManager();

        const rawQuotes = [
            "aaah",
            "fascism",
            "și niste bălării",
            "am ajuns la mickey mouse",
            "o explozie de stări",
            "am ajuns în broască",
            "iti bagi un cui în talpă",
            "Nu a* cuvinte adevărate",
            "mai repede și mai rapid",
            "mizerie de asta de lambda NFA",
            "o sa sar de blah blah blah-uri",
            "e orătania nr 2 care ne dispera",
            "daca am ajuns în B nu mai scap",
            "planul nostru este sa blocăm toate amfiteatrele",
        ];

        this.quotes = rawQuotes.sort((a, b) => a.length - b.length);

        this.currentLevel = 0;
        this.timeRemaining = 0;
        this.isProcessing = true;

        this.targetQuote = "";
        this.quoteProgress = 0;

        this.tapeString = "";
        this.tapeIndex = 0;

        this.cards = [];
        this.numCards = 5;

        this.initScene();
        this.initEnvironment();

        window.addEventListener('keydown', (e) => this.handleKeyboard(e));
        window.addEventListener('keydown', e => {
            const k = e.key.toLowerCase();
            const isTerminal = this.ui.loseScreen.style.display === 'flex' || this.ui.winScreen.style.display === 'flex';
            if (k === 'r' && isTerminal) this.restart();
            if (k === 'l' && isTerminal) window.location.href = '/lobby';
        });
        window.addEventListener('click', (e) => this.handleMouseClick(e));
        window.addEventListener('resize', () => this.onWindowResize());

        this.startLevel(0);
        this.renderer.setAnimationLoop(() => this.tick());
    }

    initScene() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a24);

        // seated position at desk
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 2.5, 3.5);

        this.controls = new PointerLockControls(this.camera, document.body);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffddaa, 1.2);
        pointLight.position.set(0, 5, 0);
        pointLight.castShadow = true;
        this.scene.add(pointLight);

        this.raycaster = new THREE.Raycaster();
    }

    initEnvironment() {
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xede8d0, roughness: 0.9 });
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.8 });

        const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), floorMat);
        floor.rotation.x = -Math.PI / 2;
        this.scene.add(floor);

        const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), wallMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 10;
        this.scene.add(ceiling);

        const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), wallMat);
        frontWall.position.set(0, 5, -8);
        this.scene.add(frontWall);

        const backWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), wallMat);
        backWall.rotation.y = Math.PI;
        backWall.position.set(0, 5, 8);
        this.scene.add(backWall);

        const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), wallMat);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-10, 5, 0);
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), wallMat);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(10, 5, 0);
        this.scene.add(rightWall);

        const deskGeo = new THREE.BoxGeometry(10, 0.2, 4);
        const deskMat = new THREE.MeshStandardMaterial({ color: 0x4a3018, roughness: 0.8 });
        this.desk = new THREE.Mesh(deskGeo, deskMat);
        this.desk.position.set(0, 0.5, 0.5);
        this.desk.receiveShadow = true;
        this.scene.add(this.desk);

        const tileGeo = new THREE.PlaneGeometry(1.0, 1.0);
        for(let i = 0; i < this.numCards; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = 128; canvas.height = 128;
            const tex = new THREE.CanvasTexture(canvas);
            const mat = new THREE.MeshBasicMaterial({ map: tex });
            const card = new THREE.Mesh(tileGeo, mat);

            card.rotation.x = -Math.PI / 2;

            // from 0 extend to the right
            card.position.set(i * 1.2, 0.61, -0.2);

            this.scene.add(card);
            this.cards.push({ mesh: card, canvas: canvas, tex: tex });
        }

        // only for card 0
        const highlightGeo = new THREE.PlaneGeometry(1.15, 1.15);
        this.highlightMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
        this.highlightBox = new THREE.Mesh(highlightGeo, this.highlightMat);
        this.highlightBox.rotation.x = -Math.PI / 2;
        this.highlightBox.position.set(0, 0.605, -0.2);
        this.scene.add(this.highlightBox);

        const baseGeo = new THREE.BoxGeometry(1, 0.2, 1);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const buttonBase = new THREE.Mesh(baseGeo, baseMat);
        buttonBase.position.set(0, 0.6, 1.2);
        this.scene.add(buttonBase);

        const btnGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 32);
        const btnMat = new THREE.MeshStandardMaterial({ color: 0xcc0000 });
        this.submitButton = new THREE.Mesh(btnGeo, btnMat);
        this.submitButton.position.set(0, 0.75, 1.2);
        this.submitButton.userData = { isSubmit: true };
        this.scene.add(this.submitButton);

        this.boardCanvas = document.createElement('canvas');
        this.boardCanvas.width = 1024;
        this.boardCanvas.height = 512;
        this.boardTexture = new THREE.CanvasTexture(this.boardCanvas);

        const boardGeo = new THREE.PlaneGeometry(14, 6);
        const boardMat = new THREE.MeshStandardMaterial({ 
            map: this.boardTexture,
            roughness: 0.9 
        });

        const board = new THREE.Mesh(boardGeo, boardMat);

        // front wall
        board.position.set(0, 4, -7.9);
        this.scene.add(board);
    }

    drawChalkboard() {
        const ctx = this.boardCanvas.getContext('2d');

        ctx.fillStyle = '#1e382b';
        ctx.fillRect(0, 0, this.boardCanvas.width, this.boardCanvas.height);

        // wooden frame
        ctx.strokeStyle = '#5c4033';
        ctx.lineWidth = 20;
        ctx.strokeRect(0, 0, this.boardCanvas.width, this.boardCanvas.height);

        // draw quote
        ctx.font = 'bold 48px "Courier New", Courier, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textY = this.boardCanvas.height / 2;
        const textX = this.boardCanvas.width / 2;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText(this.targetQuote, textX, textY);

        // draw strikethrough
        if (this.quoteProgress > 0) {
            const completedText = this.targetQuote.substring(0, this.quoteProgress);
            const fullWidth = ctx.measureText(this.targetQuote).width;
            const completedWidth = ctx.measureText(completedText).width;

            const startX = textX - (fullWidth / 2);

            ctx.beginPath();
            ctx.moveTo(startX - 10, textY);
            ctx.lineTo(startX + completedWidth, textY);
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 8;
            ctx.stroke();
        }

        this.boardTexture.needsUpdate = true;
    }

    generateTape(quote) {
        this.tapeString = "";
        const alphabet = "abcdefghijklmnopqrstuvwxyzăâîșț0123456789 ".split('');

        for (let char of quote) {
            const noiseCount = Math.floor(Math.random() * 3); 
            for(let i = 0; i < noiseCount; i++) {
                this.tapeString += alphabet[Math.floor(Math.random() * alphabet.length)];
            }
            this.tapeString += char;
        }

        // padding at the end so it shifts cleanly
        this.tapeString += "     ";
        this.updateCards();
    }

    updateCards() {
        for(let i = 0; i < this.numCards; i++) {
            const charIndex = this.tapeIndex + i;

            const char = charIndex < this.tapeString.length ? this.tapeString[charIndex] : ' ';
            const displayChar = char === ' ' ? '␣' : char;

            const canvas = this.cards[i].canvas;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 128, 128);

            if (charIndex < this.tapeString.length && displayChar !== '␣') {
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 80px monospace';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(displayChar, 64, 64);
            }

            this.cards[i].tex.needsUpdate = true;
        }
    }

    startLevel(levelIndex) {
        if (levelIndex >= this.quotes.length) {
            this.isProcessing = true;
            this.controls.unlock();
            this.ui.winScreen.style.display = 'flex';
            return;
        }

        this.currentLevel = levelIndex;
        this.targetQuote = this.quotes[this.currentLevel];
        this.quoteProgress = 0;

        const timeMultiplier = Math.max(0.8, 2.5 - (levelIndex * 0.2));
        this.timeRemaining = this.targetQuote.length * timeMultiplier;

        this.tapeIndex = 0;
        this.generateTape(this.targetQuote);
        this.drawChalkboard();
        this.ui.updateTimer(this.timeRemaining, this.currentLevel + 1);

        this.isProcessing = false;
    }

    handleKeyboard(e) {
        if (this.isProcessing) return;

        if (e.code === 'KeyD') {
            e.preventDefault();
            if (this.tapeIndex < this.tapeString.length - 1) {
                this.tapeIndex++;
                this.updateCards();
            }
        }
    }

    handleMouseClick(e) {
        if (this.isProcessing) return;

        if (!this.controls.isLocked) {
            this.controls.lock();
            return;
        }

        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObject(this.submitButton);

        if (intersects.length > 0) {
            this.submitCurrentChar();
            this.animateButtonPress();
        }
    }

    animateButtonPress() {
        this.submitButton.position.y -= 0.05;
        setTimeout(() => {
            this.submitButton.position.y += 0.05;
        }, 150);
    }

    submitCurrentChar() {
        const targetChar = this.targetQuote[this.quoteProgress];
        const currentCharOnTape = this.tapeString[this.tapeIndex];

        if (currentCharOnTape === targetChar) {
            this.quoteProgress++;
            this.highlightMat.color.setHex(0x00ffaa);

            if (this.tapeIndex < this.tapeString.length - 1) {
                this.tapeIndex++;
                this.updateCards();
            }

            this.drawChalkboard();

            if (this.quoteProgress >= this.targetQuote.length) {
                this.triggerWin();
            }
        } else {
            this.highlightMat.color.setHex(0xff0000);
            this.timeRemaining -= 2.0;
        }

        setTimeout(() => {
            this.highlightMat.color.setHex(0xffd700);
        }, 300);
    }

    restart() {
        this.ui.loseScreen.style.display = 'none';
        this.ui.winScreen.style.display  = 'none';
        this.ui.statusBox.style.display  = 'block';
        this.ui.helperBox.style.display  = 'block';
        this.ui.crosshair.style.display  = 'block';
        this.startLevel(0);
    }

    triggerFail() {
        this.isProcessing = true;
        this.controls.unlock();

        const failQuotes = ["am ajuns în broască", "timpul s-a scurs", "lucrurile s-au cam imputit"];
        const q = failQuotes[Math.floor(Math.random() * failQuotes.length)];

        this.ui.showMessage(q, "Level failed.", '#ff4444', 2000, () => {
            this.ui.loseScreen.style.display = 'flex';
        });
    }

    triggerWin() {
        this.isProcessing = true;

        const winQuotes = ["am ajuns la mickey mouse", "ne transformam in polițiști", "am acceptat cuvantul ăsta"];
        const q = winQuotes[Math.floor(Math.random() * winQuotes.length)];

        this.ui.showMessage(q, "String validated! Proceeding to the next level...", '#00ffaa', 3000, () => {
            this.startLevel(this.currentLevel + 1);
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    tick() {
        const dt = this.clock.getDelta();

        if (!this.isProcessing) {
            this.timeRemaining -= dt;
            this.ui.updateTimer(this.timeRemaining, this.currentLevel + 1);

            if (this.timeRemaining <= 0) {
                this.triggerFail();
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}

const game = new TuringMachineGame();
