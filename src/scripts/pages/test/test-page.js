import { BasePage } from "../../utils/base-classes.js";
import { testStoryAPI, testPublicStories } from "../../utils/api-test.js";

class TestPage extends BasePage {
  constructor() {
    super();
    this.title = "API Test - App";
  }

  async render() {
    return `
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">🔧 API Test Page</h1>
          <p class="page-description">Debug dan test Story API endpoints</p>
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Manual API Tests</h2>
          </div>
          
          <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px;">
            <button id="test-public-btn" class="btn btn-primary">Test Public Stories</button>
            <button id="test-register-btn" class="btn btn-secondary">Test Registration & Login</button>
            <button id="clear-console-btn" class="btn btn-outline">Clear Console</button>
          </div>
          
          <div id="test-results" class="test-results">
            <p>Hasil test akan muncul di console browser. Tekan F12 untuk melihat console.</p>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Manual Registration Test</h2>
          </div>
          
          <form id="manual-register-form">
            <div class="form-group">
              <label for="test-name" class="form-label">Name</label>
              <input type="text" id="test-name" class="form-input" value="Test User">
            </div>
            
            <div class="form-group">
              <label for="test-email" class="form-label">Email</label>
              <input type="email" id="test-email" class="form-input" value="">
            </div>
            
            <div class="form-group">
              <label for="test-password" class="form-label">Password</label>
              <input type="password" id="test-password" class="form-input" value="testpass123">
            </div>
            
            <button type="submit" class="btn btn-primary">Test Manual Register</button>
          </form>
          
          <div id="manual-result" style="margin-top: 20px; padding: 16px; background: #f8f9fa; border-radius: 8px; display: none;">
            <pre id="manual-result-text"></pre>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Current App State</h2>
          </div>
          
          <div id="app-state">
            <p><strong>Current URL:</strong> <span id="current-url">${
              window.location.href
            }</span></p>
            <p><strong>Auth Token:</strong> <span id="auth-token">${
              localStorage.getItem("token") ? "✅ Present" : "❌ Not found"
            }</span></p>
            <p><strong>Browser:</strong> <span id="browser-info">${
              navigator.userAgent
            }</span></p>
            <button id="clear-token-btn" class="btn btn-outline">Clear Token</button>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    await super.afterRender();
    this.setupEventListeners();
    this.generateTestEmail();
  }

  generateTestEmail() {
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    document.getElementById("test-email").value = testEmail;
  }

  setupEventListeners() {
    // Test buttons
    document
      .getElementById("test-public-btn")
      .addEventListener("click", async () => {
        console.log("🔍 Testing Public Stories...");
        await testPublicStories();
      });

    document
      .getElementById("test-register-btn")
      .addEventListener("click", async () => {
        console.log("🔍 Testing Registration & Login...");
        await testStoryAPI();
      });

    document
      .getElementById("clear-console-btn")
      .addEventListener("click", () => {
        console.clear();
        console.log("🧹 Console cleared");
      });

    document.getElementById("clear-token-btn").addEventListener("click", () => {
      localStorage.removeItem("token");
      document.getElementById("auth-token").textContent = "❌ Not found";
      console.log("🧹 Token cleared");
    });

    // Manual registration form
    document
      .getElementById("manual-register-form")
      .addEventListener("submit", async (event) => {
        event.preventDefault();
        await this.testManualRegister();
      });
  }

  async testManualRegister() {
    const name = document.getElementById("test-name").value;
    const email = document.getElementById("test-email").value;
    const password = document.getElementById("test-password").value;

    const resultDiv = document.getElementById("manual-result");
    const resultText = document.getElementById("manual-result-text");

    try {
      console.log("🔍 Manual Registration Test Started...");

      const registerData = { name, email, password };
      console.log("Sending data:", registerData);

      const response = await fetch(
        "https://story-api.dicoding.dev/v1/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registerData),
        }
      );

      const result = await response.json();

      console.log("Response status:", response.status);
      console.log("Response data:", result);

      resultDiv.style.display = "block";
      resultText.textContent = JSON.stringify(
        {
          status: response.status,
          statusText: response.statusText,
          data: result,
        },
        null,
        2
      );

      if (response.ok) {
        this.showSuccess("Registration test successful!");
      } else {
        this.showError(
          `Registration test failed: ${result.message || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Manual registration test error:", error);
      resultDiv.style.display = "block";
      resultText.textContent = `Error: ${error.message}`;
      this.showError(`Test failed: ${error.message}`);
    }
  }
}

export default TestPage;
