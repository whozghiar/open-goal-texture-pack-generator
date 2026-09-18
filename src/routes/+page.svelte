<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "$lib/api";
  import { I18N, type LangKey } from "$lib/i18n";
  import type { ExportResult, ProjectStatus, TextureItem } from "$lib/types";

  // Reactive State (Svelte 5 Runes)
  let lang = $state<"fr" | "en">("fr");
  let status = $state<ProjectStatus | null>(null);
  let searchQuery = $state("");
  let filterScope = $state<"all" | "shared" | "unique">("all");

  let routingMode = $state<"all" | "level">("all");
  let selectedLevel = $state("");

  // Modals state
  let exportResult = $state<ExportResult | null>(null);
  let showExportModal = $state(false);
  let activeZoomTex = $state<TextureItem | null>(null);
  let zoomDataUrl = $state<string | null>(null);
  let showHelpModal = $state(false);
  let isExporting = $state(false);

  // Thumbnail cache for textures in grid
  let thumbCache = $state<Record<string, string>>({});

  function t(key: LangKey): string {
    return I18N[lang][key] || key;
  }

  // Derived filtered textures list
  let filteredTextures = $derived(() => {
    if (!status?.textures) return [];
    let list = status.textures;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const nameMatch = t.name.toLowerCase().includes(q);
        const tpageMatch = t.tpages.some((tp) => tp.toLowerCase().includes(q));
        const lvlMatch = t.levels.some((l) => l.toLowerCase().includes(q));
        const destMatch = (t.dest_tpage || "").toLowerCase().includes(q);
        return nameMatch || tpageMatch || lvlMatch || destMatch;
      });
    }

    if (filterScope === "shared") {
      list = list.filter((t) => t.is_shared);
    } else if (filterScope === "unique") {
      list = list.filter((t) => !t.is_shared && t.known);
    }

    return list;
  });

  async function loadStatus() {
    try {
      status = await api.getStatus();
      preloadThumbnails();
    } catch (e) {
      console.error("Failed to load status:", e);
    }
  }

  async function preloadThumbnails() {
    if (!status?.textures) return;
    for (const tex of status.textures) {
      if (!thumbCache[tex.id]) {
        api.getTextureDataUrl(tex.id).then((url) => {
          thumbCache[tex.id] = url;
        }).catch(() => {});
      }
    }
  }

  async function onGameChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    status = await api.setGame(target.value);
    preloadThumbnails();
  }

  function onMetaInput() {
    if (!status) return;
    api.updateMeta(
      status.meta.name,
      status.meta.version,
      status.meta.author,
      status.meta.description,
      status.meta.tags,
    );
  }

  async function pickCover() {
    const res = await api.pickCover();
    if (res) status = res;
  }

  async function removeCover() {
    status = await api.removeCover();
  }

  async function pickFolder() {
    const res = await api.pickFolder();
    if (res) {
      status = res;
      preloadThumbnails();
    }
  }

  async function pickFiles() {
    const res = await api.pickFiles();
    if (res) {
      status = res;
      preloadThumbnails();
    }
  }

  async function scanProjectAssets() {
    try {
      status = await api.scanProjectAssets();
      preloadThumbnails();
    } catch (e) {
      alert(String(e));
    }
  }

  async function onDestChange(tex: TextureItem, newDest: string) {
    tex.dest_tpage = newDest;
    await api.updateTextureDest(tex.id, newDest);
  }

  async function applyBatchRouting() {
    if (!status) return;
    status = await api.batchSetDest(routingMode, selectedLevel);
  }

  async function removeTexture(id: string) {
    delete thumbCache[id];
    status = await api.removeTexture(id);
  }

  async function clearAll() {
    if (confirm(t("clearAllBtn") + " ?")) {
      thumbCache = {};
      status = await api.clearTextures();
    }
  }

  async function installLocal() {
    if (!status?.textures || status.textures.length === 0) {
      alert(t("alertNoTextures"));
      return;
    }
    try {
      const count = await api.installLocal();
      alert(t("alertLocalInstalled").replace("{n}", String(count)).replace("{game}", status.game));
    } catch (e) {
      alert("Erreur: " + String(e));
    }
  }

  async function exportZip() {
    if (!status?.textures || status.textures.length === 0) {
      alert(t("alertNoTextures"));
      return;
    }
    isExporting = true;
    try {
      const slug = status.meta.name.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
      const cleanSlug = slug.endsWith("-textures") ? slug : `${slug}-textures`;
      const defaultFilename = `${cleanSlug}-v${status.meta.version}.zip`;

      const res = await api.exportZip(defaultFilename);
      if (res) {
        exportResult = res;
        showExportModal = true;
      }
    } catch (e) {
      alert("Erreur export: " + String(e));
    } finally {
      isExporting = false;
    }
  }

  async function openZoom(tex: TextureItem) {
    activeZoomTex = tex;
    if (thumbCache[tex.id]) {
      zoomDataUrl = thumbCache[tex.id];
    } else {
      zoomDataUrl = await api.getTextureDataUrl(tex.id);
    }
  }

  onMount(() => {
    loadStatus();
  });
