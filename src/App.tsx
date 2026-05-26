import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Hand, Eye, Settings, Play, Pause, Compass, Waves, Layers } from 'lucide-react';
import { LandscapeBackground } from './components/LandscapeBackground';

const WOOD_COLOR = '#8B5A2B';
const LIGHT_WOOD = '#D2B48C';
const STONE_COLOR = '#E5E5E5'; // More stone-like light grey
const DARK_STONE = '#8A8A8A';  // Contrasy dark grey for lower lock
const WATER_COLOR = '#1D4ED8';  // Deeper transparent blue

// Part descriptions map for tooltips
interface PartInfo {
  title: string;
  en: string;
  desc: string;
  specs: string;
}

const PART_INFO_MAP: Record<string, PartInfo> = {
  water_wheel: {
    title: '动力水轮 (Water Wheel)',
    en: 'WATER WHEEL',
    desc: '古代大型动力构件。本模型为卧轴式水轮，利用引溪渠流水的冲击力与叶片抓水重力倾斜，产生巨大连续扭矩，为作坊运转提供清洁不绝的天然机械能。',
    specs: '八组拼插式叶片 / 樟木榫卯结构'
  },
  drive_shaft: {
    title: '传动主轴 (Main Drive Shaft)',
    en: 'TRANSMISSION SHAFT',
    desc: '作坊的核心动力骨脊。采用整棵坚大圆木刨光制成（俗称天平轴），表面装有拨板。旋转时一方面咬合齿轮拖动石磨，另一方面交替顶起碓杆压臂。',
    specs: '全长 18米 / 整木自重 1.5吨'
  },
  gears: {
    title: '立卧联动锥齿轮 (Linkage Gears)',
    en: 'GEAR COUPLING SYSTEM',
    desc: '横立十字传动副。由传动轴大立齿轮（24齿）与磨盘卧轮（24齿）直角咬合。巧妙地将水平方向的旋转转换为垂直立轴自转，实现动力方向的90度角换向。',
    specs: '传动比 1:1 / 穿凿防摩销榫'
  },
  upper_stone: {
    title: '上磨盘 (Upper Millstone)',
    en: 'ROTATING MILLSTONE',
    desc: '石磨的旋转切碾部分。精选耐磨青石对切精雕而成，底面刻有斜向放射状磨槽（磨齿）。与静止的下盘交叉挤压，将落入的谷物反复研磨成细面。',
    specs: '直径 2.0米 / 细刻斜逆向磨齿 48组'
  },
  hopper: {
    title: '粮食盛漏斗 (Grain Hopper)',
    en: 'FEEDING HOPPER',
    desc: '倒漏斗状悬挂器。装有原粮，底口对准磨盘孔。利用碓槌击落石臼或齿轮咬合产生的低震动，带动滑嘴微颤，使粮食缓缓、极均匀地自动泻入磨腹。',
    specs: '自重重力补给 / 振动下滑结构'
  }
};

