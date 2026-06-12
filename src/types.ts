export interface Deployment {
  id: string;
  slug: string;
  name: string;
  files_count: number;
  total_size: number;
  has_index_html: boolean;
  file_paths: string[];
  created_at: string;
  updated_at: string;
}

export interface FileWithPath {
  file: File;
  path: string;
}
