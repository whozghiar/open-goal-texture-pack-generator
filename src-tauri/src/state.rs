use std::collections::HashMap;
use std::fs::File;
use std::io::Read;
use std::path::{Path, PathBuf};

use crate::catalog::TextureCatalog;
use crate::models::{PackMetadata, ProjectStatus, TextureItem};

pub fn read_png_dimensions(path: &Path) -> (u32, u32, String) {
    if let Ok(mut f) = File::open(path) {
        let mut header = [0u8; 32];
        if f.read_exact(&mut header).is_ok() {
            if &header[0..8] == b"\x89PNG\r\n\x1a\n" {
                let width = u32::from_be_bytes([header[16], header[17], header[18], header[19]]);
                let height = u32::from_be_bytes([header[20], header[21], header[22], header[23]]);
                let color_type = header[25];
                let channels = match color_type {
                    6 => "RGBA",
                    2 => "RGB",
                    3 => "Indexed",
                    0 => "Grayscale",
                    4 => "GrayAlpha",
                    _ => "PNG",
                };
                return (width, height, channels.to_string());
            }
        }
    }
    (0, 0, "unknown".to_string())
}

pub fn find_project_root() -> PathBuf {
    if let Ok(env_root) = std::env::var("OPENGOAL_PROJECT_ROOT") {
        let p = PathBuf::from(env_root);
        if looks_like_project_root(&p) {
            return p;
        }
    }

    if let Ok(exe) = std::env::current_exe() {
        let mut cur = exe.clone();
        while let Some(parent) = cur.parent() {
            if looks_like_project_root(parent) {
                return parent.to_path_buf();
            }
            cur = parent.to_path_buf();
        }
    }

    if let Ok(cwd) = std::env::current_dir() {
        let mut cur = cwd.clone();
        while let Some(parent) = cur.parent() {
            if looks_like_project_root(parent) {
                return parent.to_path_buf();
            }
            cur = parent.to_path_buf();
        }
    }

    // Default fallback: 4 levels up
    PathBuf::from("..").join("..").join("..").join("..")
}

fn looks_like_project_root(p: &Path) -> bool {
    p.join("goal_src").is_dir() && p.join("custom_assets").is_dir() && p.join("decompiler").is_dir()
}

pub struct AppState {
    pub project_root: PathBuf,
    pub game: String,
    pub catalog: TextureCatalog,
    pub meta: PackMetadata,
    pub cover_path: Option<PathBuf>,
    pub cover_bytes: Option<Vec<u8>>,
    pub cover_filename: Option<String>,
    pub textures: HashMap<String, TextureItem>,
    pub next_id: usize,
}

impl AppState {
    pub fn new(project_root: PathBuf) -> Self {
        let catalog = TextureCatalog::new(project_root.clone());
        let game = "jak2".to_string();
        let mut state = Self {
            project_root,
            game: game.clone(),
            catalog,
            meta: PackMetadata {
                name: "Custom HD Textures".to_string(),
                version: "1.0.0".to_string(),
                author: "whozghiar".to_string(),
                description: format!("Texture replacement pack for OpenGOAL ({})", game.to_uppercase()),
                tags: vec![game, "retexture".to_string(), "hd".to_string()],
            },
            cover_path: None,
            cover_bytes: None,
            cover_filename: None,
            textures: HashMap::new(),
            next_id: 1,
        };
        state.load_default_cover();
        state
    }

    pub fn load_default_cover(&mut self) {
        let candidates = [
            self.project_root.join("docs").join("img").join("mod").join("mod_cover.png"),
            self.project_root.join("docs").join("img").join("mod").join("cover.png"),
            self.project_root.join("custom_assets").join(&self.game).join("cover.png"),
        ];
        for c in &candidates {
            if c.is_file() {
                if let Ok(bytes) = std::fs::read(c) {
                    self.cover_filename = c.file_name().map(|s| s.to_string_lossy().to_string());
                    self.cover_bytes = Some(bytes);
                    self.cover_path = Some(c.clone());
                    return;
                }
            }
        }
    }

    pub fn add_texture_file(&mut self, path: PathBuf, origin_tpage: Option<String>) -> Option<TextureItem> {
        if !path.is_file() || path.extension().and_then(|s| s.to_str()).map(|s| s.to_lowercase()) != Some("png".to_string()) {
            return None;
        }

        let filename = path.file_name()?.to_string_lossy().to_string();
        let tex_name = path.file_stem()?.to_string_lossy().to_string();
        let (width, height, channels) = read_png_dimensions(&path);
        let size_bytes = std::fs::metadata(&path).map(|m| m.len()).unwrap_or(0);

        let (known, is_shared, levels, tpages) = self.catalog.match_texture(&self.game, &tex_name);

        let mut dest_tpage = "_all".to_string();
        if let Some(ref orig) = origin_tpage {
            if orig != "_all" {
                dest_tpage = orig.clone();
            }
        } else if !is_shared && tpages.len() == 1 {
            dest_tpage = tpages[0].clone();
        }

        let src_str = path.to_string_lossy().to_string();

        // Check if already in list
        for item in self.textures.values_mut() {
            if item.src_path == src_str {
                item.dest_tpage = dest_tpage;
                return Some(item.clone());
            }
        }

        let id = format!("tex_{}", self.next_id);
        self.next_id += 1;

        let item = TextureItem {
            id: id.clone(),
            name: tex_name,
            filename,
            src_path: src_str,
            width,
            height,
            channels,
            size_bytes,
            known,
            is_shared,
            levels,
            tpages,
            dest_tpage,
        };

        self.textures.insert(id, item.clone());
        Some(item)
    }

    pub fn refresh_textures(&mut self) {
        let game = self.game.clone();
        for item in self.textures.values_mut() {
            let (known, is_shared, levels, tpages) = self.catalog.match_texture(&game, &item.name);
            item.known = known;
            item.is_shared = is_shared;
            item.levels = levels;
            item.tpages = tpages.clone();
            if item.dest_tpage != "_all" && !tpages.contains(&item.dest_tpage) {
                item.dest_tpage = "_all".to_string();
            }
        }
    }

    pub fn to_status(&mut self) -> ProjectStatus {
        let cat_data = self.catalog.get_game_data(&self.game).clone();
        let mut tex_list: Vec<TextureItem> = self.textures.values().cloned().collect();
        tex_list.sort_by(|a, b| a.filename.cmp(&b.filename));

        let shared_count = tex_list.iter().filter(|t| t.is_shared).count();
        let total_size: u64 = tex_list.iter().map(|t| t.size_bytes).sum();

        let cover_b64 = self.cover_bytes.as_ref().map(|b| {
            use base64::Engine;
            format!("data:image/png;base64,{}", base64::engine::general_purpose::STANDARD.encode(b))
        });

        ProjectStatus {
            project_root: self.project_root.to_string_lossy().to_string(),
            game: self.game.clone(),
            valid_games: vec!["jak1".to_string(), "jak2".to_string(), "jak3".to_string()],
            levels: cat_data.levels,
            total_db_textures: cat_data.count,
            cover_filename: self.cover_filename.clone(),
            has_cover: self.cover_bytes.is_some(),
            cover_base64: cover_b64,
            meta: self.meta.clone(),
            textures: tex_list.clone(),
            total_textures: tex_list.len(),
            shared_textures: shared_count,
            total_size_bytes: total_size,
        }
    }
}
