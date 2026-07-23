import fs from 'fs';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Polyfill FileReader for Node environment
global.FileReader = class FileReader {
  readAsDataURL(blob) {
    blob.arrayBuffer().then((ab) => {
      const base64 = Buffer.from(ab).toString('base64');
      const mime = blob.type || 'application/octet-stream';
      this.result = `data:${mime};base64,${base64}`;
      if (typeof this.onloadend === 'function') {
        this.onloadend({ target: this });
      }
      if (typeof this.onload === 'function') {
        this.onload({ target: this });
      }
    });
  }
};

function packGLB(gltfJson) {
  let binBuffer = Buffer.alloc(0);
  if (gltfJson.buffers && gltfJson.buffers.length > 0) {
    const buffers = [];
    gltfJson.buffers.forEach((b) => {
      if (b.uri && b.uri.startsWith('data:')) {
        const base64Data = b.uri.split(',')[1];
        const buf = Buffer.from(base64Data, 'base64');
        buffers.push(buf);
      }
    });
    if (buffers.length > 0) {
      binBuffer = Buffer.concat(buffers);
      const pad = (4 - (binBuffer.length % 4)) % 4;
      if (pad > 0) {
        binBuffer = Buffer.concat([binBuffer, Buffer.alloc(pad, 0)]);
      }
      gltfJson.buffers = [{ byteLength: binBuffer.length }];
    }
  }

  let jsonStr = JSON.stringify(gltfJson);
  let jsonBuffer = Buffer.from(jsonStr, 'utf8');
  const jsonPad = (4 - (jsonBuffer.length % 4)) % 4;
  if (jsonPad > 0) {
    jsonBuffer = Buffer.concat([jsonBuffer, Buffer.from(' '.repeat(jsonPad), 'utf8')]);
  }

  const hasBin = binBuffer.length > 0;
  const totalLength = 12 + 8 + jsonBuffer.length + (hasBin ? 8 + binBuffer.length : 0);

  const header = Buffer.alloc(12);
  header.write('glTF', 0, 4, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonBuffer.length, 0);
  jsonHeader.write('JSON', 4, 4, 'ascii');

  const chunks = [header, jsonHeader, jsonBuffer];

  if (hasBin) {
    const binHeader = Buffer.alloc(8);
    binHeader.writeUInt32LE(binBuffer.length, 0);
    binHeader.write('BIN\0', 4, 4, 'ascii');
    chunks.push(binHeader, binBuffer);
  }

  return Buffer.concat(chunks);
}

