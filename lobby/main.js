import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

class Player {
    constructor(camera) {
        this.rig = new THREE.Group();
        this.rig.position.set(0, 0, 0);
        this.rig.add(camera);
        this.camera = camera;

        this.standingHeight = 1.6;
        this.camera.position.y = this.standingHeight;
    }
}

const keys = { w: false, a: false, s: false, d: false };

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    if (key === 'w') keys.w = true;
    if (key === 'a') keys.a = true;
    if (key === 's') keys.s = true;
    if (key === 'd') keys.d = true;

    if (key === 'e') {
        let nearestNPC = null;
        let minDistance = 2.5;

        for (let npc of npcsList) {
            let wp = new THREE.Vector3();
            npc.mesh.getWorldPosition(wp);
            let d = player.rig.position.distanceTo(wp);

            if (d < minDistance) {
                minDistance = d;
                nearestNPC = npc;
            }
        }

        if (nearestNPC) {
            controls.unlock();
            window.location.href = nearestNPC.url;
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
scene.background = new THREE.Color(0x20252f);
scene.fog = new THREE.Fog(0x20252f, 0, 15);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
const vrButton = VRButton.createButton(renderer);
document.body.appendChild(vrButton);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

const player = new Player(camera);
scene.add(player.rig);

const controls = new PointerLockControls(camera, document.body);

renderer.domElement.addEventListener('click', () => {
    controls.lock();
});

controls.addEventListener('lock', () => {
    window.focus();
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

const floorGeo = new THREE.PlaneGeometry(20, 20);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const wallMat = new THREE.MeshStandardMaterial({ color: 0x88aa88 });

function createWall(x, z, width, depth) {
    const geo = new THREE.BoxGeometry(width, 3, depth);
    const wall = new THREE.Mesh(geo, wallMat);
    wall.position.set(x, 1.5, z);
    scene.add(wall);
}

createWall(0, -5, 10, 1);
createWall(0, 5, 10, 1);
createWall(-5, 0, 1, 10);
createWall(5, 0, 1, 10);

const npcsList = [];
const npcGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.6, 16);

function createNPC(x, z, color, targetUrl) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: color });
    const npcMesh = new THREE.Mesh(npcGeo, mat);
    npcMesh.position.set(0, 0.8, 0);
    group.add(npcMesh);

    const textPrompt = createTextSprite("[E]: Travel to Dragon");
    textPrompt.position.set(0, 2.2, 0);
    textPrompt.visible = false;
    group.add(textPrompt);

    group.position.set(x, 0, z);
    scene.add(group);

    npcsList.push({
        mesh: group,
        sprite: textPrompt,
        url: targetUrl
    });
}

createNPC(-8, -8, 0xff0000, '/mini-games/dragon/');
createNPC(8, -8, 0x00ff00, '/mini-games/dragon/');
createNPC(-8, 8, 0x0000ff, '/mini-games/dragon/');

const speed = 0.12;

renderer.setAnimationLoop(() => {
    if (controls.isLocked) {
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(camera.quaternion);
        const direction = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, euler.y, 0));
        const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, euler.y, 0));

        if (keys.w) player.rig.position.addScaledVector(direction, speed);
        if (keys.s) player.rig.position.addScaledVector(direction, -speed);
        if (keys.a) player.rig.position.addScaledVector(right, -speed);
        if (keys.d) player.rig.position.addScaledVector(right, speed);

        for (let npc of npcsList) {
            let wp = new THREE.Vector3();
            npc.mesh.getWorldPosition(wp);
            if (player.rig.position.distanceTo(wp) < 2.5) {
                npc.sprite.visible = true;
                npc.mesh.lookAt(player.rig.position.x, 0, player.rig.position.z);
            } else {
                npc.sprite.visible = false;
            }
        }
    }

    renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
