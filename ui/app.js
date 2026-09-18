/* ==========================================================================
   OpenGOAL Texture Pack Generator — Interactive Frontend Application
   ========================================================================== */

const I18N = {
  fr: {
    appSubtitle: "Générateur et gestionnaire de packs de textures pour OpenGOAL Launcher",
    targetGame: "Jeu cible :",
    packMetaTitle: "Configuration du Pack de Textures",
    packMetaHint: "Ces informations apparaîtront dans l'OpenGOAL Launcher et dans metadata.json",
    coverDropPrompt: "Image de Couverture",
    coverDropSub: "Glissez une image ici (cover.png) ou cliquez",
    browseBtn: "Parcourir...",
    changeCover: "Changer",
    removeCover: "Supprimer",
    packNameLabel: "Nom du Pack :",
    versionLabel: "Version (SemVer) :",
    authorLabel: "Auteur :",
    descriptionLabel: "Description :",
    routingStrategyTitle: "Stratégie de Destination par Défaut :",
    routingStrategyDesc: "Contrôle où OpenGOAL injecte les textures (dossier _all ou tpage d'un niveau)",
    routeAllLabel: "Tout en _all (Global : remplace la texture partout où elle apparaît)",
    routeLevelLabel: "Niveau spécifique :",
    chooseLevel: "-- Sélectionner un niveau --",
    applyToAllBtn: "Appliquer à toutes",
    texturesListTitle: "Textures à Remplacer",
    filterAll: "Toutes les textures",
    filterShared: "⚠️ Partagées entre niveaux uniquement",
    filterUnique: "✓ Uniques à un niveau uniquement",
    loadProjectBtn: "Dossier custom_assets",
    importFolderBtn: "Importer Dossier",
    importFilesBtn: "Ajouter Fichiers",
    emptyTitle: "Aucune texture chargée",
    emptyDesc: "Importez un dossier de textures, ajoutez des fichiers PNG ou chargez les textures du projet actif pour commencer à constituer votre pack.",
    statTextures: "Textures :",
    statShared: "Partagées :",
    statSize: "Taille totale :",
    clearAllBtn: "Vider la liste",
    installLocalBtn: "⚡ Installer dans custom_assets",
    exportZipBtn: "Exporter le Pack (.zip)",
    modalExportTitle: "Pack de Textures Exporté avec Succès !",
    modalExportDesc: "L'archive est prête pour l'OpenGOAL Launcher et l'extraction de jeu.",
    modalArchive: "Archive :",
    modalSize: "Taille :",
    modalSha256: "SHA256 :",
    modalTextureCount: "Textures incluses :",
    modalOpenFolder: "Ouvrir le dossier dans l'Explorateur",
    modalClose: "Fermer",
    helpTitle: "Guide d'utilisation — Packs de Textures OpenGOAL",
    helpRuleTitle: "1. Règle des textures partagées et _all",
    helpRule1: "OpenGOAL recherche les textures remplacées en priorité dans le dossier du tpage spécifique : custom_assets/<game>/texture_replacements/<tpage-name>/<texture>.png. S'il n'existe pas, il utilise le dossier fallback _all/<texture>.png.",
    helpRule2: "Certaines textures (ex: visages de héros, éléments de décor récurrents) sont partagées entre plusieurs niveaux. Cet outil vous signale immédiatement les textures partagées avec un badge orange pour que vous puissiez décider de les remplacer partout (via _all) ou uniquement pour un niveau précis.",
    helpExtractTitle: "2. Intégration en jeu",
    helpExtract1: "Pour que vos textures personnalisées apparaissent en jeu dans votre environnement de dev, OpenGOAL doit les intégrer via l'extraction :",
    helpDistTitle: "3. Distribution pour le Launcher",
    helpDist1: "L'archive ZIP générée par ce générateur contient le fichier metadata.json, la couverture cover.png et l'arborescence complète des textures. Elle peut être distribuée directement aux joueurs ou enregistrée dans index.json.",
    badgeSharedText: "Partagée ({n} niveaux : {levels})",
    badgeUniqueText: "Unique ({tpage})",
    badgeCustomText: "Non répertoriée",
    destLabel: "Dossier cible :",
    destAllOption: "_all (Universel)",
    deleteTexture: "Retirer du pack",
    searchPlaceholder: "Rechercher une texture, un tpage ou niveau...",
    alertNoTextures: "Veuillez charger au moins une texture avant d'exporter.",
    alertLocalInstalled: "{n} textures ont été installées dans custom_assets/{game}/texture_replacements.",
  },
  en: {
    appSubtitle: "Texture Pack Composer & Manager for OpenGOAL Launcher",
    targetGame: "Target Game:",
    packMetaTitle: "Texture Pack Configuration",
    packMetaHint: "These metadata fields will appear in the OpenGOAL Launcher and in metadata.json",
    coverDropPrompt: "Cover Image",
    coverDropSub: "Drop an image here (cover.png) or click to browse",
    browseBtn: "Browse...",
    changeCover: "Change",
    removeCover: "Remove",
    packNameLabel: "Pack Name:",
    versionLabel: "Version (SemVer):",
    authorLabel: "Author:",
    descriptionLabel: "Description:",
    routingStrategyTitle: "Default Destination Strategy:",
    routingStrategyDesc: "Controls where OpenGOAL injects textures (_all folder or level-specific tpage)",
    routeAllLabel: "All to _all (Global: replaces texture everywhere it appears)",
    routeLevelLabel: "Specific level:",
    chooseLevel: "-- Select a level --",
    applyToAllBtn: "Apply to all",
    texturesListTitle: "Replacement Textures",
    filterAll: "All textures",
    filterShared: "⚠️ Shared across levels only",
    filterUnique: "✓ Unique to a level only",
    loadProjectBtn: "custom_assets folder",
    importFolderBtn: "Import Folder",
    importFilesBtn: "Add Files",
    emptyTitle: "No textures loaded",
    emptyDesc: "Import a texture folder, add individual PNG files, or scan active project assets to start building your pack.",
    statTextures: "Textures:",
    statShared: "Shared:",
    statSize: "Total size:",
    clearAllBtn: "Clear list",
    installLocalBtn: "⚡ Install to custom_assets",
    exportZipBtn: "Export Pack (.zip)",
    modalExportTitle: "Texture Pack Exported Successfully!",
    modalExportDesc: "The archive is ready for the OpenGOAL Launcher and game asset extraction.",
    modalArchive: "Archive:",
    modalSize: "Size:",
    modalSha256: "SHA256:",
    modalTextureCount: "Included textures:",
    modalOpenFolder: "Show in Windows Explorer",
    modalClose: "Close",
    helpTitle: "Usage Guide — OpenGOAL Texture Packs",
    helpRuleTitle: "1. Shared textures & _all rules",
    helpRule1: "OpenGOAL searches for replacement textures primarily in the specific tpage folder: custom_assets/<game>/texture_replacements/<tpage-name>/<texture>.png. If absent, it falls back to _all/<texture>.png.",
    helpRule2: "Some textures (e.g. hero faces, common environmental props) are shared across multiple levels. This tool flags shared textures with an amber badge so you can decide whether to replace them universally (_all) or only in a given level.",
    helpExtractTitle: "2. In-Game Asset Baking",
    helpExtract1: "To see custom textures in-game in your dev setup, bake them with extraction:",
    helpDistTitle: "3. Launcher Distribution",
    helpDist1: "The ZIP archive generated by this tool contains metadata.json, cover.png, and the full texture tree. It can be distributed directly to players or indexed in index.json.",
    badgeSharedText: "Shared ({n} levels: {levels})",
    badgeUniqueText: "Unique ({tpage})",
    badgeCustomText: "Unregistered",
    destLabel: "Target folder:",
    destAllOption: "_all (Universal)",
    deleteTexture: "Remove from pack",
    searchPlaceholder: "Search texture, tpage, or level...",
    alertNoTextures: "Please load at least one texture before exporting.",
    alertLocalInstalled: "{n} textures installed to custom_assets/{game}/texture_replacements.",
  }
};

