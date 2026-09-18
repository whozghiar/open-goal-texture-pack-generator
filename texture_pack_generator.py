#!/usr/bin/env python3
"""OpenGOAL - Texture Pack Generator.

Executable standalone desktop tool to compose, preview, route, and package
texture packs for OpenGOAL and the OpenGOAL Launcher.

Features:
- Live visual thumbnail preview of replacement textures with alpha checkerboard.
- Automated inverted indexing of OpenGOAL textures from `tex-info.min.json`.
- Automatic detection of textures shared across multiple levels.
- Flexible destination routing: universal `_all` or level/tpage-specific.
- Cover art image preview & metadata validator (semver, author, tags).
- 1-click export to OpenGOAL Launcher-compliant `.zip` archive (with `metadata.json`).
- Optional 1-click local deployment to `custom_assets/<game>/texture_replacements/`.

Bilingual UI (FR / EN). Zero external dependencies beyond `bottle` and `pywebview`.
"""

import hashlib
import json
import os
import re
import socket
import struct
import subprocess
import sys
import tempfile
import threading
import tkinter as tk
from tkinter import filedialog, messagebox
import urllib.parse
import webbrowser
import zipfile

import bottle

try:
    import webview  # pywebview for native desktop window
except Exception:  # pragma: no cover
    webview = None

APP_TITLE = "OpenGOAL — Texture Pack Generator"
VALID_GAMES = ("jak1", "jak2", "jak3")

TPAGE_SUFFIXES = (
    "-vis-tfrag", "-vis-pris2", "-vis-pris", "-vis-shrub", "-vis-alpha", "-vis-water",
    "-tfrag", "-pris2", "-pris", "-shrub", "-alpha", "-water", "-sprite", "-minimap", "-warp"
)


# ---------------------------------------------------------------------------
# Project root discovery
# ---------------------------------------------------------------------------

def _candidate_anchor_dirs():
    dirs = []
    if getattr(sys, "frozen", False):
        dirs.append(os.path.dirname(os.path.abspath(sys.executable)))
    dirs.append(os.path.dirname(os.path.abspath(__file__)))
    dirs.append(os.getcwd())
    return dirs


def _looks_like_project_root(path):
    return (
        os.path.isdir(os.path.join(path, "goal_src"))
        and os.path.isdir(os.path.join(path, "custom_assets"))
        and os.path.isdir(os.path.join(path, "decompiler"))
    )


def find_jak_project_root(explicit=None):
    if explicit and _looks_like_project_root(explicit):
        return os.path.abspath(explicit)

    env_root = os.environ.get("OPENGOAL_PROJECT_ROOT")
    if env_root and _looks_like_project_root(env_root):
        return os.path.abspath(env_root)

    for base in _candidate_anchor_dirs():
        cur = os.path.abspath(base)
        while cur and os.path.dirname(cur) != cur:
            if _looks_like_project_root(cur):
                return cur
            cur = os.path.dirname(cur)

    # Fallback to 4 levels up from this script (docs/modding/tools/open-goal-texture-pack-generator)
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(here, "..", "..", "..", ".."))


