"use client";

import { Suspense, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Bounds, Center, Environment, ContactShadows, Html, useGLTF, useFBX } from "@react-three/drei";
import { EffectComposer, Bloom, SSAO } from "@react-three/postprocessing";
import { OBJLoader } from "three-stdlib";
import * as THREE from "three";

function normalizeScene(root: THREE.Object3D) {
  root.traverse((node) => {
    if ((node as THREE.Mesh).isMesh) {
      const mesh = node as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (!mesh.material) {
        mesh.material = new THREE.MeshStandardMaterial({ color: "#B4B4B8", metalness: 0.2, roughness: 0.65 });
      }
    }
  });
}

function PreviewLoader() {
  return (
    <Html center>
      <div className="text-[11px] text-[#71717A] px-2 py-1 rounded bg-[#121212] border border-[#27272A]">
        Loading model...
      </div>
    </Html>
  );
}

function Loaded3DModel({ src, format }: { src: string; format: string }) {
  const normalized = format.toLowerCase();
  if (normalized === "fbx") {
    const fbx = useFBX(src);
    const cloned = useMemo(() => fbx.clone(true), [fbx]);
    normalizeScene(cloned);
    return <primitive object={cloned} />;
  }
  if (normalized === "obj") {
    const obj = useLoader(OBJLoader, src);
    const cloned = useMemo(() => obj.clone(true), [obj]);
    normalizeScene(cloned);
    return <primitive object={cloned} />;
  }
  const gltf = useGLTF(src);
  const cloned = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  normalizeScene(cloned);
  return <primitive object={cloned} />;
}

export default function ModelPreviewCanvas({ src, format }: { src: string; format: string }) {
  return (
    <Canvas camera={{ position: [2.8, 1.8, 2.8], fov: 50 }}>
      <color attach="background" args={["#0A0A0A"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 6, 3]} intensity={1.2} />
      <Suspense fallback={<PreviewLoader />}>
        <Bounds fit clip observe margin={1.2}>
          <Center>
            <Loaded3DModel src={src} format={format} />
          </Center>
        </Bounds>
        <Environment preset="city" />
        <ContactShadows position={[0, -1.1, 0]} opacity={0.45} scale={10} blur={2} far={5} />
      </Suspense>
      <EffectComposer multisampling={4}>
        <SSAO samples={12} radius={0.22} intensity={16} luminanceInfluence={0.45} />
        <Bloom intensity={0.18} luminanceThreshold={0.45} mipmapBlur />
      </EffectComposer>
      <OrbitControls makeDefault autoRotate autoRotateSpeed={0.6} enableDamping dampingFactor={0.08} />
    </Canvas>
  );
}
