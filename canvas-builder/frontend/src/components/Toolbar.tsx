import { Download, Menu } from 'lucide-react';

type ToolbarProps = {
  onExport: () => void;
  onToggleSidebar?: () => void;
};

export default function Toolbar({ onExport, onToggleSidebar }: ToolbarProps) {
  return (
    <div className="flex justify-between items-center px-6 py-3 border-b border-[var(--border-color)] bg-[var(--panel-color)] shadow-sm z-20 sticky top-0">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
            <button onClick={onToggleSidebar} className="md:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors">
                <Menu size={24} className="text-[var(--text-color)]" />
            </button>
        )}
        <div className="w-8 h-8 bg-[var(--accent-color)] rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
            C
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-color)]">Canvas<span className="text-[var(--accent-color)]">Builder</span></h1>
      </div>
      
      <div className="flex gap-3">
       
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] transition-all shadow-md hover:shadow-lg font-medium"
        >
          <Download size={18} />
          <span className="hidden sm:inline">Export PDF</span>
        </button>
      </div>
    </div>
  );
}
