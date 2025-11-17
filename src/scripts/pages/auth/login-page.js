import { BasePage, BasePresenter } from "../../utils/base-classes.js";
import ApiService from "../../services/api-service.js";

class LoginPresenter extends BasePresenter {
  async handleLogin(formData) {
    try {
      this.showLoading();

      const credentials = {
        email: formData.get("email"),
        password: formData.get("password"),
      };

      const result = await ApiService.login(credentials);
      this.hideLoading();

      if (result.error === false) {
        this.showSuccess("Login successful! Redirecting to the stories page...");

        // Notify app about authentication update
        document.dispatchEvent(new CustomEvent("authStateChange"));

        setTimeout(() => {
          window.location.hash = "#/stories";
        }, 1500);
      } else {
        this.showError(result.message || "Login failed");
      }
    } catch (error) {
      this.hideLoading();
      this.showError("An error occurred: " + error.message);
    }
  }
}

class LoginPage extends BasePage {
  constructor() {
    super();
    this.title = "Login — APP";
    this.presenter = new LoginPresenter(this);
  }

  async render() {
    return `
      <div class="container">
        <div class="card" style="max-width: 400px; margin: 0 auto;">
          <div class="card-header">
            <h1 class="card-title">Sign In to Your Account</h1>
            <p class="text-light">Please log in to access the APP</p>
          </div>
          
          <form id="login-form" novalidate>
            <div class="form-group">
              <label for="email" class="form-label">Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                class="form-input" 
                required 
                aria-describedby="email-error"
                autocomplete="email"
              >
              <div id="email-error" class="form-error" aria-live="polite"></div>
            </div>
            
            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password"
                class="form-input"
                required
                aria-describedby="password-error"
                autocomplete="current-password"
                minlength="8"
              >
              <div id="password-error" class="form-error" aria-live="polite"></div>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              Log In
            </button>
          </form>
          
          <div style="text-align: center; margin-top: 20px;">
            <p>Don't have an account? <a href="#/register">Register here</a></p>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    await super.afterRender();

    const form = document.getElementById("login-form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    // Validation logic
    const validateEmail = () => {
      const email = emailInput.value.trim();
      const error = document.getElementById("email-error");

      if (!email) {
        error.textContent = "Email is required";
        return false;
      } else if (!email.includes("@")) {
        error.textContent = "Please enter a valid email address";
        return false;
      } else {
        error.textContent = "";
        return true;
      }
    };

    const validatePassword = () => {
      const password = passwordInput.value;
      const error = document.getElementById("password-error");

      if (!password) {
        error.textContent = "Password is required";
        return false;
      } else if (password.length < 8) {
        error.textContent = "Password must be at least 8 characters";
        return false;
      } else {
        error.textContent = "";
        return true;
      }
    };

    emailInput.addEventListener("blur", validateEmail);
    passwordInput.addEventListener("blur", validatePassword);

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const emailValid = validateEmail();
      const passwordValid = validatePassword();

      if (emailValid && passwordValid) {
        const formData = new FormData(form);
        this.presenter.handleLogin(formData);
      }
    });
  }
}

export default LoginPage;
