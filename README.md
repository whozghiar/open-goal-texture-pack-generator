# OpenGOAL Texture Pack Generator / Générateur de Packs de Textures OpenGOAL

> **Bilingual OpenGOAL Modding Tool Reference / Manuel d'Outil de Modding OpenGOAL Bilingue**
>
> - **Stack :** Tauri v2 · Rust · Svelte 5 · TypeScript · Vite
> - **Compatibility / Compatibilité :** Windows 10/11 x64 (Native binary / Binaire natif)
> - **Game Targets / Jeux cibles :** Jak 1, Jak 2, Jak 3

<p align="center">
  <a href="#-english-version"><b>🇬🇧 English Version</b></a> &nbsp;•&nbsp; <a href="#-version-française"><b>🇫🇷 Version Française</b></a>
</p>

> ### 📑 Summary / Sommaire
>
> - 🇬🇧 **English:** [1. Overview](#1-overview) · [2. Key Features](#2-key-features) · [3. Quick Start](#3-quick-start) · [4. Development & Build](#4-development--build) · [5. Architecture](#5-architecture)
> - 🇫🇷 **Français :** [1. Présentation](#1-présentation) · [2. Fonctionnalités Clés](#2-fonctionnalités-clés) · [3. Démarrage Rapide](#3-démarrage-rapide) · [4. Développement & Compilation](#4-développement--compilation) · [5. Architecture](#5-architecture-1)

---

# 🇬🇧 English Version

## 1. Overview

**OpenGOAL Texture Pack Generator** is a native desktop utility engineered to streamline the creation, previewing, and packaging of custom texture packs for the OpenGOAL PC ports (**Jak and Daxter: The Precursor Legacy**, **Jak II: Renegade**, and **Jak 3**).

Built using the exact same technological stack as the official [OpenGOAL Launcher](https://github.com/open-goal/launcher) (**Tauri v2 + Rust + Svelte 5 + TypeScript**), it delivers instantaneous startup, zero Python runtime overhead, and a modern glassmorphic dark interface.

## 2. Key Features

- **Smart Cross-Level Detection:** Automatically cross-references incoming textures against OpenGOAL's retail database (`tex-info.min.json`). It flags textures shared across multiple levels with glowing amber badges, helping modders decide between global routing (`_all/`) or level-specific tpages.
- **Visual Texture Grid & Zoom:** Displays real-time PNG previews with an alpha-channel checkerboard, dimensions, file size, SHA256 checksum, and destination folder selector.
- **Cover Art & Metadata Editor:** Drag and drop cover artwork (`cover.png`) and define pack name, SemVer version, author, website, and descriptive tags.
- **One-Click Package Export:** Generates an official launcher-compliant `.zip` archive containing:
  - `metadata.json` (OpenGOAL texture pack format v1)
  - `cover.png` (Aspect ratio normalized thumbnail)
  - `custom_assets/<game>/texture_replacements/<destination>/`
- **Direct Local Installation:** Test replacement textures immediately by injecting them straight into your local OpenGOAL project without manual archive unzipping.

## 3. Quick Start

### Running the Precompiled App
Simply double-click:
```text
run.bat
```
or directly execute:
```text
texture_pack_generator.exe
```

## 4. Development & Build

### Prerequisites
- Node.js (v18+) & `npm`
- Rust toolchain (`cargo`, `rustc` via [rustup.rs](https://rustup.rs))
- WebView2 (included by default in Windows 10/11)

### Commands
```bash
# Install frontend dependencies
npm install

# Run in live development mode (Hot Reload Svelte + Rust backend)
npm run tauri dev

# Compile standalone production binary & NSIS installer
npx tauri build
```
The resulting executable will be located at `src-tauri/target/release/open-goal-texture-pack-generator.exe` and installer in `src-tauri/target/release/bundle/nsis/`.

## 5. Architecture

```text
open-goal-texture-pack-generator/
├── src-tauri/                 # Native Rust Backend (Tauri v2)
│   ├── src/
│   │   ├── catalog.rs         # Inverted-index of retail game tex-info.min.json
│   │   ├── commands.rs        # IPC endpoints (scans, routing, zip builder)
│   │   ├── models.rs          # Serde data structs & metadata definitions
│   │   ├── state.rs           # Pure Rust PNG IHDR parser & thread-safe AppState
│   │   └── lib.rs / main.rs   # Entry point & plugin initialization
├── src/                       # Frontend (Svelte 5 + TypeScript + Vite)
│   ├── lib/
│   │   ├── api.ts             # Typed Tauri IPC client
│   │   ├── i18n.ts            # Bilingual EN/FR reactive localization
│   │   └── types.ts           # Shared TypeScript interfaces
│   ├── routes/+page.svelte    # Main interactive UI
│   └── app.css                # Dark glassmorphism styling
├── run.bat                    # Convenience Windows launcher
└── texture_pack_generator.exe # Standalone portable executable
```

---

# 🇫🇷 Version Française

## 1. Présentation

**OpenGOAL Texture Pack Generator** est un utilitaire de bureau natif conçu pour simplifier la création, la prévisualisation et l'empaquetage de packs de textures personnalisés pour les portages PC OpenGOAL (**Jak and Daxter: The Precursor Legacy**, **Jak II: Hors-la-loi**, et **Jak 3**).

Développé selon la même pile technologique que le [Launcher officiel OpenGOAL](https://github.com/open-goal/launcher) (**Tauri v2 + Rust + Svelte 5 + TypeScript**), il offre un démarrage instantané, aucune dépendance d'exécution Python, et une interface moderne en dark mode glassmorphique.

## 2. Fonctionnalités Clés

- **Détection Intelligente Inter-Niveaux :** Indexe et compare instantanément les textures importées avec la base de données officielle du jeu (`tex-info.min.json`). Les textures partagées entre plusieurs niveaux sont surlignées par un badge ambre, aidant le moddeur à choisir entre routage universel (`_all/`) ou ciblage de niveau spécifique.
- **Grille Visuelle & Zoom Haute Définition :** Aperçu en temps réel avec damier de transparence alpha, dimensions PNG, taille, empreinte SHA256 et sélecteur de dossier de destination.
- **Éditeur de Métadonnées & Couverture :** Glisser-déposer d'image de couverture (`cover.png`) et configuration du nom, version SemVer, auteur, lien Web et tags descriptifs.
- **Export en 1 Clic :** Génère une archive `.zip` strictement conforme aux spécifications du launcher OpenGOAL :
  - `metadata.json` (Format standard de pack de textures v1)
  - `cover.png` (Miniature normalisée)
  - `custom_assets/<game>/texture_replacements/<destination>/`
- **Installation Locale Immédiate :** Testez directement vos textures de remplacement dans votre projet OpenGOAL local sans avoir à extraire manuellement le fichier zip.

## 3. Démarrage Rapide

### Exécution de l'Application Précompilée
Double-cliquez simplement sur :
```text
run.bat
```
ou lancez directement :
```text
texture_pack_generator.exe
```

## 4. Développement & Compilation

### Prérequis
- Node.js (v18+) & `npm`
- Chaîne d'outils Rust (`cargo`, `rustc` via [rustup.rs](https://rustup.rs))
- WebView2 (intégré par défaut sous Windows 10/11)

### Commandes
```bash
# Installer les dépendances du frontend
npm install

# Lancer en mode développement (Rechargement à chaud Svelte + backend Rust)
npm run tauri dev

# Compiler le binaire autonome de production et l'installeur NSIS
npx tauri build
```
L'exécutable produit se trouvera dans `src-tauri/target/release/open-goal-texture-pack-generator.exe` et l'installeur dans `src-tauri/target/release/bundle/nsis/`.

## 5. Architecture

```text
open-goal-texture-pack-generator/
├── src-tauri/                 # Backend Rust Natif (Tauri v2)
│   ├── src/
│   │   ├── catalog.rs         # Index inversé des fichiers tex-info.min.json
│   │   ├── commands.rs        # Commandes IPC (scans, routage, générateur zip)
│   │   ├── models.rs          # Modèles de données Serde & métadonnées
│   │   ├── state.rs           # Parseur IHDR PNG pur Rust & AppState thread-safe
│   │   └── lib.rs / main.rs   # Point d'entrée et enregistrement des plugins
├── src/                       # Frontend (Svelte 5 + TypeScript + Vite)
│   ├── lib/
│   │   ├── api.ts             # Client d'appel IPC Tauri typé
│   │   ├── i18n.ts            # Dictionnaire de traduction bilingue FR/EN
│   │   └── types.ts           # Interfaces TypeScript partagées
│   ├── routes/+page.svelte    # Interface utilisateur principale
│   └── app.css                # Styles glassmorphism sombre
├── run.bat                    # Script de lancement rapide Windows
└── texture_pack_generator.exe # Exécutable autonome portable
```