class App {
  constructor() {
    this.lang = "fr";
    this.status = null;
    this.searchQuery = "";
    this.filterScope = "all";
    this.exportZipPath = "";

    this.initElements();
    this.bindEvents();
    this.applyLanguage();
    this.fetchStatus();
  }

  initElements() {
    // Header
    this.gameSelect = document.getElementById("gameSelect");
    this.btnLangFr = document.getElementById("btnLangFr");
    this.btnLangEn = document.getElementById("btnLangEn");
    this.btnHelp = document.getElementById("btnHelp");

    // Metadata
    this.inputPackName = document.getElementById("inputPackName");
    this.inputVersion = document.getElementById("inputVersion");
    this.inputAuthor = document.getElementById("inputAuthor");
    this.inputDescription = document.getElementById("inputDescription");
    this.selectTargetLevel = document.getElementById("selectTargetLevel");
    this.btnApplyBatchRouting = document.getElementById("btnApplyBatchRouting");

    // Cover
    this.coverDropzone = document.getElementById("coverDropzone");
    this.coverPreviewWrap = document.getElementById("coverPreviewWrap");
    this.coverPlaceholder = document.getElementById("coverPlaceholder");
    this.coverImg = document.getElementById("coverImg");
    this.btnBrowseCover = document.getElementById("btnBrowseCover");
    this.btnChangeCover = document.getElementById("btnChangeCover");
    this.btnRemoveCover = document.getElementById("btnRemoveCover");

    // Toolbar
    this.inputSearch = document.getElementById("inputSearch");
    this.filterScopeSelect = document.getElementById("filterScope");
    this.btnLoadProject = document.getElementById("btnLoadProject");
    this.btnImportFolder = document.getElementById("btnImportFolder");
    this.btnImportFiles = document.getElementById("btnImportFiles");
    this.btnEmptyLoadProject = document.getElementById("btnEmptyLoadProject");
    this.btnEmptyImportFolder = document.getElementById("btnEmptyImportFolder");

    // Grid & Empty
    this.emptyState = document.getElementById("emptyState");
    this.texturesGrid = document.getElementById("texturesGrid");
    this.badgeCount = document.getElementById("badgeCount");
    this.badgeSharedCount = document.getElementById("badgeSharedCount");

    // Footer stats & actions
    this.statTotalTextures = document.getElementById("statTotalTextures");
    this.statTotalShared = document.getElementById("statTotalShared");
    this.statTotalSize = document.getElementById("statTotalSize");
    this.btnClearAll = document.getElementById("btnClearAll");
    this.btnInstallLocal = document.getElementById("btnInstallLocal");
    this.btnExportZip = document.getElementById("btnExportZip");

    // Modals
    this.modalExportSuccess = document.getElementById("modalExportSuccess");
    this.exportResultPath = document.getElementById("exportResultPath");
    this.exportResultSize = document.getElementById("exportResultSize");
    this.exportResultSha = document.getElementById("exportResultSha");
    this.exportResultCount = document.getElementById("exportResultCount");
    this.btnOpenExportFolder = document.getElementById("btnOpenExportFolder");
    this.btnCloseExportModal = document.getElementById("btnCloseExportModal");

    this.modalImageZoom = document.getElementById("modalImageZoom");
    this.zoomImg = document.getElementById("zoomImg");
    this.zoomTitle = document.getElementById("zoomTitle");
    this.zoomDetails = document.getElementById("zoomDetails");
    this.btnCloseZoom = document.getElementById("btnCloseZoom");

    this.modalHelp = document.getElementById("modalHelp");
    this.btnCloseHelp = document.getElementById("btnCloseHelp");
    this.btnCloseHelpBottom = document.getElementById("btnCloseHelpBottom");
  }

