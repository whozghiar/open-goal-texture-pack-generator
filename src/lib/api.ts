import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import type { ExportResult, ProjectStatus } from "./types";

export const api = {
  async getStatus(): Promise<ProjectStatus> {
    return await invoke<ProjectStatus>("get_status");
  },

  async setGame(game: string): Promise<ProjectStatus> {
    return await invoke<ProjectStatus>("set_game", { game });
  },

  async updateMeta(
    name: string,
    version: string,
    author: string,
    description: string,
    tags: string[],
  ): Promise<void> {
    return await invoke("update_meta", {
      name,
      version,
      author,
      description,
      tags,
    });
  },

  async pickCover(): Promise<ProjectStatus | null> {
    const selected = await open({
      title: "Sélectionner la couverture (cover.png)",
      multiple: false,
      directory: false,
      filters: [
        {
          name: "Images",
          extensions: ["png", "jpg", "jpeg", "webp"],
        },
      ],
    });
    if (selected && typeof selected === "string") {
      return await invoke<ProjectStatus>("set_cover", { path: selected });
    }
    return null;
  },

  async removeCover(): Promise<ProjectStatus> {
    return await invoke<ProjectStatus>("remove_cover");
  },

  async pickFolder(): Promise<ProjectStatus | null> {
    const selected = await open({
      title: "Sélectionner un dossier de textures",
      multiple: false,
      directory: true,
    });
    if (selected && typeof selected === "string") {
      return await invoke<ProjectStatus>("scan_folder", {
        folderPath: selected,
      });
    }
    return null;
  },

  async pickFiles(): Promise<ProjectStatus | null> {
    const selected = await open({
      title: "Sélectionner des fichiers textures PNG",
      multiple: true,
      directory: false,
      filters: [
        {
          name: "PNG Images",
          extensions: ["png"],
        },
      ],
    });
    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected];
      if (paths.length > 0) {
        return await invoke<ProjectStatus>("scan_files", { filePaths: paths });
      }
    }
    return null;
  },

  async scanProjectAssets(): Promise<ProjectStatus> {
    return await invoke<ProjectStatus>("scan_project_assets");
  },

  async updateTextureDest(id: string, destTpage: string): Promise<void> {
    return await invoke("update_texture_dest", { id, destTpage });
  },

  async batchSetDest(
    mode: string,
    level?: string,
  ): Promise<ProjectStatus> {
    return await invoke<ProjectStatus>("batch_set_dest", { mode, level });
  },

  async removeTexture(id: string): Promise<ProjectStatus> {
    return await invoke<ProjectStatus>("remove_texture", { id });
  },

  async clearTextures(): Promise<ProjectStatus> {
    return await invoke<ProjectStatus>("clear_textures");
  },

  async getTextureDataUrl(id: string): Promise<string> {
    return await invoke<string>("get_texture_data_url", { id });
  },

  async exportZip(defaultFilename: string): Promise<ExportResult | null> {
    const dest = await save({
      title: "Enregistrer l'archive du pack (.zip)",
      defaultPath: defaultFilename,
      filters: [
        {
          name: "Archive ZIP",
          extensions: ["zip"],
        },
      ],
    });
    if (dest) {
      return await invoke<ExportResult>("export_zip", { destZipPath: dest });
    }
    return null;
  },

  async installLocal(): Promise<number> {
    return await invoke<number>("install_local");
  },

  async openInExplorer(path: string): Promise<void> {
    return await invoke("open_in_explorer", { path });
  },
};
