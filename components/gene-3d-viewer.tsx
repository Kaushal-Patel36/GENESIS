'use client';

import { useEffect, useRef } from 'react';

export function Gene3DViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let rotation = 0;

    const animate = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rotation);

      // Draw DNA helix
      const radius = 80;
      const turns = 3;
      const points = 100;

      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 3;
      ctx.beginPath();

      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2 * turns;
        const x = Math.cos(angle) * radius;
        const y = (i / points) * 200 - 100;
        const z = Math.sin(angle) * radius;

        // Perspective projection
        const scale = 400 / (400 + z);
        const screenX = x * scale;
        const screenY = y * scale;

        if (i === 0) ctx.moveTo(screenX, screenY);
        else ctx.lineTo(screenX, screenY);
      }

      ctx.stroke();

      // Draw second helix
      ctx.strokeStyle = '#06b6d4';
      ctx.beginPath();

      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2 * turns + Math.PI;
        const x = Math.cos(angle) * radius;
        const y = (i / points) * 200 - 100;
        const z = Math.sin(angle) * radius;

        const scale = 400 / (400 + z);
        const screenX = x * scale;
        const screenY = y * scale;

        if (i === 0) ctx.moveTo(screenX, screenY);
        else ctx.lineTo(screenX, screenY);
      }

      ctx.stroke();

      // Draw connecting rungs
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)';
      ctx.lineWidth = 1;

      for (let i = 0; i < points; i += 5) {
        const angle1 = (i / points) * Math.PI * 2 * turns;
        const angle2 = (i / points) * Math.PI * 2 * turns + Math.PI;
        const y = (i / points) * 200 - 100;

        const x1 = Math.cos(angle1) * radius;
        const z1 = Math.sin(angle1) * radius;
        const scale1 = 400 / (400 + z1);

        const x2 = Math.cos(angle2) * radius;
        const z2 = Math.sin(angle2) * radius;
        const scale2 = 400 / (400 + z2);

        ctx.beginPath();
        ctx.moveTo(x1 * scale1, y * scale1);
        ctx.lineTo(x2 * scale2, y * scale2);
        ctx.stroke();
      }

      ctx.restore();

      rotation += 0.01;
      animationId = requestAnimationFrame(animate);
    };

    // Set canvas size
    canvas.width = 400;
    canvas.height = 400;

    animate();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-purple-500/30"
    />
  );
}