def detect_git_info(project_root):
    author = "whozghiar"
    branch = "master-dev"
    try:
        res = subprocess.run(["git", "config", "user.name"], cwd=project_root, capture_output=True, text=True, check=True)
        if res.stdout.strip():
            author = res.stdout.strip()
    except Exception:
        pass
    try:
        res = subprocess.run(["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=project_root, capture_output=True, text=True, check=True)
        if res.stdout.strip():
            branch = res.stdout.strip()
    except Exception:
        pass
    return author, branch


def detect_initial_game(branch, project_root):
    for candidate in VALID_GAMES:
        if branch.startswith(f"{candidate}/"):
            return candidate
    for candidate in ("jak2", "jak1", "jak3"):
        p = os.path.join(project_root, "custom_assets", candidate, "texture_replacements")
        if os.path.isdir(p) and any(f.endswith(".png") for _, _, files in os.walk(p) for f in files):
            return candidate
    return "jak2"


# ---------------------------------------------------------------------------
# PNG Inspection (Standard Library)
# ---------------------------------------------------------------------------

def get_png_dimensions(filepath_or_bytes):
    """Read width and height from PNG IHDR chunk without third-party dependencies."""
    try:
        if isinstance(filepath_or_bytes, (bytes, bytearray)):
            data = filepath_or_bytes[:32]
        else:
            with open(filepath_or_bytes, "rb") as f:
                data = f.read(32)
        if len(data) >= 24 and data[:8] == b"\x89PNG\r\n\x1a\n":
            w, h = struct.unpack(">II", data[16:24])
            color_type = data[25] if len(data) > 25 else 6
            channels = "RGBA" if color_type == 6 else ("RGB" if color_type == 2 else "indexed")
            return w, h, channels
    except Exception:
        pass
    return 0, 0, "unknown"


# ---------------------------------------------------------------------------
# Texture Database Loader & Inverted Index
# ---------------------------------------------------------------------------

class TextureCatalog:
    def __init__(self, project_root):
        self.project_root = project_root
        self._cache = {}  # game -> { "by_name": { name: {"tpages": set(), "levels": set()} }, "levels": list }

    def get_game_data(self, game):
        if game in self._cache:
            return self._cache[game]

        by_name = {}
        all_levels = set()

        json_path = os.path.join(self.project_root, "decompiler", "config", game, "ntsc_v1", "tex-info.min.json")
        if not os.path.isfile(json_path):
            # Try searching any ntsc/demo dir
            cfg_dir = os.path.join(self.project_root, "decompiler", "config", game)
            if os.path.isdir(cfg_dir):
                for root, _, files in os.walk(cfg_dir):
                    if "tex-info.min.json" in files:
                        json_path = os.path.join(root, "tex-info.min.json")
                        break

        if os.path.isfile(json_path):
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    entries = json.load(f)
                for item in entries:
                    info = item[1]
                    name = info.get("name", "").strip()
                    tpage = info.get("tpage_name", "").strip()
                    if not name:
                        continue
                    lvl = tpage
                    for s in TPAGE_SUFFIXES:
                        if tpage.endswith(s):
                            lvl = tpage[:-len(s)]
                            break
                    if lvl:
                        all_levels.add(lvl)

                    if name not in by_name:
                        by_name[name] = {"tpages": set(), "levels": set()}
                    if tpage:
                        by_name[name]["tpages"].add(tpage)
                    if lvl:
                        by_name[name]["levels"].add(lvl)
            except Exception as e:
                print(f"[TextureCatalog] Warning: Failed to load {json_path}: {e}")

        # Convert sets to sorted lists for JSON serialization
        serialized_by_name = {}
        for k, v in by_name.items():
            tpages = sorted(list(v["tpages"]))
            levels = sorted(list(v["levels"]))
            serialized_by_name[k] = {
                "tpages": tpages,
                "levels": levels,
                "is_shared": len(levels) > 1 or len(tpages) > 1,
            }

        sorted_levels = sorted(list(all_levels))
        self._cache[game] = {
            "by_name": serialized_by_name,
            "levels": sorted_levels,
            "count": len(serialized_by_name),
        }
        return self._cache[game]

    def match_texture(self, game, tex_name):
        data = self.get_game_data(game)
        by_name = data["by_name"]
        clean_name = tex_name.lower().replace(".png", "")
        if clean_name in by_name:
            entry = by_name[clean_name]
            return {
                "known": True,
                "is_shared": entry["is_shared"],
                "levels": entry["levels"],
                "tpages": entry["tpages"],
            }
        return {
            "known": False,
            "is_shared": False,
            "levels": [],
            "tpages": [],
        }


# ---------------------------------------------------------------------------
# State Management
# ---------------------------------------------------------------------------

class AppState:
    def __init__(self, project_root):
        self.project_root = project_root
        self.catalog = TextureCatalog(project_root)
        self.git_author, self.git_branch = detect_git_info(project_root)
        self.game = detect_initial_game(self.git_branch, project_root)

        # Metadata
        self.pack_name = "Custom HD Textures"
        self.pack_version = "1.0.0"
        self.pack_author = self.git_author
        self.pack_description = f"Texture replacement pack for OpenGOAL ({self.game.upper()})."
        self.pack_tags = [self.game, "retexture", "hd"]

        # Cover image: { "path": ..., "bytes": ..., "mime": ... }
        self.cover = None
        self._load_default_cover()

        # Textures: id -> { ... }
        self.textures = {}
        self._next_id = 1
        self.lock = threading.Lock()

    def _load_default_cover(self):
        candidates = [
            os.path.join(self.project_root, "docs", "img", "mod", "mod_cover.png"),
            os.path.join(self.project_root, "docs", "img", "mod", "cover.png"),
            os.path.join(self.project_root, "custom_assets", self.game, "cover.png"),
        ]
        for c in candidates:
            if os.path.isfile(c):
                try:
                    with open(c, "rb") as f:
                        b = f.read()
                    self.cover = {
                        "path": c,
                        "bytes": b,
                        "mime": "image/png",
                        "filename": os.path.basename(c),
                    }
                    return
                except Exception:
                    pass

    def add_texture_file(self, file_path, origin_tpage=None):
        if not os.path.isfile(file_path) or not file_path.lower().endswith(".png"):
            return None

        filename = os.path.basename(file_path)
        tex_name = os.path.splitext(filename)[0]

        # Read dimensions
        w, h, channels = get_png_dimensions(file_path)
        size_bytes = os.path.getsize(file_path)

        # Match against game DB
        match = self.catalog.match_texture(self.game, tex_name)

        # Determine default destination tpage
        dest_tpage = "_all"
        if origin_tpage and origin_tpage != "_all":
            dest_tpage = origin_tpage
        elif not match["is_shared"] and len(match["tpages"]) == 1:
            dest_tpage = match["tpages"][0]

        with self.lock:
            # Check if this exact source path is already loaded
            for tid, item in self.textures.items():
                if item["src_path"] == file_path:
                    item["dest_tpage"] = dest_tpage
                    return item

            tex_id = f"tex_{self._next_id}"
            self._next_id += 1

            tex_obj = {
                "id": tex_id,
                "name": tex_name,
                "filename": filename,
                "src_path": file_path,
                "width": w,
                "height": h,
                "channels": channels,
                "size_bytes": size_bytes,
                "known": match["known"],
                "is_shared": match["is_shared"],
                "levels": match["levels"],
                "tpages": match["tpages"],
                "dest_tpage": dest_tpage,
            }
            self.textures[tex_id] = tex_obj
            return tex_obj

    def refresh_texture_matches(self):
        """Called when game changes to re-evaluate is_shared and tpages."""
        with self.lock:
            for _, item in self.textures.items():
                match = self.catalog.match_texture(self.game, item["name"])
                item["known"] = match["known"]
                item["is_shared"] = match["is_shared"]
                item["levels"] = match["levels"]
                item["tpages"] = match["tpages"]
                if item["dest_tpage"] != "_all" and item["dest_tpage"] not in match["tpages"]:
                    item["dest_tpage"] = "_all"


# ---------------------------------------------------------------------------
# Native File Dialog Helpers
# ---------------------------------------------------------------------------

def show_folder_dialog(title="Sélectionner un dossier", initialdir=None):
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    path = filedialog.askdirectory(title=title, initialdir=initialdir or os.getcwd())
    root.destroy()
    return path


def show_open_files_dialog(title="Sélectionner des textures PNG", initialdir=None):
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    files = filedialog.askopenfilenames(
        title=title,
        initialdir=initialdir or os.getcwd(),
        filetypes=[("Images PNG (*.png)", "*.png"), ("Tous les fichiers", "*.*")],
    )
    root.destroy()
    return list(files)


def show_open_image_dialog(title="Sélectionner l'image de couverture (cover.png)", initialdir=None):
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    path = filedialog.askopenfilename(
        title=title,
        initialdir=initialdir or os.getcwd(),
        filetypes=[("Images (*.png;*.jpg;*.jpeg;*.webp)", "*.png;*.jpg;*.jpeg;*.webp"), ("PNG (*.png)", "*.png"), ("Tous les fichiers", "*.*")],
    )
    root.destroy()
    return path


def show_save_zip_dialog(title="Enregistrer le pack de texture (.zip)", initialfile="custom-textures-v1.0.0.zip", initialdir=None):
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    path = filedialog.asksaveasfilename(
        title=title,
        initialdir=initialdir or os.getcwd(),
        initialfile=initialfile,
        defaultextension=".zip",
        filetypes=[("Archive Zip (*.zip)", "*.zip"), ("Tous les fichiers", "*.*")],
    )
    root.destroy()
    return path


# ---------------------------------------------------------------------------
# Bottle Web Application
# ---------------------------------------------------------------------------

def create_app(state: AppState):
    app = bottle.Bottle()
    ui_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ui")

    @app.route("/")
    def index():
        return bottle.static_file("index.html", root=ui_dir)

    @app.route("/ui/<filepath:path>")
    def static_ui(filepath):
        return bottle.static_file(filepath, root=ui_dir)

    @app.route("/api/status", method="GET")
    def get_status():
        cat_data = state.catalog.get_game_data(state.game)
        with state.lock:
            tex_list = list(state.textures.values())
            shared_count = sum(1 for t in tex_list if t["is_shared"])
            total_size = sum(t["size_bytes"] for t in tex_list)

        return {
            "project_root": state.project_root,
            "game": state.game,
            "valid_games": list(VALID_GAMES),
            "levels": cat_data["levels"],
            "total_db_textures": cat_data["count"],
            "cover": {
                "has_cover": state.cover is not None,
                "filename": state.cover["filename"] if state.cover else None,
            },
            "meta": {
                "name": state.pack_name,
                "version": state.pack_version,
                "author": state.pack_author,
                "description": state.pack_description,
                "tags": state.pack_tags,
            },
            "textures": tex_list,
            "stats": {
                "total_textures": len(tex_list),
                "shared_textures": shared_count,
                "total_size_bytes": total_size,
            },
        }

    @app.route("/api/set-game", method="POST")
    def set_game():
        data = bottle.request.json or {}
        new_game = data.get("game", "").lower()
        if new_game in VALID_GAMES:
            state.game = new_game
            state.pack_description = f"Texture replacement pack for OpenGOAL ({new_game.upper()})."
            if new_game not in state.pack_tags:
                state.pack_tags = [new_game, "retexture", "hd"]
            state.refresh_texture_matches()
        return get_status()

    @app.route("/api/update-meta", method="POST")
    def update_meta():
        data = bottle.request.json or {}
        if "name" in data:
            state.pack_name = str(data["name"]).strip() or "Custom Textures"
        if "version" in data:
            state.pack_version = str(data["version"]).strip() or "1.0.0"
        if "author" in data:
            state.pack_author = str(data["author"]).strip() or state.git_author
        if "description" in data:
            state.pack_description = str(data["description"]).strip()
        if "tags" in data and isinstance(data["tags"], list):
            state.pack_tags = [str(t).strip() for t in data["tags"] if str(t).strip()]
        return {"success": True}

    @app.route("/api/pick-cover", method="POST")
    def pick_cover():
        path = show_open_image_dialog(initialdir=state.project_root)
        if not path or not os.path.isfile(path):
            return {"success": False, "cancelled": True}
        try:
            with open(path, "rb") as f:
                b = f.read()
            ext = os.path.splitext(path)[1].lower()
            mime = "image/png" if ext == ".png" else ("image/jpeg" if ext in (".jpg", ".jpeg") else "image/webp")
            state.cover = {
                "path": path,
                "bytes": b,
                "mime": mime,
                "filename": os.path.basename(path),
            }
            return {"success": True, "filename": os.path.basename(path)}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @app.route("/api/remove-cover", method="POST")
    def remove_cover():
        state.cover = None
        return {"success": True}

    @app.route("/api/cover-image", method="GET")
    def get_cover_image():
        if not state.cover or not state.cover.get("bytes"):
            return bottle.HTTPResponse(status=404, body="No cover loaded")
        return bottle.HTTPResponse(
            body=state.cover["bytes"],
            headers={"Content-Type": state.cover.get("mime", "image/png"), "Cache-Control": "no-cache"}
        )

    @app.route("/api/pick-folder", method="POST")
    def pick_folder():
        folder = show_folder_dialog(
            title=f"Choisir le dossier de textures ({state.game})",
            initialdir=os.path.join(state.project_root, "custom_assets", state.game)
        )
        if not folder or not os.path.isdir(folder):
            return {"success": False, "cancelled": True}

        added = 0
        for root, dirs, files in os.walk(folder):
            for f in files:
                if f.lower().endswith(".png"):
                    full_p = os.path.join(root, f)
                    rel = os.path.relpath(full_p, folder).replace("\\", "/")
                    parts = rel.split("/")
                    origin_tpage = parts[0] if len(parts) > 1 else "_all"
                    if state.add_texture_file(full_p, origin_tpage=origin_tpage):
                        added += 1

        return {"success": True, "added": added, "folder": folder, "status": get_status()}

    @app.route("/api/pick-files", method="POST")
    def pick_files():
        files = show_open_files_dialog(
            title=f"Ajouter des fichiers textures PNG ({state.game})",
            initialdir=os.path.join(state.project_root, "custom_assets", state.game)
        )
        if not files:
            return {"success": False, "cancelled": True}

        added = 0
        for f in files:
            if state.add_texture_file(f):
                added += 1

        return {"success": True, "added": added, "status": get_status()}

    @app.route("/api/scan-project-assets", method="POST")
    def scan_project_assets():
        tex_dir = os.path.join(state.project_root, "custom_assets", state.game, "texture_replacements")
        if not os.path.isdir(tex_dir):
            return {"success": False, "error": f"Dossier introuvable: custom_assets/{state.game}/texture_replacements"}

        added = 0
        for root, dirs, files in os.walk(tex_dir):
            for f in files:
                if f.lower().endswith(".png"):
                    full_p = os.path.join(root, f)
                    rel = os.path.relpath(full_p, tex_dir).replace("\\", "/")
                    parts = rel.split("/")
                    origin_tpage = parts[0] if len(parts) > 1 else "_all"
                    if state.add_texture_file(full_p, origin_tpage=origin_tpage):
                        added += 1

        return {"success": True, "added": added, "dir": tex_dir, "status": get_status()}

    @app.route("/api/update-texture-dest", method="POST")
    def update_texture_dest():
        data = bottle.request.json or {}
        tex_id = data.get("id")
        dest = data.get("dest_tpage", "_all").strip()
        with state.lock:
            if tex_id in state.textures:
                state.textures[tex_id]["dest_tpage"] = dest
                return {"success": True, "texture": state.textures[tex_id]}
        return {"success": False, "error": "Texture introuvable"}

    @app.route("/api/batch-set-dest", method="POST")
    def batch_set_dest():
        data = bottle.request.json or {}
        mode = data.get("mode", "all")  # 'all' (force _all) or 'level' (route to matching level tpage)
        target_level = data.get("level", "").strip()

        updated = 0
        with state.lock:
            for tid, item in state.textures.items():
                if mode == "all":
                    item["dest_tpage"] = "_all"
                    updated += 1
                elif mode == "level" and target_level:
                    # Look for a tpage that matches this level
                    matching_tpages = [tp for tp in item["tpages"] if tp.startswith(target_level)]
                    if matching_tpages:
                        item["dest_tpage"] = matching_tpages[0]
                        updated += 1
                    else:
                        item["dest_tpage"] = "_all"
                        updated += 1

        return {"success": True, "updated": updated, "status": get_status()}

    @app.route("/api/remove-texture", method="POST")
    def remove_texture():
        data = bottle.request.json or {}
        tex_id = data.get("id")
        with state.lock:
            if tex_id in state.textures:
                del state.textures[tex_id]
                return {"success": True}
        return {"success": False, "error": "Texture introuvable"}

    @app.route("/api/clear-textures", method="POST")
    def clear_textures():
        with state.lock:
            state.textures.clear()
        return {"success": True}

    @app.route("/api/texture-image/<tex_id>", method="GET")
    def get_texture_image(tex_id):
        with state.lock:
            item = state.textures.get(tex_id)
        if not item or not os.path.isfile(item["src_path"]):
            return bottle.HTTPResponse(status=404, body="Texture not found")
        return bottle.static_file(os.path.basename(item["src_path"]), root=os.path.dirname(item["src_path"]), mimetype="image/png")

    @app.route("/api/export-zip", method="POST")
    def export_zip():
        with state.lock:
            tex_items = list(state.textures.values())
        if not tex_items:
            return {"success": False, "error": "Aucune texture à packager."}

        # Slugify pack name
        clean_slug = re.sub(r"[^a-zA-Z0-9_-]+", "-", state.pack_name.lower()).strip("-")
        if not clean_slug.endswith("-textures"):
            clean_slug = f"{clean_slug}-textures"

        default_zip_name = f"{clean_slug}-v{state.pack_version}.zip"
        initial_dir = os.path.join(state.project_root, "out", "textures")
        os.makedirs(initial_dir, exist_ok=True)

        dest_zip = show_save_zip_dialog(
            title="Enregistrer le pack de texture OpenGOAL (.zip)",
            initialfile=default_zip_name,
            initialdir=initial_dir
        )
        if not dest_zip:
            return {"success": False, "cancelled": True}

        try:
            now_iso = bottle.datetime.datetime.now(bottle.datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            release_date = bottle.datetime.datetime.now(bottle.datetime.timezone.utc).strftime("%Y-%m-%d")

            metadata = {
                "schemaVersion": "1.0.0",
                "version": state.pack_version,
                "name": state.pack_name,
                "description": state.pack_description,
                "author": state.pack_author,
                "authors": state.pack_author,
                "releaseDate": release_date,
                "publishedDate": now_iso,
                "tags": state.pack_tags,
                "supportedGames": [state.game],
            }

            with zipfile.ZipFile(dest_zip, "w", zipfile.ZIP_DEFLATED) as zf:
                # 1. metadata.json
                zf.writestr("metadata.json", json.dumps(metadata, indent=2, ensure_ascii=False).encode("utf-8"))

                # 2. cover.png
                if state.cover and state.cover.get("bytes"):
                    zf.writestr("cover.png", state.cover["bytes"])

                # 3. custom_assets/<game>/texture_replacements/<dest_tpage>/<filename>
                for item in tex_items:
                    dest_tpage = item.get("dest_tpage") or "_all"
                    arcname = f"custom_assets/{state.game}/texture_replacements/{dest_tpage}/{item['filename']}"
                    zf.write(item["src_path"], arcname=arcname)

            # Compute SHA256
            hasher = hashlib.sha256()
            with open(dest_zip, "rb") as f:
                while chunk := f.read(65536):
                    hasher.update(chunk)
            sha256 = hasher.hexdigest()
            size_kb = round(os.path.getsize(dest_zip) / 1024, 1)

            return {
                "success": True,
                "path": dest_zip,
                "sha256": sha256,
                "size_kb": size_kb,
                "texture_count": len(tex_items),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @app.route("/api/install-local", method="POST")
    def install_local():
        with state.lock:
            tex_items = list(state.textures.values())
        if not tex_items:
            return {"success": False, "error": "Aucune texture à installer."}

        target_base = os.path.join(state.project_root, "custom_assets", state.game, "texture_replacements")
        installed = 0
        try:
            for item in tex_items:
                dest_tpage = item.get("dest_tpage") or "_all"
                out_dir = os.path.join(target_base, dest_tpage)
                os.makedirs(out_dir, exist_ok=True)
                dest_file = os.path.join(out_dir, item["filename"])
                # Copy file if source differs from destination
                if os.path.abspath(item["src_path"]) != os.path.abspath(dest_file):
                    with open(item["src_path"], "rb") as src, open(dest_file, "wb") as dst:
                        dst.write(src.read())
                installed += 1
            return {"success": True, "installed": installed, "target_dir": target_base}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @app.route("/api/open-folder", method="POST")
    def open_folder():
        data = bottle.request.json or {}
        target_path = data.get("path", "")
        if target_path and os.path.exists(target_path):
            try:
                if sys.platform == "win32":
                    subprocess.run(["explorer", "/select,", os.path.normpath(target_path)])
                else:
                    folder = os.path.dirname(target_path) if os.path.isfile(target_path) else target_path
                    webbrowser.open(folder)
                return {"success": True}
            except Exception as e:
                return {"success": False, "error": str(e)}
        return {"success": False, "error": "Chemin introuvable"}

    return app


# ---------------------------------------------------------------------------
# Main Entry Point
# ---------------------------------------------------------------------------

def free_port():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(("127.0.0.1", 0))
    p = s.getsockname()[1]
    s.close()
    return p


def main():
    explicit_project = None
    serve_only = False
    args = sys.argv[1:]
    for i, a in enumerate(args):
        if a in ("--project", "-p") and i + 1 < len(args):
            explicit_project = args[i + 1]
        elif a == "--serve":
            serve_only = True

    root = find_jak_project_root(explicit_project)
    print(f"[texture-pack-generator] OpenGOAL Project Root: {root}")
    if not _looks_like_project_root(root):
        print("[texture-pack-generator] WARNING: Not a jak-project checkout (missing goal_src/ or custom_assets/).")

    state = AppState(root)
    app = create_app(state)
    port = free_port()

    threading.Thread(
        target=lambda: bottle.run(app, host="127.0.0.1", port=port, quiet=True),
        daemon=True,
    ).start()

    url = f"http://127.0.0.1:{port}/"
    print(f"[texture-pack-generator] Server running at: {url}")

    if serve_only or webview is None:
        print("[texture-pack-generator] Opening in web browser (pywebview not active or --serve specified)...")
        webbrowser.open(url)
        threading.Event().wait()
        return

    webview.create_window(
        APP_TITLE,
        url=url,
        width=1400,
        height=900,
        min_size=(1050, 700),
        background_color="#0b0f19",
    )
    webview.start()


if __name__ == "__main__":
    main()
