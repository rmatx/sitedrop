import { useState, useCallback, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import Header from './components/Header';
import DropZone from './components/DropZone';
import UploadProgress from './components/UploadProgress';
import DeploymentSuccess from './components/DeploymentSuccess';
import DeploymentsList from './components/DeploymentsList';
import SiteViewer from './components/SiteViewer';
import LoginPage from './components/LoginPage';
import { supabase, STORAGE_BUCKET } from './lib/supabase';
import type { Deployment, FileWithPath } from './types';
import { generateSlug } from './utils/files';

type View = 'home' | 'uploading' | 'success' | 'sites' | 'viewer';

interface UploadState {
  current: number;
  total: number;
  currentFile: string;
  uploadedBytes: number;
  totalBytes: number;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<View>('home');
  const [uploadState, setUploadState] = useState<UploadState>({
    current: 0,
    total: 0,
    currentFile: '',
    uploadedBytes: 0,
    totalBytes: 0,
  });
  const [currentDeployment, setCurrentDeployment] = useState<Deployment | null>(null);
  const [viewingDeployment, setViewingDeployment] = useState<Deployment | null>(null);
  const [redeployTarget, setRedeployTarget] = useState<Deployment | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDeploy = useCallback(async (files: FileWithPath[], name: string) => {
    if (!user) return;
    setDeployError(null);

    const isRedeploy = redeployTarget !== null;
    const slug = isRedeploy ? redeployTarget!.slug : generateSlug();
    const deployName = isRedeploy ? redeployTarget!.name : name;
    const totalBytes = files.reduce((acc, f) => acc + f.file.size, 0);

    setUploadState({ current: 0, total: files.length, currentFile: '', uploadedBytes: 0, totalBytes });
    setView('uploading');

    try {
      if (isRedeploy && redeployTarget!.file_paths.length > 0) {
        const oldPaths = redeployTarget!.file_paths.map((p) => `${slug}/${p}`);
        await supabase.storage.from(STORAGE_BUCKET).remove(oldPaths);
      }

      let uploadedBytes = 0;

      for (let i = 0; i < files.length; i++) {
        const { file, path } = files[i];

        setUploadState((prev) => ({ ...prev, current: i, currentFile: path }));

        const { error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(`${slug}/${path}`, file, {
            contentType: file.type || undefined,
            upsert: isRedeploy,
          });

        if (error) throw new Error(`Failed to upload ${path}: ${error.message}`);

        uploadedBytes += file.size;
        setUploadState((prev) => ({ ...prev, current: i + 1, uploadedBytes }));
      }

      const filePaths = files.map((f) => f.path);
      const hasIndexHtml = filePaths.includes('index.html');

      let data;
      if (isRedeploy) {
        const { data: updated, error: dbError } = await supabase
          .from('deployments')
          .update({
            files_count: files.length,
            total_size: totalBytes,
            has_index_html: hasIndexHtml,
            file_paths: filePaths,
          })
          .eq('id', redeployTarget!.id)
          .select()
          .single();
        if (dbError) throw new Error(dbError.message);
        data = updated;
      } else {
        const { data: inserted, error: dbError } = await supabase
          .from('deployments')
          .insert({
            slug,
            name: deployName,
            user_id: user.id,
            files_count: files.length,
            total_size: totalBytes,
            has_index_html: hasIndexHtml,
            file_paths: filePaths,
          })
          .select()
          .single();
        if (dbError) throw new Error(dbError.message);
        data = inserted;
      }

      setCurrentDeployment(data as Deployment);
      setRedeployTarget(null);
      setView('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed.';
      setDeployError(message);
      setView('home');
    }
  }, [user, redeployTarget]);

  const handleViewSite = useCallback((deployment: Deployment) => {
    setViewingDeployment(deployment);
    setView('viewer');
  }, []);

  const handleNewDeploy = useCallback(() => {
    setDeployError(null);
    setRedeployTarget(null);
    setView('home');
  }, []);

  const handleRedeploy = useCallback((deployment: Deployment) => {
    setRedeployTarget(deployment);
    setDeployError(null);
    setView('home');
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(148,163,184,0.04) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      <Header
        user={user}
        onNavigateSites={() => setView('sites')}
        onNavigateHome={handleNewDeploy}
      />

      <main className="relative flex flex-col items-center justify-center min-h-screen px-4 pt-20 pb-12">
        {view === 'home' && (
          <>
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
                Deploy in seconds
              </h1>
              <p className="text-lg text-slate-400 max-w-sm mx-auto">
                Drop your static site folder to publish it instantly — no config required.
              </p>
            </div>

            {deployError && (
              <div className="w-full max-w-lg mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                {deployError}
              </div>
            )}

            <DropZone onDeploy={handleDeploy} redeployTarget={redeployTarget} />
          </>
        )}

        {view === 'uploading' && (
          <UploadProgress
            current={uploadState.current}
            total={uploadState.total}
            currentFile={uploadState.currentFile}
            uploadedBytes={uploadState.uploadedBytes}
            totalBytes={uploadState.totalBytes}
          />
        )}

        {view === 'success' && currentDeployment && (
          <>
            <div className="text-center mb-8">
              <p className="text-slate-400 text-sm">Your site is live</p>
            </div>
            <DeploymentSuccess
              deployment={currentDeployment}
              onViewSite={handleViewSite}
              onNewDeploy={handleNewDeploy}
            />
          </>
        )}

        {view === 'sites' && (
          <DeploymentsList onViewSite={handleViewSite} onNewDeploy={handleNewDeploy} onRedeploy={handleRedeploy} />
        )}

        {view === 'viewer' && viewingDeployment && (
          <SiteViewer
            deployment={viewingDeployment}
            onBack={() => setView('sites')}
          />
        )}
      </main>
    </div>
  );
}