// Procedural organic paper/watercolor wash texture generator representing painting scroll paper
const createSoilTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Elegant warm light ivory/cream watercolor paper base
    ctx.fillStyle = '#F4EFEB'; 
    ctx.fillRect(0, 0, 512, 512);

    // Draw mud / watercolor pigment grain variations
    for (let i = 0; i < 9000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 1.5 + 0.4;
      const opacity = Math.random() * 0.12;
      
      if (Math.random() > 0.5) {
        ctx.fillStyle = `rgba(180, 160, 140, ${opacity})`; // soft warm wash pigment dots
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.9})`; // highlights
      }
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw soft watercolor ink blots for an authentic hand-painted illustration backdrop
    for (let w = 0; w < 12; w++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const rad = Math.random() * 120 + 40;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, rad);
      grad.addColorStop(0, 'rgba(210, 195, 175, 0.15)');
      grad.addColorStop(0.5, 'rgba(210, 195, 175, 0.05)');
      grad.addColorStop(1, 'rgba(210, 195, 175, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw some dry artistic sketch brush fine lines for ink sketch feel
    ctx.strokeStyle = 'rgba(140, 120, 100, 0.05)';
    ctx.lineWidth = 1.2;
    for (let c = 0; c < 15; c++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 512, Math.random() * 512);
      for (let p = 0; p < 3; p++) {
        ctx.lineTo(Math.random() * 512, Math.random() * 512);
      }
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 8);
  return texture;
};

// Procedural Chinese landscape painting scroll texture generator
const createChineseLandscapeTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // 1. Aged silk/paper background
    ctx.fillStyle = '#EADECA'; // Warm traditional aged silk paper color
    ctx.fillRect(0, 0, 1024, 512);

    // Subtle paper particle noise
    for (let i = 0; i < 30000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const size = Math.random() * 1.5;
      ctx.fillStyle = Math.random() > 0.6 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(90, 70, 45, 0.06)';
      ctx.fillRect(x, y, size, size);
    }

    // 2. Distant mountains (very soft, hazy charcoal wash)
    ctx.fillStyle = 'rgba(110, 115, 110, 0.28)';
    ctx.beginPath();
    ctx.moveTo(0, 512);
    ctx.lineTo(0, 190);
    let x = 0;
    while (x < 1024) {
      x += 60 + Math.random() * 90;
      const y = 210 + Math.sin(x * 0.009) * 45 + Math.cos(x * 0.016) * 15 + Math.random() * 10;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(1024, 512);
    ctx.fill();

    // 3. Middle range mountain ridges (soft grey ink layers)
    ctx.fillStyle = 'rgba(75, 80, 75, 0.45)';
    ctx.beginPath();
    ctx.moveTo(0, 512);
    ctx.lineTo(0, 270);
    x = 0;
    while (x < 1024) {
      x += 45 + Math.random() * 70;
      const y = 290 + Math.sin(x * 0.014) * 60 + Math.cos(x * 0.025) * 20 + Math.random() * 8;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(1024, 512);
    ctx.fill();

    // 4. Foreground peaks and hills (dark heavy ink)
    ctx.fillStyle = 'rgba(38, 42, 38, 0.78)';
    ctx.beginPath();
    ctx.moveTo(0, 512);
    ctx.lineTo(0, 370);
    x = 0;
    while (x < 1024) {
      x += 35 + Math.random() * 50;
      const y = 380 + Math.sin(x * 0.022) * 40 + Math.cos(x * 0.035) * 12 + Math.random() * 4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(1024, 512);
    ctx.fill();

    // Draw minimalist pine trees brush details on ridges
    ctx.strokeStyle = 'rgba(20, 22, 20, 0.82)';
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 20; i++) {
      const rx = 120 + Math.random() * 780;
      const ry = 360 + Math.random() * 80;
      // Draw a pine tree trunk
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx, ry - 25);
      ctx.stroke();
      // Foliage lines
      ctx.beginPath();
      ctx.moveTo(rx - 12, ry - 25);
      ctx.lineTo(rx + 12, ry - 25);
      ctx.moveTo(rx - 9, ry - 32);
      ctx.lineTo(rx + 9, ry - 32);
      ctx.stroke();
    }

    // 5. Traditional red sun (soft misty glowing sun at upper right)
    const sunX = 740;
    const sunY = 135;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, 38);
    sunGrad.addColorStop(0, 'rgba(182, 48, 32, 0.82)');
    sunGrad.addColorStop(0.4, 'rgba(215, 78, 55, 0.45)');
    sunGrad.addColorStop(1, 'rgba(234, 222, 202, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 38, 0, Math.PI * 2);
    ctx.fill();

    // 6. Flying bird flocks in traditional calligraphic silhouette
    ctx.strokeStyle = 'rgba(28, 28, 28, 0.65)';
    ctx.lineWidth = 1.3;
    const birds = [
      { bx: 340, by: 120 }, { bx: 370, by: 105 }, { bx: 350, by: 135 },
      { bx: 260, by: 160 }, { bx: 285, by: 152 }
    ];
    birds.forEach(b => {
      ctx.beginPath();
      ctx.moveTo(b.bx - 6, b.by - 2);
      ctx.quadraticCurveTo(b.bx - 3, b.by - 6, b.bx, b.by);
      ctx.quadraticCurveTo(b.bx + 3, b.by - 6, b.bx + 6, b.by - 2);
      ctx.stroke();
    });

    // 7. Calligraphic text title at the left
    ctx.fillStyle = 'rgba(20, 20, 20, 0.88)';
    ctx.font = '24px "Times New Roman", Georgia, serif';
    const textYStr = "江南水碓磨坊联动图";
    for (let charIdx = 0; charIdx < textYStr.length; charIdx++) {
      ctx.fillText(textYStr[charIdx], 55, 80 + charIdx * 24);
    }

    // 8. Ancient Seal / chop (Square signature stamp in vermilion red)
    ctx.fillStyle = '#9C1E15';
    ctx.fillRect(920, 410, 28, 28);
    ctx.strokeStyle = '#EADECA';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(922, 412, 24, 24);
    
    // Draw pseudo archaic script seal lines
    ctx.beginPath();
    ctx.moveTo(929, 414); ctx.lineTo(929, 434);
    ctx.moveTo(935, 414); ctx.lineTo(935, 434);
    ctx.moveTo(923, 424); ctx.lineTo(937, 424);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
};

// Column stone bases or wild accents (Scattered pebbles successfully removed as requested)
const ScatteredNature = () => {
  return null;
};

// Particle foam/sprays underneath the water wheel
const WaterSplashes = ({ speedRef }: { speedRef: React.MutableRefObject<number> }) => {
  const count = 35;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const particles = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        x: -3.0 + (Math.random() - 0.5) * 1.5, // around the water wheel x = -3
        y: -1.0,                               // water level is relative y = 0 inside Machine (y = -2 absolute)
        z: (Math.random() - 0.5) * 3.2,
        vx: (Math.random() - 0.5) * 0.8,
        vy: Math.random() * 2.8 + 1.2,
        vz: Math.random() * 2.0 - 1.0,
        scale: Math.random() * 0.07 + 0.03,
        life: Math.random()
      });
    }
    return data;
  }, []);

  const tempObject = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const currentSpeed = speedRef.current;
    
    particles.forEach((p, i) => {
      if (currentSpeed === 0) {
        tempObject.position.set(0, -999, 0); // Hide off-screen when water is off
        tempObject.updateMatrix();
        meshRef.current!.setMatrixAt(i, tempObject.matrix);
        return;
      }
      
      // Decreasing life based on rotation velocity
      p.life -= delta * (1.2 + currentSpeed * 0.6);
      
      // Kinematic update
      p.x += p.vx * delta * currentSpeed;
      p.y += p.vy * delta * currentSpeed;
      p.z += p.vz * delta * currentSpeed;
      p.vy -= 9.8 * delta; // standard gravity pull
      
      if (p.life <= 0 || p.y < -1.8) {
        p.life = 1.0;
        p.x = -3.0 + (Math.random() - 0.5) * 1.2;
        p.y = -0.1;
        // Concentrate splash on exiting blades at the front (+z) and entering at the back (-z)
        p.z = Math.random() > 0.4 ? 1.6 + (Math.random() - 0.5) * 0.6 : -1.6 + (Math.random() - 0.5) * 0.6;
        p.vx = (Math.random() - 0.5) * 0.4;
        p.vy = Math.random() * 2.5 + 1.5;
        p.vz = p.z > 0 ? Math.random() * 1.8 + 1.0 : -Math.random() * 1.8 - 1.0;
        p.scale = Math.random() * 0.07 + 0.03;
      }
      
      // Floating offset over water channel
      tempObject.position.set(p.x, p.y + 0.1, p.z);
      const s = p.scale * p.life;
      tempObject.scale.set(s, s, s);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, count]}>
      <sphereGeometry args={[1, 5, 5]} />
      <meshBasicMaterial color="#E8F4FD" transparent opacity={0.7} />
    </instancedMesh>
  );
};

// White flour dust puff rising on stone mallet impact
const MortarDust = ({ wasHitRef }: { wasHitRef: React.MutableRefObject<boolean> }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const particles = useMemo(() => {
    const list = [];
    for (let i = 0; i < 18; i++) {
      list.push({
        x: 0,
        y: 1.0,
        z: 0.0,
        vx: 0,
        vy: 0,
        vz: 0,
        scale: 0.1,
        life: 0 // initially dead
      });
    }
    return list;
  }, []);

  const tempObj = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Check if impact occurred
    if (wasHitRef.current) {
      wasHitRef.current = false;
      
      particles.forEach((p) => {
        // Hammer head impacts the mortar cavity around X=-7, Y=1.0, Z=0.0 (relative to assembly)
        p.x = (Math.random() - 0.5) * 0.3;
        p.y = 1.0;
        p.z = 0.0 + (Math.random() - 0.5) * 0.3;
        p.vx = (Math.random() - 0.5) * 1.2;
        p.vy = Math.random() * 1.8 + 1.4; // upward expansion
        p.vz = (Math.random() - 0.5) * 1.2;
        p.scale = Math.random() * 0.12 + 0.05;
        p.life = 1.0;
      });
    }

    // Animate active particles
    particles.forEach((p, idx) => {
      if (p.life > 0) {
        p.life -= delta * 1.5; // lifespan of ~0.66 seconds
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.z += p.vz * delta;
        
        // Slower movement as it expands
        p.vx *= 0.90;
        p.vy *= 0.95;
        p.vz *= 0.90;
        
        tempObj.position.set(p.x, p.y, p.z);
        // Slowly expands in width as it rises up and fades away
        const currentScale = p.scale * (1.0 + (1.0 - p.life) * 2.5) * p.life;
        tempObj.scale.set(currentScale, currentScale, currentScale);
        tempObj.updateMatrix();
        meshRef.current!.setMatrixAt(idx, tempObj.matrix);
      } else {
        tempObj.position.set(0, -999, 0); // hide dead particles
        tempObj.updateMatrix();
        meshRef.current!.setMatrixAt(idx, tempObj.matrix);
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, 18]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#FAFAFA" transparent opacity={0.65} />
    </instancedMesh>
  );
};

// Dynamic ripples with sine waves and smooth alpha border transitions
const FlowingWater = ({ speedRef }: { speedRef: React.MutableRefObject<number> }) => {
  const ripplesRef = useRef<THREE.Group>(null);
  const totalRipples = 40;

  // Pre-generate static ripple info
  const rippleMetadata = useMemo(() => {
    const list = [];
    for (let i = 0; i < totalRipples; i++) {
      list.push({
        origX: (Math.random() - 0.5) * 4.5,
        speedMultiplier: Math.random() * 0.4 + 0.8,
        phase: Math.random() * Math.PI * 2
      });
    }
    return list;
  }, []);
  
  useFrame((state, delta) => {
    const currentSpeed = speedRef.current;
    const elapsed = state.clock.getElapsedTime();
    
    if (ripplesRef.current && currentSpeed > 0) {
      ripplesRef.current.children.forEach((child, idx) => {
        const meta = rippleMetadata[idx];
        const localSpeed = 2.8 * meta.speedMultiplier * currentSpeed;
        
        // Move downstream (back to front)
        child.position.y += delta * localSpeed; 
        
        // Wavy movement side-to-side
        const lateralOffset = Math.sin(elapsed * 4 + meta.phase) * 0.12;
        child.position.x = meta.origX + lateralOffset;

        // Fades gently near the edges (boundaries of channel Y in [-15, 15])
        const distanceToEdge = Math.abs(child.position.y); // range 0 to 15
        const fadeMultiplier = THREE.MathUtils.clamp((15 - distanceToEdge) / 3.0, 0, 1);
        const meshChild = child as THREE.Mesh;
        if (meshChild.material) {
          (meshChild.material as THREE.MeshBasicMaterial).opacity = 0.45 * fadeMultiplier;
        }

        // Loop wrapper
        if (child.position.y > 15) {
          child.position.y -= 30;
          child.position.x = meta.origX;
        }
      });
    }
  });

  return (
    <group position={[-3, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Blue base river plate */}
      <mesh receiveShadow>
        <planeGeometry args={[5, 30]} />
        <meshStandardMaterial 
          color={WATER_COLOR} 
          roughness={0.15} 
          metalness={0.8}
          transparent 
          opacity={0.75} 
        />
      </mesh>
      
      {/* Moving water ripple planes */}
      <group ref={ripplesRef}>
        {[...Array(totalRipples)].map((_, i) => (
          <mesh 
            key={i} 
            position={[
              rippleMetadata[i].origX, 
              (Math.random() - 0.5) * 30, 
              0.02 
            ]}
          >
            <planeGeometry args={[Math.random() * 0.15 + 0.08, Math.random() * 1.8 + 0.6]} />
            <meshBasicMaterial color="#FFFFFF" transparent opacity={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// Pulse hotspot dot component
const HotspotMarker = ({ 
  position, 
  active, 
  label, 
  onHover,
  onClick
}: { 
  position: [number, number, number]; 
  active: boolean; 
  label: string; 
  onHover: (hovered: boolean) => void;
  onClick: () => void;
}) => {
  return (
    <group 
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(true);
      }}
      onPointerOut={() => onHover(false)}
      onPointerDown={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Interactive invisible larger hover trigger bounds */}
      <mesh visible={false}>
        <sphereGeometry args={[0.5, 8, 8]} />
      </mesh>

      {/* 2D HTML Name indicator */}
      <Html distanceFactor={14} center position={[0, 0.38, 0]}>
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap transition-all duration-300 pointer-events-auto cursor-pointer select-none ${
            active 
              ? 'bg-amber-600 border-amber-400 text-white shadow-md scale-110' 
              : 'bg-white/95 border-amber-500/30 text-amber-900 shadow-sm hover:bg-amber-50 hover:border-amber-400'
          }`}
        >
          {label}
        </div>
      </Html>
    </group>
  );
};

