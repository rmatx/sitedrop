import { useState } from 'react';
import { CheckCircle, ExternalLink, Copy, Check, ArrowRight, Globe } from 'lucide-react';
import type { Deployment } from '../types';
import { getSiteUrl } from '../lib/supabase';
import { formatBytes } from '../utils/files';

interface DeploymentSuccessProps {
  deployment: Deployment;
  onViewSite: (deployment: Deployment) => void;
  onNewDeploy: () => void;
}

export default function DeploymentSuccess({
  deployment,
  onViewSite,
  onNewDeploy,
}: DeploymentSuccessProps) {
  const [copied, setCopied] = useState(false);
  const siteUrl = deployment.has_index_html ? getSiteUrl(deployment.slug) : null;

  const handleCopy = async () => {
    if (!siteUrl) return;
    await navigator.clipboard.writeText(siteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-emerald-500 px-6 py-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <CheckCircle size={22} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white">Deployed successfully!</p>
            <p className="text-sm text-emerald-100">
              {deployment.files_count} file{deployment.files_count !== 1 ? 's' : ''} &middot; {formatBytes(deployment.total_size)}
            </p>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Globe size={18} className="text-slate-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{deployment.name}</p>
              <p className="text-xs text-slate-400 font-mono">{deployment.slug}</p>
            </div>
          </div>

          {siteUrl ? (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center gap-2">
              <div className="flex-1 px-3 overflow-hidden">
                <p className="text-xs text-slate-500 truncate font-mono">{siteUrl}</p>
              </div>
              <button
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-cyan-300 hover:text-cyan-600 text-xs font-medium text-slate-600 transition-all"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
              <p className="text-xs text-amber-700">
                No <code className="font-mono bg-amber-100 px-1 rounded">index.html</code> — direct URL preview unavailable.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {siteUrl && (
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold transition-colors"
              >
                <ExternalLink size={15} />
                Open Site
              </a>
            )}
            <button
              onClick={() => onViewSite(deployment)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors"
            >
              View Files
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={onNewDeploy}
        className="mt-4 w-full text-center text-sm text-slate-400 hover:text-white transition-colors py-2"
      >
        Deploy another site
      </button>
    </div>
  );
}
