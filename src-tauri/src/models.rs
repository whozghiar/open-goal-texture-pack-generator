use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextureItem {
    pub id: String,
    pub name: String,
    pub filename: String,
    pub src_path: String,
    pub width: u32,
    pub height: u32,
    pub channels: String,
    pub size_bytes: u64,
    pub known: bool,
    pub is_shared: bool,
    pub levels: Vec<String>,
    pub tpages: Vec<String>,
    pub dest_tpage: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackMetadata {
    pub name: String,
    pub version: String,
    pub author: String,
    pub description: String,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectStatus {
    pub project_root: String,
    pub game: String,
    pub valid_games: Vec<String>,
    pub levels: Vec<String>,
    pub total_db_textures: usize,
    pub cover_filename: Option<String>,
    pub has_cover: bool,
    pub cover_base64: Option<String>,
    pub meta: PackMetadata,
    pub textures: Vec<TextureItem>,
    pub total_textures: usize,
    pub shared_textures: usize,
    pub total_size_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportResult {
    pub success: bool,
    pub path: String,
    pub sha256: String,
    pub size_kb: f64,
    pub texture_count: usize,
}
