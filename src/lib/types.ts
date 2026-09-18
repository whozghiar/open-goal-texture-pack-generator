export interface TextureItem {
  id: string;
  name: string;
  filename: string;
  src_path: string;
  width: number;
  height: number;
  channels: string;
  size_bytes: number;
  known: boolean;
  is_shared: boolean;
  levels: string[];
  tpages: string[];
  dest_tpage: string;
}

export interface PackMetadata {
  name: string;
  version: string;
  author: string;
  description: string;
  tags: string[];
}

export interface ProjectStatus {
  project_root: string;
  game: string;
  valid_games: string[];
  levels: string[];
  total_db_textures: number;
  cover_filename?: string;
  has_cover: boolean;
  cover_base64?: string;
  meta: PackMetadata;
  textures: TextureItem[];
  total_textures: number;
  shared_textures: number;
  total_size_bytes: number;
}

export interface ExportResult {
  success: boolean;
  path: string;
  sha256: string;
  size_kb: number;
  texture_count: number;
}
