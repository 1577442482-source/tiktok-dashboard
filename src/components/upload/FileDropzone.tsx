import { useState, useRef, type DragEvent } from 'react';
import { Upload } from 'lucide-react';

interface FileDropzoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export default function FileDropzone({ onFile, disabled }: FileDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.csv') || file.name.endsWith('.xls'))) {
      onFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
        disabled
          ? 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
          : dragOver
            ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
            : 'border-slate-600 hover:border-emerald-300 bg-slate-700 hover:shadow-sm'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
      <div className={`inline-flex p-4 rounded-full mb-4 transition-colors ${dragOver ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
        <Upload size={32} strokeWidth={1.5} className={dragOver ? 'text-emerald-500' : 'text-slate-400'} />
      </div>
      <p className="text-base text-slate-400 font-medium">
        拖拽 Excel 文件到此处，或点击选择文件
      </p>
      <p className="text-sm text-slate-400 mt-2">
        支持 .xlsx / .xls / .csv 格式
      </p>
    </div>
  );
}