interface MachineProps {
  speedRef: React.MutableRefObject<number>;
  hoveredPart: string | null;
  setHoveredPart: (part: string | null) => void;
  selectedPart: string | null;
  setSelectedPart: (part: string | null) => void;
}

const Machine = ({ 
  speedRef, 
  hoveredPart, 
  setHoveredPart, 
  selectedPart, 
  setSelectedPart 
}: MachineProps) => {
  const mainShaftRef = useRef<THREE.Group>(null);
  const upperMillRef = useRef<THREE.Group>(null);
  const hammerLeverRef = useRef<THREE.Group>(null);
  
  // Ref to propagate hammer impact trigger to MortarDust stateless component
  const wasHitRef = useRef(false);
  const hammerWasLifted = useRef(false);

  // Mouse cursor toggle helper
  const handleHoverState = (partId: string | null) => {
    setHoveredPart(partId);
    document.body.style.cursor = partId ? 'pointer' : 'auto';
  };

  const handleSelectState = (partId: string | null) => {
    setSelectedPart(partId);
  };

  useFrame((state, delta) => {
    const currentSpeed = speedRef.current;
    
    // Slow down rotation if speed control is set
    const animationDelta = delta * currentSpeed;

    if (mainShaftRef.current) {
      mainShaftRef.current.rotation.x -= 1.0 * animationDelta;
    }
    if (upperMillRef.current && mainShaftRef.current) {
      // Direct mechanical gear linkage coupling (1:1 gear ratio)
      upperMillRef.current.rotation.y = -mainShaftRef.current.rotation.x + (Math.PI / 24);
    }
    if (hammerLeverRef.current && mainShaftRef.current) {
      // Cam peg trigger logic
      let angle = -mainShaftRef.current.rotation.x % (Math.PI * 2);
      if (angle < 0) angle += Math.PI * 2;
      
      const rangeWidth = Math.PI / 2.5;
      
      if (angle >= 0 && angle <= rangeWidth) {
         // Lever pushed down by peg (lifting the stone hammer head as peg approaches bottom from back)
        const progress = angle / rangeWidth;
        const currentLift = Math.sin(progress * Math.PI / 2) * 0.35;
        hammerLeverRef.current.rotation.x = currentLift;
        
        if (currentLift > 0.15) {
          hammerWasLifted.current = true;
        }
      } else {
        // Drop phase: instant descend from gravity once peg rotates past the bottom
        const oldX = hammerLeverRef.current.rotation.x;
        hammerLeverRef.current.rotation.x = THREE.MathUtils.lerp(oldX, 0, 0.58);
        
        // Mallet hits the mortar bed, trigger dust particles rising
        if (hammerWasLifted.current && hammerLeverRef.current.rotation.x <= 0.012) {
          hammerWasLifted.current = false;
          
          if (currentSpeed > 0) {
            wasHitRef.current = true;
          }
        }
      }
    }
  });

  return (
    <group position={[0, -2, 0]}>
      {/* 1.动力水轮 (Water Wheel Assembly) */}
      <group 
        position={[-3, 2, 0]}
        onPointerOver={(e) => { e.stopPropagation(); handleHoverState('water_wheel'); }}
        onPointerOut={() => handleHoverState(null)}
        onPointerDown={(e) => { e.stopPropagation(); handleSelectState('water_wheel'); }}
      >
        <group ref={mainShaftRef} position={[3, 0, 0]}>
          {/* Main Shaft Pole */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
            <cylinderGeometry args={[0.2, 0.2, 18, 16]} />
            <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
          </mesh>
          
          {/* Water Wheel inside Shaft group */}
          <group position={[-3, 0, 0]}>
            {/* Central hub block */}
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.5, 0.5, 1.6, 16]} />
              <meshStandardMaterial color={WOOD_COLOR} roughness={0.82} />
            </mesh>
            {/* 8 radiating spokes and blades */}
            {[...Array(8)].map((_, i) => (
              <group key={i} rotation={[i * Math.PI / 4, 0, 0]}>
                {/* Spokes extending */}
                <mesh position={[0, 1.5, 0]} castShadow>
                  <boxGeometry args={[0.15, 3, 0.15]} />
                  <meshStandardMaterial color={WOOD_COLOR} />
                </mesh>
                {/* Thick cup-like water blade catching cascades */}
                <mesh position={[0, 2.4, 0]} rotation={[0.15, 0, 0]} castShadow>
                  <boxGeometry args={[1.8, 1.2, 0.1]} />
                  <meshStandardMaterial color={LIGHT_WOOD} roughness={0.7} />
                </mesh>
              </group>
            ))}
          </group>

          {/* Cam peg block pushing hammer mallet tail */}
          <group position={[-7, 0, 0]} rotation={[(Math.PI / 2.5) + Math.PI - 0.1, 0, 0]}>
            <mesh position={[0, 0.6, 0]} castShadow>
              <boxGeometry args={[0.2, 1.2, 0.3]} />
              <meshStandardMaterial color={WOOD_COLOR} />
            </mesh>
          </group>

          {/* Driving Vertical Shaft Gear */}
          <group position={[5, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[1.3, 1.3, 0.4, 32]} />
              <meshStandardMaterial color={WOOD_COLOR} roughness={0.88} />
            </mesh>
            {[...Array(24)].map((_, i) => (
              <group key={i} rotation={[i * Math.PI / 12, 0, 0]}>
                <mesh position={[0, 1.4, 0]} castShadow>
                  <boxGeometry args={[0.4, 0.4, 0.18]} />
                  <meshStandardMaterial color={LIGHT_WOOD} />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      </group>

      {/* 2.传动轴 (Main Drive Shaft hover zone) */}
      {/* Invisible cylinder surrounding drive shaft to easily trigger hover */}
      <mesh 
        position={[0, 2, 0]} 
        rotation={[0, 0, Math.PI / 2]}
        visible={false}
        onPointerOver={(e) => { e.stopPropagation(); handleHoverState('drive_shaft'); }}
        onPointerOut={() => handleHoverState(null)}
        onPointerDown={(e) => { e.stopPropagation(); handleSelectState('drive_shaft'); }}
      >
        <cylinderGeometry args={[0.6, 0.6, 17, 8]} />
      </mesh>

      {/* 3.联动齿轮 (Gears mesh hover box) */}
      <mesh 
        position={[4.4, 1.8, 0]} 
        visible={false}
        onPointerOver={(e) => { e.stopPropagation(); handleHoverState('gears'); }}
        onPointerOut={() => handleHoverState(null)}
        onPointerDown={(e) => { e.stopPropagation(); handleSelectState('gears'); }}
      >
        <boxGeometry args={[2.5, 2.5, 2.5]} />
      </mesh>

      {/* 4.上磨盘 (Upper Stone Mill Assembly) */}
      <group position={[3.6, 0, 0]}>
        {/* Driven vertical axle and rotating upper stone */}
        <group 
          ref={upperMillRef}
          onPointerOver={(e) => { e.stopPropagation(); handleHoverState('upper_stone'); }}
          onPointerOut={() => handleHoverState(null)}
          onPointerDown={(e) => { e.stopPropagation(); handleSelectState('upper_stone'); }}
        >
          {/* Vertical central support pole */}
          <mesh position={[0, 5, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 8, 16]} />
            <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
          </mesh>
          
          {/* Driven horizontal gear */}
          <group position={[0, 3.6, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[1.3, 1.3, 0.2, 32]} />
              <meshStandardMaterial color={WOOD_COLOR} roughness={0.8} />
            </mesh>
            {[...Array(24)].map((_, i) => (
              <group key={i} rotation={[0, i * Math.PI / 12, 0]}>
                <mesh position={[1.4, -0.2, 0]} castShadow>
                  <boxGeometry args={[0.4, 0.4, 0.18]} />
                  <meshStandardMaterial color={LIGHT_WOOD} />
                </mesh>
              </group>
            ))}
          </group>

          {/* Rotating upper stone slab */}
          <mesh position={[0, 6.5, 0]} castShadow>
            <cylinderGeometry args={[2, 2, 0.6, 32]} />
            <meshStandardMaterial color={STONE_COLOR} roughness={0.8} />
            {/* Chiseled diagonal grooves */}
            {[...Array(12)].map((_, i) => (
              <mesh key={i} rotation={[0, i * Math.PI / 6, 0]} position={[0, 0.31, 0]}>
                <boxGeometry args={[4, 0.02, 0.05]} />
                <meshStandardMaterial color={DARK_STONE} />
              </mesh>
            ))}
          </mesh>
          
          {/* Centered grain feeding hole */}
          <mesh position={[0, 6.81, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.02, 16]} />
            <meshStandardMaterial color="#1E293B" />
          </mesh>

          {/* Slinger board (sweeping grain away) */}
          <mesh position={[0, 6.85, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <boxGeometry args={[1.4, 0.15, 0.05]} />
            <meshStandardMaterial color={WOOD_COLOR} />
          </mesh>
        </group>

        {/* Static lower stone slab */}
        <mesh position={[0, 5.8, 0]} receiveShadow>
          <cylinderGeometry args={[2.2, 2.2, 0.8, 32]} />
          <meshStandardMaterial color={DARK_STONE} roughness={0.9} />
        </mesh>
        
        {/* Out-fall wooden catch board */}
        <mesh position={[0, 5.3, 0]} receiveShadow>
          <cylinderGeometry args={[3, 3, 0.2, 32]} />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.85} />
        </mesh>

        {/* Crushed yellow flour dust on catcher */}
        <mesh position={[0, 5.41, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.2, 2.8, 32]} />
          <meshStandardMaterial color="#EEDCB5" side={THREE.DoubleSide} roughness={1.0} />
        </mesh>
        
        {/* 5.谷物漏斗 (Grain Hopper) */}
        <group 
          position={[0, 8.2, 0]}
          onPointerOver={(e) => { e.stopPropagation(); handleHoverState('hopper'); }}
          onPointerOut={() => handleHoverState(null)}
          onPointerDown={(e) => { e.stopPropagation(); handleSelectState('hopper'); }}
        >
          <mesh rotation={[Math.PI, 0, 0]} castShadow>
            <coneGeometry args={[1.2, 1.6, 4]} />
            <meshStandardMaterial color={LIGHT_WOOD} roughness={0.7} />
          </mesh>
          {/* Continuous falling cylinder represent seeds pouring */}
          <mesh position={[0, -1.0, 0]}>
            <cylinderGeometry args={[0.08, 0.18, 1.2, 8]} />
            <meshStandardMaterial color="#EEDCB5" transparent opacity={0.8} roughness={1.0} />
          </mesh>
        </group>
      </group>

      {/* Trip Hammer Assembly */}
      <group position={[-7, 0, -4.5]}>
        {/* Support block */}
        <mesh position={[0, 0.8, 2.0]} castShadow receiveShadow>
          <boxGeometry args={[0.6, 1.6, 0.6]} />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.85} />
        </mesh>
        
        {/* Pivot Lever Arm */}
        <group ref={hammerLeverRef} position={[0, 1.6, 2.0]}>
          <mesh position={[0, 0, 0.25]} castShadow>
            <boxGeometry args={[0.3, 0.3, 5]} />
            <meshStandardMaterial color={LIGHT_WOOD} roughness={0.75} />
          </mesh>
          
          {/* Heavy Stone mallet head */}
          <group position={[0, -0.8, -2.0]}>
            <mesh position={[0, 0.4, 0]} castShadow>
              <boxGeometry args={[0.2, 0.8, 0.2]} />
              <meshStandardMaterial color={WOOD_COLOR} />
            </mesh>
            <mesh position={[0, -0.1, 0]} castShadow>
              <cylinderGeometry args={[0.3, 0.2, 0.8, 16]} />
              <meshStandardMaterial color={DARK_STONE} roughness={0.95} />
            </mesh>
          </group>
        </group>

        {/* Mortar Stone Cavity (石臼) */}
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1, 1.2, 1, 32]} />
            <meshStandardMaterial color={STONE_COLOR} roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.01, 0]}>
            <cylinderGeometry args={[0.7, 0.7, 0.1, 32]} />
            <meshStandardMaterial color={'#1E293B'} />
          </mesh>
          <mesh position={[0, 0.95, 0]}>
            <cylinderGeometry args={[0.68, 0.68, 0.15, 32]} />
            <meshStandardMaterial color="#EEDCB5" roughness={1} />
          </mesh>
        </group>

        {/* Basket containing grain seeds */}
        <group position={[-1.8, 0.4, 0]} rotation={[0.2, 0, -0.1]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.6, 0.4, 0.8, 16]} />
            <meshStandardMaterial color="#D2B48C" roughness={0.9} />
          </mesh>
          {[...Array(6)].map((_, i) => (
            <mesh key={i} position={[0, -0.35 + i * 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.42 + i * 0.035, 0.03, 8, 24]} />
              <meshStandardMaterial color="#B8860B" />
            </mesh>
          ))}
          <mesh position={[0, 0.2, 0]}>
             <cylinderGeometry args={[0.55, 0.35, 0.81, 16]} />
             <meshStandardMaterial color="#8B5A2B" />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.2, 16]} />
            <meshStandardMaterial color="#EEDCB5" roughness={1} />
          </mesh>
        </group>

        {/* Clutter Grain Piles */}
        <group position={[1.2, 0.05, -0.3]} castShadow>
          <mesh position={[0, 0.1, 0]}><coneGeometry args={[0.6, 0.2, 16]} /><meshStandardMaterial color="#EEDCB5" roughness={1.0} /></mesh>
          <mesh position={[0.2, 0.05, 0.2]}><sphereGeometry args={[0.18, 8, 8]} /><meshStandardMaterial color="#EEDCB5" roughness={1.0} /></mesh>
          <mesh position={[-0.2, 0.05, -0.1]}><sphereGeometry args={[0.14, 8, 8]} /><meshStandardMaterial color="#EEDCB5" roughness={1.0} /></mesh>
        </group>
        <group position={[0.8, 0.05, 0.5]} scale={0.7} castShadow>
          <mesh position={[0, 0.1, 0]}><coneGeometry args={[0.6, 0.2, 16]} /><meshStandardMaterial color="#EEDCB5" roughness={1.0} /></mesh>
          <mesh position={[0.1, 0.05, -0.2]}><sphereGeometry args={[0.15, 8, 8]} /><meshStandardMaterial color="#EEDCB5" roughness={1.0} /></mesh>
        </group>
        <group position={[-1.0, 0.05, 0.7]} scale={0.8} castShadow>
          <mesh position={[0, 0.1, 0]}><coneGeometry args={[0.6, 0.2, 16]} /><meshStandardMaterial color="#EEDCB5" roughness={1.0} /></mesh>
          <mesh position={[-0.1, 0.05, 0.2]}><sphereGeometry args={[0.18, 8, 8]} /><meshStandardMaterial color="#EEDCB5" roughness={1.0} /></mesh>
        </group>

        {/* Flour Dust Particle System */}
        <MortarDust wasHitRef={wasHitRef} />
      </group>

      {/* Structural Bearing Blocks for Drive Shaft and Mill Platform */}
      <group>
        {/* Left shaft bearing mount: a solid rustic log support */}
        <mesh position={[-8.5, 0.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.6, 1.6, 0.6]} />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.9} />
        </mesh>
        
        {/* Mid shaft bearing mount */}
        <mesh position={[1, 0.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.6, 1.6, 0.6]} />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.9} />
        </mesh>

        {/* Right shaft bearing mount */}
        <mesh position={[7, 0.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.6, 1.6, 0.6]} />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.9} />
        </mesh>

        {/* The second floor deck where the millstone stands (designed to blend into the main architecture) */}
        <mesh position={[3.6, 5.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[8.0, 0.16, 5.8]} />
          <meshStandardMaterial color={LIGHT_WOOD} roughness={0.85} />
        </mesh>
      </group>

      {/* 2D Interactive Holographic Hotspots displayed when clicked or hovered */}
      <HotspotMarker 
        position={[-3, 4.2, 0]} 
        active={hoveredPart === 'water_wheel' || selectedPart === 'water_wheel'} 
        label="水轮" 
        onHover={(hovered) => handleHoverState(hovered ? 'water_wheel' : null)} 
        onClick={() => handleSelectState('water_wheel')}
      />
      <HotspotMarker 
        position={[-0.5, 2.4, 0]} 
        active={hoveredPart === 'drive_shaft' || selectedPart === 'drive_shaft'} 
        label="传动轴" 
        onHover={(hovered) => handleHoverState(hovered ? 'drive_shaft' : null)} 
        onClick={() => handleSelectState('drive_shaft')}
      />
      <HotspotMarker 
        position={[4.4, 2.3, 0]} 
        active={hoveredPart === 'gears' || selectedPart === 'gears'} 
        label="交错齿轮" 
        onHover={(hovered) => handleHoverState(hovered ? 'gears' : null)} 
        onClick={() => handleSelectState('gears')}
      />
      <HotspotMarker 
        position={[3.6, 7.1, 0]} 
        active={hoveredPart === 'upper_stone' || selectedPart === 'upper_stone'} 
        label="上磨盘" 
        onHover={(hovered) => handleHoverState(hovered ? 'upper_stone' : null)} 
        onClick={() => handleSelectState('upper_stone')}
      />
      <HotspotMarker 
        position={[3.6, 9.4, 0]} 
        active={hoveredPart === 'hopper' || selectedPart === 'hopper'} 
        label="粮食漏斗" 
        onHover={(hovered) => handleHoverState(hovered ? 'hopper' : null)} 
        onClick={() => handleSelectState('hopper')}
      />

      {/* Flowing Water System & Foams */}
      <FlowingWater speedRef={speedRef} />
      <WaterSplashes speedRef={speedRef} />
    </group>
  );
};

