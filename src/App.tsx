import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Hand } from 'lucide-react';

const WOOD_COLOR = '#8B5A2B';
const LIGHT_WOOD = '#D2B48C';
const STONE_COLOR = '#F0F0F0'; // Clearer light grey for upper stone
const DARK_STONE = '#9E9E9E';  // More contrast darker grey for lower stone
const WATER_COLOR = '#4682B4';

const FlowingWater = () => {
  const ripplesRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (ripplesRef.current) {
      ripplesRef.current.children.forEach((child) => {
        // Match the water speed with the wheel's edge speed, with slight random variation
        const speed = 2.5 * (child.userData.speedMultiplier || 1);
        child.position.y -= delta * speed; 
        if (child.position.y < -15) {
          child.position.y += 30;
          child.position.x = (Math.random() - 0.5) * 4.5;
        }
      });
    }
  });

  return (
    <group position={[-3, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <planeGeometry args={[5, 30]} />
        <meshStandardMaterial color={WATER_COLOR} transparent opacity={0.7} />
      </mesh>
      <group ref={ripplesRef}>
        {[...Array(40)].map((_, i) => (
          <mesh 
            key={i} 
            position={[
              (Math.random() - 0.5) * 4.5, 
              (Math.random() - 0.5) * 30, 
              0.02 
            ]}
            userData={{ speedMultiplier: Math.random() * 0.5 + 0.8 }}
          >
            <planeGeometry args={[Math.random() * 0.15 + 0.05, Math.random() * 2 + 0.5]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

  const Machine = () => {
    const mainShaftRef = useRef<THREE.Group>(null);
    const upperMillRef = useRef<THREE.Group>(null);
    const hammerLeverRef = useRef<THREE.Group>(null);
  
    useFrame((state, delta) => {
      const speed = 1.0; // Rotation speed
      if (mainShaftRef.current) {
        mainShaftRef.current.rotation.x += speed * delta;
      }
      if (upperMillRef.current && mainShaftRef.current) {
        // Gear ratio 1:1. Offset by half a tooth (PI/24) for perfect meshing
        upperMillRef.current.rotation.y = -mainShaftRef.current.rotation.x + (Math.PI / 24);
      }
      if (hammerLeverRef.current && mainShaftRef.current) {
        // Cam mechanism simulation (拨板顶起碓杆)
        let angle = mainShaftRef.current.rotation.x % (Math.PI * 2);
        if (angle < 0) angle += Math.PI * 2;
        
        // Peg hits the lever tail, pressing it down (lifting the hammer head)
        // Sudden drop when the peg passes
        if (angle > 0 && angle < Math.PI / 2.5) {
          // Lift phase: smooth sine-based lift for natural cam push
          const progress = angle / (Math.PI / 2.5);
          const lift = Math.sin(progress * Math.PI / 2) * -0.35;
          hammerLeverRef.current.rotation.x = lift;
        } else {
          // Drop phase: gravity pulls it down instantly, slight lerp for impact feel
          hammerLeverRef.current.rotation.x = THREE.MathUtils.lerp(hammerLeverRef.current.rotation.x, 0, 0.6);
        }
      }
    });
  
    return (
      <group position={[0, -2, 0]}>
        {/* Main Shaft & Water Wheel */}
        <group ref={mainShaftRef} position={[0, 2, 0]}>
          {/* Main Shaft */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 18, 16]} />
            <meshStandardMaterial color={WOOD_COLOR} />
          </mesh>
  
          {/* Water Wheel (大叶片) */}
          <group position={[-3, 0, 0]}>
            {/* Central Hub */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.5, 0.5, 1.6, 16]} />
              <meshStandardMaterial color={WOOD_COLOR} />
            </mesh>
            {/* Large Blades */}
            {[...Array(8)].map((_, i) => (
              <group key={i} rotation={[i * Math.PI / 4, 0, 0]}>
                {/* Spoke */}
                <mesh position={[0, 1.5, 0]}>
                  <boxGeometry args={[0.15, 3, 0.15]} />
                  <meshStandardMaterial color={WOOD_COLOR} />
                </mesh>
                {/* Large Blade */}
                <mesh position={[0, 2.4, 0]} rotation={[0.15, 0, 0]}>
                  <boxGeometry args={[1.8, 1.2, 0.1]} />
                  <meshStandardMaterial color={LIGHT_WOOD} />
                </mesh>
              </group>
            ))}
          </group>
  
          {/* Trip Hammer Cam (Peg / 拨板) */}
          {/* Rotated so it visually syncs with the lift phase (angle 0 to PI/2.5) */}
          <group position={[-7, 0, 0]} rotation={[Math.PI + 0.2, 0, 0]}>
            <mesh position={[0, 0.6, 0]}>
              <boxGeometry args={[0.2, 1.2, 0.3]} />
              <meshStandardMaterial color={WOOD_COLOR} />
            </mesh>
          </group>
  
          {/* Vertical Gear (Driving) */}
          <group position={[5, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[1.3, 1.3, 0.4, 32]} />
              <meshStandardMaterial color={WOOD_COLOR} />
            </mesh>
            {/* Radial Teeth */}
            {[...Array(24)].map((_, i) => (
              <group key={i} rotation={[i * Math.PI / 12, 0, 0]}>
                <mesh position={[0, 1.4, 0]}>
                  <boxGeometry args={[0.4, 0.4, 0.18]} />
                  <meshStandardMaterial color={LIGHT_WOOD} />
                </mesh>
              </group>
            ))}
          </group>
        </group>
  
        {/* Trip Hammer Assembly */}
        <group position={[-7, 0, 0]}>
          {/* Pivot Support */}
          <mesh position={[0, 0.8, 2.5]}>
            <boxGeometry args={[0.6, 1.6, 0.6]} />
            <meshStandardMaterial color={WOOD_COLOR} />
          </mesh>
          
          {/* Lever */}
          <group ref={hammerLeverRef} position={[0, 1.6, 2.5]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.3, 0.3, 5]} />
              <meshStandardMaterial color={LIGHT_WOOD} />
            </mesh>
            {/* Hammer Head (碓头 - 重石) */}
            <group position={[0, -0.8, 2]}>
              {/* Wooden connector */}
              <mesh position={[0, 0.4, 0]}>
                <boxGeometry args={[0.2, 0.8, 0.2]} />
                <meshStandardMaterial color={WOOD_COLOR} />
              </mesh>
              {/* Heavy Stone */}
              <mesh position={[0, -0.1, 0]}>
                <cylinderGeometry args={[0.3, 0.2, 0.8, 16]} />
                <meshStandardMaterial color={DARK_STONE} roughness={0.9} />
              </mesh>
            </group>
          </group>
  
          {/* Mortar (石臼) */}
          <group position={[0, 0, 4.5]}>
            <mesh position={[0, 0.5, 0]}>
              <cylinderGeometry args={[1, 1.2, 1, 32]} />
              <meshStandardMaterial color={STONE_COLOR} />
            </mesh>
            {/* Inside hole */}
            <mesh position={[0, 1.01, 0]}>
              <cylinderGeometry args={[0.7, 0.7, 0.1, 32]} />
              <meshStandardMaterial color={'#333'} />
            </mesh>
            {/* Grain inside mortar */}
            <mesh position={[0, 0.95, 0]}>
              <cylinderGeometry args={[0.68, 0.68, 0.15, 32]} />
              <meshStandardMaterial color="#E8C382" roughness={1} />
            </mesh>
          </group>
  
          {/* Bamboo Basket (竹篮) */}
          <group position={[-1.8, 0.4, 4.5]} rotation={[0.2, 0, -0.1]}>
            <mesh>
              <cylinderGeometry args={[0.6, 0.4, 0.8, 16]} />
              <meshStandardMaterial color="#D2B48C" />
            </mesh>
            {/* Woven details (Horizontal rings) */}
            {[...Array(6)].map((_, i) => (
              <mesh key={i} position={[0, -0.35 + i * 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.42 + i * 0.035, 0.03, 8, 24]} />
                <meshStandardMaterial color="#B8860B" />
              </mesh>
            ))}
            {/* Basket inner shadow */}
            <mesh position={[0, 0.2, 0]}>
               <cylinderGeometry args={[0.55, 0.35, 0.81, 16]} />
               <meshStandardMaterial color="#8B5A2B" />
            </mesh>
            {/* Grain inside basket */}
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.55, 0.55, 0.2, 16]} />
              <meshStandardMaterial color="#E8C382" roughness={1} />
            </mesh>
          </group>
  
          {/* Scattered Grain Piles (散落的谷堆) */}
          <group position={[1.2, 0.05, 4.2]}>
            <mesh position={[0, 0.1, 0]}><coneGeometry args={[0.6, 0.2, 16]} /><meshStandardMaterial color="#E8C382" roughness={1} /></mesh>
            <mesh position={[0.2, 0.05, 0.2]}><sphereGeometry args={[0.2, 8, 8]} /><meshStandardMaterial color="#E8C382" roughness={1} /></mesh>
            <mesh position={[-0.2, 0.05, -0.1]}><sphereGeometry args={[0.15, 8, 8]} /><meshStandardMaterial color="#E8C382" roughness={1} /></mesh>
          </group>
          <group position={[0.8, 0.05, 5.0]} scale={0.7}>
            <mesh position={[0, 0.1, 0]}><coneGeometry args={[0.6, 0.2, 16]} /><meshStandardMaterial color="#E8C382" roughness={1} /></mesh>
            <mesh position={[0.1, 0.05, -0.2]}><sphereGeometry args={[0.15, 8, 8]} /><meshStandardMaterial color="#E8C382" roughness={1} /></mesh>
          </group>
          <group position={[-1.0, 0.05, 5.2]} scale={0.8}>
            <mesh position={[0, 0.1, 0]}><coneGeometry args={[0.6, 0.2, 16]} /><meshStandardMaterial color="#E8C382" roughness={1} /></mesh>
            <mesh position={[-0.1, 0.05, 0.2]}><sphereGeometry args={[0.18, 8, 8]} /><meshStandardMaterial color="#E8C382" roughness={1} /></mesh>
          </group>
        </group>
  
        {/* Stone Mill Assembly */}
        <group position={[3.6, 0, 0]}>
          {/* Vertical Shaft and Upper Stone */}
          <group ref={upperMillRef}>
            <mesh position={[0, 5, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 8, 16]} />
              <meshStandardMaterial color={WOOD_COLOR} />
            </mesh>
            
            {/* Horizontal Gear (Driven) */}
            <group position={[0, 3.6, 0]}>
              <mesh>
                <cylinderGeometry args={[1.3, 1.3, 0.2, 32]} />
                <meshStandardMaterial color={WOOD_COLOR} />
              </mesh>
              {/* Downward Teeth */}
              {[...Array(24)].map((_, i) => (
                <group key={i} rotation={[0, i * Math.PI / 12, 0]}>
                  <mesh position={[1.4, -0.2, 0]}>
                    <boxGeometry args={[0.4, 0.4, 0.18]} />
                    <meshStandardMaterial color={LIGHT_WOOD} />
                  </mesh>
                </group>
              ))}
            </group>
  
            {/* Upper Stone */}
            <mesh position={[0, 6.5, 0]}>
              <cylinderGeometry args={[2, 2, 0.6, 32]} />
              <meshStandardMaterial color={STONE_COLOR} roughness={0.8} />
              {/* Grooves for clarity */}
              {[...Array(12)].map((_, i) => (
                <mesh key={i} rotation={[0, i * Math.PI / 6, 0]} position={[0, 0.31, 0]}>
                  <boxGeometry args={[4, 0.02, 0.05]} />
                  <meshStandardMaterial color={DARK_STONE} />
                </mesh>
              ))}
            </mesh>
            
            {/* Fake Hole in Upper Stone for grain to fall into */}
            <mesh position={[0, 6.81, 0]}>
              <cylinderGeometry args={[0.5, 0.5, 0.02, 16]} />
              <meshStandardMaterial color="#222" />
            </mesh>
  
            {/* Sweeper Board (拨料板) */}
            <mesh position={[0, 6.85, 0]} rotation={[0, Math.PI / 4, 0]}>
              <boxGeometry args={[1.4, 0.15, 0.05]} />
              <meshStandardMaterial color={WOOD_COLOR} />
            </mesh>
          </group>
  
          {/* Lower Stone (Fixed) */}
          <mesh position={[0, 5.8, 0]}>
            <cylinderGeometry args={[2.2, 2.2, 0.8, 32]} />
            <meshStandardMaterial color={DARK_STONE} roughness={0.9} />
          </mesh>
          
          {/* Mill Platform */}
          <mesh position={[0, 5.3, 0]}>
            <cylinderGeometry args={[3, 3, 0.2, 32]} />
            <meshStandardMaterial color={WOOD_COLOR} />
          </mesh>
  
          {/* Flour/Grain on the platform (磨出的面粉/谷物) */}
          <mesh position={[0, 5.41, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.2, 2.8, 32]} />
            <meshStandardMaterial color="#E8C382" side={THREE.DoubleSide} />
          </mesh>
          
          {/* Hopper */}
          <group position={[0, 8.2, 0]}>
            <mesh rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[1.2, 1.6, 4]} />
              <meshStandardMaterial color={LIGHT_WOOD} />
            </mesh>
            {/* Grain falling from hopper */}
            <mesh position={[0, -1.0, 0]}>
              <cylinderGeometry args={[0.08, 0.15, 1.2, 8]} />
              <meshStandardMaterial color="#E8C382" transparent opacity={0.8} />
            </mesh>
          </group>
        </group>

      {/* Structural Frames */}
      <group>
        {/* Main shaft supports */}
        <mesh position={[-8.5, 1, 0]}>
          <boxGeometry args={[0.5, 2, 0.5]} />
          <meshStandardMaterial color={WOOD_COLOR} />
        </mesh>
        <mesh position={[1, 1, 0]}>
          <boxGeometry args={[0.5, 2, 0.5]} />
          <meshStandardMaterial color={WOOD_COLOR} />
        </mesh>
        <mesh position={[7, 1, 0]}>
          <boxGeometry args={[0.5, 2, 0.5]} />
          <meshStandardMaterial color={WOOD_COLOR} />
        </mesh>
        
        {/* Second floor platform */}
        <mesh position={[3.6, 5.1, 0]}>
          <boxGeometry args={[8, 0.2, 6]} />
          <meshStandardMaterial color={WOOD_COLOR} />
        </mesh>
        
        {/* Pillars for second floor */}
        <mesh position={[0, 2.55, 2.5]}>
          <boxGeometry args={[0.4, 5.1, 0.4]} />
          <meshStandardMaterial color={WOOD_COLOR} />
        </mesh>
        <mesh position={[7, 2.55, 2.5]}>
          <boxGeometry args={[0.4, 5.1, 0.4]} />
          <meshStandardMaterial color={WOOD_COLOR} />
        </mesh>
        <mesh position={[0, 2.55, -2.5]}>
          <boxGeometry args={[0.4, 5.1, 0.4]} />
          <meshStandardMaterial color={WOOD_COLOR} />
        </mesh>
        <mesh position={[7, 2.55, -2.5]}>
          <boxGeometry args={[0.4, 5.1, 0.4]} />
          <meshStandardMaterial color={WOOD_COLOR} />
        </mesh>
      </group>

      {/* Environment */}
      {/* Ground */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 30]} />
        <meshStandardMaterial color="#E8E0D0" />
      </mesh>
      {/* Water Channel */}
      <FlowingWater />
    </group>
  );
};

export default function App() {
  return (
    <div className="w-full h-screen bg-slate-50 relative overflow-hidden font-sans">
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 z-10 pointer-events-none flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight drop-shadow-sm mb-2">
          水碓磨坊 3D模型
        </h1>
        <p className="text-slate-600 font-medium text-sm md:text-base flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm">
          <Hand className="w-4 h-4" />
          支持触屏：单指拖动旋转，双指捏合缩放
        </p>
      </div>

      {/* 3D Canvas */}
      <Canvas camera={{ position: [12, 10, 15], fov: 45 }}>
        <color attach="background" args={['#F8FAFC']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
        <directionalLight position={[-10, 10, -10]} intensity={0.4} />
        
        <Machine />
        
        <OrbitControls 
          makeDefault 
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 2 - 0.05}
          enableDamping
          dampingFactor={0.05}
        />
        <ContactShadows position={[0, -2.49, 0]} opacity={0.4} scale={30} blur={2} far={10} />
      </Canvas>
    </div>
  );
}
