use std::fs::File;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;
use walkdir::WalkDir;
use zip::write::SimpleFileOptions;
use sha2::{Digest, Sha256};
use base64::Engine;

use crate::models::{ExportResult, ProjectStatus};
use crate::state::AppState;

#[tauri::command]
pub fn get_status(state: State<Mutex<AppState>>) -> Result<ProjectStatus, String> {
    let mut lock = state.lock().map_err(|e| e.to_string())?;
    Ok(lock.to_status())
}

#[tauri::command]
pub fn set_game(state: State<Mutex<AppState>>, game: String) -> Result<ProjectStatus, String> {
    let mut lock = state.lock().map_err(|e| e.to_string())?;
    let g = game.to_lowercase();
    if ["jak1", "jak2", "jak3"].contains(&g.as_str()) {
        lock.game = g.clone();
        lock.meta.description = format!("Texture replacement pack for OpenGOAL ({})", g.to_uppercase());
        if !lock.meta.tags.contains(&g) {
            lock.meta.tags.insert(0, g);
        }
        lock.refresh_textures();
    }
    Ok(lock.to_status())
}

#[tauri::command]
pub fn update_meta(
    state: State<Mutex<AppState>>,
    name: String,
    version: String,
    author: String,
    description: String,
    tags: Vec<String>,
) -> Result<(), String> {
    let mut lock = state.lock().map_err(|e| e.to_string())?;
    if !name.trim().is_empty() {
        lock.meta.name = name.trim().to_string();
    }
    if !version.trim().is_empty() {
        lock.meta.version = version.trim().to_string();
    }
    if !author.trim().is_empty() {
        lock.meta.author = author.trim().to_string();
    }
    lock.meta.description = description.trim().to_string();
    lock.meta.tags = tags;
    Ok(())
}

#[tauri::command]
pub fn set_cover(state: State<Mutex<AppState>>, path: String) -> Result<ProjectStatus, String> {
    let p = PathBuf::from(&path);
    if !p.is_file() {
        return Err("Fichier de couverture introuvable".to_string());
    }
    let bytes = std::fs::read(&p).map_err(|e| e.to_string())?;
    let mut lock = state.lock().map_err(|e| e.to_string())?;
    lock.cover_filename = p.file_name().map(|s| s.to_string_lossy().to_string());
    lock.cover_bytes = Some(bytes);
    lock.cover_path = Some(p);
    Ok(lock.to_status())
}

#[tauri::command]
pub fn remove_cover(state: State<Mutex<AppState>>) -> Result<ProjectStatus, String> {
    let mut lock = state.lock().map_err(|e| e.to_string())?;
    lock.cover_path = None;
    lock.cover_bytes = None;
    lock.cover_filename = None;
    Ok(lock.to_status())
}

#[tauri::command]
pub fn scan_folder(state: State<Mutex<AppState>>, folder_path: String) -> Result<ProjectStatus, String> {
    let folder = PathBuf::from(&folder_path);
    if !folder.is_dir() {
        return Err("Dossier introuvable".to_string());
    }

    let mut lock = state.lock().map_err(|e| e.to_string())?;

    for entry in WalkDir::new(&folder).into_iter().filter_map(|e| e.ok()) {
        let p = entry.path();
        if p.is_file() && p.extension().and_then(|s| s.to_str()).map(|s| s.to_lowercase()) == Some("png".to_string()) {
            let rel = p.strip_prefix(&folder).unwrap_or(p);
            let mut origin_tpage = None;
            if let Some(parent) = rel.parent() {
                let s = parent.to_string_lossy().to_string().replace('\\', "/");
                let first_part = s.split('/').next().unwrap_or("");
                if !first_part.is_empty() {
                    origin_tpage = Some(first_part.to_string());
                }
            }
            lock.add_texture_file(p.to_path_buf(), origin_tpage);
        }
    }

    Ok(lock.to_status())
}

#[tauri::command]
pub fn scan_files(state: State<Mutex<AppState>>, file_paths: Vec<String>) -> Result<ProjectStatus, String> {
    let mut lock = state.lock().map_err(|e| e.to_string())?;
    for f in file_paths {
        lock.add_texture_file(PathBuf::from(f), None);
    }
    Ok(lock.to_status())
}

