'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Circle, Text, Line, Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';

// --- Types ---
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
  activeTool: string;
  currentColor: string;
  currentStrokeWidth: number;
  onElementAdd: (el: CanvasElement) => void;
  onElementRemove?: (index: number) => void;
  onElementUpdate?: (index: number, el: CanvasElement) => void;
  selectedIndex?: number | null;
  onSelect?: (index: number | null) => void;
};

// --- Sub-components ---

const URLImage = ({ image, shapeProps }: any) => {
  const [img] = useImage(image.src);
  return <KonvaImage image={img} {...shapeProps} width={image.width} height={image.height} />;
};

const ShapeItem = ({ shape, isSelected, onSelect, onChange }: any) => {
  const shapeProps = {
    x: shape.x,
    y: shape.y,
    id: shape.id,
    fill: shape.color,
    draggable: isSelected, // Only draggable if selected
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      onChange({ ...shape, x: e.target.x(), y: e.target.y() });
    },
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      
      // Reset scale to 1 and update dimensions instead
      node.scaleX(1);
      node.scaleY(1);

      if (shape.type === 'rect' || shape.type === 'image') {
        onChange({
          ...shape,
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
        });
      } else if (shape.type === 'circle') {
        onChange({
          ...shape,
          x: node.x(),
          y: node.y(),
          radius: Math.max(5, (node as Konva.Circle).radius() * scaleX), // Use X scale
        });
      } else if (shape.type === 'text') {
        onChange({
          ...shape,
          x: node.x(),
          y: node.y(),
          fontSize: Math.max(10, shape.fontSize * scaleY),
        });
      }
    },
  };

  if (shape.type === 'rect') return <Rect {...shapeProps} width={shape.width} height={shape.height} />;
  if (shape.type === 'circle') return <Circle {...shapeProps} radius={shape.radius} />;
  if (shape.type === 'text') return <Text {...shapeProps} text={shape.text} fontSize={shape.fontSize} />;
  if (shape.type === 'image') return <URLImage image={shape} shapeProps={shapeProps} />;
  if (shape.type === 'path') {
     const points = shape.points.flatMap((p: Point) => [p.x, p.y]);
     return (
        <Line 
          {...shapeProps} 
          points={points} 
          stroke={shape.color} 
          strokeWidth={shape.strokeWidth} 
          lineCap="round" 
          lineJoin="round" 
        />
     );
  }
  return null;
};

// --- Main Component ---

export default function InteractiveCanvas({ 
  width, height, elements, activeTool, currentColor, currentStrokeWidth, 
  onElementAdd, onElementRemove, onElementUpdate,
  selectedIndex, onSelect
}: InteractiveCanvasProps) {
  
  const [newShape, setNewShape] = useState<CanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<Point | null>(null);

  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null);

  // Update Transformer selection
  useEffect(() => {
    if (selectedIndex !== null && selectedIndex !== undefined && transformerRef.current && stageRef.current) {
        const node = stageRef.current.findOne('#shape-' + selectedIndex); 
        if (node) {
             transformerRef.current.nodes([node]);
             transformerRef.current.getLayer()?.batchDraw();
        } else {
             transformerRef.current.nodes([]);
        }
    } else {
         transformerRef.current?.nodes([]);
    }
  }, [selectedIndex, elements]);

  const getPointerPos = () => stageRef.current?.getPointerPosition();

  // Changed event type to 'any' to handle both MouseEvent and TouchEvent
  const handleMouseDown = (e: Konva.KonvaEventObject<any>) => {
    // Check if we clicked on an existing shape
    const isStage = e.target === e.target.getStage();
    if (!isStage) {
        // If we clicked a shape, select it regardless of tool
        // This prevents creating text on top of other text/shapes easily, which is good UX usually
        const id = e.target.id();
        if (id && id.startsWith('shape-')) {
            const index = parseInt(id.split('-')[1]);
            if (!isNaN(index)) {
                onSelect?.(index);
                return;
            }
        }
    }

    if (activeTool === 'select') {
      if (isStage) onSelect?.(null);
      return;
    }

    const pos = getPointerPos();
    if (!pos) return;

    if (activeTool === 'text') {
        setIsDrawing(false);
        onElementAdd({
            type: 'text',
            x: pos.x,
            y: pos.y,
            text: 'Input Text Here',
            fontSize: 24,
            color: currentColor || '#000000'
        });
        // Auto-select the newly added element
        onSelect?.(elements.length);
        return;
    }

    if (activeTool === 'image') {
       e.evt.preventDefault();
       // Use timeout to avoid blocking main thread event
       setTimeout(() => {
           const url = prompt('Image URL', 'https://via.placeholder.com/150');
           if (url) onElementAdd({ type: 'image', x: pos.x, y: pos.y, width: 150, height: 150, src: url });
       }, 50);
       return;
    }

    setIsDrawing(true);
    setStartPos(pos);
    
    // Init Shape
    if (activeTool === 'rect') setNewShape({ type: 'rect', x: pos.x, y: pos.y, width: 0, height: 0, color: currentColor });
    if (activeTool === 'circle') setNewShape({ type: 'circle', x: pos.x, y: pos.y, radius: 0, color: currentColor });
    if (activeTool === 'pencil') setNewShape({ type: 'path', points: [pos], color: currentColor, strokeWidth: currentStrokeWidth });
  };

  const handleMouseMove = () => {
    if (!isDrawing || !startPos || !newShape) return;
    const pos = getPointerPos();
    if (!pos) return;

    if (activeTool === 'rect') {
        setNewShape({ ...newShape, width: pos.x - startPos.x, height: pos.y - startPos.y } as CanvasElement);
    } else if (activeTool === 'circle') {
        const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
        setNewShape({ ...newShape, radius } as CanvasElement);
    } else if (activeTool === 'pencil') {
        if (newShape.type === 'path') {
            setNewShape({ ...newShape, points: [...newShape.points, pos] });
        }
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && newShape) {
        // Validation check before add
        const isValid = 
             (newShape.type === 'rect' && (Math.abs(newShape.width) > 5)) ||
             (newShape.type === 'circle' && newShape.radius > 5) ||
             (newShape.type === 'path' && newShape.points.length > 2);
        
        if (isValid) onElementAdd(newShape);
    }
    setIsDrawing(false);
    setNewShape(null);
  };

  return (
    <div className="flex justify-center items-center p-8 bg-(--bg-color) overflow-auto">
      <div 
         className="shadow-lg border border-(--canvas-border) bg-white relative" 
         style={{ width, height, zIndex: 0 }} 
      >
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
        >
          <Layer>
            <Rect width={width} height={height} fill="white" listening={false} />
            
            {elements.map((el, i) => (
              <ShapeItem
                key={i}
                shape={{ ...el, id: `shape-${i}` }}
                isSelected={selectedIndex === i} // Just check index, tool logic handled in mouse events usually
                onSelect={() => {
                  if (activeTool === 'eraser' && onElementRemove) {
                    onElementRemove(i);
                  } else {
                    onSelect?.(i);
                  }
                }}
                onChange={(newAttrs: CanvasElement) => onElementUpdate && onElementUpdate(i, newAttrs)}
              />
            ))}

            {newShape && (
               <ShapeItem shape={{...newShape, id: 'preview'}} isSelected={false} />
            )}

            <Transformer 
                ref={transformerRef} 
                boundBoxFunc={(oldBox, newBox) => newBox.width < 5 || newBox.height < 5 ? oldBox : newBox} 
                rotateEnabled={false}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