</script>

<!-- Header -->
<header class="app-header">
  <div class="brand-wrap">
    <div class="brand-logo">🎨</div>
    <div>
      <h1 class="brand-title">OpenGOAL <span class="brand-accent">Texture Pack Generator</span></h1>
      <span class="brand-sub">{t("appSubtitle")}</span>
    </div>
  </div>

  <div class="header-controls">
    <!-- Game Selector -->
    <div class="select-wrap">
      <label for="game-select" class="field-label">{t("targetGame")}</label>
      <select id="game-select" class="styled-select" value={status?.game || "jak2"} onchange={onGameChange}>
        <option value="jak1">Jak and Daxter (Jak 1)</option>
        <option value="jak2">Jak II (Jak 2)</option>
        <option value="jak3">Jak 3</option>
      </select>
    </div>

    <!-- Language Toggle -->
    <div class="lang-switch">
      <button class="lang-btn" class:active={lang === "fr"} onclick={() => (lang = "fr")}>🇫🇷 FR</button>
      <button class="lang-btn" class:active={lang === "en"} onclick={() => (lang = "en")}>🇬🇧 EN</button>
    </div>

    <!-- Help Button -->
    <button class="icon-btn" onclick={() => (showHelpModal = true)} title="Aide & Fonctionnement">
      ❓
    </button>
  </div>
</header>

