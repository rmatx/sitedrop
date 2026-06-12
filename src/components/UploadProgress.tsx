import { Loader2, FileUp } from 'lucide-react';
import { formatBytes } from '../utils/files';

interface UploadProgressProps {
  current: number;
  total: number;
  currentFile: string;
  uploadedBytes: number;
  totalBytes: number;
}

export default function UploadProgress({
  current,
  total,
  currentFile,
  uploadedBytes,
  totalBytes,
}: UploadProgressProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  const circumference = 2 * Math.PI * 34;

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - percent / 100)}
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-slate-900">{percent}%</span>
          </div>
        </div>

        <div className="text-center w-full">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Deploying your site</h2>
          <p className="text-sm text-slate-500 mb-4">
            {formatBytes(uploadedBytes)} of {formatBytes(totalBytes)} uploaded
          </p>

          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
            <div
              className="bg-cyan-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 size={14} className="animate-spin text-cyan-500" />
            <FileUp size={14} className="text-slate-400" />
            <span className="truncate max-w-xs">{currentFile || 'Preparing...'}</span>
          </div>

          <p className="text-xs text-slate-400 mt-2">
            File {Math.min(current + 1, total)} of {total}
          </p>
        </div>
      </div>
    </div>
  );
}
