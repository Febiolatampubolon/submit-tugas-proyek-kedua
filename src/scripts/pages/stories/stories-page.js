import { BasePage, BasePresenter } from "../../utils/base-classes.js";
import ApiService from "../../services/api-service.js";
import MapService from "../../services/map-service.js";

class StoriesPresenter extends BasePresenter {
  constructor(view) {
    super(view);
    this.stories = [];
    this.mapService = null;
    this.currentFilter = "all";
  }

  async init() {
    await this.loadStories();
    await this.initMap();
    this.setupEventListeners();
  }

  async loadStories() {
    try {
      this.showLoading();

      // Prefer sync service (handles online/offline) if available
      let stories = [];
      if (window.syncService) {
        stories = await window.syncService.getStories(false);
      } else {
        // Fallback to direct API call
        const response = await ApiService.getStoriesWithLocation();
        if (response.error === false) {
          stories = response.listStory || [];
        }
      }

      this.stories = stories;
      this.view.displayStories(this.stories);
      this.hideLoading();
    } catch (error) {
      this.hideLoading();

      // If API failed, attempt to recover from local DB
      if (window.indexedDBService) {
        try {
          const cachedStories = await window.indexedDBService.getAllStories();
          this.stories = cachedStories;
          this.view.displayStories(this.stories);
          this.showSuccess("Loaded stories from local cache");
        } catch (cacheError) {
          this.showError("Unable to load stories: " + error.message);
        }
      } else {
        this.showError("An error occurred: " + error.message);
      }
    }
  }

  async initMap() {
    const mapContainer = document.getElementById("stories-map");
    if (mapContainer && this.stories.length > 0) {
      this.mapService = new MapService("stories-map");
      await this.mapService.initMap();

      // Place markers for stories that include coordinates
      this.stories.forEach((story) => {
        if (story.lat && story.lon) {
          this.mapService.addStoryMarker(story);
        }
      });

      // When a marker is clicked, highlight and scroll to the card
      this.mapService.onMarkerClick((story) => {
        this.highlightStoryCard(story.id);
        this.view.scrollToStory(story.id);
      });
    }
  }

  setupEventListeners() {
    // Filter controls
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const filter = e.target.dataset.filter;
        this.applyFilter(filter);

        // Toggle active state
        filterButtons.forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
      });
    });

    // Story card hover & click interactions
    const storyCards = document.querySelectorAll(".story-card");
    storyCards.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        const storyId = card.dataset.storyId;
        if (this.mapService) {
          this.mapService.highlightMarker(storyId);
        }
      });

      card.addEventListener("mouseleave", () => {
        if (this.mapService) {
          this.mapService.clearHighlight();
        }
      });

      // Click opens detail view (placeholder for future implementation)
      card.addEventListener("click", () => {
        const storyId = card.dataset.storyId;
        this.viewStoryDetails(storyId);
      });
    });

    // Favorite toggle buttons
    const favoriteButtons = document.querySelectorAll(".favorite-btn");
    favoriteButtons.forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation(); // prevent triggering card click
        const storyId = e.target.dataset.storyId;
        await this.toggleFavorite(storyId, e.target);
      });
    });

    // Manual refresh control
    const refreshBtn = document.getElementById("refresh-stories");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this.refreshStories();
      });
    }
  }

  async toggleFavorite(storyId, button) {
    if (!window.indexedDBService) {
      this.showError("IndexedDB service is unavailable");
      return;
    }

    try {
      const story = this.stories.find((s) => s.id === storyId);
      if (!story) return;

      const isFavorite = await window.indexedDBService.isFavorite(storyId);

      if (isFavorite) {
        await window.indexedDBService.removeFromFavorites(storyId);
        button.innerHTML = "🤍";
        button.setAttribute("aria-label", "Add to favorites");
        button.classList.remove("favorite-active");
        this.showSuccess("Removed from favorites");
      } else {
        await window.indexedDBService.addToFavorites(storyId, story);
        button.innerHTML = "❤️";
        button.setAttribute("aria-label", "Remove from favorites");
        button.classList.add("favorite-active");
        this.showSuccess("Saved to favorites");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      this.showError("Failed to update favorite status");
    }
  }

  async refreshStories() {
    if (window.syncService) {
      try {
        // Force a fresh fetch from the API via sync service
        await window.syncService.getStories(true);
        await this.loadStories();
        await this.initMap();
        this.showSuccess("Stories refreshed successfully");
      } catch (error) {
        this.showError("Failed to refresh stories: " + error.message);
      }
    } else {
      await this.loadStories();
      await this.initMap();
    }
  }

  viewStoryDetails(storyId) {
    // Placeholder for a detailed story page in future
    console.log("Open story details for:", storyId);
  }

  applyFilter(filter) {
    this.currentFilter = filter;
    let filteredStories = this.stories;

    if (filter === "with-location") {
      filteredStories = this.stories.filter((story) => story.lat && story.lon);
    } else if (filter === "recent") {
      filteredStories = this.stories
        .slice() // avoid mutating original array
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);
    }

    this.view.displayStories(filteredStories);

    if (this.mapService) {
      this.mapService.clearMarkers();
      filteredStories.forEach((story) => {
        if (story.lat && story.lon) {
          this.mapService.addStoryMarker(story);
        }
      });
    }
  }

  highlightStoryCard(storyId) {
    // Un-highlight any previously highlighted cards
    document.querySelectorAll(".story-card.highlighted").forEach((card) => {
      card.classList.remove("highlighted");
    });

    // Add highlight to the selected card
    const card = document.querySelector(`[data-story-id="${storyId}"]`);
    if (card) {
      card.classList.add("highlighted");
    }
  }
}