// Beautiful open-sided rural wooden watermill architecture matching the watercolor hand-painted illustration.
// It includes:
// 1. Raised hand-built riverbank stone bases under left & right workshops.
// 2. Left gabled thatched-roof open wooden hut covering the Trip Hammer pounding mortar.
// 3. Right two-story open pine timber-framed workshop enclosing the gears (ground) and millstones (second) with balusters, screen shutters.
// 4. Elevated wooden flume/aqueduct slanting from background with flowing animated blue water feeding the top of the waterwheel.
// 5. Open wooden stairs climbing from ground bank up to the second level platform with handrails.
const SubStoneMasonry = ({ position, width, height, length, color }: { position: [number, number, number], width: number, height: number, length: number, color: string }) => {
  // Protruding small stone brick blocks on the sides to model realistic rock masonry relief!
  const blockCount = 18;
  const stones = useMemo(() => {
    return [...Array(blockCount)].map((_, i) => ({
      pos: [
        (Math.random() - 0.5) * (width - 0.2),
        (Math.random() - 0.5) * (height - 0.2),
        (Math.random() - 0.5) * (length + 0.05), // slightly stick out of front/back faces
      ] as [number, number, number],
      size: [
        Math.random() * 0.4 + 0.2,
        Math.random() * 0.2 + 0.1,
        Math.random() * 0.3 + 0.2,
      ] as [number, number, number],
      color: i % 3 === 0 ? '#A69B91' : i % 3 === 1 ? '#8A7B70' : '#C5B5A4',
    }));
  }, [width, height, length]);

  return (
    <group position={position}>
      {/* Base block */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, length]} />
        <meshStandardMaterial color={color} roughness={1.0} />
      </mesh>
      {/* Detail relief stones */}
      {stones.map((st, i) => (
        <mesh key={i} position={st.pos} castShadow receiveShadow>
          <boxGeometry args={st.size} />
          <meshStandardMaterial color={st.color} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};

// Subcomponent to render and animate water in the overhead flume
const FlumeWater = () => {
  const waterRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (waterRef.current) {
      // Scroll the water texture effect by slightly offset position or wave motions on the mesh StandardMaterial map
      const t = state.clock.getElapsedTime();
      // Wave pulse oscillation for flowing watercolor ink aesthetic
      waterRef.current.position.y = 3.65 + Math.sin(t * 3.5) * 0.012;
    }
  });

  return (
    <group>
      {/* Solid blue flowing water plane within flume */}
      <mesh 
        ref={waterRef}
        position={[-3, 3.65, -6.5]} 
        rotation={[-Math.atan2(2.5, 7.8), 0, 0]} // align slant precisely with flume
      >
        <planeGeometry args={[0.54, 8.2]} />
        <meshStandardMaterial 
          color="#3B82F6" 
          roughness={0.2} 
          metalness={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Scrolling dynamic water wave particles inside flume for high visual feedback */}
      <mesh 
        position={[-3, 3.68, -6.5]} 
        rotation={[-Math.atan2(2.5, 7.8), 0, 0]}
      >
        <planeGeometry args={[0.52, 8.2]} />
        <meshStandardMaterial 
          color="#93C5FD" 
          roughness={0.4} 
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
};

const ChineseArchitecture = ({ landscapeTexture }: { landscapeTexture: THREE.CanvasTexture }) => {
  const woodColor = '#C1A482'; // Light-toned softwood pine color from traditional painting
  const darkWood = '#8C6F4F';  // Darker structural timber accent
  const thatchColor = '#E3C89E'; // Straw gold thatch roof base
  const thatchDark = '#C6AA7E';  // Shadow thatch layer

  return (
    <group>
      {/* 1. Raised Riverbank Stone Foundations (毛石墙基座) */}
      {/* Left side rock base (under Trip Hammer) */}
      <SubStoneMasonry 
        position={[-7.0, -1.82, -3.0]} 
        width={3.6} 
        height={0.55} 
        length={5.0} 
        color="#B9ADA0" 
      />

      {/* Right side rock base (under Millstone Building) */}
      <SubStoneMasonry 
        position={[3.8, -1.82, 0.0]} 
        width={8.4} 
        height={0.55} 
        length={6.4} 
        color="#BFAFA0" 
      />

      {/* 2. Left Open Thatch-Roof Pavilion (米碓棚) - covers the hammering pestles */}
      <group position={[-7.0, -1.54, -3.0]}>
        {/* Slender pine support poles (columns) */}
        {/* Back Left Column */}
        <mesh position={[-1.5, 1.8, -1.8]} castShadow>
          <cylinderGeometry args={[0.08, 0.09, 3.6, 10]} />
          <meshStandardMaterial color={woodColor} roughness={0.85} />
        </mesh>
        {/* Back Right Column */}
        <mesh position={[1.5, 1.8, -1.8]} castShadow>
          <cylinderGeometry args={[0.08, 0.09, 3.6, 10]} />
          <meshStandardMaterial color={woodColor} roughness={0.85} />
        </mesh>
        {/* Front Left Column */}
        <mesh position={[-1.5, 1.8, 1.8]} castShadow>
          <cylinderGeometry args={[0.08, 0.09, 3.6, 10]} />
          <meshStandardMaterial color={woodColor} roughness={0.85} />
        </mesh>
        {/* Front Right Column */}
        <mesh position={[1.5, 1.8, 1.8]} castShadow>
          <cylinderGeometry args={[0.08, 0.09, 3.6, 10]} />
          <meshStandardMaterial color={woodColor} roughness={0.85} />
        </mesh>

        {/* Roof Horizontal cross rafters and ties */}
        <mesh position={[0, 3.6, -1.8]} castShadow>
          <boxGeometry args={[3.2, 0.1, 0.12]} />
          <meshStandardMaterial color={darkWood} />
        </mesh>
        <mesh position={[0, 3.6, 1.8]} castShadow>
          <boxGeometry args={[3.2, 0.1, 0.12]} />
          <meshStandardMaterial color={darkWood} />
        </mesh>
        <mesh position={[-1.5, 3.6, 0]} rotation={[0, Math.PI/2, 0]} castShadow>
          <boxGeometry args={[3.8, 0.1, 0.12]} />
          <meshStandardMaterial color={darkWood} />
        </mesh>
        <mesh position={[1.5, 3.6, 0]} rotation={[0, Math.PI/2, 0]} castShadow>
          <boxGeometry args={[3.8, 0.1, 0.12]} />
          <meshStandardMaterial color={darkWood} />
        </mesh>

        {/* Slanted gabled rural thatch roof (暖黄色稻草堆砌感) */}
        <group position={[0, 4.3, 0]}>
          {/* Front falling slope */}
          <mesh position={[0, -0.4, 1.15]} rotation={[0.32, 0, 0]} castShadow>
            <boxGeometry args={[3.6, 0.15, 2.5]} />
            <meshStandardMaterial color={thatchColor} roughness={1.0} />
          </mesh>
          {/* Back falling slope */}
          <mesh position={[0, -0.4, -1.15]} rotation={[-0.32, 0, 0]} castShadow>
            <boxGeometry args={[3.6, 0.15, 2.5]} />
            <meshStandardMaterial color={thatchColor} roughness={1.0} />
          </mesh>
          {/* Thatch roof eaves texture elements to add layered thatch edges */}
          <mesh position={[0, -0.73, 2.3]} rotation={[0.32, 0, 0]}>
            <boxGeometry args={[3.8, 0.08, 0.18]} />
            <meshStandardMaterial color={thatchDark} roughness={1.0} />
          </mesh>
          <mesh position={[0, -0.73, -2.3]} rotation={[-0.32, 0, 0]}>
            <boxGeometry args={[3.8, 0.08, 0.18]} />
            <meshStandardMaterial color={thatchDark} roughness={1.0} />
          </mesh>
          {/* Straw roof cap ridge (屋脊) */}
          <mesh position={[0, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 3.8, 12]} />
            <meshStandardMaterial color={thatchDark} roughness={1.0} />
          </mesh>
        </group>
      </group>

      {/* 3. Right Two-Story Wooden Workshop Building (磨坊本体) */}
      <group position={[3.8, -1.54, 0.0]}>
        {/* Support Timber columns framework stretching from stone base up to roof eaves */}
        {/* Column Back-Left */}
        <mesh position={[-3.6, 4.5, -2.8]} castShadow>
          <cylinderGeometry args={[0.13, 0.14, 9.0, 11]} />
          <meshStandardMaterial color={woodColor} roughness={0.8} />
        </mesh>
        {/* Column Back-Right */}
        <mesh position={[3.6, 4.5, -2.8]} castShadow>
          <cylinderGeometry args={[0.13, 0.14, 9.0, 11]} />
          <meshStandardMaterial color={woodColor} roughness={0.8} />
        </mesh>
        {/* Column Front-Left */}
        <mesh position={[-3.6, 4.5, 2.8]} castShadow>
          <cylinderGeometry args={[0.13, 0.14, 9.0, 11]} />
          <meshStandardMaterial color={woodColor} roughness={0.8} />
        </mesh>
        {/* Column Front-Right */}
        <mesh position={[3.6, 4.5, 2.8]} castShadow>
          <cylinderGeometry args={[0.13, 0.14, 9.0, 11]} />
          <meshStandardMaterial color={woodColor} roughness={0.8} />
        </mesh>

        {/* Extra mid columns to frame the structure nicely */}
        <mesh position={[-3.6, 2.3, 0.0]} castShadow>
          <cylinderGeometry args={[0.11, 0.11, 4.6, 10]} />
          <meshStandardMaterial color={woodColor} roughness={0.8} />
        </mesh>
        <mesh position={[3.6, 4.5, 0.0]} castShadow>
          <cylinderGeometry args={[0.11, 0.11, 9.0, 10]} />
          <meshStandardMaterial color={woodColor} roughness={0.8} />
        </mesh>

        {/* Second floor deck balustrades/railings (2F护栏) at height Y = 4.6 (since platform is at Y = 4.6 relative) */}
        {/* Front horizontal handrail */}
        <mesh position={[0, 5.5, 2.76]} castShadow>
          <boxGeometry args={[7.2, 0.08, 0.08]} />
          <meshStandardMaterial color={darkWood} roughness={0.9} />
        </mesh>
        <mesh position={[0, 4.8, 2.76]} castShadow>
          <boxGeometry args={[7.2, 0.06, 0.06]} />
          <meshStandardMaterial color={darkWood} roughness={0.9} />
        </mesh>
        {/* Front balusters (spindles) */}
        {[-3, -2.2, -1.4, -0.6, 0.2, 1.0, 1.8, 2.6, 3.4].map((xVal, idx) => (
          <mesh key={idx} position={[xVal, 5.15, 2.76]} castShadow>
            <cylinderGeometry args={[0.024, 0.024, 0.7, 8]} />
            <meshStandardMaterial color={woodColor} roughness={0.9} />
          </mesh>
        ))}

        {/* Back horizontal handrail */}
        <mesh position={[0, 5.5, -2.76]} castShadow>
          <boxGeometry args={[7.2, 0.08, 0.08]} />
          <meshStandardMaterial color={darkWood} roughness={0.9} />
        </mesh>
        <mesh position={[0, 4.8, -2.76]} castShadow>
          <boxGeometry args={[7.2, 0.06, 0.06]} />
          <meshStandardMaterial color={darkWood} roughness={0.9} />
        </mesh>
        {/* Back balusters */}
        {[-3, -2.2, -1.4, -0.6, 0.2, 1.0, 1.8, 2.6, 3.4].map((xVal, idx) => (
          <mesh key={idx} position={[xVal, 5.15, -2.76]} castShadow>
            <cylinderGeometry args={[0.024, 0.024, 0.7, 8]} />
            <meshStandardMaterial color={woodColor} roughness={0.9} />
          </mesh>
        ))}

        {/* Right side horizontal handrail */}
        <mesh position={[3.56, 5.5, 0]} rotation={[0, Math.PI/2, 0]} castShadow>
          <boxGeometry args={[5.5, 0.08, 0.08]} />
          <meshStandardMaterial color={darkWood} roughness={0.9} />
        </mesh>
        <mesh position={[3.56, 4.8, 0]} rotation={[0, Math.PI/2, 0]} castShadow>
          <boxGeometry args={[5.5, 0.06, 0.06]} />
          <meshStandardMaterial color={darkWood} roughness={0.9} />
        </mesh>
        {/* Right side balusters */}
        {[-2.2, -1.4, -0.6, 0.2, 1.0, 1.8, 2.6].map((zVal, idx) => (
          <mesh key={idx} position={[3.56, 5.15, zVal]} castShadow>
            <cylinderGeometry args={[0.024, 0.024, 0.7, 8]} />
            <meshStandardMaterial color={woodColor} roughness={0.9} />
          </mesh>
        ))}

        {/* Traditional Wooden vertical screen/louvers (格栅门窗板) on the left-back of second floor (as in picture) */}
        <group position={[-3.56, 6.2, -0.8]}>
          {/* Framer borders */}
          <mesh castShadow>
            <boxGeometry args={[0.08, 3.2, 3.6]} />
            <meshStandardMaterial color={darkWood} roughness={0.9} />
          </mesh>
          {/* Vertical wood lattice bars */}
          {[-1.5, -1.2, -0.9, -0.6, -0.3, 0.0, 0.3, 0.6, 0.9, 1.2, 1.5].map((zPos, idx) => (
            <mesh key={idx} position={[0.05, 0, zPos]} castShadow>
              <boxGeometry args={[0.03, 3.0, 0.06]} />
              <meshStandardMaterial color={woodColor} roughness={0.8} />
            </mesh>
          ))}
        </group>

        {/* Roof Cross-beams header support at the top (Y = 8.8 relative, which is absolute Y = 7.3) */}
        <mesh position={[0, 8.8, 0]} castShadow>
          <boxGeometry args={[7.4, 0.16, 5.8]} />
          <meshStandardMaterial color={darkWood} />
        </mesh>

        {/* Lightweight slanted thatched workshop roof atop the 2nd floor */}
        <group position={[0, 9.5, 0]}>
          {/* Gabled slopes slanting down frontwards and backwards */}
          {/* Front falling slope */}
          <mesh position={[0, -0.4, 1.7]} rotation={[0.26, 0, 0]} castShadow>
            <boxGeometry args={[8.0, 0.15, 3.8]} />
            <meshStandardMaterial color={thatchColor} roughness={1.0} />
          </mesh>
          {/* Back falling slope */}
          <mesh position={[0, -0.4, -1.7]} rotation={[-0.26, 0, 0]} castShadow>
            <boxGeometry args={[8.0, 0.15, 3.8]} />
            <meshStandardMaterial color={thatchColor} roughness={1.0} />
          </mesh>
          {/* Thick decorative straw cap ridge rope at peak */}
          <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 8.2, 12]} />
            <meshStandardMaterial color={thatchDark} roughness={1.0} />
          </mesh>
          {/* Eave helper panels */}
          <mesh position={[0, -0.85, 3.4]} rotation={[0.26, 0, 0]}>
            <boxGeometry args={[8.2, 0.08, 0.2]} />
            <meshStandardMaterial color={thatchDark} roughness={1.0} />
          </mesh>
          <mesh position={[0, -0.85, -3.4]} rotation={[-0.26, 0, 0]}>
            <boxGeometry args={[8.2, 0.08, 0.2]} />
            <meshStandardMaterial color={thatchDark} roughness={1.0} />
          </mesh>
        </group>
      </group>

      {/* 4. Wood Stairs System (木梯) - climbing to the second-floor mill room */}
      {/* Starting on the ground level around the wheel pit, slanting up to the deck entry */}
      <group position={[1.4, -0.5, 2.9]}>
        {/* Slanted support side beams (stringers) */}
        <mesh position={[-0.8, 0, -0.22]} rotation={[Math.PI / 2.7, 0, -Math.PI / 6]} castShadow>
          <boxGeometry args={[0.08, 4.4, 0.16]} />
          <meshStandardMaterial color={darkWood} roughness={0.9} />
        </mesh>
        <mesh position={[0.2, 0, 0.38]} rotation={[Math.PI / 2.7, 0, -Math.PI / 6]} castShadow>
          <boxGeometry args={[0.08, 4.4, 0.16]} />
          <meshStandardMaterial color={darkWood} roughness={0.9} />
        </mesh>

        {/* Stair steps (step treads) */}
        {[...Array(11)].map((_, idx) => {
          const ratio = idx / 10;
          const sx = -1.7 + ratio * 1.83;
          const sy = -1.5 + ratio * 3.04;
          const sz = -0.74 + ratio * 1.1;
          return (
            <mesh key={idx} position={[sx, sy, sz]} rotation={[0, -Math.PI / 5, 0]} castShadow>
              <boxGeometry args={[0.7, 0.05, 0.22]} />
              <meshStandardMaterial color={woodColor} roughness={0.8} />
            </mesh>
          );
        })}

        {/* Simple wooden handrail along the outer side */}
        <group position={[0.24, 0.4, 0.4]}>
          <mesh rotation={[Math.PI / 2.7, 0, -Math.PI / 6]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 4.4]} />
            <meshStandardMaterial color={darkWood} roughness={0.9} />
          </mesh>
          {/* Vertical supports for handrail */}
          <mesh position={[-1.4, -0.9, -0.8]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.9]} />
            <meshStandardMaterial color={woodColor} roughness={0.9} />
          </mesh>
          <mesh position={[0.0, -0.1, 0.0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.9]} />
            <meshStandardMaterial color={woodColor} roughness={0.9} />
          </mesh>
          <mesh position={[1.4, 0.7, 0.8]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.9]} />
            <meshStandardMaterial color={woodColor} roughness={0.9} />
          </mesh>
        </group>
      </group>

      {/* 5. Overhead Elevational 引水渠 (Water flume / Aqueduct) - Successfully removed as requested */}
    </group>
  );
};