#[tauri::command]
pub fn scan_project_assets(state: State<Mutex<AppState>>) -> Result<ProjectStatus, String> {
    let (target_dir, game) = {
        let lock = state.lock().map_err(|e| e.to_string())?;
        (lock.project_root.join("custom_assets").join(&lock.game).join("texture_replacements"), lock.game.clone())
    };

    if !target_dir.is_dir() {
        return Err(format!("Dossier introuvable: custom_assets/{}/texture_replacements", game));
    }

    let mut lock = state.lock().map_err(|e| e.to_string())?;
    for entry in WalkDir::new(&target_dir).into_iter().filter_map(|e| e.ok()) {
        let p = entry.path();
        if p.is_file() && p.extension().and_then(|s| s.to_str()).map(|s| s.to_lowercase()) == Some("png".to_string()) {
            let rel = p.strip_prefix(&target_dir).unwrap_or(p);
            let mut origin_tpage = None;
            if let Some(parent) = rel.parent() {
                let s = parent.to_string_lossy().to_string().replace('\\', "/");
                let first = s.split('/').next().unwrap_or("");
                if !first.is_empty() {
                    origin_tpage = Some(first.to_string());
                }
            }
            lock.add_texture_file(p.to_path_buf(), origin_tpage);
        }
    }

    Ok(lock.to_status())
}

#[tauri::command]
pub fn update_texture_dest(state: State<Mutex<AppState>>, id: String, dest_tpage: String) -> Result<(), String> {
    let mut lock = state.lock().map_err(|e| e.to_string())?;
    if let Some(item) = lock.textures.get_mut(&id) {
        item.dest_tpage = dest_tpage.trim().to_string();
        return Ok(());
    }
    Err("Texture introuvable".to_string())
}

#[tauri::command]
pub fn batch_set_dest(state: State<Mutex<AppState>>, mode: String, level: Option<String>) -> Result<ProjectStatus, String> {
    let mut lock = state.lock().map_err(|e| e.to_string())?;
    let lvl = level.unwrap_or_default().trim().to_string();

    for item in lock.textures.values_mut() {
        if mode == "all" {
            item.dest_tpage = "_all".to_string();
        } else if mode == "level" && !lvl.is_empty() {
            if let Some(matching) = item.tpages.iter().find(|tp| tp.starts_with(&lvl)) {
                item.dest_tpage = matching.clone();
            } else {
                item.dest_tpage = "_all".to_string();
            }
        }
    }

    Ok(lock.to_status())
}

#[tauri::command]
pub fn remove_texture(state: State<Mutex<AppState>>, id: String) -> Result<ProjectStatus, String> {
    let mut lock = state.lock().map_err(|e| e.to_string())?;
    lock.textures.remove(&id);
    Ok(lock.to_status())
}

#[tauri::command]
pub fn clear_textures(state: State<Mutex<AppState>>) -> Result<ProjectStatus, String> {
    let mut lock = state.lock().map_err(|e| e.to_string())?;
    lock.textures.clear();
    Ok(lock.to_status())
}

#[tauri::command]
pub fn get_texture_data_url(state: State<Mutex<AppState>>, id: String) -> Result<String, String> {
    let path = {
        let lock = state.lock().map_err(|e| e.to_string())?;
        let item = lock.textures.get(&id).ok_or("Texture introuvable")?;
        item.src_path.clone()
    };

    let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
    Ok(format!("data:image/png;base64,{}", b64))
}