class StoriesPage extends BasePage {
  constructor() {
    super();
    this.title = "Stories - App";
    this.presenter = new StoriesPresenter(this);
  }

  async render() {
    return `
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">📚 Story Map</h1>
          <p class="page-description">Browse compelling accounts submitted from many places</p>
        </div>

        <!-- Filter Controls -->
        <div class="filter-controls" role="tablist" aria-label="Story filters">
          <button class="filter-btn btn btn-outline active" data-filter="all" role="tab" aria-selected="true">
            All Stories
          </button>
        </div>

        <!-- Map Section -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">🗺️ Stories Map</h2>
            <p>Click a marker to open that story's summary</p>
          </div>
          <div id="stories-map" class="map-container" role="application" aria-label="Stories location map"></div>
        </div>

        <!-- Stories Grid -->
        <div class="stories-section">
          <h2 class="section-title">Story Listings</h2>
          <div id="stories-grid" class="story-grid" role="region" aria-label="Stories list">
            <!-- Stories will be injected here -->
          </div>
        </div>

        <!-- Empty state -->
        <div id="empty-state" class="empty-state" style="display: none;">
          <div class="empty-state-content">
            <div class="empty-icon"></div>
            <h3>No stories yet</h3>
            <p>There are currently no stories available.</p>
            <a href="#/add-story" class="btn btn-primary">Add Your First Story</a>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    await super.afterRender();
  }

  async displayStories(stories) {
    const storiesGrid = document.getElementById("stories-grid");
    const emptyState = document.getElementById("empty-state");

    if (!stories || stories.length === 0) {
      storiesGrid.style.display = "none";
      emptyState.style.display = "block";
      return;
    }

    storiesGrid.style.display = "grid";
    emptyState.style.display = "none";

    // Build story cards, checking favorite state from local DB if possible
    const storyCards = await Promise.all(
      stories.map(async (story) => {
        let isFavorite = false;
        if (window.indexedDBService) {
          try {
            isFavorite = await window.indexedDBService.isFavorite(story.id);
          } catch (error) {
            console.warn("Failed to check favorite flag:", error);
          }
        }

        const isOffline = !!story.isOffline;
        const syncPending = !!story.syncPending;

        const imageSrc =
          story.photoUrl ||
          (isOffline ? story.photo : "/placeholder-image.jpg");
        const altText = story.description || "Story image";

        return `
        <article class="story-card ${
          isOffline ? "offline-story" : ""
        }" data-story-id="${story.id}" tabindex="0" role="article">
          <div class="story-image-container">
            <img 
              src="${imageSrc}" 
              alt="${altText}"
              class="story-image"
              loading="lazy"
            >
            <div class="story-actions">
              <button 
                class="favorite-btn ${isFavorite ? "favorite-active" : ""}" 
                data-story-id="${story.id}"
                aria-label="${
                  isFavorite ? "Remove from favorites" : "Add to favorites"
                }"
              >
                ${isFavorite ? "❤️" : "🤍"}
              </button>
            </div>
            ${
              syncPending
                ? '<div class="sync-indicator">🔄 Sync Pending</div>'
                : ""
            }
          </div>
          <div class="story-content">
            <h3 class="story-title">${story.name || "Untitled Story"}</h3>
            <p class="story-description">${
              story.description || "No description provided"
            }</p>
            <div class="story-meta">
              <span class="story-author">📝 ${
                story.name || "Unknown author"
              }</span>
              <span class="story-date">📅 ${
                story.createdAt
                  ? new Date(story.createdAt).toLocaleDateString("en-US")
                  : "—"
              }</span>
              ${
                isOffline ? '<span class="offline-badge">📱 Offline</span>' : ""
              }
            </div>
            ${
              story.lat && story.lon
                ? `
              <div class="story-location">
                📍 Lat: ${Number(story.lat).toFixed(4)}, Lon: ${Number(
                    story.lon
                  ).toFixed(4)}
              </div>
            `
                : ""
            }
          </div>
        </article>
      `;
      })
    );

    storiesGrid.innerHTML = storyCards.join("");

    // Re-attach event listeners for generated elements
    this.presenter.setupEventListeners();
  }

  scrollToStory(storyId) {
    const card = document.querySelector(`[data-story-id="${storyId}"]`);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.focus();
    }
  }
}

export default StoriesPage;
