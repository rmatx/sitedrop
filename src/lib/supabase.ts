import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const STORAGE_BUCKET = 'sites';

export function getFileUrl(slug: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${slug}/${path}`;
}

export function getSiteUrl(slug: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${slug}/index.html`;
}
