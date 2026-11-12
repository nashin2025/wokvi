'use client';

import { useRef, useEffect, useState } from 'react';
import { useProjectStore } from '../store';
import { cn } from '../utils/cn';

export function SchematicView() {
  const { currentProject } = useProjectStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

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

      // Draw schematic grid
      drawSchematicGrid(ctx, width, height);

      // Draw components as schematic symbols
      drawSchematicComponents(ctx);

      // Draw nets/wires
      drawNets(ctx);

      ctx.restore();
    };

    render();
  }, [currentProject, scale, pan]);

  const drawSchematicGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 50;
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 0.5;

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Major grid lines
    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += gridSize * 5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize * 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawSchematicComponents = (ctx: CanvasRenderingContext2D) => {
    if (!currentProject) return;

    currentProject.components.forEach((comp) => {
      const { x, y } = comp.position;
      
      ctx.save();
      ctx.translate(x, y);

      // Draw component symbol based on type
      drawSymbol(ctx, comp.componentId);

      // Draw reference designator
      ctx.fillStyle = '#18181b';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(comp.id.slice(0, 8), 0, -40);

      ctx.restore();
    });
  };

  const drawSymbol = (ctx: CanvasRenderingContext2D, componentId: string) => {
    // Simplified - draw a generic IC symbol
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = '#fafafa';

    // Body
    ctx.beginPath();
    ctx.roundRect(-30, -25, 60, 50, 4);
    ctx.fill();
    ctx.stroke();

    // Pins
    ctx.fillStyle = '#ef4444';
    for (let i = 0; i < 8; i++) {
      const py = -20 + i * 5;
      // Left pins
      ctx.beginPath();
      ctx.arc(-32, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Right pins
      ctx.beginPath();
      ctx.arc(32, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pin numbers
    ctx.fillStyle = '#18181b';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i < 8; i++) {
      const py = -20 + i * 5;
      ctx.fillText(`${i + 1}`, -35, py + 3);
    }
    ctx.textAlign = 'left';
    for (let i = 0; i < 8; i++) {
      const py = -20 + i * 5;
      ctx.fillText(`${i + 9}`, 35, py + 3);
    }
  };

  const drawNets = (ctx: CanvasRenderingContext2D) => {
    if (!currentProject) return;

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    currentProject.wires.forEach((wire) => {
      const fromComp = currentProject.components.find((c) => c.id === wire.from.componentId);
      const toComp = currentProject.components.find((c) => c.id === wire.to.componentId);

      if (!fromComp || !toComp) return;

      // Simplified - draw straight line between component centers
      ctx.beginPath();
      ctx.moveTo(fromComp.position.x, fromComp.position.y);
      ctx.lineTo(toComp.position.x, toComp.position.y);
      ctx.stroke();

      // Draw junction dots
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(fromComp.position.x, fromComp.position.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(toComp.position.x, toComp.position.y, 3, 0, Math.PI * 2);
      ctx.fill();
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
        <div>Schematic View</div>
        <div className="mt-1">Components: {currentProject?.components.length || 0}</div>
        <div>Nets: {currentProject?.wires.length || 0}</div>
      </div>
    </div>
  );
}