<!-- Main Body -->
<main class="app-content">
  <!-- Top: Pack Configuration & Cover Art -->
  <section class="panel-card">
    <h2 class="panel-title">{t("packMetaTitle")}</h2>
    <p class="panel-desc">{t("packMetaHint")}</p>

    <div class="meta-layout">
      <!-- Cover Box -->
      <div>
        <div class="cover-box" onclick={pickCover} role="button" tabindex="0" onkeydown={(e) => e.key === "Enter" && pickCover()}>
          {#if status?.has_cover && status.cover_base64}
            <img src={status.cover_base64} alt="Cover Preview" class="cover-img-rendered" />
            <div class="cover-actions-overlay">
              <button class="btn btn-sm btn-glass" onclick={(e) => { e.stopPropagation(); pickCover(); }}>{t("changeCover")}</button>
              <button class="btn btn-sm btn-danger-glass" onclick={(e) => { e.stopPropagation(); removeCover(); }}>{t("removeCover")}</button>
            </div>
          {:else}
            <div class="cover-empty">
              <span class="cover-empty-icon">🖼️</span>
              <span class="cover-empty-title">{t("coverDropPrompt")}</span>
              <span class="cover-empty-sub">{t("coverDropSub")}</span>
              <button class="btn btn-sm btn-primary" style="margin-top: 8px;">{t("browseBtn")}</button>
            </div>
          {/if}
        </div>
        <div style="font-size: 11px; color: var(--text-dim); text-align: center; margin-top: 6px;">
          cover.png (512x512)
        </div>
      </div>

      <!-- Form Fields -->
      <div class="form-fields">
        {#if status}
          <div class="form-row">
            <div class="field-wrap flex-2">
              <label for="pack-name" class="field-label">{t("packNameLabel")}</label>
              <input id="pack-name" type="text" class="styled-input" bind:value={status.meta.name} oninput={onMetaInput} placeholder="ex: Haven City Cyberpunk Textures" />
            </div>
            <div class="field-wrap flex-1">
              <label for="pack-ver" class="field-label">{t("versionLabel")}</label>
              <input id="pack-ver" type="text" class="styled-input" bind:value={status.meta.version} oninput={onMetaInput} placeholder="1.0.0" />
            </div>
            <div class="field-wrap flex-1">
              <label for="pack-auth" class="field-label">{t("authorLabel")}</label>
              <input id="pack-auth" type="text" class="styled-input" bind:value={status.meta.author} oninput={onMetaInput} placeholder="whozghiar" />
            </div>
          </div>

          <div class="field-wrap">
            <label for="pack-desc" class="field-label">{t("descriptionLabel")}</label>
            <textarea id="pack-desc" class="styled-textarea" rows="2" bind:value={status.meta.description} oninput={onMetaInput}></textarea>
          </div>
        {/if}

        <!-- Routing strategy -->
        <div class="routing-container">
          <div class="routing-title-row">
            <span class="routing-title">{t("routingStrategyTitle")}</span>
            <span class="routing-sub">{t("routingStrategyDesc")}</span>
          </div>

          <div class="routing-inputs">
            <label class="radio-item">
              <input type="radio" name="routingMode" value="all" checked={routingMode === "all"} onchange={() => (routingMode = "all")} />
              <span><b>Tout en _all</b> (Global : remplace la texture partout où elle apparaît)</span>
            </label>

            <label class="radio-item">
              <input type="radio" name="routingMode" value="level" checked={routingMode === "level"} onchange={() => (routingMode = "level")} />
              <span><b>Niveau spécifique :</b></span>
            </label>

            <select class="styled-select" bind:value={selectedLevel} disabled={routingMode !== "level"}>
              <option value="">{t("chooseLevel")}</option>
              {#if status?.levels}
                {#each status.levels as lvl}
                  <option value={lvl}>{lvl}</option>
                {/each}
              {/if}
            </select>

            <button class="btn btn-sm btn-glass" onclick={applyBatchRouting}>{t("applyToAllBtn")}</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Bottom: Textures Gallery -->
  <section class="panel-card">
    <div class="toolbar-wrap">
      <div class="toolbar-left">
        <h2 class="panel-title">{t("texturesListTitle")}</h2>
        <span class="counter-badge">{status?.total_textures || 0} textures</span>
        {#if (status?.shared_textures || 0) > 0}
          <span class="counter-badge counter-amber">{status?.shared_textures} {t("statShared").toLowerCase()}</span>
        {/if}
      </div>

      <div class="toolbar-center">
        <div class="search-input-wrap">
          <span class="search-icon-fixed">🔍</span>
          <input type="text" bind:value={searchQuery} placeholder={t("searchPlaceholder")} />
        </div>

        <select class="styled-select" bind:value={filterScope}>
          <option value="all">{t("filterAll")}</option>
          <option value="shared">{t("filterShared")}</option>
          <option value="unique">{t("filterUnique")}</option>
        </select>
      </div>

      <div class="toolbar-right">
        <button class="btn btn-secondary" onclick={scanProjectAssets} title="Scanner custom_assets/<game>/texture_replacements">
          ⚡ <span>{t("loadProjectBtn")}</span>
        </button>
        <button class="btn btn-secondary" onclick={pickFolder} title="Importer un dossier de textures">
          📁 <span>{t("importFolderBtn")}</span>
        </button>
        <button class="btn btn-primary" onclick={pickFiles} title="Ajouter des fichiers PNG">
          ➕ <span>{t("importFilesBtn")}</span>
        </button>
      </div>
    </div>

    <!-- Empty or Grid -->
    {#if !status || status.textures.length === 0}
      <div class="empty-view">
        <span class="empty-view-icon">🎨</span>
        <h3 class="empty-view-title">{t("emptyTitle")}</h3>
        <p class="empty-view-desc">{t("emptyDesc")}</p>
        <div style="display: flex; gap: 12px;">
          <button class="btn btn-secondary" onclick={scanProjectAssets}>⚡ {t("loadProjectBtn")}</button>
          <button class="btn btn-primary" onclick={pickFolder}>📁 {t("importFolderBtn")}</button>
        </div>
      </div>
    {:else}
      <div class="grid-container">
        {#each filteredTextures() as tex (tex.id)}
          <div class="texture-card" class:card-shared={tex.is_shared}>
            <!-- Thumbnail Frame -->
            <div class="thumb-frame" onclick={() => openZoom(tex)} role="button" tabindex="0" onkeydown={(e) => e.key === "Enter" && openZoom(tex)}>
              {#if thumbCache[tex.id]}
                <img src={thumbCache[tex.id]} alt={tex.name} class="thumb-image" />
              {:else}
                <span style="font-size: 11px; color: var(--text-dim);">Chargement...</span>
              {/if}
              <div class="thumb-zoom-tag">🔍 Zoom</div>
            </div>

            <!-- Card Body -->
            <div class="card-content">
              <div class="card-title-line">{tex.filename}</div>

              <div class="card-meta-line">
                <span class="dim-tag">{tex.width}x{tex.height} {tex.channels}</span>
                <span>{Math.round(tex.size_bytes / 1024)} KB</span>
              </div>

              <!-- Badges -->
              <div>
                {#if tex.is_shared}
                  <div class="card-badge badge-shared" title={`Niveaux: ${tex.levels.join(', ')}\nTpages: ${tex.tpages.join(', ')}`}>
                    ⚠️ {t("badgeSharedText").replace("{n}", String(tex.levels.length)).replace("{levels}", tex.levels.slice(0, 3).join(", ") + (tex.levels.length > 3 ? "..." : ""))}
                  </div>
                {:else if tex.known}
                  <div class="card-badge badge-unique">
                    ✓ {t("badgeUniqueText").replace("{tpage}", tex.tpages[0] || "unique")}
                  </div>
                {:else}
                  <div class="card-badge badge-custom">{t("badgeCustomText")}</div>
                {/if}
              </div>

              <!-- Destination selector -->
              <div class="card-dest-box">
                <label for={`dest-${tex.id}`}>{t("destLabel")}</label>
                <select id={`dest-${tex.id}`} value={tex.dest_tpage} onchange={(e) => onDestChange(tex, (e.target as HTMLSelectElement).value)}>
                  <option value="_all">{t("destAllOption")}</option>
                  {#each tex.tpages as tp}
                    <option value={tp}>{tp}/</option>
                  {/each}
                </select>
              </div>

              <!-- Actions -->
              <div class="card-bottom-row">
                <button class="card-del-btn" onclick={() => removeTexture(tex.id)}>
                  🗑️ {t("deleteTexture")}
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</main>

<!-- Sticky Footer -->
<footer class="app-footer">
  <div class="footer-stat-group">
    <span class="footer-stat-item">{t("statTextures")} <b>{status?.total_textures || 0}</b></span>
    <span class="stat-divider">•</span>
    <span class="footer-stat-item">{t("statShared")} <b class="stat-highlight">{status?.shared_textures || 0}</b></span>
    <span class="stat-divider">•</span>
    <span class="footer-stat-item">{t("statSize")} <b>{Math.round((status?.total_size_bytes || 0) / 1024)} KB</b></span>
  </div>

  <div class="footer-buttons">
    <button class="btn btn-danger-glass" onclick={clearAll}>{t("clearAllBtn")}</button>
    <button class="btn btn-secondary" onclick={installLocal}>{t("installLocalBtn")}</button>
    <button class="btn btn-success btn-glow" onclick={exportZip} disabled={isExporting}>
      📦 <span>{isExporting ? "Packaging..." : t("exportZipBtn")}</span>
    </button>
  </div>
</footer>

<!-- Export Success Modal -->
{#if showExportModal && exportResult}
  <div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showExportModal = false; }} role="button" tabindex="0" onkeydown={(e) => e.key === "Escape" && (showExportModal = false)}>
    <div class="modal-box" role="dialog" aria-modal="true">
      <div class="modal-icon-banner">🎉</div>
      <h3 class="modal-heading">{t("modalExportTitle")}</h3>
      <p class="modal-sub">{t("modalExportDesc")}</p>

      <div class="summary-details">
        <div class="detail-line">
          <span class="detail-k">{t("modalArchive")}</span>
          <span class="detail-v mono">{exportResult.path}</span>
        </div>
        <div class="detail-line">
          <span class="detail-k">{t("modalSize")}</span>
          <span class="detail-v">{exportResult.size_kb} KB</span>
        </div>
        <div class="detail-line">
          <span class="detail-k">{t("modalSha256")}</span>
          <span class="detail-v mono-sm">{exportResult.sha256}</span>
        </div>
        <div class="detail-line">
          <span class="detail-k">{t("modalTextureCount")}</span>
          <span class="detail-v">{exportResult.texture_count}</span>
        </div>
      </div>

      <div class="modal-foot">
        <button class="btn btn-primary" onclick={() => api.openInExplorer(exportResult!.path)}>{t("modalOpenFolder")}</button>
        <button class="btn btn-secondary" onclick={() => (showExportModal = false)}>{t("modalClose")}</button>
      </div>
    </div>
  </div>
{/if}

<!-- Zoom Modal -->
{#if activeZoomTex && zoomDataUrl}
  <div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) activeZoomTex = null; }} role="button" tabindex="0" onkeydown={(e) => e.key === "Escape" && (activeZoomTex = null)}>
    <div class="modal-box modal-wide" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3 class="modal-heading">{activeZoomTex.filename} ({activeZoomTex.width}x{activeZoomTex.height})</h3>
        <button class="modal-close-x" onclick={() => (activeZoomTex = null)}>&times;</button>
      </div>

      <div class="zoom-canvas-wrap">
        <img src={zoomDataUrl} alt={activeZoomTex.name} />
      </div>

      <div class="zoom-meta">
        <div><b>Nom OpenGOAL :</b> <code>{activeZoomTex.name}</code></div>
        <div><b>Dimensions :</b> {activeZoomTex.width}x{activeZoomTex.height} px ({activeZoomTex.channels}) • <b>Poids :</b> {(activeZoomTex.size_bytes / 1024).toFixed(1)} KB</div>
        <div><b>Destination :</b> <code>custom_assets/{status?.game}/texture_replacements/{activeZoomTex.dest_tpage}/{activeZoomTex.filename}</code></div>
        {#if activeZoomTex.is_shared}
          <div style="margin-top: 6px; color: #fbbf24;">
            <b>⚠️ Texture partagée dans {activeZoomTex.levels.length} niveaux :</b> {activeZoomTex.levels.join(", ")}<br />
            <b>Pages de textures :</b> {activeZoomTex.tpages.join(", ")}
          </div>
        {:else if activeZoomTex.known}
          <div style="margin-top: 6px; color: #34d399;">
            <b>✓ Texture unique au tpage :</b> {activeZoomTex.tpages.join(", ")}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Help Modal -->
{#if showHelpModal}
  <div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showHelpModal = false; }} role="button" tabindex="0" onkeydown={(e) => e.key === "Escape" && (showHelpModal = false)}>
    <div class="modal-box modal-wide" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3 class="modal-heading">{t("helpTitle")}</h3>
        <button class="modal-close-x" onclick={() => (showHelpModal = false)}>&times;</button>
      </div>

      <div class="help-body">
        <h4>{t("helpRuleTitle")}</h4>
        <p>{t("helpRule1")}</p>
        <p>{t("helpRule2")}</p>

        <h4>{t("helpExtractTitle")}</h4>
        <p>{t("helpExtract1")}</p>
        <pre class="help-code-block">task extract
task boot-game</pre>

        <h4>{t("helpDistTitle")}</h4>
        <p>{t("helpDist1")}</p>
      </div>

      <div class="modal-foot">
        <button class="btn btn-primary" onclick={() => (showHelpModal = false)}>{t("modalClose")}</button>
      </div>
    </div>
  </div>
{/if}