function buildMannequinScene() {
  // Skeleton Bones with exact hierarchy and rest positions
  const hips = new THREE.Bone(); hips.name = 'Hips'; hips.position.set(0, 0.95, 0);
  const spine = new THREE.Bone(); spine.name = 'Spine'; spine.position.set(0, 0.15, 0);
  const spine1 = new THREE.Bone(); spine1.name = 'Spine1'; spine1.position.set(0, 0.15, 0);
  const spine2 = new THREE.Bone(); spine2.name = 'Spine2'; spine2.position.set(0, 0.15, 0);
  const neck = new THREE.Bone(); neck.name = 'Neck'; neck.position.set(0, 0.12, 0);
  const head = new THREE.Bone(); head.name = 'Head'; head.position.set(0, 0.10, 0);

  const lShoulder = new THREE.Bone(); lShoulder.name = 'LeftShoulder'; lShoulder.position.set(0.08, 0.08, 0);
  const lArm = new THREE.Bone(); lArm.name = 'LeftArm'; lArm.position.set(0.10, 0, 0);
  const lForeArm = new THREE.Bone(); lForeArm.name = 'LeftForeArm'; lForeArm.position.set(0.22, 0, 0);
  const lHand = new THREE.Bone(); lHand.name = 'LeftHand'; lHand.position.set(0.20, 0, 0);

  const rShoulder = new THREE.Bone(); rShoulder.name = 'RightShoulder'; rShoulder.position.set(-0.08, 0.08, 0);
  const rArm = new THREE.Bone(); rArm.name = 'RightArm'; rArm.position.set(-0.10, 0, 0);
  const rForeArm = new THREE.Bone(); rForeArm.name = 'RightForeArm'; rForeArm.position.set(-0.22, 0, 0);
  const rHand = new THREE.Bone(); rHand.name = 'RightHand'; rHand.position.set(-0.20, 0, 0);

  const lUpLeg = new THREE.Bone(); lUpLeg.name = 'LeftUpLeg'; lUpLeg.position.set(0.11, -0.05, 0);
  const lLeg = new THREE.Bone(); lLeg.name = 'LeftLeg'; lLeg.position.set(0, -0.42, 0);
  const lFoot = new THREE.Bone(); lFoot.name = 'LeftFoot'; lFoot.position.set(0, -0.42, 0.05);

  const rUpLeg = new THREE.Bone(); rUpLeg.name = 'RightUpLeg'; rUpLeg.position.set(-0.11, -0.05, 0);
  const rLeg = new THREE.Bone(); rLeg.name = 'RightLeg'; rLeg.position.set(0, -0.42, 0);
  const rFoot = new THREE.Bone(); rFoot.name = 'RightFoot'; rFoot.position.set(0, -0.42, 0.05);

  hips.add(spine);
  spine.add(spine1);
  spine1.add(spine2);
  spine2.add(neck);
  neck.add(head);

  spine2.add(lShoulder);
  lShoulder.add(lArm);
  lArm.add(lForeArm);
  lForeArm.add(lHand);

  spine2.add(rShoulder);
  rShoulder.add(rArm);
  rArm.add(rForeArm);
  rForeArm.add(rHand);

  hips.add(lUpLeg);
  lUpLeg.add(lLeg);
  lLeg.add(lFoot);

  hips.add(rUpLeg);
  rUpLeg.add(rLeg);
  rLeg.add(rFoot);

  // Materials for sleek 3D studio visual aesthetic
  const matBody = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.1 });
  const matJoint = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.2 });
  const matHead = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.15 });
  const matAccent = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.25, metalness: 0.25 });

  function addMesh(parentBone, geometry, material, offset = [0, 0, 0], rot = [0, 0, 0]) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...offset);
    mesh.rotation.set(...rot);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parentBone.add(mesh);
    return mesh;
  }

  // Head & Neck
  addMesh(head, new THREE.SphereGeometry(0.11, 24, 24), matHead, [0, 0.08, 0]);
  addMesh(neck, new THREE.CylinderGeometry(0.045, 0.05, 0.08, 16), matBody, [0, 0.04, 0]);

  // Torso
  addMesh(spine2, new THREE.BoxGeometry(0.30, 0.20, 0.18), matBody, [0, 0.08, 0]);
  addMesh(spine1, new THREE.BoxGeometry(0.26, 0.14, 0.16), matBody, [0, 0.07, 0]);
  addMesh(spine, new THREE.BoxGeometry(0.24, 0.14, 0.15), matBody, [0, 0.07, 0]);
  addMesh(hips, new THREE.BoxGeometry(0.27, 0.14, 0.17), matAccent, [0, 0, 0]);

  // Shoulders & Arms
  addMesh(lShoulder, new THREE.SphereGeometry(0.05, 16, 16), matJoint, [0, 0, 0]);
  addMesh(rShoulder, new THREE.SphereGeometry(0.05, 16, 16), matJoint, [0, 0, 0]);

  addMesh(lArm, new THREE.CylinderGeometry(0.042, 0.038, 0.20, 16), matBody, [0.10, 0, 0], [0, 0, -Math.PI / 2]);
  addMesh(rArm, new THREE.CylinderGeometry(0.042, 0.038, 0.20, 16), matBody, [-0.10, 0, 0], [0, 0, Math.PI / 2]);

  addMesh(lForeArm, new THREE.CylinderGeometry(0.038, 0.032, 0.18, 16), matBody, [0.09, 0, 0], [0, 0, -Math.PI / 2]);
  addMesh(rForeArm, new THREE.CylinderGeometry(0.038, 0.032, 0.18, 16), matBody, [-0.09, 0, 0], [0, 0, Math.PI / 2]);

  addMesh(lHand, new THREE.BoxGeometry(0.07, 0.03, 0.08), matJoint, [0.03, 0, 0]);
  addMesh(rHand, new THREE.BoxGeometry(0.07, 0.03, 0.08), matJoint, [-0.03, 0, 0]);

  // Legs
  addMesh(lUpLeg, new THREE.CylinderGeometry(0.058, 0.048, 0.38, 16), matBody, [0, -0.20, 0]);
  addMesh(rUpLeg, new THREE.CylinderGeometry(0.058, 0.048, 0.38, 16), matBody, [0, -0.20, 0]);

  addMesh(lLeg, new THREE.CylinderGeometry(0.048, 0.038, 0.38, 16), matBody, [0, -0.20, 0]);
  addMesh(rLeg, new THREE.CylinderGeometry(0.048, 0.038, 0.38, 16), matBody, [0, -0.20, 0]);

  addMesh(lFoot, new THREE.BoxGeometry(0.09, 0.06, 0.18), matAccent, [0, -0.02, 0.05]);
  addMesh(rFoot, new THREE.BoxGeometry(0.09, 0.06, 0.18), matAccent, [0, -0.02, 0.05]);

  const sceneGroup = new THREE.Scene();
  sceneGroup.name = 'Scene';
  sceneGroup.add(hips);

  return sceneGroup;
}

async function run() {
  const sceneGroup = buildMannequinScene();
  const exporter = new GLTFExporter();

  const gltfJson = await new Promise((resolve, reject) => {
    exporter.parse(
      sceneGroup,
      (result) => resolve(result),
      (error) => reject(error),
      { binary: false, embedImages: false }
    );
  });

  const glbBuffer = packGLB(gltfJson);
  fs.writeFileSync('public/model.glb', glbBuffer);
  console.log('SUCCESS! Generated public/model.glb! Size:', glbBuffer.length, 'bytes');

  // Verify loading with GLTFLoader
  const loader = new GLTFLoader();
  const ab = new ArrayBuffer(glbBuffer.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < glbBuffer.length; i++) view[i] = glbBuffer[i];

  await new Promise((resolve, reject) => {
    loader.parse(
      ab,
      '',
      (gltf) => {
        console.log('GLTFLoader Verification PASSED! Scene children count:', gltf.scene.children.length);
        resolve();
      },
      (err) => reject(err)
    );
  });
}

run().catch((err) => {
  console.error('Model generation failed:', err);
  process.exit(1);
});
