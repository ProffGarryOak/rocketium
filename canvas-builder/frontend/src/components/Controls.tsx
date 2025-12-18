'use client';

import React from 'react';
import { MousePointer2, Pencil, Eraser, Square, Circle, Type, ImageIcon, Undo2, Redo2 } from 'lucide-react';
export type Tool = 'select' | 'rect' | 'circle' | 'text' | 'image' | 'pencil' | 'eraser';

type ControlsProps = {
  activeTool: Tool;
  setActiveTool: (t: Tool) => void;
  width: number;
  height: number;
  setWidth: (w: number) => void;
  setHeight: (h: number) => void;
  currentColor: string;
  setColor: (c: string) => void;
  currentStrokeWidth: number;
  setStrokeWidth: (w: number) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onImageUpload?: (file: File) => void;
};

export default function Controls({ 
    activeTool, 
    setActiveTool, 
    width, height, setWidth, setHeight, 
    currentColor, setColor,
    currentStrokeWidth, setStrokeWidth,
    onClear,
    onUndo, onRedo, canUndo, canRedo,
    onImageUpload
}: ControlsProps) {
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleToolClick = (toolId: Tool) => {
      if (toolId === 'image' && onImageUpload) {
          fileInputRef.current?.click();
      }
      setActiveTool(toolId);
  };
   
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && onImageUpload) {
          const file = e.target.files[0];
          if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
              onImageUpload(file);
          } else {
              alert('Only JPEG images are allowed');
          }
      }
      // Reset value so we can select same file again
      e.target.value = '';
      // Switch back to select after upload attempt usually makes sense
      setActiveTool('select');
  };

// ... (inside component)

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/jpeg, image/jpg" 
        className="hidden" 
      />



// ... (inside component)

  const inputClass = "w-full p-2 mb-2 border rounded text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-[var(--text-color)] focus:ring-2 focus:ring-blue-500 outline-none transition-colors";
  const labelClass = "block text-xs font-semibold mb-1 text-[var(--text-color)] uppercase tracking-wide opacity-70";
  
  const tools: { id: Tool; label: string; icon: React.ReactNode }[] = [
    { id: 'select', label: 'Select', icon: <MousePointer2 size={20} /> },
    { id: 'pencil', label: 'Pencil', icon: <Pencil size={20} /> },
    { id: 'eraser', label: 'Eraser', icon: <Eraser size={20} /> },
    { id: 'rect', label: 'Rectangle', icon: <Square size={20} /> },
    { id: 'circle', label: 'Circle', icon: <Circle size={20} /> },
    { id: 'text', label: 'Text', icon: <Type size={20} /> },
    { id: 'image', label: 'Image', icon: <ImageIcon size={20} /> },
  ];

  return (
    <div className="w-full md:w-72 p-4 border-t md:border-t-0 md:border-r border-[var(--border-color)] bg-[var(--panel-color)] flex flex-col gap-6 h-full md:h-screen overflow-y-auto shadow-xl z-30">
      
      {/* Config */}
      <section>
        <h2 className="font-bold mb-3 text-xs uppercase tracking-wider text-[var(--text-muted)]">Canvas Size</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
                <label className={labelClass}>Width</label>
                <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} className={inputClass} />
            </div>
            <div>
                <label className={labelClass}>Height</label>
                <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className={inputClass} />
            </div>
        </div>
               <div className="flex gap-2 mb-3">
            <button onClick={onUndo} disabled={!canUndo} className="flex-1 flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-2 rounded-lg disabled:opacity-50 text-sm font-medium transition-colors text-[var(--text-color)]" title="Undo">
                <Undo2 size={16} /> <span className="hidden sm:inline">Undo</span>
            </button>
            <button onClick={onRedo} disabled={!canRedo} className="flex-1 flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-2 rounded-lg disabled:opacity-50 text-sm font-medium transition-colors text-[var(--text-color)]" title="Redo">
                <span className="hidden sm:inline">Redo</span> <Redo2 size={16} />
            </button>
        </div>
        <button onClick={onClear} className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-medium border border-red-200 dark:border-red-900/30">
            Clear Canvas
        </button>
      </section>

      {/* Tools */}
      <section>
        <h2 className="font-bold mb-3 text-xs uppercase tracking-wider text-[var(--text-muted)]">Tools</h2>
        <div className="grid grid-cols-4 gap-2">
            {tools.map(t => (
                <button 
                    key={t.id} 
                    onClick={() => handleToolClick(t.id)}
                    className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-all aspect-square
                        ${activeTool === t.id 
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500 dark:ring-blue-400 shadow-sm' 
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                    title={t.label}
                >
                    {t.icon}
                </button>
            ))}
        </div>
      </section>

      {/* Properties */}
      <section>
        <h2 className="font-bold mb-3 text-xs uppercase tracking-wider text-[var(--text-muted)]">Properties</h2>
        <label className={labelClass}>Color</label>
        <div className="flex gap-2 items-center mb-4">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-[var(--border-color)] shadow-sm">
                <input type="color" value={currentColor} onChange={e => setColor(e.target.value)} className="absolute -top-2 -left-2 w-16 h-16 p-0 border-0 cursor-pointer" />
            </div>
            <input type="text" value={currentColor} onChange={e => setColor(e.target.value)} className={`${inputClass} font-mono`} />
        </div>
        
        {activeTool === 'pencil' && (
            <>
                <div className="flex justify-between items-center mb-1">
                    <label className={labelClass}>Stroke Width</label>
                    <span className="text-xs font-mono text-[var(--text-muted)]">{currentStrokeWidth}px</span>
                </div>
                <input 
                    type="range" 
                    min="1" max="20" 
                    value={currentStrokeWidth} 
                    onChange={e => setStrokeWidth(Number(e.target.value))} 
                    className="w-full accent-blue-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
            </>
        )}
      </section>
      
      <div className="mt-auto pt-6 text-[10px] text-center text-[var(--text-muted)] border-t border-[var(--border-color)]">
        Select tool & drag on canvas
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/jpeg, image/jpg" 
        className="hidden" 
      />
    </div>
  );
}
