import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const winScreen = document.createElement('div');
winScreen.style.position = 'absolute';
winScreen.style.top = '0'; winScreen.style.left = '0';
winScreen.style.width = '100vw'; winScreen.style.height = '100vh';
winScreen.style.backgroundColor = '#000000'; winScreen.style.color = '#50C878';
winScreen.style.display = 'none'; winScreen.style.alignItems = 'center';
winScreen.style.justifyContent = 'center'; winScreen.style.fontSize = '3rem';
winScreen.style.fontFamily = 'Arial, sans-serif'; winScreen.style.textAlign = 'center';
winScreen.innerHTML = 'You escaped the dragon lair,<br>without destroying the equipment!';
document.body.appendChild(winScreen);

const loseScreen = document.createElement('div');
loseScreen.style.position = 'absolute';
loseScreen.style.top = '0'; loseScreen.style.left = '0';
loseScreen.style.width = '100vw'; loseScreen.style.height = '100vh';
loseScreen.style.backgroundColor = '#220000'; loseScreen.style.color = '#FF4444';
loseScreen.style.display = 'none'; loseScreen.style.alignItems = 'center';
loseScreen.style.justifyContent = 'center'; loseScreen.style.fontSize = '4rem';
loseScreen.style.fontFamily = 'Arial, sans-serif'; loseScreen.style.textAlign = 'center';
loseScreen.innerHTML = 'THE DRAGON SPOTTED YOU!<br>Game Over.';
document.body.appendChild(loseScreen);

const hud = document.createElement('div');
hud.style.position = 'absolute';
hud.style.top = '20px'; hud.style.width = '100vw';
hud.style.color = 'white'; hud.style.fontSize = '2rem';
hud.style.fontFamily = 'Arial, sans-serif'; hud.style.textAlign = 'center';
hud.style.textShadow = '2px 2px 4px #000000';
hud.innerHTML = 'Safe... for now.';
document.body.appendChild(hud);

class Player {
    constructor(camera) {
        this.state = { onChair: false };
        this.rig = new THREE.Group();
        this.rig.position.set(0, 0, 30);
        this.rig.add(camera);
        this.camera = camera;

        this.standingHeight = 1.6;
        this.sittingHeight = 1.0;
        this.camera.position.y = this.standingHeight;
    }

    sitDown(chairWorldPos) {
        this.state.onChair = true;
        this.rig.position.set(chairWorldPos.x, 0, chairWorldPos.z);
        this.camera.position.y = this.sittingHeight;
    }

    standUp(chairWorldPos) {
        this.state.onChair = false;
        const stepOutDistance = chairWorldPos.x > 0 ? -2 : 2;
        this.rig.position.set(chairWorldPos.x + stepOutDistance, 0, chairWorldPos.z);
        this.camera.position.y = this.standingHeight;
    }
}

const keys = { w: false, a: false, s: false, d: false };
let currentSittingChairWorldPos = new THREE.Vector3();

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    if (key === 'w') keys.w = true;
    if (key === 'a') keys.a = true;
    if (key === 's') keys.s = true;
    if (key === 'd') keys.d = true;

    if (key === 'e') {
        if (player.state.onChair) {
            player.standUp(currentSittingChairWorldPos);
            return;
        }

        if (!player.state.onChair) {
            if (player.rig.position.distanceTo(door.position) < 3.0) {
                triggerWinState();
                return;
            }

            let nearestChair = null;
            let minDistance = 2.0;

            for (let chair of chairsList) {
                let wp = new THREE.Vector3();
                chair.getWorldPosition(wp);
                let d = player.rig.position.distanceTo(wp);

                if (d < minDistance) {
                    minDistance = d;
                    nearestChair = chair;
                    currentSittingChairWorldPos.copy(wp);
                }
            }

            if (nearestChair) {
                player.sitDown(currentSittingChairWorldPos);
            }
        }
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w') keys.w = false;
    if (key === 'a') keys.a = false;
    if (key === 's') keys.s = false;
    if (key === 'd') keys.d = false;
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xD3D3D3);
scene.fog = new THREE.Fog(0xD3D3D3, 10, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
const vrButton = VRButton.createButton(renderer);
document.body.appendChild(vrButton);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(0, 20, 10);
scene.add(directionalLight);

const player = new Player(camera);
scene.add(player.rig);

const controls = new PointerLockControls(camera, document.body);
document.body.addEventListener('click', () => {
    if (winScreen.style.display === 'none' && loseScreen.style.display === 'none') {
        controls.lock();
    }
});

function createTextSprite(message) {
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
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(1.5, 0.75, 1);
    return sprite;
}

const floor = new THREE.Mesh(new THREE.BoxGeometry(50, 0.2, 70), new THREE.MeshStandardMaterial({ color: 0xE0E0E0 }));
floor.position.y = -0.1; scene.add(floor);

const board = new THREE.Mesh(new THREE.BoxGeometry(30, 5, 0.2), new THREE.MeshStandardMaterial({ color: 0x2E8B57 }));
board.position.set(0, 2.5, -34.8); scene.add(board);

const door = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 2), new THREE.MeshStandardMaterial({ color: 0xB22222 }));
door.position.set(24.9, 1.5, -15); scene.add(door);

