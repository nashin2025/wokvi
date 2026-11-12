'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useProjectStore } from '../store';
import { cn } from '../utils/cn';
import { PlacedComponent, Wire } from '../types';

export function Canvas() {
  const { currentProject, addComponent, removeComponent, updateComponent, addWire, removeWire, updateWire } = useProjectStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [wireStart, setWireStart] = useState<{ componentId: string; pinId: string } | null>(null);

  const components = currentProject?.components || [];
  const wires = currentProject?.wires || [];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Render loop
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

      // Apply transform
      ctx.translate(pan.x, pan.y);
      ctx.scale(scale, scale);

      // Draw grid
      drawGrid(ctx, width, height);

      // Draw wires
      drawWires(ctx, wires, components);

      // Draw components
      drawComponents(ctx, components);

      // Draw wire preview
      if (wireStart) {
        const startComp = components.find((c) => c.id === wireStart.componentId);
        if (startComp) {
          const pin = getPinPosition(startComp, wireStart.pinId);
          // TODO: Draw preview wire to mouse position
        }
      }

      ctx.restore();
    };

    render();
  }, [components, wires, scale, pan, wireStart]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20;
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
  };

  const drawComponents = (ctx: CanvasRenderingContext2D, comps: PlacedComponent[]) => {
    comps.forEach((comp) => {
      const isSelected = comp.id === selectedComponent;
      const { x, y } = comp.position;
      const w = 80;
      const h = 60;

      ctx.save();
      ctx.translate(x, y);
      if (comp.rotation) {
        ctx.rotate((comp.rotation * Math.PI) / 180);
      }

      // Component body
      ctx.fillStyle = isSelected ? '#3b82f6' : '#ffffff';
      ctx.strokeStyle = isSelected ? '#2563eb' : '#d4d4d8';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 8);
      ctx.fill();
      ctx.stroke();

      // Component label
      ctx.fillStyle = isSelected ? '#ffffff' : '#18181b';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(comp.componentId.slice(0, 12), 0, 0);

      // Pin indicators
      ctx.fillStyle = '#ef4444';
      for (let i = 0; i < 8; i++) {
        const px = -w / 2 - 4;
        const py = -h / 2 + 10 + i * 6;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  };

  const drawWires = (ctx: CanvasRenderingContext2D, wires: Wire[], comps: PlacedComponent[]) => {
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    wires.forEach((wire) => {
      const fromComp = comps.find((c) => c.id === wire.from.componentId);
      const toComp = comps.find((c) => c.id === wire.to.componentId);

      if (!fromComp || !toComp) return;

      const fromPin = getPinPosition(fromComp, wire.from.pinId);
      const toPin = getPinPosition(toComp, wire.to.pinId);

      ctx.beginPath();
      ctx.moveTo(fromPin.x, fromPin.y);

      if (wire.path.length > 0) {
        wire.path.forEach((p) => ctx.lineTo(p.x, p.y));
      }

      ctx.lineTo(toPin.x, toPin.y);
      ctx.stroke();
    });
  };

  const getPinPosition = (comp: PlacedComponent, pinId: string) => {
    // Simplified - return component center for now
    return {
      x: comp.position.x,
      y: comp.position.y,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - pan.x) / scale;
    const y = (e.clientY - rect.top - pan.y) / scale;

    // Check if clicking on a component
    const clickedComp = components.find((comp) => {
      const w = 80;
      const h = 60;
      return (
        x >= comp.position.x - w / 2 &&
        x <= comp.position.x + w / 2 &&
        y >= comp.position.y - h / 2 &&
        y <= comp.position.y + h / 2
      );
    });

    if (clickedComp) {
      setSelectedComponent(clickedComp.id);
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      setSelectedComponent(null);
      // Start panning
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    if (selectedComponent) {
      // Drag component
      const comp = components.find((c) => c.id === selectedComponent);
      if (comp) {
        updateComponent(selectedComponent, {
          position: {
            x: comp.position.x + dx / scale,
            y: comp.position.y + dy / scale,
          },
        });
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    } else {
      // Pan canvas
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, scale * zoomFactor));
    setScale(newScale);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - pan.x) / scale;
    const y = (e.clientY - rect.top - pan.y) / scale;

    // Add new component at position
    addComponent({
      id: crypto.randomUUID(),
      componentId: 'generic-ic',
      position: { x, y },
      rotation: 0,
      properties: {},
    });
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      />
      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={() => setScale(Math.min(5, scale * 1.2))}
          className="btn-secondary p-2"
        >
          +
        </button>
        <button
          onClick={() => setScale(Math.max(0.1, scale / 1.2))}
          className="btn-secondary p-2"
        >
          -
        </button>
        <button
          onClick={() => setScale(1)}
          className="btn-secondary p-2"
        >
          100%
        </button>
      </div>

      {/* Selection Info */}
      {selectedComponent && (
        <div className="absolute top-4 left-4 card p-2 text-xs">
          Selected: {selectedComponent.slice(0, 8)}...
        </div>
      )}
    </div>
  );
}