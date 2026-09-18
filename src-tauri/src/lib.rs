mod catalog;
mod commands;
mod models;
mod state;

use std::sync::Mutex;
use state::{find_project_root, AppState};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let project_root = find_project_root();
    let app_state = Mutex::new(AppState::new(project_root));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::get_status,
            commands::set_game,
            commands::update_meta,
            commands::set_cover,
            commands::remove_cover,
            commands::scan_folder,
            commands::scan_files,
            commands::scan_project_assets,
            commands::update_texture_dest,
            commands::batch_set_dest,
            commands::remove_texture,
            commands::clear_textures,
            commands::get_texture_data_url,
            commands::export_zip,
            commands::install_local,
            commands::open_in_explorer,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
