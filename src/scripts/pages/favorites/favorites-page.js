// Favorites Page - utilizing IndexedDB
import { BasePage } from "../../utils/base-classes.js";

class FavoritesPage extends BasePage {
  constructor() {
    super();
    this.favorites = [];
    this.filteredFavorites = [];
    this.currentSort = "addedAt";
    this.sortOrder = "desc";
    this.searchQuery = "";
  }

  async render() {
    return `
      <div class="favorites-page">
        <div class="page-header">
          <h1>📚 Favorite Stories</h1>
          <p>Manage and explore your favorite stories</p>
        </div>

        <div class="favorites-controls">
          <div class="search-section">
            <label for="search-favorites" class="sr-only">Search favorites</label>
            <input 
              type="search" 
              id="search-favorites" 
              placeholder="Search favorite stories..."
              class="search-input"
              aria-describedby="search-help"
            />
            <span id="search-help" class="sr-only">Type to search stories by title or description</span>
          </div>

          <div class="filter-section">
            <label for="sort-favorites">Sort by:</label>
            <select id="sort-favorites" class="sort-select">
              <option value="addedAt-desc">Newest added</option>
              <option value="addedAt-asc">Oldest added</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="createdAt-desc">Newest story date</option>
              <option value="createdAt-asc">Oldest story date</option>
            </select>
          </div>

          <div class="action-buttons">
            <button id="refresh-favorites" class="btn btn-secondary" aria-label="Reload favorites list">
              🔄 Refresh
            </button>
            <button id="clear-favorites" class="btn btn-danger" aria-label="Clear all favorites">
              🗑️ Clear All
            </button>
            <button id="export-favorites" class="btn btn-info" aria-label="Export favorites to JSON">
              💾 Export
            </button>
          </div>
        </div>

        <div class="sync-status-card">
          <div class="sync-info">
            <span id="sync-status" class="sync-status">Checking...</span>
            <button id="force-sync" class="btn btn-sm btn-primary" style="display: none;">
              🔄 Sync Now
            </button>
          </div>
          <div class="offline-indicator" id="offline-indicator" style="display: none;">
            📱 Offline Mode - Some features limited
          </div>
        </div>

        <div class="favorites-stats">
          <div class="stats-grid">
            <div class="stat-card">
              <h3 id="total-favorites">0</h3>
              <p>Total Favorites</p>
            </div>
            <div class="stat-card">
              <h3 id="this-month">0</h3>
              <p>This Month</p>
            </div>
            <div class="stat-card">
              <h3 id="storage-used">0 KB</h3>
              <p>Storage</p>
            </div>
          </div>
        </div>

        <div class="favorites-grid" id="favorites-grid" role="region" aria-label="Favorite stories list">
          <div class="loading-message">Loading favorites...</div>
        </div>

        <div class="empty-state" id="empty-state" style="display: none;">
          <div class="empty-icon">📚</div>
          <h2>No favorite stories yet</h2>
          <p>Add stories to favorites by clicking the ❤️ icon on the stories page</p>
          <a href="#/stories" class="btn btn-primary">Explore Stories</a>
        </div>

        <!-- Push Notification Controls -->
        <div class="push-notification-section">
          <h2>🔔 Notifications</h2>
          <div class="notification-controls">
            <div class="notification-status">
              <span id="push-status" class="status-inactive">Push notifications inactive</span>
            </div>
            <button id="push-toggle-btn" class="btn btn-secondary">
              🔕 Enable Notifications
            </button>
            <button id="test-notification" class="btn btn-info">
              🧪 Test Notification
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    await this.loadFavorites();
    this.setupEventListeners();
    this.updateSyncStatus();
    this.updateStats();
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById("search-favorites");
    searchInput?.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.filterAndDisplayFavorites();
    });

    // Sort functionality
    const sortSelect = document.getElementById("sort-favorites");
    sortSelect?.addEventListener("change", (e) => {
      const [sortBy, order] = e.target.value.split("-");
      this.currentSort = sortBy;
      this.sortOrder = order;
      this.filterAndDisplayFavorites();
    });

    // Control buttons
    document
      .getElementById("refresh-favorites")
      ?.addEventListener("click", () => {
        this.loadFavorites();
      });

    document
      .getElementById("clear-favorites")
      ?.addEventListener("click", () => {
        this.clearAllFavorites();
      });

    document
      .getElementById("export-favorites")
      ?.addEventListener("click", () => {
        this.exportFavorites();
      });

    document.getElementById("force-sync")?.addEventListener("click", () => {
      this.forceSync();
    });

    // Push notification controls
    document
      .getElementById("push-toggle-btn")
      ?.addEventListener("click", () => {
        window.pushNotificationService?.toggleSubscription();
      });

    document
      .getElementById("test-notification")
      ?.addEventListener("click", () => {
        window.pushNotificationService?.testNotification();
      });

    // Online/offline status
    window.addEventListener("online", () => this.updateSyncStatus());
    window.addEventListener("offline", () => this.updateSyncStatus());
  }

  async loadFavorites() {
    try {
      this.showLoading(true);

      if (!window.indexedDBService) {
        throw new Error("IndexedDB service not available");
      }

      this.favorites = await window.indexedDBService.getFavorites();
      console.log("Loaded favorites:", this.favorites.length);

      this.filterAndDisplayFavorites();
      this.updateStats();
    } catch (error) {
      console.error("Error loading favorites:", error);
      this.showError("Failed to load favorites: " + error.message);
    } finally {
      this.showLoading(false);
    }
  }

  filterAndDisplayFavorites() {
    // Apply search filter
    this.filteredFavorites = this.favorites.filter((favorite) => {
      if (!this.searchQuery) return true;

      const story = favorite.storyData;
      return (
        story.name?.toLowerCase().includes(this.searchQuery) ||
        story.description?.toLowerCase().includes(this.searchQuery)
      );
    });

    // Apply sorting
    this.filteredFavorites.sort((a, b) => {
      let valueA, valueB;

      if (this.currentSort === "addedAt") {
        valueA = new Date(a.addedAt);
        valueB = new Date(b.addedAt);
      } else if (this.currentSort === "createdAt") {
        valueA = new Date(a.storyData.createdAt);
        valueB = new Date(b.storyData.createdAt);
      } else if (this.currentSort === "name") {
        valueA = a.storyData.name?.toLowerCase() || "";
        valueB = b.storyData.name?.toLowerCase() || "";
      }

      if (this.sortOrder === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    this.displayFavorites();
  }

  displayFavorites() {
    const favoritesGrid = document.getElementById("favorites-grid");
    const emptyState = document.getElementById("empty-state");

    if (!favoritesGrid) return;

    if (this.filteredFavorites.length === 0) {
      favoritesGrid.style.display = "none";
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";
    favoritesGrid.style.display = "grid";

    favoritesGrid.innerHTML = this.filteredFavorites
      .map((favorite) => this.renderFavoriteCard(favorite))
      .join("");

    // Add event listeners to cards
    this.setupFavoriteCardListeners();
  }

  renderFavoriteCard(favorite) {
    const story = favorite.storyData;
    const addedDate = new Date(favorite.addedAt).toLocaleDateString("en-US");
    const storyDate = new Date(story.createdAt).toLocaleDateString("en-US");

    return `
      <article class="favorite-card" data-story-id="${story.id}">
        <div class="favorite-image">
          ${
            story.photoUrl
              ? `<img src="${story.photoUrl}" alt="Story photo ${story.name}" loading="lazy" />`
              : '<div class="placeholder-image">📷</div>'
          }
        </div>
        
        <div class="favorite-content">
          <h3 class="favorite-title">${this.escapeHtml(
            story.name || "Untitled story"
          )}</h3>
          <p class="favorite-description">
            ${this.escapeHtml(this.truncateText(story.description || "", 100))}
          </p>
          
          <div class="favorite-meta">
            <span class="story-date">📅 ${storyDate}</span>
            <span class="added-date">❤️ ${addedDate}</span>
            ${
              story.lat && story.lon
                ? '<span class="has-location">📍 Location</span>'
                : ""
            }
          </div>
        </div>
        
        <div class="favorite-actions">
          <button class="btn btn-sm btn-primary view-story" data-story-id="${
            story.id
          }">
            👁️ View
          </button>
          ${
            story.lat && story.lon
              ? `<button class="btn btn-sm btn-info view-map" data-lat="${story.lat}" data-lon="${story.lon}">
                 🗺️ Map
               </button>`
              : ""
          }
          <button class="btn btn-sm btn-danger remove-favorite" data-story-id="${
            story.id
          }">
            🗑️ Remove
          </button>
        </div>
      </article>
    `;
  }

  setupFavoriteCardListeners() {
    // View story buttons
    document.querySelectorAll(".view-story").forEach((button) => {
      button.addEventListener("click", (e) => {
        const storyId = e.target.getAttribute("data-story-id");
        window.location.hash = `#/stories/${storyId}`;
      });
    });

    // View map buttons
    document.querySelectorAll(".view-map").forEach((button) => {
      button.addEventListener("click", (e) => {
        const lat = e.target.getAttribute("data-lat");
        const lon = e.target.getAttribute("data-lon");
        window.location.hash = `#/stories?lat=${lat}&lon=${lon}`;
      });
    });

    // Remove favorite buttons
    document.querySelectorAll(".remove-favorite").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const storyId = e.target.getAttribute("data-story-id");
        await this.removeFavorite(storyId);
      });
    });
  }

  async removeFavorite(storyId) {
    if (
      !confirm("Are you sure you want to remove this story from favorites?")
    ) {
      return;
    }

    try {
      await window.indexedDBService.removeFromFavorites(storyId);
      this.showMessage("Story removed from favorites", "success");
      await this.loadFavorites(); // Reload favorites
    } catch (error) {
      console.error("Error removing favorite:", error);
      this.showMessage("Failed to remove favorite: " + error.message, "error");
    }
  }

  async clearAllFavorites() {
    if (
      !confirm(
        "Are you sure you want to remove ALL favorite stories? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Clear favorites by removing each one
      for (const favorite of this.favorites) {
        await window.indexedDBService.removeFromFavorites(favorite.storyId);
      }

      this.showMessage("All favorites removed successfully", "success");
      await this.loadFavorites(); // Reload favorites
    } catch (error) {
      console.error("Error clearing favorites:", error);
      this.showMessage(
        "Failed to remove all favorites: " + error.message,
        "error"
      );
    }
  }

  async exportFavorites() {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        totalFavorites: this.favorites.length,
        favorites: this.favorites,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `app-favorites-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showMessage("Favorites exported successfully", "success");
    } catch (error) {
      console.error("Error exporting favorites:", error);
      this.showMessage("Failed to export favorites: " + error.message, "error");
    }
  }

  async forceSync() {
    try {
      this.showMessage("Starting synchronization...", "info");
      await window.syncService?.forcSync();
      this.showMessage("Synchronization completed", "success");
      this.updateSyncStatus();
    } catch (error) {
      console.error("Error during force sync:", error);
      this.showMessage("Failed to synchronize: " + error.message, "error");
    }
  }

  updateSyncStatus() {
    const syncStatus = document.getElementById("sync-status");
    const offlineIndicator = document.getElementById("offline-indicator");
    const forceSyncBtn = document.getElementById("force-sync");

    if (!syncStatus) return;

    const isOnline = navigator.onLine;

    if (isOnline) {
      syncStatus.textContent = "🟢 Online";
      syncStatus.className = "sync-status online";
      offlineIndicator.style.display = "none";

      // Show sync button if there might be pending changes
      window.syncService?.hasPendingChanges().then((hasPending) => {
        if (forceSyncBtn) {
          forceSyncBtn.style.display = hasPending ? "inline-block" : "none";
        }
      });
    } else {
      syncStatus.textContent = "🔴 Offline";
      syncStatus.className = "sync-status offline";
      offlineIndicator.style.display = "block";
      if (forceSyncBtn) {
        forceSyncBtn.style.display = "none";
      }
    }
  }

  async updateStats() {
    try {
      const totalElement = document.getElementById("total-favorites");
      const thisMonthElement = document.getElementById("this-month");
      const storageElement = document.getElementById("storage-used");

      if (totalElement) {
        totalElement.textContent = this.favorites.length;
      }

      // Calculate this month's additions
      const thisMonth = new Date();
      const startOfMonth = new Date(
        thisMonth.getFullYear(),
        thisMonth.getMonth(),
        1
      );
      const thisMonthCount = this.favorites.filter(
        (f) => new Date(f.addedAt) >= startOfMonth
      ).length;

      if (thisMonthElement) {
        thisMonthElement.textContent = thisMonthCount;
      }

      // Get storage stats
      if (window.indexedDBService) {
        const stats = await window.indexedDBService.getDBStats();
        if (storageElement) {
          storageElement.textContent = `${stats.totalSize} KB`;
        }
      }
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  }

  showLoading(show) {
    const favoritesGrid = document.getElementById("favorites-grid");
    if (!favoritesGrid) return;

    if (show) {
      favoritesGrid.innerHTML =
        '<div class="loading-message">Memuat favorit...</div>';
    }
  }

  showError(message) {
    const favoritesGrid = document.getElementById("favorites-grid");
    if (!favoritesGrid) return;

    favoritesGrid.innerHTML = `
      <div class="error-message">
        <p>❌ ${message}</p>
        <button onclick="location.reload()" class="btn btn-primary">Muat Ulang</button>
      </div>
    `;
  }

  showMessage(message, type = "info") {
    // Use global message function if available
    if (typeof window.showMessage === "function") {
      window.showMessage(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

export default FavoritesPage;
