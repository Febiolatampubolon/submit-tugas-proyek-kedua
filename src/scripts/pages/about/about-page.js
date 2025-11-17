import { BasePage } from "../../utils/base-classes.js";

export default class AboutPage extends BasePage {
  constructor() {
    super();
    this.title = "About — App";
  }

  async render() {
    return `
      <div class="container">
        <header class="page-header">
          <h3 class="page-title"> About This Application</h3>
        </header>

        <!-- Basic Info -->
        <section class="card">
          <div class="card-header">
            <h2 class="card-title">📘 Overview</h2>
          </div>
          <div class="card-body">
            <p>
              This web app allows users to post short stories and connect them to specific map locations.
              It was created as part of a learning project using modern web development techniques.
            </p>
            <p>
              The app supports creating stories, viewing them on a map, and browsing user submissions.
            </p>
          </div>
        </section>

        <!-- Main Features -->
        <section class="card">
          <div class="card-header">
            <h2 class="card-title">✨ Main Capabilities</h2>
          </div>
          <div class="card-body">
            <ul class="features-list">
              <li>Interactive map with location markers</li>
              <li>Story creation with photo uploads</li>
              <li>Simple single-page navigation</li>
              <li>Responsive layout for all screen sizes</li>
              <li>Support for basic offline usage</li>
            </ul>
          </div>
        </section>

        <!-- Dev Info -->
        <section class="card">
          <div class="card-header">
            <h2 class="card-title">👨‍💻 Project Details</h2>
          </div>
          <div class="card-body">
            <p><strong>Stack:</strong> JavaScript, HTML, CSS, Web APIs</p>
            <p><strong>Purpose:</strong> Learning and practice</p>
            <p><strong>Developer:</strong> Independent project</p>
          </div>
        </section>

        <!-- Actions -->
        <nav class="about-actions">
          <a href="#/stories" class="btn btn-primary"> View Stories</a>
          <a href="#/add-story" class="btn btn-secondary"> Create Story</a>
          <a href="#/" class="btn btn-outline"> Home</a>
        </nav>
      </div>
    `;
  }

  async afterRender() {
    await super.afterRender();
  }
}