export default function App() {
  const [speed, setSpeed] = useState(1.0);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [showUI, setShowUI] = useState(true);
  const speedRef = useRef(1.0);

  // Sync ref with react state for optimal ThreeJS thread reads
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Procedural Canvas Texture
  const groundTexture = useMemo(() => createSoilTexture(), []);
  const landscapeTexture = useMemo(() => createChineseLandscapeTexture(), []);

  // Calculate live telemetry readings
  const telemetry = useMemo(() => {
    const isRunning = speed > 0;
    const waterFlow = (speed * 1.8).toFixed(1);
    const rpm = (speed * 8.2).toFixed(1);
    const strikeFreq = (speed * 9.2).toFixed(1);
    
    return {
      status: isRunning ? '运行中 / Active' : '合闸断流 / Stopped',
      waterFlow: isRunning ? `${waterFlow} m/s` : '0.0 m/s',
      shaftSpeed: isRunning ? `${rpm} RPM` : '0 RPM',
      millSpeed: isRunning ? `${rpm} RPM` : '0 RPM',
      strikes: isRunning ? `${strikeFreq} 次/分` : '0 次/分',
    };
  }, [speed]);

  return (
    <div className="w-full h-screen bg-[#FAF7F2] relative overflow-hidden font-sans select-none">
      {/* Beautiful Chinese Landscape Scenery Background */}
      <LandscapeBackground />

      {/* Floating UI Control toggle button - always visible */}
      <div className="absolute top-4 right-4 z-40 flex gap-2">
        <button
          onClick={() => setShowUI(!showUI)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white/95 hover:bg-white border border-[#8C7A65]/30 hover:border-amber-600/50 rounded-xl shadow-md text-xs font-bold text-[#3F2E1E] transition-all hover:scale-105 pointer-events-auto"
        >
          <Eye className="w-4 h-4 text-amber-700 font-bold" />
          <span>{showUI ? '隐藏控制界面' : '显示控制界面'}</span>
        </button>
      </div>

      {/* UI Header Overlay */}
      {showUI && (
        <div className="absolute top-0 left-0 w-full p-4 md:p-6 z-30 pointer-events-none flex flex-col items-center">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#3F2E1E] tracking-tight drop-shadow-sm mb-1.5 font-serif text-center">
            传统水碓磨坊 3D博物馆
          </h1>
          <p className="text-[#6B5A46] font-medium text-xs md:text-sm flex items-center gap-1.5 bg-white/75 border border-[#8C7A65]/10 backdrop-blur px-4 py-1.5 rounded-full shadow-sm max-sm:hidden">
            <Hand className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>支持360度旋转：鼠标拖拽旋转角色，鼠标滚轮缩放</span>
          </p>
        </div>
      )}

      {/* Left side: Controls and Telemetry */}
      {showUI && (
        <>
          {/* Control Panel (Upper Left Sidebar) */}
          <div className="absolute top-24 left-4 z-30 w-80 bg-white/92 border border-[#8C7A65]/20 backdrop-blur-md rounded-2xl p-5 shadow-lg flex flex-col gap-4 text-[#3F2E1E] transition-all max-sm:hidden pointer-events-auto">
            <div className="flex items-center gap-2 border-b border-[#8C7A65]/10 pb-3">
              <Settings className="w-5 h-5 text-amber-700" />
              <h2 className="font-bold text-base tracking-wide">水源水闸控制器</h2>
            </div>

            {/* Speed Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-stone-500">水流灌入闸口开度</span>
                <span className="text-amber-800 font-bold font-mono text-xs">
                  {speed === 0 ? '已闭闸 (0%)' : speed === 0.5 ? '半开演示 (50%)' : speed === 1.0 ? '常流平均 (100%)' : speed === 1.5 ? '湍流 (150%)' : '湍急饱荷 (200%)'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.5"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-amber-600 h-1.5 bg-amber-900/10 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400 font-bold px-1 font-mono">
                <span>闭闸</span>
                <span>缓流</span>
                <span>均流(1.0)</span>
                <span>湍流(1.5)</span>
                <span>急流(2.0)</span>
              </div>
            </div>

            {/* Preset Modes */}
            <div className="grid grid-cols-3 gap-2 mt-1">
              <button 
                onClick={() => setSpeed(0)}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                  speed === 0 
                    ? 'bg-[#3F2E1E] text-white border-transparent shadow' 
                    : 'bg-stone-50 text-[#6B5A46] border-[#8C7A65]/20 hover:bg-stone-100'
                }`}
              >
                闭合闸
              </button>
              <button 
                onClick={() => setSpeed(1.0)}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                  speed === 1.0 
                    ? 'bg-amber-700 text-white border-transparent shadow' 
                    : 'bg-stone-50 text-[#6B5A46] border-[#8C7A65]/20 hover:bg-stone-100'
                }`}
              >
                均衡研磨
              </button>
              <button 
                onClick={() => setSpeed(2.0)}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                  speed === 2.0 
                    ? 'bg-red-700 text-white border-transparent shadow animate-pulse' 
                    : 'bg-stone-50 text-[#6B5A46] border-[#8C7A65]/20 hover:bg-stone-100'
                }`}
              >
                湍流过载
              </button>
            </div>
          </div>

          {/* Telemetry Dashboard Panel (Lower Left sidebar) */}
          <div className="absolute bottom-6 left-4 z-30 w-80 bg-white/92 border border-[#8C7A65]/20 backdrop-blur-md rounded-2xl p-5 shadow-lg flex flex-col gap-3.5 text-[#3F2E1E] transition-all max-sm:hidden pointer-events-auto">
            <div className="flex items-center gap-2 border-b border-[#8C7A65]/10 pb-2.5">
              <Compass className="w-4.5 h-4.5 text-amber-700" />
              <h3 className="font-bold text-sm tracking-wide">机械联动与工况读数</h3>
            </div>

            <div className="flex flex-col gap-2 text-xs font-mono">
              <div className="flex justify-between items-center bg-stone-50/50 py-1.5 px-2.5 rounded-lg border border-stone-100">
                <span className="text-stone-500 font-sans">作坊当前工况</span>
                <span className={`font-bold ${speed > 0 ? 'text-green-600' : 'text-stone-400'}`}>{telemetry.status}</span>
              </div>
              <div className="flex justify-between items-center bg-stone-50/50 py-1.5 px-2.5 rounded-lg border border-stone-100">
                <span className="text-stone-500 font-sans flex items-center gap-1"><Waves className="w-3.5 h-3.5 text-blue-500" /> 引水渠流速</span>
                <span className="font-bold text-[#3F2E1E]">{telemetry.waterFlow}</span>
              </div>
              <div className="flex justify-between items-center bg-stone-50/50 py-1.5 px-2.5 rounded-lg border border-stone-100">
                <span className="text-stone-500 font-sans">大天平轴转速</span>
                <span className="font-bold text-[#3F2E1E]">{telemetry.shaftSpeed}</span>
              </div>
              <div className="flex justify-between items-center bg-stone-50/50 py-1.5 px-2.5 rounded-lg border border-stone-100">
                <span className="text-stone-500 font-sans">立式石磨转速</span>
                <span className="font-bold text-[#3F2E1E]">{telemetry.millSpeed}</span>
              </div>
              <div className="flex justify-between items-center bg-stone-50/50 py-1.5 px-2.5 rounded-lg border border-stone-100">
                <span className="text-stone-500 font-sans">舂米碓槌频率</span>
                <span className="font-bold text-amber-700">{telemetry.strikes}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Right side: Parts Catalog Menu Directory */}
      {showUI && (
        <div className="absolute top-24 right-4 z-30 w-72 flex flex-col gap-2.5 text-[#3F2E1E] max-sm:hidden select-none pointer-events-auto">
          <div className="bg-white/92 border border-[#8C7A65]/20 backdrop-blur-md rounded-2xl p-4 shadow-md flex flex-col gap-2">
            <span className="text-[11px] uppercase font-bold text-[#8C7A65] tracking-widest pb-1 border-b border-[#8C7A65]/10 flex items-center gap-1">
              🏛️ 科普词条目录 (点击查看)
            </span>
            <div className="flex flex-col gap-1.5">
              {Object.entries(PART_INFO_MAP).map(([key, info]) => {
                const isSel = selectedPart === key;
                const isHov = hoveredPart === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedPart(selectedPart === key ? null : key);
                    }}
                    onMouseEnter={() => setHoveredPart(key)}
                    onMouseLeave={() => setHoveredPart(null)}
                    className={`w-full px-3 py-2 text-xs font-bold rounded-lg border text-left transition-all tracking-wide shadow-sm flex items-center justify-between gap-1 cursor-pointer ${
                      isSel
                        ? 'bg-amber-700 text-white border-transparent'
                        : isHov
                          ? 'bg-amber-50 text-amber-800 border-amber-400 translate-x-1'
                          : 'bg-stone-50/80 text-[#3F2E1E] border-[#8C7A65]/15 hover:bg-stone-100'
                    }`}
                  >
                    <span>{info.title.split(' ')[0]}</span>
                    <span className={`text-[9px] font-mono font-medium ${isSel ? 'text-amber-200' : 'text-stone-400'}`}>
                      {isSel ? '已选' : '词条'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Floating Detailed Interactive Card showing SELECTED metadata (STABLE, LOCKABLE) */}
      {showUI && selectedPart && PART_INFO_MAP[selectedPart] && (
        <div className="absolute bottom-6 right-4 z-30 w-80 md:w-[380px] bg-slate-900/95 border border-amber-500/30 backdrop-blur-lg rounded-2xl p-5 shadow-2xl text-slate-100 flex flex-col gap-3 transition-all duration-300 transform scale-100 max-sm:hidden pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
            <div className="flex flex-col">
              <span className="font-serif font-extrabold text-base md:text-lg text-amber-400 tracking-wide">
                {PART_INFO_MAP[selectedPart].title}
              </span>
              <span className="text-[10px] font-mono text-slate-400 tracking-widest font-semibold mt-0.5">
                {PART_INFO_MAP[selectedPart].en}
              </span>
            </div>
            {/* Close Button */}
            <button 
              onClick={() => setSelectedPart(null)}
              className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 hover:scale-105 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>
          <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-light">
            {PART_INFO_MAP[selectedPart].desc}
          </p>
          <div className="bg-slate-800/80 rounded-xl p-2.5 flex items-center justify-between border border-slate-700/50 mt-1">
            <span className="text-[10px] text-slate-400 font-semibold font-sans">规格结构:</span>
            <span className="text-xs text-amber-200/90 font-mono font-medium">{PART_INFO_MAP[selectedPart].specs}</span>
          </div>
        </div>
      )}

      {/* Custom Mobile Sluice & Description controller */}
      <div className="absolute bottom-4 left-4 right-4 z-30 flex flex-col gap-2.5 sm:hidden pointer-events-none">
        {selectedPart && PART_INFO_MAP[selectedPart] && (
          <div className="bg-slate-950/95 text-white border border-amber-500/30 p-4 rounded-xl shadow-lg flex flex-col gap-2 pointer-events-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
              <span className="text-amber-400 text-sm font-bold font-serif">{PART_INFO_MAP[selectedPart].title}</span>
              <button 
                onClick={() => setSelectedPart(null)}
                className="text-slate-400 bg-slate-800 hover:text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px]"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">{PART_INFO_MAP[selectedPart].desc}</p>
          </div>
        )}
        
        {/* Mobile controls list */}
        {showUI && (
          <div className="bg-white/95 border border-[#8C7A65]/20 backdrop-blur-md rounded-xl p-4 shadow-md flex items-center justify-between text-[#3F2E1E] pointer-events-auto">
            <div className="flex flex-col gap-1 w-2/3">
              <span className="text-[11px] font-bold text-[#6B5A46]">水闸开度:</span>
              <input
                type="range"
                min="0"
                max="2"
                step="0.5"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-amber-600 h-1.5 bg-amber-900/10 rounded-lg cursor-pointer"
              />
            </div>
            <button 
              onClick={() => setSpeed(speed === 0 ? 1.0 : 0)} 
              className="bg-amber-700 text-[#F2EDE4] px-3 py-2 rounded-lg font-bold text-xs shadow-sm flex items-center gap-1 cursor-pointer"
            >
              {speed === 0 ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              {speed === 0 ? '开闸启运' : '合闸断流'}
            </button>
          </div>
        )}
      </div>

      {/* 3D Canvas */}
      <Canvas 
        className="relative z-10 w-full h-full bg-transparent"
        camera={{ position: [11, 8.5, 14], fov: 45 }}
        shadows
      >
        {/* Global illumination */}
        <ambientLight intensity={0.65} />
        
        {/* Sunlight throwing shadows */}
        <directionalLight 
          position={[12, 16, 12]} 
          intensity={1.3} 
          castShadow 
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-bias={-0.00015}
        />
        
        {/* Sky secondary bounce blue light */}
        <directionalLight position={[-12, 10, -12]} intensity={0.35} color="#DCE6F1" />

        {/* Ancient Chinese Wooden Architecture and Landscape Painting Frame */}
        <ChineseArchitecture landscapeTexture={landscapeTexture} />

        {/* Water mill core components */}
        <Machine 
          speedRef={speedRef} 
          hoveredPart={hoveredPart} 
          setHoveredPart={setHoveredPart} 
          selectedPart={selectedPart}
          setSelectedPart={setSelectedPart}
        />
        
        {/* Highly polished light brown soil texture ground */}
        <mesh position={[0, -2.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[65, 45]} />
          <meshStandardMaterial map={groundTexture} roughness={1.0} metalness={0.05} />
        </mesh>

        {/* Scattered 3D pebbles and wild grass clumps */}
        <ScatteredNature />
        
        {/* Global camera controls */}
        <OrbitControls 
          makeDefault 
          minPolarAngle={0.08} 
          maxPolarAngle={Math.PI / 2 - 0.05} // prevent going underwater or ground level
          minDistance={6}
          maxDistance={32}
          enableDamping
          dampingFactor={0.05}
        />
        
        {/* Shadow floor overlay */}
        <ContactShadows position={[0, -2.09, 0]} opacity={0.38} scale={35} blur={1.8} far={6} />
      </Canvas>
    </div>
  );
}
