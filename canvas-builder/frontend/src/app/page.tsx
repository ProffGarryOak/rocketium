'use client';

import React, { useState, useEffect } from 'react';
import Controls, { Tool } from '@/components/Controls';
import InteractiveCanvas, { CanvasElement } from '@/components/InteractiveCanvas';
import Toolbar from '@/components/Toolbar';

export default function Home() {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  
  // History State
  const [history, setHistory] = useState<CanvasElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
  
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(2);

  // Initialize Theme
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    const theme = newMode ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (newMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  };

  const addToHistory = (newElements: CanvasElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setElements(newElements);
  };

  const handleAddElement = (newEl: CanvasElement) => {
    const newElements = [...elements, newEl];
    addToHistory(newElements);
  };

  const handleRemoveElement = (index: number) => {
    const newElements = elements.filter((_, i) => i !== index);
    addToHistory(newElements);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
    }
  };

  const clearCanvas = () => {
    addToHistory([]);
  };

  const handleExport = async () => {
    try {
      const response = await fetch('http://localhost:5000/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ width, height, elements }),
      });

      if (!response.ok) {
         const err = await response.json();
         console.error(err);
         alert('Failed to generate PDF');
         return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'canvas-export.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Error exporting PDF');
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Toolbar  
        onExport={handleExport} 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        <div className={`order-2 md:order-1 flex-shrink-0 border-t md:border-t-0 md:border-r border-[var(--border-color)] transition-all duration-300 absolute md:relative z-10 w-full md:w-auto h-1/2 md:h-auto bg-[var(--panel-color)] shadow-2xl md:shadow-none ${isSidebarOpen ? 'bottom-0' : '-bottom-full md:bottom-0'}`}> 
          <Controls
            activeTool={activeTool}
          setActiveTool={setActiveTool}
          width={width} 
          height={height} 
          setWidth={setWidth} 
          setHeight={setHeight}
          currentColor={currentColor}
          setColor={setCurrentColor}
          currentStrokeWidth={currentStrokeWidth}
          setStrokeWidth={setCurrentStrokeWidth}
          onClear={clearCanvas}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onImageUpload={(file) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                  const src = e.target?.result as string;
                  // Add image element
                  const img = new Image();
                  img.src = src;
                  img.onload = () => {
                      // Scale down if huge
                      let w = img.width;
                      let h = img.height;
                      if (w > 400) { h = (400/w)*h; w = 400; }
                      
                      const newEl: CanvasElement = {
                          type: 'image',
                          x: 50,
                          y: 50,
                          width: w,
                          height: h,
                          src
                      };
                      handleAddElement(newEl);
                  };
              };
              reader.readAsDataURL(file);
          }}
        />
        </div>
        
        <main className="order-1 md:order-2 flex-1 overflow-auto bg-[var(--bg-color)] relative flex items-center justify-center p-4">
            <InteractiveCanvas 
                width={width} 
                height={height} 
                elements={elements}
                activeTool={activeTool}
                currentColor={currentColor}
                currentStrokeWidth={currentStrokeWidth}
                onElementAdd={handleAddElement}
                onElementRemove={handleRemoveElement}
                onElementUpdate={(index, newEl) => {
                    const newElements = [...elements];
                    newElements[index] = newEl;
                    setElements(newElements);
                }}
            />
        </main>
      </div>
    </div>
  );
}
