import fs from 'fs';
import { parse } from 'path';

// read the glb file manually to see if it has morphTargets. Since glb is binary, we will just read the JSON chunk.
function extractGLTFJson(filePath) {
  const buffer = fs.readFileSync(filePath);
  const magic = buffer.toString('utf8', 0, 4);
  if (magic !== 'glTF') throw new Error('Not a glTF file');
  
  const version = buffer.readUInt32LE(4);
  const length = buffer.readUInt32LE(8);
  
  const chunkLength = buffer.readUInt32LE(12);
  const chunkType = buffer.toString('utf8', 16, 20);
  
  if (chunkType !== 'JSON') throw new Error('First chunk is not JSON');
  
  const jsonString = buffer.toString('utf8', 20, 20 + chunkLength);
  return JSON.parse(jsonString);
}

try {
  const modelJson = extractGLTFJson('./public/model.glb');
  
  // Look for morph targets
  const meshesWithMorphs = modelJson.meshes.filter(m => m.primitives.some(p => p.targets));
  
  console.log(`Found ${meshesWithMorphs.length} meshes with morph targets in model.glb`);
  meshesWithMorphs.forEach((m, idx) => {
    console.log(`Mesh ${m.name || idx}:`);
    console.log(m.extras || "No extras mapping for morph targets in mesh");
    if (m.primitives[0].targets) {
       console.log(` Has ${m.primitives[0].targets.length} targets`);
    }
  });

  // Also check for jaw bone
  const jawBones = modelJson.nodes.filter(n => n.name && n.name.toLowerCase().includes('jaw'));
  console.log(`Found ${jawBones.length} nodes with "jaw" in the name in model.glb:`);
  jawBones.forEach(n => console.log(` - ${n.name}`));
  
  const headBones = modelJson.nodes.filter(n => n.name && n.name.toLowerCase().includes('head'));
  console.log(`Found ${headBones.length} nodes with "head" in the name in model.glb:`);
  headBones.forEach(n => console.log(` - ${n.name}`));

} catch(e) {
  console.error(e);
}
