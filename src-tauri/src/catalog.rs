use std::collections::{HashMap, HashSet};
use std::fs::File;
use std::io::BufReader;
use std::path::PathBuf;

const TPAGE_SUFFIXES: &[&str] = &[
    "-vis-tfrag", "-vis-pris2", "-vis-pris", "-vis-shrub", "-vis-alpha", "-vis-water",
    "-tfrag", "-pris2", "-pris", "-shrub", "-alpha", "-water", "-sprite", "-minimap", "-warp",
];

#[derive(Debug, Clone)]
pub struct CatalogEntry {
    pub tpages: Vec<String>,
    pub levels: Vec<String>,
    pub is_shared: bool,
}

#[derive(Debug, Clone)]
pub struct GameCatalog {
    pub by_name: HashMap<String, CatalogEntry>,
    pub levels: Vec<String>,
    pub count: usize,
}

#[derive(Debug)]
pub struct TextureCatalog {
    project_root: PathBuf,
    cache: HashMap<String, GameCatalog>,
}

impl TextureCatalog {
    pub fn new(project_root: PathBuf) -> Self {
        Self {
            project_root,
            cache: HashMap::new(),
        }
    }

    pub fn get_game_data(&mut self, game: &str) -> &GameCatalog {
        if !self.cache.contains_key(game) {
            let data = self.load_game_data(game);
            self.cache.insert(game.to_string(), data);
        }
        self.cache.get(game).unwrap()
    }

    fn load_game_data(&self, game: &str) -> GameCatalog {
        let mut by_name: HashMap<String, (HashSet<String>, HashSet<String>)> = HashMap::new();
        let mut all_levels: HashSet<String> = HashSet::new();

        let candidates = [
            self.project_root.join("decompiler").join("config").join(game).join("ntsc_v1").join("tex-info.min.json"),
            self.project_root.join("decompiler").join("config").join(game).join("demo").join("tex-info.min.json"),
        ];

        let mut found_path = None;
        for c in &candidates {
            if c.is_file() {
                found_path = Some(c.clone());
                break;
            }
        }

        if let Some(path) = found_path {
            if let Ok(file) = File::open(&path) {
                let reader = BufReader::new(file);
                if let Ok(json_val) = serde_json::from_reader::<_, serde_json::Value>(reader) {
                    if let Some(array) = json_val.as_array() {
                        for item in array {
                            if let Some(tuple) = item.as_array() {
                                if tuple.len() >= 2 {
                                    if let Some(obj) = tuple[1].as_object() {
                                        let name = obj.get("name").and_then(|v| v.as_str()).unwrap_or("").trim().to_lowercase();
                                        let tpage = obj.get("tpage_name").and_then(|v| v.as_str()).unwrap_or("").trim();
                                        if !name.is_empty() {
                                            let mut lvl = tpage;
                                            for suffix in TPAGE_SUFFIXES {
                                                if tpage.ends_with(suffix) {
                                                    lvl = &tpage[..tpage.len() - suffix.len()];
                                                    break;
                                                }
                                            }
                                            if !lvl.is_empty() {
                                                all_levels.insert(lvl.to_string());
                                            }

                                            let entry = by_name.entry(name).or_insert_with(|| (HashSet::new(), HashSet::new()));
                                            if !tpage.is_empty() {
                                                entry.0.insert(tpage.to_string());
                                            }
                                            if !lvl.is_empty() {
                                                entry.1.insert(lvl.to_string());
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        let mut final_by_name: HashMap<String, CatalogEntry> = HashMap::new();
        for (k, (tpages_set, levels_set)) in by_name {
            let mut tpages: Vec<String> = tpages_set.into_iter().collect();
            let mut levels: Vec<String> = levels_set.into_iter().collect();
            tpages.sort();
            levels.sort();
            let is_shared = levels.len() > 1 || tpages.len() > 1;
            final_by_name.insert(k, CatalogEntry {
                tpages,
                levels,
                is_shared,
            });
        }

        let mut sorted_levels: Vec<String> = all_levels.into_iter().collect();
        sorted_levels.sort();
        let count = final_by_name.len();

        GameCatalog {
            by_name: final_by_name,
            levels: sorted_levels,
            count,
        }
    }

    pub fn match_texture(&mut self, game: &str, tex_name: &str) -> (bool, bool, Vec<String>, Vec<String>) {
        let clean = tex_name.to_lowercase().replace(".png", "");
        let cat = self.get_game_data(game);
        if let Some(entry) = cat.by_name.get(&clean) {
            (true, entry.is_shared, entry.levels.clone(), entry.tpages.clone())
        } else {
            (false, false, Vec::new(), Vec::new())
        }
    }
}
