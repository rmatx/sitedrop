import { useEffect, useRef, useState } from 'react';
import {
  Globe, ExternalLink, Trash2, Plus, Clock, FileText, HardDrive,
  RefreshCw, Search, Pencil, Check, X,
} from 'lucide-react';
import { supabase, getSiteUrl } from '../lib/supabase';
import type { Deployment } from '../types';
import { formatBytes, formatDate } from '../utils/files';

interface DeploymentsListProps {
  onViewSite: (deployment: Deployment) => void;
  onNewDeploy: () => void;
  onRedeploy: (deployment: Deployment) => void;
}

export default function DeploymentsList({ onViewSite, onNewDeploy, onRedeploy }: DeploymentsListProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDeployments();
  }, []);

  useEffect(() => {
    if (editingId) renameInputRef.current?.focus();
  }, [editingId]);

  async function fetchDeployments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('deployments')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setDeployments(data as Deployment[]);
    setLoading(false);
  }

  async function handleDelete(deployment: Deployment) {
    if (!confirm(`Delete "${deployment.name}"? This cannot be undone.`)) return;

    setDeleting(deployment.id);
    try {
      const filePaths = deployment.file_paths.map((p) => `${deployment.slug}/${p}`);
      if (filePaths.length > 0) {
        await supabase.storage.from('sites').remove(filePaths);
      }
      const { error } = await supabase.from('deployments').delete().eq('id', deployment.id);
      if (error) throw error;
      setDeployments((prev) => prev.filter((d) => d.id !== deployment.id));
    } catch {
      alert('Failed to delete deployment. Please try again.');
    } finally {
      setDeleting(null);
    }
  }

  function startRename(deployment: Deployment) {
    setEditingId(deployment.id);
    setEditingName(deployment.name);
  }

  function cancelRename() {
    setEditingId(null);
    setEditingName('');
  }

  async function commitRename(deploymentId: string) {
    const trimmed = editingName.trim();
    if (!trimmed) { cancelRename(); return; }

    setSavingId(deploymentId);
    const { error } = await supabase
      .from('deployments')
      .update({ name: trimmed })
      .eq('id', deploymentId);

    if (!error) {
      setDeployments((prev) =>
        prev.map((d) => d.id === deploymentId ? { ...d, name: trimmed } : d)
      );
    }
    setSavingId(null);
    setEditingId(null);
    setEditingName('');
  }

  const filtered = query.trim()
    ? deployments.filter((d) =>
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.slug.toLowerCase().includes(query.toLowerCase())
      )
    : deployments;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Sites</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {deployments.length} deployment{deployments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onNewDeploy}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          New Deploy
        </button>
      </div>

      {!loading && deployments.length > 2 && (
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search sites..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white/5 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : deployments.length === 0 ? (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
            <Globe size={24} className="text-slate-400" />
          </div>
          <p className="text-slate-300 font-medium mb-1">No sites yet</p>
          <p className="text-sm text-slate-500 mb-5">Deploy your first static site in seconds.</p>
          <button
            onClick={onNewDeploy}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold transition-colors"
          >
            Deploy a Site
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-10 text-center">
          <p className="text-slate-400 text-sm">No sites match <span className="text-white font-medium">"{query}"</span></p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((deployment) => {
            const siteUrl = deployment.has_index_html ? getSiteUrl(deployment.slug) : null;
            const isEditing = editingId === deployment.id;
            const isSaving = savingId === deployment.id;

            return (
              <div
                key={deployment.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Globe size={18} className="text-cyan-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              ref={renameInputRef}
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitRename(deployment.id);
                                if (e.key === 'Escape') cancelRename();
                              }}
                              onBlur={() => commitRename(deployment.id)}
                              disabled={isSaving}
                              className="flex-1 min-w-0 text-sm font-semibold text-slate-900 bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-400"
                            />
                            <button
                              onMouseDown={(e) => { e.preventDefault(); commitRename(deployment.id); }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-600"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onMouseDown={(e) => { e.preventDefault(); cancelRename(); }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 group/name">
                            <p className="font-semibold text-slate-900 truncate">{deployment.name}</p>
                            <button
                              onClick={() => startRename(deployment)}
                              title="Rename"
                              className="opacity-0 group-hover/name:opacity-100 w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 transition-opacity"
                            >
                              <Pencil size={11} />
                            </button>
                          </div>
                        )}
                        <p className="text-xs font-mono text-slate-400 truncate mt-0.5">{deployment.slug}</p>
                      </div>

                      {!isEditing && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onRedeploy(deployment)}
                            title="Update site"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-cyan-500 transition-colors"
                          >
                            <RefreshCw size={15} />
                          </button>
                          {siteUrl && (
                            <a
                              href={siteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open site"
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-cyan-500 transition-colors"
                            >
                              <ExternalLink size={15} />
                            </a>
                          )}
                          <button
                            onClick={() => onViewSite(deployment)}
                            title="View files"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            <FileText size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(deployment)}
                            disabled={deleting === deployment.id}
                            title="Delete deployment"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-2.5">
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <FileText size={11} />
                        {deployment.files_count} file{deployment.files_count !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <HardDrive size={11} />
                        {formatBytes(deployment.total_size)}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock size={11} />
                        {formatDate(deployment.updated_at || deployment.created_at)}
                      </span>
                      {deployment.has_index_html && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-xs font-medium">
                          Live
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
