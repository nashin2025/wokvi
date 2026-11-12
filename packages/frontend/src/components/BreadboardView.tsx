'use client';

import { useRef, useEffect, useState } from 'react';
import { useProjectStore } from '../store';
import { cn } from '../utils/cn';

export function BreadboardView() {
  const { currentProject } = useProjectStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Breadboard dimensions
  const BREADBOARD_WIDTH = 600;
  const BREADBOARD_HEIGHT = 400;
  const HOLE_SPACING = 2.54 * 3.78; // 2.54mm in pixels (approx)
  const ROWS = 30;
  const COLS = 2 * 5 + 2 * 5; // Two power rails + two terminal strips

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      ctx.save();
      ctx.clearRect(0, 0, width, height);
      ctx.translate(pan.x, pan.y);
      ctx.scale(scale, scale);

      // Center breadboard
      const bbX = (width / scale - BREADBOARD_WIDTH) / 2;
      const bbY = (height / scale - BREADBOARD_HEIGHT) / 2;

      // Draw breadboard
      drawBreadboard(ctx, bbX, bbY);

      // Draw components
      drawComponents(ctx, bbX, bbY);

      // Draw wires
      drawWires(ctx, bbX, bbY);

      ctx.restore();
    };

    render();
  }, [currentProject, scale, pan]);

  const drawBreadboard = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Breadboard body
    ctx.fillStyle = '#f5f5f4';
    ctx.strokeStyle = '#d6d3d1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, BREADBOARD_WIDTH, BREADBOARD_HEIGHT, 8);
    ctx.fill();
    ctx.stroke();

    // Center notch
    ctx.fillStyle = '#e7e5e4';
    ctx.beginPath();
    ctx.roundRect(x + BREADBOARD_WIDTH / 2 - 10, y, 20, BREADBOARD_HEIGHT, 2);
    ctx.fill();

    // Draw holes
    ctx.fillStyle = '#a8a29e';
    const holeRadius = 1.5;

    // Power rails (top and bottom)
    for (let rail = 0; rail < 2; rail++) {
      const railY = y + (rail === 0 ? 20 : BREADBOARD_HEIGHT - 20);
      for (let side = 0; side < 2; side++) {
        const railX = x + (side === 0 ? 20 : BREADBOARD_WIDTH - 20 - 5 * HOLE_SPACING);
        // Positive rail (red)
        ctx.fillStyle = '#ef4444';
        for (let i = 0; i < 30; i++) {
          const hx = railX + (i % 5) * HOLE_SPACING;
          const hy = railY + Math.floor(i / 5) * HOLE_SPACING * 2;
          ctx.beginPath();
          ctx.arc(hx, hy, holeRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        // Negative rail (blue)
        ctx.fillStyle = '#3b82f6';
        for (let i = 0; i < 30; i++) {
          const hx = railX + (i % 5) * HOLE_SPACING + 2 * HOLE_SPACING;
          const hy = railY + Math.floor(i / 5) * HOLE_SPACING * 2;
          ctx.beginPath();
          ctx.arc(hx, hy, holeRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Terminal strips (center area)
    for (let strip = 0; strip < 2; strip++) {
      const stripX = x + (strip === 0 ? 60 : BREADBOARD_WIDTH - 60 - 5 * HOLE_SPACING);
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < 5; col++) {
          const hx = stripX + col * HOLE_SPACING;
          const hy = y + 40 + row * HOLE_SPACING;
          ctx.fillStyle = '#a8a29e';
          ctx.beginPath();
          ctx.arc(hx, hy, holeRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Row/column labels
    ctx.fillStyle = '#78716c';
    ctx.font = '8px Inter, sans-serif';
    ctx.textAlign = 'center';
    for (let row = 0; row < ROWS; row++) {
      const hy = y + 40 + row * HOLE_SPACING;
      ctx.fillText(`${row + 1}`, x + 45, hy + 3);
      ctx.fillText(`${row + 1}`, x + BREADBOARD_WIDTH - 45, hy + 3);
    }
    for (let col = 0; col < 5; col++) {
      const hx = x + 60 + col * HOLE_SPACING;
      ctx.fillText(String.fromCharCode(65 + col), hx, y + 30);
      const hx2 = x + BREADBOARD_WIDTH - 60 - 5 * HOLE_SPACING + col * HOLE_SPACING;
      ctx.fillText(String.fromCharCode(65 + col), hx2, y + 30);
    }
  };

  const drawComponents = (ctx: CanvasRenderingContext2D, bbX: number, bbY: number) => {
    if (!currentProject) return;

    currentProject.components.forEach((comp) => {
      const { x, y } = comp.position;
      const w = 60;
      const h = 40;

      ctx.save();
      ctx.translate(bbX + x, bbY + y);

      // Component body (DIP package style)
      ctx.fillStyle = '#1c1917';
      ctx.strokeStyle = '#44403c';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 4);
      ctx.fill();
      ctx.stroke();

      // Notch
      ctx.fillStyle = '#44403c';
      ctx.beginPath();
      ctx.arc(0, -h / 2, 4, Math.PI, 0);
      ctx.fill();

      // Pins
      ctx.fillStyle = '#a8a29e';
      for (let i = 0; i < 8; i++) {
        const px = -w / 2 - 4;
        const py = -h / 2 + 5 + i * 5;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 8; i++) {
        const px = w / 2 + 4;
        const py = -h / 2 + 5 + i * 5;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Label
      ctx.fillStyle = '#fafaf9';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(comp.componentId.slice(0, 10), 0, 3);

      ctx.restore();
    });
  };

  const drawWires = (ctx: CanvasRenderingContext2D, bbX: number, bbY: number) => {
    if (!currentProject) return;

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    currentProject.wires.forEach((wire) => {
      const fromComp = currentProject.components.find((c) => c.id === wire.from.componentId);
      const toComp = currentProject.components.find((c) => c.id === wire.to.componentId);

      if (!fromComp || !toComp) return;

      // Simplified - draw wire between component positions
      const fromX = bbX + fromComp.position.x;
      const fromY = bbY + fromComp.position.y;
      const toX = bbX + toComp.position.x;
      const toY = bbY + toComp.position.y;

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      // Manhattan routing
      const midX = (fromX + toX) / 2;
      ctx.lineTo(midX, fromY);
      ctx.lineTo(midX, toY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
    });
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        onWheel={(e) => {
          e.preventDefault();
          const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
          setScale((prev) => Math.max(0.1, Math.min(5, prev * zoomFactor)));
        }}
      />
      
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button onClick={() => setScale((s) => Math.min(5, s * 1.2))} className="btn-secondary p-2">+</button>
        <button onClick={() => setScale((s) => Math.max(0.1, s / 1.2))} className="btn-secondary p-2">-</button>
        <button onClick={() => setScale(1)} className="btn-secondary p-2">100%</button>
      </div>

      <div className="absolute top-4 left-4 card p-3 text-xs text-surface-600 dark:text-surface-400">
        <div>Breadboard View</div>
        <div className="mt-1">Components: {currentProject?.components.length || 0}</div>
        <div>Wires: {currentProject?.wires.length || 0}</div>
      </div>
    </div>
  );
}