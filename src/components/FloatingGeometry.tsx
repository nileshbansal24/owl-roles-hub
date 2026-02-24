import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

const RotatingBox = ({ position, scale, speed }: { position: [number, number, number]; scale: number; speed: number }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * speed * 0.3;
      ref.current.rotation.y += delta * speed * 0.5;
    }
  });
  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={1.5}>
      <mesh ref={ref} position={position} scale={scale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#3b82f6"
          transparent
          opacity={0.15}
          wireframe
        />
      </mesh>
    </Float>
  );
};

const RotatingTorus = ({ position, scale, speed }: { position: [number, number, number]; scale: number; speed: number }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * speed * 0.2;
      ref.current.rotation.z += delta * speed * 0.4;
    }
  });
  return (
    <Float speed={2} rotationIntensity={0.6} floatIntensity={2}>
      <mesh ref={ref} position={position} scale={scale}>
        <torusGeometry args={[1, 0.3, 16, 32]} />
        <meshStandardMaterial
          color="#6366f1"
          transparent
          opacity={0.12}
          wireframe
        />
      </mesh>
    </Float>
  );
};

const RotatingOctahedron = ({ position, scale, speed }: { position: [number, number, number]; scale: number; speed: number }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * speed * 0.3;
      ref.current.rotation.z += delta * speed * 0.2;
    }
  });
  return (
    <Float speed={1.8} rotationIntensity={0.5} floatIntensity={1.8}>
      <mesh ref={ref} position={position} scale={scale}>
        <octahedronGeometry args={[1]} />
        <meshStandardMaterial
          color="#8b5cf6"
          transparent
          opacity={0.1}
          wireframe
        />
      </mesh>
    </Float>
  );
};

const GlassSphere = ({ position, scale }: { position: [number, number, number]; scale: number }) => {
  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={2.5}>
      <mesh position={position} scale={scale}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color="#3b82f6"
          transparent
          opacity={0.08}
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>
    </Float>
  );
};

const Scene = () => {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} />
      <pointLight position={[-3, 2, 4]} intensity={0.3} color="#6366f1" />

      <RotatingBox position={[-4, 2, -3]} scale={1.2} speed={0.5} />
      <RotatingBox position={[4.5, -1, -4]} scale={0.8} speed={0.7} />
      <RotatingTorus position={[3, 2.5, -2]} scale={0.7} speed={0.4} />
      <RotatingTorus position={[-3.5, -2, -3]} scale={0.5} speed={0.6} />
      <RotatingOctahedron position={[-1.5, 3, -5]} scale={0.9} speed={0.3} />
      <RotatingOctahedron position={[2, -2.5, -4]} scale={0.6} speed={0.5} />
      <GlassSphere position={[5, 1, -6]} scale={1.5} />
      <GlassSphere position={[-5, -1, -5]} scale={1} />
      <GlassSphere position={[0, -3, -7]} scale={0.7} />
    </>
  );
};

const FloatingGeometry = () => {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
};

export default FloatingGeometry;
