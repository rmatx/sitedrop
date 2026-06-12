import { useRef, useState, useCallback } from 'react';
import { Upload, FolderOpen, FileText, RefreshCw } from 'lucide-react';
import type { Deployment, FileWithPath } from '../types';
import { traverseEntry, formatBytes } from '../utils/files';

interface DropZoneProps {
  onDeploy: (files: FileWithPath[], name: string) => void;
  redeployTarget?: Deployment | null;
}

export default function DropZone({ onDeploy, redeployTarget }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<FileWithPath[] | null>(null);
  const [previewName, setPreviewName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const buildPreview = useCallback((files: FileWithPath[], name: string) => {
    if (files.length > 0 && files[0].path.includes('/')) {
      const prefix = files[0].path.split('/')[0] + '/';
      if (files.every((f) => f.path.startsWith(prefix))) {
        files.forEach((f) => { f.path = f.path.slice(prefix.length); });
      }
    }
    const filtered = files.filter((f) => !f.path.startsWith('.') && !f.path.includes('/.'));
    if (filtered.length === 0) return;
    setPreviewName(name);
    setPreview(filtered);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);

      const files: FileWithPath[] = [];
      let name = 'My Site';

      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        const entry = item.webkitGetAsEntry?.();
        if (entry) {
          if (entry.isDirectory && i === 0) name = entry.name;
          const result = await traverseEntry(entry);
          files.push(...result);
        }
      }

      buildPreview(files, name);
    },
    [buildPreview]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;

      const files: FileWithPath[] = [];
      let name = 'My Site';

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
        if (relativePath) {
          if (i === 0) name = relativePath.split('/')[0];
          const parts = relativePath.split('/');
          files.push({ file, path: parts.slice(1).join('/') });
        } else {
          files.push({ file, path: file.name });
        }
      }

      buildPreview(files, name);
      e.target.value = '';
    },
    [buildPreview]
  );

  const totalSize = preview?.reduce((acc, f) => acc + f.file.size, 0) ?? 0;
  const hasIndex = preview?.some((f) => f.path === 'index.html') ?? false;

  if (preview) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {redeployTarget && (
            <div className="px-6 py-3 bg-cyan-50 border-b border-cyan-100 flex items-center gap-2">
              <RefreshCw size={13} className="text-cyan-500 shrink-0" />
              <p className="text-xs text-cyan-700 font-medium truncate">
                Updating <span className="font-semibold">{redeployTarget.name}</span>
              </p>
            </div>
          )}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                <FolderOpen size={20} className="text-cyan-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{previewName}</p>
                <p className="text-sm text-slate-500">
                  {preview.length} file{preview.length !== 1 ? 's' : ''} &middot; {formatBytes(totalSize)}
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto">
            {preview.slice(0, 50).map(({ path, file }) => (
              <div
                key={path}
                className="flex items-center justify-between px-6 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={14} className="text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-700 truncate">{path}</span>
                </div>
                <span className="text-xs text-slate-400 ml-3 shrink-0">{formatBytes(file.size)}</span>
              </div>
            ))}
            {preview.length > 50 && (
              <div className="px-6 py-3 text-sm text-slate-400 text-center">
                +{preview.length - 50} more files
              </div>
            )}
          </div>

          {!hasIndex && (
            <div className="mx-6 mt-4 px-4 py-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-700">
                No <code className="font-mono bg-amber-100 px-1 rounded">index.html</code> detected — live preview will be unavailable.
              </p>
            </div>
          )}

          <div className="p-6 flex gap-3">
            <button
              onClick={() => setPreview(null)}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onDeploy(preview, previewName)}
              className="flex-1 px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold transition-colors"
            >
              {redeployTarget ? 'Update Site' : 'Deploy Site'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {redeployTarget && (
        <div className="mb-3 px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-2.5">
          <RefreshCw size={14} className="text-cyan-400 shrink-0" />
          <p className="text-sm text-cyan-300">
            Updating <span className="font-semibold text-cyan-200">{redeployTarget.name}</span> — drop new files to replace
          </p>
        </div>
      )}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative bg-white rounded-2xl shadow-2xl transition-all duration-200 ${
          isDragging ? 'shadow-cyan-500/20 scale-[1.01]' : ''
        }`}
      >
        <div
          className={`absolute inset-4 rounded-xl border-2 border-dashed transition-colors duration-200 pointer-events-none ${
            isDragging ? 'border-cyan-400 bg-cyan-50/60' : 'border-slate-200'
          }`}
        />

        <div className="relative flex flex-col items-center px-10 py-14 gap-5">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-200 ${
              isDragging ? 'bg-cyan-100' : 'bg-slate-100'
            }`}
          >
            <Upload
              size={28}
              className={`transition-colors duration-200 ${isDragging ? 'text-cyan-500' : 'text-slate-400'}`}
            />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-1.5">
              {isDragging ? 'Drop to deploy' : redeployTarget ? 'Drop replacement files' : 'Drop your site here'}
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {redeployTarget
                ? 'New files will replace the existing deployment.'
                : 'Drag a folder or files — your site goes live in seconds.'}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full my-1">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => folderInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50 text-sm font-medium text-slate-700 hover:text-cyan-600 transition-all"
            >
              <FolderOpen size={16} />
              Browse Folder
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50 text-sm font-medium text-slate-700 hover:text-cyan-600 transition-all"
            >
              <FileText size={16} />
              Browse Files
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error non-standard attribute
          webkitdirectory="true"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      <p className="text-center text-xs text-slate-500 mt-5">
        HTML, CSS, JS, images and more &mdash; up to 50 MB per file
      </p>
    </div>
  );
}