  bindEvents() {
    // Language switch
    this.btnLangFr.addEventListener("click", () => this.setLanguage("fr"));
    this.btnLangEn.addEventListener("click", () => this.setLanguage("en"));

    // Game change
    this.gameSelect.addEventListener("change", async (e) => {
      const res = await this.apiPost("/api/set-game", { game: e.target.value });
      this.handleStatus(res);
    });

    // Metadata live sync
    const syncMeta = () => {
      this.apiPost("/api/update-meta", {
        name: this.inputPackName.value,
        version: this.inputVersion.value,
        author: this.inputAuthor.value,
        description: this.inputDescription.value,
      });
    };
    this.inputPackName.addEventListener("input", syncMeta);
    this.inputVersion.addEventListener("input", syncMeta);
    this.inputAuthor.addEventListener("input", syncMeta);
    this.inputDescription.addEventListener("input", syncMeta);

    // Routing radio buttons
    document.querySelectorAll('input[name="routingMode"]').forEach(radio => {
      radio.addEventListener("change", (e) => {
        this.selectTargetLevel.disabled = (e.target.value !== "level");
      });
    });

    // Batch routing apply button
    this.btnApplyBatchRouting.addEventListener("click", async () => {
      const mode = document.querySelector('input[name="routingMode"]:checked').value;
      const level = this.selectTargetLevel.value;
      const res = await this.apiPost("/api/batch-set-dest", { mode, level });
      if (res && res.status) {
        this.handleStatus(res.status);
      }
    });

    // Cover picker
    const triggerCoverPick = async () => {
      const res = await this.apiPost("/api/pick-cover", {});
      if (res && res.success) {
        this.fetchStatus();
      }
    };
    this.btnBrowseCover.addEventListener("click", triggerCoverPick);
    this.btnChangeCover.addEventListener("click", triggerCoverPick);
    this.btnRemoveCover.addEventListener("click", async () => {
      await this.apiPost("/api/remove-cover", {});
      this.fetchStatus();
    });

    // Toolbar imports
    const scanAssets = async () => {
      const res = await this.apiPost("/api/scan-project-assets", {});
      if (res && res.status) this.handleStatus(res.status);
    };
    const importFolder = async () => {
      const res = await this.apiPost("/api/pick-folder", {});
      if (res && res.status) this.handleStatus(res.status);
    };
    const importFiles = async () => {
      const res = await this.apiPost("/api/pick-files", {});
      if (res && res.status) this.handleStatus(res.status);
    };

    this.btnLoadProject.addEventListener("click", scanAssets);
    this.btnEmptyLoadProject.addEventListener("click", scanAssets);
    this.btnImportFolder.addEventListener("click", importFolder);
    this.btnEmptyImportFolder.addEventListener("click", importFolder);
    this.btnImportFiles.addEventListener("click", importFiles);

    // Search & filters
    this.inputSearch.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderTexturesGrid();
    });
    this.filterScopeSelect.addEventListener("change", (e) => {
      this.filterScope = e.target.value;
      this.renderTexturesGrid();
    });

    // Clear all
    this.btnClearAll.addEventListener("click", async () => {
      if (confirm(this.t("clearAllBtn") + " ?")) {
        await this.apiPost("/api/clear-textures", {});
        this.fetchStatus();
      }
    });

    // Local Install
    this.btnInstallLocal.addEventListener("click", async () => {
      if (!this.status || !this.status.textures || this.status.textures.length === 0) {
        alert(this.t("alertNoTextures"));
        return;
      }
      const res = await this.apiPost("/api/install-local", {});
      if (res && res.success) {
        const msg = this.t("alertLocalInstalled")
          .replace("{n}", res.installed)
          .replace("{game}", this.status.game);
        alert(msg);
      }
    });

    // Export Zip
    this.btnExportZip.addEventListener("click", async () => {
      if (!this.status || !this.status.textures || this.status.textures.length === 0) {
        alert(this.t("alertNoTextures"));
        return;
      }
      this.btnExportZip.disabled = true;
      this.btnExportZip.textContent = "Packaging...";
      try {
        const res = await this.apiPost("/api/export-zip", {});
        if (res && res.success) {
          this.exportZipPath = res.path;
          this.exportResultPath.textContent = res.path;
          this.exportResultSize.textContent = `${res.size_kb} KB`;
          this.exportResultSha.textContent = res.sha256;
          this.exportResultCount.textContent = res.texture_count;
          this.modalExportSuccess.classList.remove("hidden");
        } else if (res && res.error) {
          alert("Erreur lors de l'export: " + res.error);
        }
      } finally {
        this.btnExportZip.disabled = false;
        this.btnExportZip.innerHTML = `<span class="icon">📦</span> <span>${this.t("exportZipBtn")}</span>`;
      }
    });

    // Open export folder
    this.btnOpenExportFolder.addEventListener("click", () => {
      if (this.exportZipPath) {
        this.apiPost("/api/open-folder", { path: this.exportZipPath });
      }
    });
    this.btnCloseExportModal.addEventListener("click", () => {
      this.modalExportSuccess.classList.add("hidden");
    });

    // Zoom modal close
    this.btnCloseZoom.addEventListener("click", () => {
      this.modalImageZoom.classList.add("hidden");
    });

    // Help modal toggle
    this.btnHelp.addEventListener("click", () => {
      this.modalHelp.classList.remove("hidden");
    });
    this.btnCloseHelp.addEventListener("click", () => {
      this.modalHelp.classList.add("hidden");
    });
    this.btnCloseHelpBottom.addEventListener("click", () => {
      this.modalHelp.classList.add("hidden");
    });
  }

  setLanguage(lang) {
    this.lang = lang;
    this.btnLangFr.classList.toggle("active", lang === "fr");
    this.btnLangEn.classList.toggle("active", lang === "en");
    this.applyLanguage();
    this.renderTexturesGrid();
  }

  t(key) {
    const dict = I18N[this.lang] || I18N.fr;
    return dict[key] || key;
  }

  applyLanguage() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const k = el.getAttribute("data-i18n");
      const val = this.t(k);
      if (val) el.textContent = val;
    });
    this.inputSearch.placeholder = this.t("searchPlaceholder");
  }

  async apiGet(endpoint) {
    try {
      const res = await fetch(endpoint);
      return await res.json();
    } catch (e) {
      console.error(`API GET ${endpoint} error:`, e);
      return null;
    }
  }

  async apiPost(endpoint, data) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (e) {
      console.error(`API POST ${endpoint} error:`, e);
      return null;
    }
  }

  async fetchStatus() {
    const data = await this.apiGet("/api/status");
    if (data) {
      this.handleStatus(data);
    }
  }

  handleStatus(data) {
    this.status = data;

    // Sync game selector
    if (data.game && this.gameSelect.value !== data.game) {
      this.gameSelect.value = data.game;
    }

    // Populate levels dropdown
    const curLvlVal = this.selectTargetLevel.value;
    this.selectTargetLevel.innerHTML = `<option value="">${this.t("chooseLevel")}</option>`;
    if (data.levels && Array.isArray(data.levels)) {
      data.levels.forEach(lvl => {
        const opt = document.createElement("option");
        opt.value = lvl;
        opt.textContent = lvl;
        this.selectTargetLevel.appendChild(opt);
      });
    }
    if (curLvlVal) {
      this.selectTargetLevel.value = curLvlVal;
    }

    // Sync meta form if values are empty or initial
    if (data.meta) {
      if (data.meta.name) this.inputPackName.value = data.meta.name;
      if (data.meta.version) this.inputVersion.value = data.meta.version;
      if (data.meta.author) this.inputAuthor.value = data.meta.author;
      if (data.meta.description) this.inputDescription.value = data.meta.description;
    }

    // Cover view
    if (data.cover && data.cover.has_cover) {
      this.coverImg.src = `/api/cover-image?t=${Date.now()}`;
      this.coverPreviewWrap.classList.remove("hidden");
      this.coverPlaceholder.classList.add("hidden");
    } else {
      this.coverPreviewWrap.classList.add("hidden");
      this.coverPlaceholder.classList.remove("hidden");
    }

    // Stats
    const totalCount = data.stats.total_textures || 0;
    const sharedCount = data.stats.shared_textures || 0;
    const sizeKb = Math.round((data.stats.total_size_bytes || 0) / 1024);

    this.statTotalTextures.textContent = totalCount;
    this.statTotalShared.textContent = sharedCount;
    this.statTotalSize.textContent = sizeKb >= 1024 ? `${(sizeKb/1024).toFixed(2)} MB` : `${sizeKb} KB`;

    this.badgeCount.textContent = `${totalCount} texture${totalCount > 1 ? 's' : ''}`;
    if (sharedCount > 0) {
      this.badgeSharedCount.textContent = `${sharedCount} partagée(s)`;
      this.badgeSharedCount.classList.remove("hidden");
    } else {
      this.badgeSharedCount.classList.add("hidden");
    }

    this.renderTexturesGrid();
  }

  renderTexturesGrid() {
    if (!this.status || !this.status.textures || this.status.textures.length === 0) {
      this.emptyState.classList.remove("hidden");
      this.texturesGrid.classList.add("hidden");
      this.texturesGrid.innerHTML = "";
      return;
    }

    this.emptyState.classList.add("hidden");
    this.texturesGrid.classList.remove("hidden");

    let items = this.status.textures;

    // Filter by search query
    if (this.searchQuery) {
      items = items.filter(t => {
        const nameMatch = t.name.toLowerCase().includes(this.searchQuery);
        const tpageMatch = t.tpages.some(tp => tp.toLowerCase().includes(this.searchQuery));
        const lvlMatch = t.levels.some(l => l.toLowerCase().includes(this.searchQuery));
        const destMatch = (t.dest_tpage || "").toLowerCase().includes(this.searchQuery);
        return nameMatch || tpageMatch || lvlMatch || destMatch;
      });
    }

    // Filter by scope
    if (this.filterScope === "shared") {
      items = items.filter(t => t.is_shared);
    } else if (this.filterScope === "unique") {
      items = items.filter(t => !t.is_shared && t.known);
    }

    this.texturesGrid.innerHTML = "";

    items.forEach(tex => {
      const card = document.createElement("div");
      card.className = `texture-card ${tex.is_shared ? 'is-shared' : ''}`;

      // Card Thumbnail
      const thumbContainer = document.createElement("div");
      thumbContainer.className = "card-thumb-container";
      thumbContainer.title = "Cliquez pour agrandir";

      const img = document.createElement("img");
      img.src = `/api/texture-image/${tex.id}`;
      img.alt = tex.name;
      img.className = "card-thumb-img";
      img.loading = "lazy";

      const zoomOverlay = document.createElement("div");
      zoomOverlay.className = "card-zoom-overlay";
      zoomOverlay.innerHTML = "🔍 Zoom";

      thumbContainer.appendChild(img);
      thumbContainer.appendChild(zoomOverlay);
      thumbContainer.addEventListener("click", () => this.showZoomModal(tex));

      // Card Body
      const body = document.createElement("div");
      body.className = "card-body";

      // Title & dimensions
      const titleRow = document.createElement("div");
      titleRow.className = "card-title-row";

      const filename = document.createElement("div");
      filename.className = "card-filename";
      filename.textContent = tex.filename;

      titleRow.appendChild(filename);

      const metaRow = document.createElement("div");
      metaRow.className = "card-meta-row";

      const dim = document.createElement("span");
      dim.className = "card-dimensions";
      dim.textContent = `${tex.width}x${tex.height} ${tex.channels}`;

      const sizeKb = Math.round(tex.size_bytes / 1024);
      const sizeSpan = document.createElement("span");
      sizeSpan.textContent = `${sizeKb} KB`;

      metaRow.appendChild(dim);
      metaRow.appendChild(sizeSpan);

      // Status Badge
      const statusBadge = document.createElement("div");
      if (tex.is_shared) {
        statusBadge.className = "card-status-badge badge-status-shared";
        const lvlStr = tex.levels.slice(0, 3).join(", ") + (tex.levels.length > 3 ? "..." : "");
        statusBadge.textContent = this.t("badgeSharedText")
          .replace("{n}", tex.levels.length)
          .replace("{levels}", lvlStr);
        statusBadge.title = `Niveaux : ${tex.levels.join(', ')}\nTpages : ${tex.tpages.join(', ')}`;
      } else if (tex.known) {
        statusBadge.className = "card-status-badge badge-status-unique";
        const tp = tex.tpages[0] || tex.levels[0] || "unique";
        statusBadge.textContent = this.t("badgeUniqueText").replace("{tpage}", tp);
      } else {
        statusBadge.className = "card-status-badge badge-status-unknown";
        statusBadge.textContent = this.t("badgeCustomText");
      }

      // Destination Selector
      const destRow = document.createElement("div");
      destRow.className = "card-dest-row";

      const destLabel = document.createElement("span");
      destLabel.className = "card-dest-label";
      destLabel.textContent = this.t("destLabel");

      const selectDest = document.createElement("select");
      selectDest.className = "card-dest-select";

      // Option _all
      const optAll = document.createElement("option");
      optAll.value = "_all";
      optAll.textContent = this.t("destAllOption");
      if (tex.dest_tpage === "_all") optAll.selected = true;
      selectDest.appendChild(optAll);

      // Options for known tpages of this texture
      if (tex.tpages && tex.tpages.length > 0) {
        tex.tpages.forEach(tp => {
          const opt = document.createElement("option");
          opt.value = tp;
          opt.textContent = `${tp}/`;
          if (tex.dest_tpage === tp) opt.selected = true;
          selectDest.appendChild(opt);
        });
      }

      selectDest.addEventListener("change", async (e) => {
        await this.apiPost("/api/update-texture-dest", {
          id: tex.id,
          dest_tpage: e.target.value,
        });
        tex.dest_tpage = e.target.value;
      });

      destRow.appendChild(destLabel);
      destRow.appendChild(selectDest);

      // Actions row (Delete)
      const actionsRow = document.createElement("div");
      actionsRow.className = "card-actions-row";

      const delBtn = document.createElement("button");
      delBtn.className = "card-delete-btn";
      delBtn.textContent = `🗑️ ${this.t("deleteTexture")}`;
      delBtn.addEventListener("click", async () => {
        await this.apiPost("/api/remove-texture", { id: tex.id });
        this.fetchStatus();
      });

      actionsRow.appendChild(delBtn);

      // Assemble card
      body.appendChild(titleRow);
      body.appendChild(metaRow);
      body.appendChild(statusBadge);
      body.appendChild(destRow);
      body.appendChild(actionsRow);

      card.appendChild(thumbContainer);
      card.appendChild(body);

      this.texturesGrid.appendChild(card);
    });
  }

  showZoomModal(tex) {
    this.zoomTitle.textContent = `${tex.filename} (${tex.width}x${tex.height})`;
    this.zoomImg.src = `/api/texture-image/${tex.id}`;

    let detailsHtml = `
      <div><b>Nom OpenGOAL :</b> <code>${tex.name}</code></div>
      <div><b>Dimensions :</b> ${tex.width}x${tex.height} px (${tex.channels}) • <b>Poids :</b> ${(tex.size_bytes/1024).toFixed(1)} KB</div>
      <div><b>Destination actuelle :</b> <code>custom_assets/${this.status.game}/texture_replacements/${tex.dest_tpage}/${tex.filename}</code></div>
    `;

    if (tex.is_shared) {
      detailsHtml += `
        <div style="margin-top: 6px; color: #fbbf24;">
          <b>⚠️ Texture partagée dans ${tex.levels.length} niveaux :</b> ${tex.levels.join(', ')}<br>
          <b>Pages de texture (tpages) :</b> ${tex.tpages.join(', ')}
        </div>
      `;
    } else if (tex.known) {
      detailsHtml += `
        <div style="margin-top: 6px; color: #34d399;">
          <b>✓ Texture unique au tpage :</b> ${tex.tpages.join(', ')}
        </div>
      `;
    }

    this.zoomDetails.innerHTML = detailsHtml;
    this.modalImageZoom.classList.remove("hidden");
  }
}

// Bootstrap on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
