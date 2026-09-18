# OpenGOAL — Texture Pack Generator / Générateur de Packs de Textures OpenGOAL

> **Bilingual OpenGOAL Reference Manual / Manuel de Référence Bilingue**
>
> - **Tool Location / Emplacement :** `docs/modding/tools/open-goal-texture-pack-generator/`
> - **Submodule / Sous-module :** `open-goal-texture-pack-generator`
> - **Standalone Executable / Exécutable Windows :** `texture_pack_generator.exe`
> - **Launcher / Lanceur Script :** `run.bat` (`python texture_pack_generator.py`)
> - **Binary Rebuild / Recompilation :** `build_exe.bat`

<p align="center">
  <a href="#-english-version"><b>🇬🇧 English Version</b></a> &nbsp;•&nbsp; <a href="#-version-française"><b>🇫🇷 Version Française</b></a>
</p>

> ### 📑 Summary / Sommaire
>
> - 🇬🇧 **English:** [1. Overview & Purpose](#1-overview--purpose) · [2. Key Features](#2-key-features) · [3. How It Works (Shared vs _all)](#3-how-it-works-shared-textures-and-_all-routing) · [4. Launch & Usage](#4-launch--usage) · [5. Building Standalone Executable](#5-building-standalone-executable)
> - 🇫🇷 **Français :** [1. Présentation & Objectifs](#1-présentation--objectifs) · [2. Fonctionnalités Clés](#2-fonctionnalités-clés) · [3. Fonctionnement (Textures Partagées & _all)](#3-fonctionnement-textures-partagées-et-routage-_all) · [4. Lancement & Utilisation](#4-lancement--utilisation) · [5. Compilation de l'Exécutable](#5-compilation-de-lexécutable-autonome)

---

# 🇬🇧 English Version

## 1. Overview & Purpose

The **OpenGOAL Texture Pack Generator** is a standalone, dedicated desktop application designed to streamline the creation, visual preview, routing, and packaging of custom texture replacement packs for OpenGOAL and the OpenGOAL Launcher.

In OpenGOAL, textures are replaced either globally across all levels (`custom_assets/<game>/texture_replacements/_all/`) or specifically inside a designated texture page folder (`custom_assets/<game>/texture_replacements/<tpage-name>/`). Because thousands of textures are shared across multiple levels, modders often encounter unexpected regressions when altering shared textures.

This tool solves this challenge by:
1. Providing live visual previews of replacement PNGs with transparency checkerboards.
2. Inverted-indexing OpenGOAL's complete texture catalog (`tex-info.min.json`) for Jak 1, Jak 2, and Jak 3.
3. Highlighting textures that are shared between levels and guiding destination choices.
4. Exporting compliant, 1-click installable `.zip` archives with official `metadata.json` and cover art.

---

## 2. Key Features

- **Live Visual Preview:** Inspect PNG thumbnails, pixel dimensions (e.g. 512x512 RGBA), and file sizes on a dark glassmorphism interface with transparency checkerboards.
- **Shared Texture Intelligence:** Automatic detection of textures shared across multiple levels (e.g. `samosyoung-hair` across 10 levels), with visual amber warning badges.
- **Dual Routing Control:** Choose between universal replacement (`_all/`) or level/tpage-specific isolation (`<tpage-name>/`), individually or in batch.
- **Cover Art & Metadata Composer:** Drag & drop cover images (`cover.png`) and edit SemVer version, pack title, author, and description.
- **1-Click Official ZIP Exporter:** Generates an OpenGOAL Launcher v1 compliant `.zip` archive containing `metadata.json`, `cover.png`, and the correctly structured `custom_assets/` directory tree, alongside computed SHA256 checksums.
- **Local Project Deployer:** Instantly inject replacement textures into your local `custom_assets/<game>/texture_replacements/` directory for immediate testing via `task extract`.
- **Zero Heavy Dependencies:** Powered by Python 3 with an embedded Bottle microserver and native PyWebView desktop window. Fully standalone when built with PyInstaller.

---

## 3. How It Works (Shared Textures and _all Routing)

OpenGOAL's C++ asset extractor (`TextureDB.cpp`) resolves texture replacements in this order:
1. `custom_assets/<game>/texture_replacements/<tpage-name>/<texture-name>.png`
2. `custom_assets/<game>/texture_replacements/_all/<texture-name>.png` (fallback)

### Shared Textures
In Jak 2, for example, out of 6,060 retail textures, **2,326 textures are shared across different levels**. When you alter a shared texture:
- If placed in `_all/`, it updates across every level that references it.
- If placed in `<tpage-name>/`, it only alters that specific level's texture page, keeping other levels in their retail appearance.

The tool analyzes `tex-info.min.json` and lets you route textures with a single click.

---

## 4. Launch & Usage

### Method A: Direct Executable (Recommended)
Double-click:
```text
docs\modding\tools\open-goal-texture-pack-generator\texture_pack_generator.exe
```

### Method B: Batch Launcher
Double-click:
```text
docs\modding\tools\open-goal-texture-pack-generator\run.bat
```

### Method C: Python Terminal
```powershell
python docs/modding/tools/open-goal-texture-pack-generator/texture_pack_generator.py
```

### Workflow Steps:
1. **Select Target Game:** Choose `Jak 1`, `Jak 2`, or `Jak 3` in the header bar.
2. **Add Cover Art:** Drag and drop an image onto the cover box or click **Browse...**.
3. **Configure Metadata:** Enter the pack name, version, and author.
4. **Import Textures:** Click **Import Folder**, **Add Files**, or **custom_assets folder** to load textures from the active project.
5. **Inspect & Route:** Review shared badges and select destination (`_all` or specific tpage).
6. **Export:** Click **Export Pack (.zip)** to save the ready-to-distribute archive.

---

## 5. Building Standalone Executable

To compile `texture_pack_generator.exe` from source:
1. Run:
   ```cmd
   docs\modding\tools\open-goal-texture-pack-generator\build_exe.bat
   ```
2. The PyInstaller script installs dependencies and outputs `texture_pack_generator.exe`.

---

# 🇫🇷 Version Française

## 1. Présentation & Objectifs

L'outil **OpenGOAL Texture Pack Generator** est une application desktop autonome dédiée à la création, la prévisualisation visuelle, le routage et le packaging des packs de textures pour OpenGOAL et le Launcher officiel.

Dans OpenGOAL, le remplacement de textures s'effectue soit de façon globale pour tous les niveaux (`custom_assets/<game>/texture_replacements/_all/`), soit spécifiquement au sein du dossier d'une page de texture (`custom_assets/<game>/texture_replacements/<tpage-name>/`). Étant donné que plusieurs milliers de textures sont partagées entre plusieurs niveaux, les moddeurs risquent souvent de provoquer des régressions visuelles inattendues.

Cet outil résout ce problème en :
1. Fournissant une prévisualisation visuelle immédiate des PNG avec damier de transparence.
2. Indexant l'intégralité du catalogue de textures OpenGOAL (`tex-info.min.json`) pour Jak 1, Jak 2 et Jak 3.
3. Mettant en évidence les textures partagées entre plusieurs niveaux et facilitant le choix de destination.
4. Exportant une archive `.zip` prête à l'emploi conforme au Launcher OpenGOAL avec `metadata.json` et couverture.

---

## 2. Fonctionnalités Clés

- **Prévisualisation Visuelle Temps Réel :** Affichage des miniatures PNG avec fond damier (canal alpha), dimensions exactes (ex: 512x512 RGBA) et taille du fichier sur une interface sombre soignée.
- **Détection des Textures Partagées :** Identification automatique des textures partagées entre plusieurs niveaux (ex: `samosyoung-hair` partagé sur 10 niveaux), avec badge d'alerte orange.
- **Contrôle de Routage Double :** Choix entre un remplacement universel (`_all/`) ou un ciblage par niveau/tpage (`<tpage-name>/`), individuellement ou par lot.
- **Gestionnaire de Couverture & Métadonnées :** Glisser-déposer de l'image de couverture (`cover.png`) et édition du nom, de la version (SemVer), de l'auteur et de la description.
- **Export ZIP Conforme Launcher en 1 Clic :** Génère une archive `.zip` conforme au schéma v1 du Launcher OpenGOAL contenant `metadata.json`, `cover.png` et l'arborescence complète `custom_assets/`, avec calcul de l'empreinte SHA256.
- **Déploiement Local Direct :** Copie en un clic les textures modifiées directement dans `custom_assets/<game>/texture_replacements/` pour tester immédiatement avec `task extract`.
- **Zéro Dépendance Lourde :** Fonctionne sous Python 3 avec un microserveur Bottle embarqué et une fenêtre native PyWebView. Totalement autonome sous forme de `.exe`.

---

## 3. Fonctionnement (Textures Partagées et Routage _all)

L'extracteur C++ d'OpenGOAL (`TextureDB.cpp`) résout les remplacements selon la priorité suivante :
1. `custom_assets/<game>/texture_replacements/<tpage-name>/<texture-name>.png`
2. `custom_assets/<game>/texture_replacements/_all/<texture-name>.png` (repli global)

### Les Textures Partagées
Dans Jak 2 par exemple, sur 6 060 textures originales, **2 326 textures sont partagées entre différents niveaux**. Lorsque vous modifiez une texture partagée :
- Placée dans `_all/`, elle est remplacée dans tous les niveaux où elle est affichée.
- Placée dans `<tpage-name>/`, elle n'est remplacée que pour ce tpage spécifique, préservant l'aspect d'origine dans les autres niveaux.

L'outil analyse `tex-info.min.json` et vous permet d'affecter chaque texture en un clic.

---

## 4. Lancement & Utilisation

### Méthode A : Exécutable Direct (Recommandée)
Double-cliquez sur :
```text
docs\modding\tools\open-goal-texture-pack-generator\texture_pack_generator.exe
```

### Méthode B : Lanceur Batch
Double-cliquez sur :
```text
docs\modding\tools\open-goal-texture-pack-generator\run.bat
```

### Méthode C : Terminal Python
```powershell
python docs/modding/tools/open-goal-texture-pack-generator/texture_pack_generator.py
```

### Étapes d'utilisation :
1. **Choisir le Jeu Cible :** Sélectionnez `Jak 1`, `Jak 2` ou `Jak 3` dans la barre supérieure.
2. **Ajouter une Couverture :** Glissez une image sur la zone de couverture ou cliquez sur **Parcourir...**.
3. **Renseigner les Métadonnées :** Indiquez le nom du pack, sa version et l'auteur.
4. **Importer les Textures :** Cliquez sur **Importer Dossier**, **Ajouter Fichiers**, ou **Dossier custom_assets** pour charger les textures du projet.
5. **Inspecter & Router :** Vérifiez les badges partagés et choisissez la destination (`_all` ou tpage précis).
6. **Exporter :** Cliquez sur **Exporter le Pack (.zip)** pour générer l'archive finale.

---

## 5. Compilation de l'Exécutable Autonome

Pour générer `texture_pack_generator.exe` depuis les sources :
1. Exécutez :
   ```cmd
   docs\modding\tools\open-goal-texture-pack-generator\build_exe.bat
   ```
2. Le script PyInstaller installe les dépendances requises et produit `texture_pack_generator.exe`.
