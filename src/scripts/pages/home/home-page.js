import { BasePage } from "../../utils/base-classes.js";
import ApiService from "../../services/api-service.js";

export default class HomePage extends BasePage {
  constructor() {
    super();
    this.title = "Home - App";
  }

  async render() {
    const isAuthenticated = ApiService.isAuthenticated();

    return `
      <div class="container">
  <!-- Hero Section -->
  <section class="hero-section" role="banner">
    <div class="hero-content">
      <h1 class="hero-title">
        🌍 Discover Stories From Around the Globe
      </h1>
      <p class="hero-description">
        Dive into unique moments shared by people everywhere. 
        Browse inspiring narratives and explore 
        places through a beautifully designed interactive map.
      </p>
      <div class="hero-actions">
        <a href="#/register" class="btn btn-primary">✨ Join and Start Creating</a>
        <a href="#/stories" class="btn btn-outline">📘 Browse Story Collection</a>
      </div>
    </div>
  </section>
</div>


        <!-- Features Section -->
        <section class="features-section" role="region" aria-labelledby="features-title">
          <h2 id="features-title" class="section-title">✨ Key Features</h2>

          <article class="feature-card">
  <div class="feature-icon">⚡</div>
  <h3 class="feature-title">Fast Performance</h3>
  <p class="feature-description">
    Enjoy a highly optimized experience with quick loading times and efficient data processing across all pages.
  </p>
</article>

<article class="feature-card">
  <div class="feature-icon">🔒</div>
  <h3 class="feature-title">Secure Authentication</h3>
  <p class="feature-description">
    Your data is protected with secure login and authorization features, ensuring safe access to your stories.
  </p>
</article>

<article class="feature-card">
  <div class="feature-icon">☁️</div>
  <h3 class="feature-title">Cloud Backup</h3>
  <p class="feature-description">
    All your stories are stored safely in the cloud, allowing you to access them anytime and from any device.
  </p>
</article>
              

        <!-- Stats Section -->
        <section class="stats-section" role="region" aria-labelledby="stats-title">
          <h2 id="stats-title" class="section-title">📊 Platform Statistics</h2>
          
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number" id="story-count">0</div>
              <div class="stat-label">Published Stories</div>
            </div>
            <div class="stat-item">
              <div class="stat-number" id="location-count">0</div>
              <div class="stat-label">Different Locations</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">100%</div>
              <div class="stat-label">Accessibility</div>
            </div>
          </div>
        </section>

        <!-- CTA Section -->
        <section class="cta-section" role="region" aria-labelledby="cta-title">
          <div class="cta-content">
            <h2 id="cta-title">🚀 Ready to Get Started?</h2>
            <p>Join the storyteller community and share your experiences</p>
            <div class="cta-actions">
              ${
                !isAuthenticated
                  ? `
                <a href="#/register" class="btn btn-primary">Sign Up Now</a>
                <a href="#/login" class="btn btn-outline">Already Have an Account?</a>
              `
                  : `
                <a href="#/add-story" class="btn btn-primary">Add New Story</a>
                <a href="#/stories" class="btn btn-outline">View All Stories</a>
              `
              }
            </div>
          </div>
        </section>
      </div>
    `;
  }

  async afterRender() {
    await super.afterRender();
    await this.loadStats();
    this.setupAnimations();
  }

  async loadStats() {
    try {
      // Load statistics without authentication requirement
      const response = await fetch(
        "https://story-api.dicoding.dev/v1/stories?size=100"
      );
      const data = await response.json();

      if (data.error === false && data.listStory) {
        const stories = data.listStory;
        const storyCount = stories.length;
        const uniqueLocations = new Set(
          stories
            .filter((story) => story.lat && story.lon)
            .map((story) => `${story.lat.toFixed(2)},${story.lon.toFixed(2)}`)
        ).size;

        this.animateCounter("story-count", storyCount);
        this.animateCounter("location-count", uniqueLocations);
      }
    } catch (error) {
      console.warn("Failed to load stats:", error);
      // Set fallback values
      document.getElementById("story-count").textContent = "50+";
      document.getElementById("location-count").textContent = "25+";
    }
  }

  animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    let currentValue = 0;
    const increment = Math.ceil(targetValue / 30); // Animate over ~30 frames

    const timer = setInterval(() => {
      currentValue += increment;
      if (currentValue >= targetValue) {
        currentValue = targetValue;
        clearInterval(timer);
      }
      element.textContent = currentValue.toLocaleString();
    }, 50);
  }

  setupAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    }, observerOptions);

    // Observe feature cards and sections
    const animateElements = document.querySelectorAll(
      ".feature-card, .stat-item, .cta-content"
    );
    animateElements.forEach((element, index) => {
      element.style.opacity = "0";
      element.style.transform = "translateY(20px)";
      element.style.transition = `opacity 0.6s ease ${
        index * 0.1
      }s, transform 0.6s ease ${index * 0.1}s`;
      observer.observe(element);
    });
  }
}
