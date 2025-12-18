'use client';

import React, { useRef, useEffect, useState } from 'react';

export type Point = { x: number; y: number };

export type CanvasElement = 
  | { type: 'rect'; x: number; y: number; width: number; height: number; color: string }
  | { type: 'circle'; x: number; y: number; radius: number; color: string }
  | { type: 'text'; x: number; y: number; text: string; fontSize: number; color: string }
  | { type: 'image'; x: number; y: number; width: number; height: number; src: string }
  | { type: 'path'; points: Point[]; color: string; strokeWidth: number };

type InteractiveCanvasProps = {
  width: number;
  height: number;
  elements: CanvasElement[];
  activeTool: 'select' | 'rect' | 'circle' | 'text' | 'image' | 'pencil' | 'eraser';
  currentColor: string;
  currentStrokeWidth: number;
  onElementAdd: (el: CanvasElement) => void;
  onElementRemove?: (index: number) => void;
  onElementUpdate?: (index: number, el: CanvasElement) => void;
};

const HANDLE_SIZE = 8;

export default function InteractiveCanvas({ 
  width, 
  height, 
  elements, 
  activeTool,
  currentColor,
  currentStrokeWidth,
  onElementAdd,
  onElementRemove,
  onElementUpdate
}: InteractiveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null); // 'nw', 'ne', 'sw', 'se'
  
  const [startPos, setStartPos] = useState<Point | null>(null);
  const [currentPos, setCurrentPos] = useState<Point | null>(null);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  
  // Inline Text Editing
  const [editingText, setEditingText] = useState<{ x: number; y: number; value: string } | null>(null);
  
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [initialElementState, setInitialElementState] = useState<CanvasElement | null>(null);

  // Helper to check if point is on a handle
  const getResizeHandle = (x: number, y: number, el: CanvasElement) => {
    if (el.type === 'path' || el.type === 'text') return null; // Simple resize for now only rect/circle/image
    const right = el.x + (el.type === 'circle' ? el.radius * 2 : (el as any).width || 0);
    const bottom = el.y + (el.type === 'circle' ? el.radius * 2 : (el as any).height || 0);
    // For circle, we treat x,y as top-left of bounding box for resize logic simplicity
    
    // Handles: nw, ne, sw, se
    const handles = [
        { id: 'nw', x: el.x, y: el.y },
        { id: 'ne', x: right, y: el.y },
        { id: 'sw', x: el.x, y: bottom },
        { id: 'se', x: right, y: bottom }
    ];

    for (const h of handles) {
        if (x >= h.x - HANDLE_SIZE && x <= h.x + HANDLE_SIZE && y >= h.y - HANDLE_SIZE && y <= h.y + HANDLE_SIZE) {
            return h.id;
        }
    }
    return null;
  };

  // Redraw canvas whenever dependencies change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and set background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Helper to draw an element
    const drawElement = (el: CanvasElement) => {
      if (el.type === 'rect') {
        ctx.fillStyle = el.color;
        ctx.fillRect(el.x, el.y, el.width, el.height);
      } else if (el.type === 'circle') {
        ctx.beginPath();
        ctx.arc(el.x, el.y, el.radius, 0, Math.PI * 2);
        ctx.fillStyle = el.color;
        ctx.fill();
      } else if (el.type === 'text') {
        ctx.font = `${el.fontSize}px sans-serif`;
        ctx.fillStyle = el.color;
        ctx.fillText(el.text, el.x, el.y);
      } else if (el.type === 'image') {
        const img = new Image();
        img.src = el.src;
        if (img.complete) {
            ctx.drawImage(img, el.x, el.y, el.width, el.height);
        } else {
            img.onload = () => ctx.drawImage(img, el.x, el.y, el.width, el.height);
        }
      } else if (el.type === 'path') {
        if (el.points.length < 2) return;
        ctx.beginPath();
        ctx.lineWidth = el.strokeWidth;
        ctx.strokeStyle = el.color;
        ctx.lineCap = 'round';
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.stroke();
      }
    };

    // Draw existing elements
    elements.forEach(drawElement);

    // Draw preview of current operation
    if (isDrawing && startPos && currentPos) {
      if (activeTool === 'rect') {
        const w = currentPos.x - startPos.x;
        const h = currentPos.y - startPos.y;
        ctx.fillStyle = currentColor + '80'; // transparent preview
        ctx.fillRect(startPos.x, startPos.y, w, h);
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(startPos.x, startPos.y, w, h);
      } else if (activeTool === 'circle') {
        const radius = Math.sqrt(Math.pow(currentPos.x - startPos.x, 2) + Math.pow(currentPos.y - startPos.y, 2));
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = currentColor + '80';
        ctx.fill();
        ctx.strokeStyle = currentColor;
        ctx.stroke();
      }
    }

    // Draw current path being drawn
    if (isDrawing && activeTool === 'pencil' && currentPath.length > 1) {
       ctx.beginPath();
       ctx.lineWidth = currentStrokeWidth;
       ctx.strokeStyle = currentColor;
       ctx.lineCap = 'round';
       ctx.moveTo(currentPath[0].x, currentPath[0].y);
       for (let i = 1; i < currentPath.length; i++) {
           ctx.lineTo(currentPath[i].x, currentPath[i].y);
       }
       ctx.stroke();
    }

    // Draw selection handles if selected
    if (selectedIndex !== null && elements[selectedIndex]) {
        const el = elements[selectedIndex];
        // Don't draw handles for path for now (too complex)
        if (el.type !== 'path') {
            const x = el.x;
            const y = el.y;
            const w = el.type === 'circle' ? el.radius * 2 : (el as any).width || 0;
            const h = el.type === 'circle' ? el.radius * 2 : (el as any).height || (el as any).fontSize || 0;
            
            // Draw Bounding Box
            ctx.strokeStyle = '#2196f3';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, w, h);

            // Draw Handles
            if (el.type !== 'text') { // Text resize logic is font-size based, different interaction
                const right = x + w;
                const bottom = y + h;
                const handles = [
                    { x: x, y: y }, { x: right, y: y },
                    { x: x, y: bottom }, { x: right, y: bottom }
                ];
                ctx.fillStyle = '#2196f3';
                handles.forEach(h => {
                    ctx.fillRect(h.x - HANDLE_SIZE/2, h.y - HANDLE_SIZE/2, HANDLE_SIZE, HANDLE_SIZE);
                });
            }
        }
    }

  }, [width, height, elements, isDrawing, startPos, currentPos, currentPath, activeTool, currentColor, currentStrokeWidth, selectedIndex]);

  const getPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getPos(e);

    // 1. SELECT / MOVE / RESIZE LOGIC
    if (activeTool === 'select') {
        // Check for resize handles first
        if (selectedIndex !== null && elements[selectedIndex]) {
            const handle = getResizeHandle(pos.x, pos.y, elements[selectedIndex]);
            if (handle) {
                setIsResizing(handle);
                setStartPos(pos);
                setInitialElementState({ ...elements[selectedIndex] });
                return;
            }
        }

        // Check for object hit
        // Iterate backwards
        for (let i = elements.length - 1; i >= 0; i--) {
            const el = elements[i];
            let hit = false;
            // Re-use hit logic (should extract to helper)
            if (el.type === 'rect' || el.type === 'image') {
                  const x = el.width < 0 ? el.x + el.width : el.x;
                  const y = el.height < 0 ? el.y + el.height : el.y;
                  const w = Math.abs(el.width);
                  const h = Math.abs(el.height);
                  hit = pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h;
            } else if (el.type === 'circle') {
                 // Simplified box hit for selection to make it easier or circle hit? Circle hit is fine.
                 // Treat circle x,y as top-left for bounding box consistency? 
                 // Previous code used x,y as center. Let's consistency check.
                 // 'circle' adds x,y as top-left in handleMouseUp below? NO, it adds as START POS.
                 // Wait, circle drawing in handleMouseUp:
                 // x: startPos.x, y: startPos.y, radius: ...
                 // ctx.arc(el.x, el.y, ...) -> so startPos IS CENTER.
                 // But bounding box logic above assumes x,y is top-left? 
                 // FIX: For circle, logic above used radius*2 for w/h. That implies x,y is top-left.
                 // But drawing uses x,y as center. 
                 // Let's standardise: x,y is CENTER for circle rendering.
                 // So bounding box should be x-r, y-r.
                 const dist = Math.sqrt(Math.pow(pos.x - el.x, 2) + Math.pow(pos.y - el.y, 2));
                 hit = dist <= el.radius;
            } else if (el.type === 'text') {
                 hit = pos.x >= el.x && pos.x <= el.x + (el.fontSize * el.text.length * 0.6) && pos.y <= el.y && pos.y >= el.y - el.fontSize;
            } else if (el.type === 'path') {
                 // For now, simpler path hit
                 // ... (existing logic)
                 const canvas = canvasRef.current;
                   const ctx = canvas?.getContext('2d');
                   if (ctx) {
                       ctx.beginPath();
                       ctx.lineWidth = el.strokeWidth + 10;
                       if (el.points.length > 0) {
                           ctx.moveTo(el.points[0].x, el.points[0].y);
                           for(let p of el.points) ctx.lineTo(p.x, p.y);
                           hit = ctx.isPointInStroke(pos.x, pos.y);
                       }
                   }
            }

            if (hit) {
                setSelectedIndex(i);
                setIsDragging(true);
                setStartPos(pos);
                setInitialElementState({ ...el });
                return;
            }
        }
        
        // Clicked empty space
        setSelectedIndex(null);
        return;
    }

    // 2. ERASER LOGIC (Existing)
    if (activeTool === 'eraser') {
       if (onElementRemove) {
          // Find topmost element under cursor (iterate backwards)
          for (let i = elements.length - 1; i >= 0; i--) {
              const el = elements[i];
              let hit = false;
              if (el.type === 'rect' || el.type === 'image') {
                  // Normalize dimensions for hit detection (handle negative width/height)
                  const x = el.width < 0 ? el.x + el.width : el.x;
                  const y = el.height < 0 ? el.y + el.height : el.y;
                  const w = Math.abs(el.width);
                  const h = Math.abs(el.height);
                  hit = pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h;
              } else if (el.type === 'circle') {
                  const dist = Math.sqrt(Math.pow(pos.x - el.x, 2) + Math.pow(pos.y - el.y, 2));
                  hit = dist <= el.radius;
              } else if (el.type === 'text') {
                  // Rough approximation for text
                  hit = pos.x >= el.x && pos.x <= el.x + (el.fontSize * el.text.length * 0.6) && pos.y <= el.y && pos.y >= el.y - el.fontSize;
              } else if (el.type === 'path') {
                  // Simple bounding box for path default, ideally use isPointInStroke
                  // For now, let's use canvas API isPointInStroke
                   const canvas = canvasRef.current;
                   const ctx = canvas?.getContext('2d');
                   if (ctx) {
                       ctx.beginPath();
                       ctx.lineWidth = el.strokeWidth + 5; // Easier hit area
                       if (el.points.length > 0) {
                           ctx.moveTo(el.points[0].x, el.points[0].y);
                           for(let p of el.points) ctx.lineTo(p.x, p.y);
                           hit = ctx.isPointInStroke(pos.x, pos.y);
                       }
                   }
              }

              if (hit) {
                  onElementRemove(i);
                  return; // Remove one at a time
              }
          }
       }
       return;
    }

    // 3. DRAWING LOGIC (Existing)
    setIsDrawing(true);
    setStartPos(pos);
    setCurrentPos(pos);

    if (activeTool === 'pencil') {
        setCurrentPath([pos]);
    } else if (activeTool === 'text') {
        e.preventDefault(); // Prevent canvas from keeping focus
        setEditingText({ x: pos.x, y: pos.y, value: '' });
        setIsDrawing(false); 
    } else if (activeTool === 'image') {
        const url = prompt('Enter Image URL:', 'https://via.placeholder.com/150');
        if (url) {
             onElementAdd({
               type: 'image',
               x: pos.x,
               y: pos.y,
               width: 150,
               height: 150,
               src: url
           });
           setIsDrawing(false);
        }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getPos(e);
    
    // Set Cursor if hovering handles in select mode
    if (activeTool === 'select' && !isDragging && !isResizing && selectedIndex !== null && elements[selectedIndex]) {
        const handle = getResizeHandle(pos.x, pos.y, elements[selectedIndex]);
        if (handle) {
            if (canvasRef.current) canvasRef.current.style.cursor = handle === 'nw' || handle === 'se' ? 'nwse-resize' : 'nesw-resize';
        } else {
             if (canvasRef.current) canvasRef.current.style.cursor = 'default';
        }
    }

    if (isDragging && selectedIndex !== null && startPos && initialElementState && onElementUpdate) {
        const dx = pos.x - startPos.x;
        const dy = pos.y - startPos.y;
             if (activeTool !== 'pencil' && onElementUpdate) {
                // Determine new state safely (exclude path for now as it uses different logic)
                onElementUpdate(selectedIndex, { 
                    ...initialElementState, 
                    x: (initialElementState as any).x + dx, 
                    y: (initialElementState as any).y + dy 
                } as CanvasElement);
             }
             return;
        }

    if (isResizing && selectedIndex !== null && startPos && initialElementState && onElementUpdate) {
        const dx = pos.x - startPos.x;
        const dy = pos.y - startPos.y;
        
        // Force non-null casting effectively
        const el = { ...initialElementState } as CanvasElement;
        
        if (el.type === 'rect' || el.type === 'image') {
             let newW = el.width;
             let newH = el.height;
             let newX = el.x;
             let newY = el.y;

             if (isResizing === 'se') {
                 newW += dx;
                 newH += dy;
             } else if (isResizing === 'sw') {
                 newX += dx;
                 newW -= dx;
                 newH += dy;
             } else if (isResizing === 'nw') {
                 newX += dx;
                 newY += dy;
                 newW -= dx;
                 newH -= dy;
             } else if (isResizing === 'ne') {
                 newY += dy;
                 newW += dx;
                 newH -= dy;
             }
             
             onElementUpdate(selectedIndex, { ...el, width: newW, height: newH, x: newX, y: newY } as CanvasElement);
        } else if (el.type === 'circle') {
             const dr = dx; 
             onElementUpdate(selectedIndex, { ...el, radius: el.radius + dr/2 } as CanvasElement);
        }
        return;
    }

    if (!isDrawing) return;
    
    setCurrentPos(pos);
    
    if (activeTool === 'pencil') {
        setCurrentPath(prev => [...prev, pos]);
    }
  };

  const handleMouseUp = () => {
    if (isDragging || isResizing) {
        setIsDragging(false);
        setIsResizing(null);
        setStartPos(null);
        setInitialElementState(null);
        return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (activeTool === 'pencil') {
        onElementAdd({
            type: 'path',
            points: currentPath,
            color: currentColor,
            strokeWidth: currentStrokeWidth
        });
        setCurrentPath([]);
    } else if (activeTool === 'rect' && startPos && currentPos) {
        onElementAdd({
            type: 'rect',
            x: startPos.x,
            y: startPos.y,
            width: currentPos.x - startPos.x,
            height: currentPos.y - startPos.y,
            color: currentColor
        });
    } else if (activeTool === 'circle' && startPos && currentPos) {
        const radius = Math.sqrt(Math.pow(currentPos.x - startPos.x, 2) + Math.pow(currentPos.y - startPos.y, 2));
        onElementAdd({
            type: 'circle',
            x: startPos.x,
            y: startPos.y,
            radius: radius,
            color: currentColor
        });
    }
    
    setStartPos(null);
    setCurrentPos(null);
  };

  return (
    <div className="flex justify-center items-center p-8 bg-[var(--bg-color)] overflow-auto cursor-crosshair">
       <div style={{ position: 'relative', width, height }} className="shadow-lg border border-[var(--canvas-border)] bg-white">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="block"
            style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
          />
          {editingText && (
              <input
                autoFocus
                type="text"
                value={editingText.value}
                onChange={(e) => setEditingText({ ...editingText, value: e.target.value })}
                onBlur={() => {
                    if (editingText.value.trim()) {
                        onElementAdd({
                            type: 'text',
                            x: editingText.x,
                            y: editingText.y,
                            text: editingText.value,
                            fontSize: 24,
                            color: currentColor
                        });
                    }
                    setEditingText(null);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.currentTarget.blur();
                    }
                }}
                style={{
                    position: 'absolute',
                    left: editingText.x,
                    top: editingText.y,
                    fontSize: '24px',
                    color: currentColor,
                    border: '1px dashed #333',
                    background: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    outline: 'none',
                    minWidth: '100px',
                    padding: '4px 8px',
                    margin: 0,
                    zIndex: 1000,
                    lineHeight: 1,
                    borderRadius: '4px'
                }}
              />
          )}
       </div>
    </div>
  );
}
