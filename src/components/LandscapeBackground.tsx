import React, { useEffect, useRef } from 'react';

export const LandscapeBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const draw = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Ensure appropriate resolution
      canvas.width = width;
      canvas.height = height;

      // Clear previous drawing
      ctx.clearRect(0, 0, width, height);

      // 1. Base watercolor traditional wash background
      // Soft light cream, beige, ivory silk parchment feel
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#FAF7F2');
      bgGrad.addColorStop(0.5, '#F4EDE0');
      bgGrad.addColorStop(1, '#EAE1CE');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Add elegant faint ink paper texture wash points
      ctx.fillStyle = 'rgba(125, 95, 65, 0.025)';
      for (let i = 0; i < 450; i++) {
        const rx = Math.random() * width;
        const ry = Math.random() * height;
        const rSize = Math.random() * 2 + 0.5;
        ctx.fillRect(rx, ry, rSize, rSize);
      }

      // Draw soft hazy grey watercolor ink clouds/wash blots
      for (let i = 0; i < 10; i++) {
        const cx = Math.random() * width;
        const cy = Math.random() * height * 0.8;
        const r = Math.random() * 240 + 120;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, 'rgba(215, 202, 185, 0.22)');
        grad.addColorStop(0.6, 'rgba(215, 202, 185, 0.06)');
        grad.addColorStop(1, 'rgba(215, 202, 185, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Beautiful rising watercolor vermilion soft morning sun
      const sunX = width * 0.82;
      const sunY = height * 0.24;
      const sunR = Math.min(width, height) * 0.11;
      const sunGrad = ctx.createRadialGradient(sunX, sunY, sunR * 0.1, sunX, sunY, sunR);
      sunGrad.addColorStop(0, 'rgba(215, 80, 60, 0.38)');
      sunGrad.addColorStop(0.5, 'rgba(215, 80, 60, 0.12)');
      sunGrad.addColorStop(1, 'rgba(215, 80, 60, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();

      // Soft sun core
      ctx.fillStyle = 'rgba(200, 62, 45, 0.14)';
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Helper function to render flowing watercolor mountain range layers
      const drawMountainRange = (
        startY: number,
        amplitude: number,
        frequency: number,
        color: string,
        mistColor: string
      ) => {
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, startY);

        for (let x = 0; x <= width; x += 5) {
          // Beautiful combo of sine and cosine waves to synthesize realistic, painterly ink ridges
          const wave1 = Math.sin(x * frequency) * amplitude;
          const wave2 = Math.cos(x * frequency * 2.15 + 1.6) * (amplitude * 0.42);
          const wave3 = Math.sin(x * frequency * 0.38 + 2.8) * (amplitude * 0.58);
          const y = startY + wave1 + wave2 + wave3;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        // Mountain fill with soft vertical decay to mimic rolling morning mist (云雾缭绕)
        const mountainGrad = ctx.createLinearGradient(0, startY - amplitude * 2, 0, height);
        mountainGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        mountainGrad.addColorStop(0.1, color);
        mountainGrad.addColorStop(0.65, mistColor);
        mountainGrad.addColorStop(1, mistColor);
        ctx.fillStyle = mountainGrad;
        ctx.fill();
      };

      // Layer 1: Sky-distant, hazy mountain ridges (light purple-grey shade)
      drawMountainRange(
        height * 0.42,
        height * 0.13,
        0.0035,
        'rgba(142, 146, 150, 0.14)',
        'rgba(244, 237, 224, 0.72)'
      );

      // Layer 2: Mid-range traditional charcoal ink mountain range
      drawMountainRange(
        height * 0.54,
        height * 0.12,
        0.0055,
        'rgba(102, 112, 112, 0.24)',
        'rgba(244, 237, 224, 0.55)'
      );

      // Layer 3: Main prominent mountain peaks
      drawMountainRange(
        height * 0.68,
        height * 0.10,
        0.0085,
        'rgba(68, 78, 78, 0.38)',
        'rgba(244, 237, 224, 0.32)'
      );
      
      // Layer 4: Close riverbank hills outlining the water perspective
      drawMountainRange(
        height * 0.84,
        height * 0.05,
        0.016,
        'rgba(42, 52, 48, 0.48)',
        'rgba(234, 225, 206, 0.85)'
      );

      // 3. Poetic flight of calligraphic cranes/wild birds
      ctx.strokeStyle = 'rgba(42, 48, 42, 0.58)';
      ctx.lineWidth = 1.35;
      const birdList = [
        { bx: width * 0.28, by: height * 0.26, bs: 11 },
        { bx: width * 0.32, by: height * 0.22, bs: 14 },
        { bx: width * 0.29, by: height * 0.30, bs: 9 },
        { bx: width * 0.35, by: height * 0.25, bs: 10 },
        { bx: width * 0.33, by: height * 0.19, bs: 12 },
        { bx: width * 0.39, by: height * 0.28, bs: 8 },
      ];
      birdList.forEach(bird => {
        const { bx, by, bs } = bird;
        ctx.beginPath();
        ctx.moveTo(bx - bs, by - bs * 0.25);
        ctx.quadraticCurveTo(bx - bs * 0.4, by - bs * 0.75, bx, by);
        ctx.quadraticCurveTo(bx + bs * 0.4, by - bs * 0.75, bx + bs, by - bs * 0.25);
        ctx.stroke();
      });

      // 4. Vertical Chinese Calligraphy text column
      ctx.fillStyle = 'rgba(28, 28, 28, 0.78)';
      ctx.font = `bold ${Math.max(16, Math.min(width * 0.02, 22))}px font-serif, "Kaiti", "SimSun", "STKaiti", serif`;
      const titleText = "水碓磨坊三维联动图";
      const charSize = Math.max(16, Math.min(width * 0.02, 22)) * 1.15;
      const startX = width * 0.08;
      const startY = height * 0.18;
      
      for (let i = 0; i < titleText.length; i++) {
        ctx.fillText(titleText[i], startX, startY + i * charSize);
      }

      // Secondary annotation text streams
      ctx.fillStyle = 'rgba(68, 68, 68, 0.62)';
      ctx.font = `${Math.max(11, Math.min(width * 0.012, 13))}px font-serif, "Kaiti", "SimSun", "STKaiti", serif`;
      const annot1 = "古法机械";
      const annot2 = "水利联动";
      const annotSize = Math.max(11, Math.min(width * 0.012, 13)) * 1.25;
      
      for (let i = 0; i < annot1.length; i++) {
        ctx.fillText(annot1[i], startX + charSize * 0.78, startY + i * annotSize + 25);
      }
      for (let i = 0; i < annot2.length; i++) {
        ctx.fillText(annot2[i], startX + charSize * 1.35, startY + i * annotSize + 25);
      }

      // 5. Signature Vermilion Chop Stamp Seal (朱文印章)
      const sealX = startX - 3;
      const sealY = startY + titleText.length * charSize + 18;
      const sealSize = Math.max(22, Math.min(width * 0.025, 28));
      
      ctx.fillStyle = '#9C1E15'; // Traditional vermilion cinnabar
      ctx.fillRect(sealX, sealY, sealSize, sealSize);
      
      ctx.strokeStyle = '#FAF7F2'; // Ivory relief border
      ctx.lineWidth = Math.max(1, sealSize * 0.05);
      ctx.strokeRect(sealX + 1.5, sealY + 1.5, sealSize - 3, sealSize - 3);

      // Simple traditional chop horizontal & vertical lines
      ctx.beginPath();
      ctx.moveTo(sealX + sealSize * 0.5, sealY + 3);
      ctx.lineTo(sealX + sealSize * 0.5, sealY + sealSize - 3);
      ctx.moveTo(sealX + 3, sealY + sealSize * 0.5);
      ctx.lineTo(sealX + sealSize - 3, sealY + sealSize * 0.5);
      ctx.stroke();
    };

    draw();

    const handleResize = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      id="landscape-painting-background"
      className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none select-none z-0" 
    />
  );
};