#[tauri::command]
pub fn export_zip(state: State<Mutex<AppState>>, dest_zip_path: String) -> Result<ExportResult, String> {
    let dest_path = PathBuf::from(&dest_zip_path);
    if let Some(parent) = dest_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let (items, meta, cover_bytes, game) = {
        let lock = state.lock().map_err(|e| e.to_string())?;
        if lock.textures.is_empty() {
            return Err("Aucune texture à exporter".to_string());
        }
        (
            lock.textures.values().cloned().collect::<Vec<_>>(),
            lock.meta.clone(),
            lock.cover_bytes.clone(),
            lock.game.clone(),
        )
    };

    let file = File::create(&dest_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(file);
    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    // 1. metadata.json
    let now_iso = chrono_lite_iso();
    let release_date = chrono_lite_date();
    let launcher_metadata = serde_json::json!({
        "schemaVersion": "1.0.0",
        "version": meta.version,
        "name": meta.name,
        "description": meta.description,
        "author": meta.author,
        "authors": meta.author,
        "releaseDate": release_date,
        "publishedDate": now_iso,
        "tags": meta.tags,
        "supportedGames": [game],
    });

    zip.start_file("metadata.json", options).map_err(|e| e.to_string())?;
    let meta_str = serde_json::to_string_pretty(&launcher_metadata).map_err(|e| e.to_string())?;
    zip.write_all(meta_str.as_bytes()).map_err(|e| e.to_string())?;

    // 2. cover.png
    if let Some(ref c_bytes) = cover_bytes {
        zip.start_file("cover.png", options).map_err(|e| e.to_string())?;
        zip.write_all(c_bytes).map_err(|e| e.to_string())?;
    }

    // 3. custom_assets/<game>/texture_replacements/<dest_tpage>/<filename>
    for item in &items {
        let dest_tpage = if item.dest_tpage.is_empty() { "_all" } else { &item.dest_tpage };
        let arc_name = format!("custom_assets/{}/texture_replacements/{}/{}", game, dest_tpage, item.filename);
        zip.start_file(&arc_name, options).map_err(|e| e.to_string())?;
        let bytes = std::fs::read(&item.src_path).map_err(|e| e.to_string())?;
        zip.write_all(&bytes).map_err(|e| e.to_string())?;
    }

    zip.finish().map_err(|e| e.to_string())?;

    // Compute SHA256 & Size
    let mut hasher = Sha256::new();
    let mut f = File::open(&dest_path).map_err(|e| e.to_string())?;
    let mut buf = [0u8; 65536];
    let mut total_bytes = 0u64;
    while let Ok(n) = f.read(&mut buf) {
        if n == 0 {
            break;
        }
        total_bytes += n as u64;
        hasher.update(&buf[..n]);
    }
    let sha256 = format!("{:x}", hasher.finalize());
    let size_kb = (total_bytes as f64) / 1024.0;

    Ok(ExportResult {
        success: true,
        path: dest_path.to_string_lossy().to_string(),
        sha256,
        size_kb: (size_kb * 10.0).round() / 10.0,
        texture_count: items.len(),
    })
}

#[tauri::command]
pub fn install_local(state: State<Mutex<AppState>>) -> Result<usize, String> {
    let (items, target_base) = {
        let lock = state.lock().map_err(|e| e.to_string())?;
        if lock.textures.is_empty() {
            return Err("Aucune texture à installer".to_string());
        }
        (
            lock.textures.values().cloned().collect::<Vec<_>>(),
            lock.project_root.join("custom_assets").join(&lock.game).join("texture_replacements"),
        )
    };

    let mut installed = 0;
    for item in &items {
        let dest_tpage = if item.dest_tpage.is_empty() { "_all" } else { &item.dest_tpage };
        let dir = target_base.join(dest_tpage);
        std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        let out_file = dir.join(&item.filename);
        let src_file = PathBuf::from(&item.src_path);
        if src_file != out_file {
            std::fs::copy(&src_file, &out_file).map_err(|e| e.to_string())?;
        }
        installed += 1;
    }

    Ok(installed)
}

#[tauri::command]
pub fn open_in_explorer(path: String) -> Result<(), String> {
    let p = PathBuf::from(&path);
    if p.exists() {
        #[cfg(target_os = "windows")]
        {
            let norm = p.canonicalize().unwrap_or(p);
            let _ = std::process::Command::new("explorer")
                .arg("/select,")
                .arg(norm)
                .spawn();
        }
        #[cfg(not(target_os = "windows"))]
        {
            let folder = if p.is_file() { p.parent().unwrap_or(&p) } else { &p };
            let _ = std::process::Command::new("xdg-open").arg(folder).spawn();
        }
        Ok(())
    } else {
        Err("Chemin introuvable".to_string())
    }
}

fn chrono_lite_date() -> String {
    // Return simple UTC date YYYY-MM-DD
    let dur = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    let days = dur.as_secs() / 86400;
    // rough date estimation or standard formatting
    let mut year = 1970;
    let mut rem_days = days;
    loop {
        let leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
        let days_in_year = if leap { 366 } else { 365 };
        if rem_days >= days_in_year {
            rem_days -= days_in_year;
            year += 1;
        } else {
            break;
        }
    }
    let leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
    let month_days = [31, if leap { 29 } else { 28 }, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let mut month = 1;
    for &d in &month_days {
        if rem_days >= d {
            rem_days -= d;
            month += 1;
        } else {
            break;
        }
    }
    let day = rem_days + 1;
    format!("{:04}-{:02}-{:02}", year, month, day)
}

fn chrono_lite_iso() -> String {
    format!("{}T00:00:00Z", chrono_lite_date())
}
