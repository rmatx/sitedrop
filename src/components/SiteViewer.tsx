import { useState } from 'react';
import {
  ArrowLeft, ExternalLink, FileText, Globe,
  Image, Code, FileCode, Music, Video, HardDrive, Copy, Check,
} from 'lucide-react';
import type { Deployment } from '../types';
import { getFileUrl, getSiteUrl } from '../lib/supabase';
import { formatBytes, getFileTypeLabel } from '../utils/files';

interface SiteViewerProps {
  deployment: Deployment;
  onBack: () => void;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  html: <FileCode size={14} className="text-orange-500" />,
  css: <Code size={14} className="text-blue-500" />,
  js: <Code size={14} className="text-yellow-500" />,
  ts: <Code size={14} className="text-blue-600" />,
  json: <Code size={14} className="text-green-500" />,
  img: <Image size={14} className="text-purple-500" />,
  video: <Video size={14} className="text-red-500" />,
  audio: <Music size={14} className="text-pink-500" />,
  pdf: <FileText size={14} className="text-red-600" />,
  text: <FileText size={14} className="text-slate-500" />,
  font: <HardDrive size={14} className="text-slate-400" />,
  code: <Code size={14} className="text-slate-500" />,
  file: <FileText size={14} className="text-slate-400" />,
};

export default function SiteViewer({ deployment, onBack }: SiteViewerProps) {
  const [tab, setTab] = useState<'preview' | 'files'>(
    deployment.has_index_html ? 'preview' : 'files'
  );
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const siteUrl = deployment.has_index_html ? getSiteUrl(deployment.slug) : null;

  const handleCopyUrl = async (path: string) => {
    const url = getFileUrl(deployment.slug, path);
    await navigator.clipboard.writeText(url);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 1500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="h-4 w-px bg-slate-700" />
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Globe size={14} className="text-cyan-400" />
          </div>
          <span className="text-white font-semibold truncate">{deployment.name}</span>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">{deployment.slug}</span>
        </div>
        {siteUrl && (
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-semibold transition-colors shrink-0"
          >
            <ExternalLink size={12} />
            Open Site
          </a>
        )}
      </div>

      {deployment.has_index_html && (
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-4 w-fit">
          {(['preview', 'files'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {tab === 'preview' && siteUrl && (
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-100 border-b border-slate-200">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-slate-500 font-mono truncate border border-slate-200">
              {siteUrl}
            </div>
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              <ExternalLink size={14} />
            </a>
          </div>
          <iframe
            src={siteUrl}
            title={deployment.name}
            className="w-full h-[520px] border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      )}

      {tab === 'files' && (
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {deployment.files_count} file{deployment.files_count !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-slate-500">{formatBytes(deployment.total_size)} total</p>
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {deployment.file_paths.map((path) => {
              const typeLabel = getFileTypeLabel(path);
              const icon = TYPE_ICON[typeLabel] ?? TYPE_ICON.file;
              const fileUrl = getFileUrl(deployment.slug, path);
              const isCopied = copiedPath === path;

              return (
                <div
                  key={path}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-5 flex items-center justify-center shrink-0">{icon}</div>
                  <span className="flex-1 text-sm text-slate-700 font-mono truncate">{path}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopyUrl(path)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      {isCopied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      {isCopied ? 'Copied' : 'URL'}
                    </button>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <ExternalLink size={11} />
                      Open
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
