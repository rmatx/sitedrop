import type { FileWithPath } from '../types';

const ADJECTIVES = [
  'amber', 'azure', 'bold', 'brave', 'bright', 'calm', 'cedar', 'crisp',
  'dawn', 'deep', 'deft', 'eager', 'early', 'epic', 'fair', 'fast',
  'free', 'glad', 'gold', 'hale', 'high', 'icy', 'jade', 'just',
  'keen', 'kind', 'lush', 'mild', 'neat', 'open', 'opal', 'pink',
  'pure', 'quiet', 'rare', 'rich', 'safe', 'slim', 'soft', 'swift',
  'tall', 'tame', 'vast', 'warm', 'wide', 'wise', 'young', 'zeal',
];

const NOUNS = [
  'apex', 'arch', 'bay', 'beam', 'bloom', 'cedar', 'cliff', 'cove',
  'dawn', 'dune', 'echo', 'elm', 'fern', 'field', 'gale', 'grove',
  'haze', 'hill', 'iris', 'isle', 'jade', 'kelp', 'knot', 'lake',
  'lea', 'marsh', 'mist', 'moon', 'nook', 'nova', 'opal', 'orb',
  'peak', 'pine', 'quay', 'reef', 'ridge', 'sage', 'star', 'stone',
  'tide', 'trail', 'vale', 'vine', 'wave', 'wood', 'yard', 'zone',
];

export function generateSlug(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}-${noun}-${num}`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function readFileEntry(
  fileEntry: FileSystemFileEntry,
  basePath: string
): Promise<FileWithPath> {
  return new Promise((resolve, reject) => {
    fileEntry.file(
      (file) => resolve({ file, path: basePath + file.name }),
      reject
    );
  });
}

async function readAllDirEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  const all: FileSystemEntry[] = [];
  while (true) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
    if (batch.length === 0) break;
    all.push(...batch);
  }
  return all;
}

export async function traverseEntry(
  entry: FileSystemEntry,
  basePath = ''
): Promise<FileWithPath[]> {
  if (entry.isFile) {
    const result = await readFileEntry(entry as FileSystemFileEntry, basePath);
    return [result];
  }

  if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry;
    const reader = dirEntry.createReader();
    const entries = await readAllDirEntries(reader);
    const nested = await Promise.all(
      entries.map((e) => traverseEntry(e, basePath + dirEntry.name + '/'))
    );
    return nested.flat();
  }

  return [];
}

export function getFileTypeLabel(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    html: 'html', htm: 'html',
    css: 'css',
    js: 'js', mjs: 'js',
    ts: 'ts', tsx: 'ts', jsx: 'js',
    json: 'json',
    png: 'img', jpg: 'img', jpeg: 'img', gif: 'img',
    svg: 'img', webp: 'img', ico: 'img', avif: 'img',
    mp4: 'video', webm: 'video',
    mp3: 'audio', wav: 'audio',
    pdf: 'pdf',
    md: 'text', txt: 'text',
    woff: 'font', woff2: 'font', ttf: 'font', otf: 'font',
    xml: 'code', yaml: 'code', yml: 'code',
  };
  return map[ext] ?? 'file';
}