const doorText = createTextSprite("[E]: Exit");
doorText.position.set(24.7, 1.5, -15);
doorText.visible = false; scene.add(doorText);

const teacherGroup = new THREE.Group();
const teacherBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.4), new THREE.MeshStandardMaterial({ color: 0xFFD700 }));
teacherBody.position.y = 0.7;
const teacherHead = new THREE.Mesh(new THREE.SphereGeometry(0.25), new THREE.MeshStandardMaterial({ color: 0xFFD700 }));
teacherHead.position.y = 1.6;
teacherGroup.add(teacherBody); teacherGroup.add(teacherHead);
teacherGroup.position.set(0, 0, -30); scene.add(teacherGroup);

const deskMaterial = new THREE.MeshStandardMaterial({ color: 0x4682B4 });
const chairsList = [];

function createStudentDesk(x, z, baseChairModel) {
    const group = new THREE.Group();

    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 1), deskMaterial);
    deskTop.position.set(0, 0.4, 0);
    group.add(deskTop);

    const chair1 = baseChairModel.clone();
    chair1.position.set(-0.6, 0, 0.8);

    const text1 = createTextSprite("[E]: Sit/Stand");
    text1.position.set(0, 1.2, 0);
    text1.visible = false;
    chair1.add(text1);
    chair1.userData.sprite = text1;
    group.add(chair1);
    chairsList.push(chair1);

    const chair2 = baseChairModel.clone();
    chair2.position.set(0.6, 0, 0.8);

    const text2 = createTextSprite("[E]: Sit/Stand");
    text2.position.set(0, 1.2, 0);
    text2.visible = false;
    chair2.add(text2);
    chair2.userData.sprite = text2;
    group.add(chair2);
    chairsList.push(chair2);

    group.position.set(x, 0, z);
    scene.add(group);
}
const gltfLoader = new GLTFLoader();

gltfLoader.load('assets/chair.glb', function (gltf) {
    const loadedChair = gltf.scene;

    loadedChair.rotation.y = Math.PI;

    const columns = [-12, 12];
    const rows = [-20, -5, 10, 25];

    for (let c of columns) {
        for (let r of rows) {
            createStudentDesk(c, r, loadedChair);
        }
    }
}, undefined, function (error) {
    console.error('Uh oh, there was an error loading the chair:', error);
});

const speed = 0.12;
const clock = new THREE.Clock();
let cycleTime = 0;
const lookDuration = 2.0;

function getRandomSafeTime() {
    return Math.random() * (11.0 - 4.0) + 4.0;
}
let safeDuration = getRandomSafeTime();

renderer.setAnimationLoop(() => {
    if (controls.isLocked) {
        if (!player.state.onChair) {
            const euler = new THREE.Euler(0, 0, 0, 'YXZ');
            euler.setFromQuaternion(camera.quaternion);
            const direction = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, euler.y, 0));
            const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, euler.y, 0));

            if (keys.w) player.rig.position.addScaledVector(direction, speed);
            if (keys.s) player.rig.position.addScaledVector(direction, -speed);
            if (keys.a) player.rig.position.addScaledVector(right, -speed);
            if (keys.d) player.rig.position.addScaledVector(right, speed);
        }

        const distanceToDoor = player.rig.position.distanceTo(door.position);
        doorText.visible = (distanceToDoor < 3.0 && !player.state.onChair);

        for (let chair of chairsList) {
            let wp = new THREE.Vector3();
            chair.getWorldPosition(wp);
            chair.userData.sprite.visible = (player.rig.position.distanceTo(wp) < 2.5 && !player.state.onChair);
        }

        const dt = clock.getDelta();
        cycleTime += dt;
        const totalCycle = safeDuration + lookDuration;

        if (cycleTime > totalCycle) {
            cycleTime = 0;
            safeDuration = getRandomSafeTime();
        }

        if (cycleTime < safeDuration) {
            // SAFE PHASE
            scene.background.setHex(0xD3D3D3);
            scene.fog.color.setHex(0xD3D3D3);

            let timeLeft = safeDuration - cycleTime;

            if (timeLeft <= 3.0) {
                hud.innerHTML = `Dragon looks in: ${Math.ceil(timeLeft)}s!`;
                hud.style.color = '#FFA500';
            } else {
                hud.innerHTML = "Safe... for now.";
                hud.style.color = 'white';
            }

        } else {
            // DANGER PHASE
            scene.background.setHex(0x8B0000);
            scene.fog.color.setHex(0x8B0000);
            hud.innerHTML = "DRAGON IS LOOKING! HIDE!";
            hud.style.color = '#FF0000';

            if (!player.state.onChair) {
                triggerLoseState();
            }
        }
    } else {
        clock.getDelta();
    }

    renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function triggerWinState() {
    controls.unlock();
    renderer.setAnimationLoop(null);
    renderer.domElement.style.display = 'none';
    vrButton.style.display = 'none';
    hud.style.display = 'none';
    winScreen.style.display = 'flex';
}

function triggerLoseState() {
    controls.unlock();
    renderer.setAnimationLoop(null);
    renderer.domElement.style.display = 'none';
    vrButton.style.display = 'none';
    hud.style.display = 'none';
    loseScreen.style.display = 'flex';
}
