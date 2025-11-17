import { BasePage, BasePresenter } from "../../utils/base-classes.js";
import ApiService from "../../services/api-service.js";

class RegisterPresenter extends BasePresenter {
  async handleRegister(formData) {
    try {
      this.showLoading();
      const userData = {
        name: formData.get("name")?.trim(),
        email: formData.get("email")?.trim().toLowerCase(),
        password: formData.get("password"),
      };

      console.log("Form data being sent:", userData);

      // Additional validation
      if (!userData.name || userData.name.length < 2) {
        this.hideLoading();
        this.showError("Name must be at least 2 characters long");
        return;
      }

      if (!userData.email || !userData.email.includes("@")) {
        this.hideLoading();
        this.showError("Invalid email format");
        return;
      }

      if (!userData.password || userData.password.length < 8) {
        this.hideLoading();
        this.showError("Password must be at least 8 characters long");
        return;
      }

      const result = await ApiService.register(userData);
      this.hideLoading();

      console.log("Registration result:", result);

      if (result.error === false) {
        this.showSuccess(
          "Registration successful! Please log in with your account."
        );
        setTimeout(() => {
          window.location.hash = "#/login";
        }, 2000);
      } else {
        this.showError(result.message || "Registration failed");
      }
    } catch (error) {
      this.hideLoading();
      console.error("Registration error:", error);
      this.showError("An error occurred: " + error.message);
    }
  }
}

class RegisterPage extends BasePage {
  constructor() {
    super();
    this.title = "Register - App";
    this.presenter = new RegisterPresenter(this);
  }

  async render() {
    return `
      <div class="container">
        <div class="card" style="max-width: 400px; margin: 0 auto;">
          <div class="card-header">
            <h1 class="card-title">Create a New Account</h1>
            <p class="text-light">Register to start sharing your stories</p>
          </div>
          
          <form id="register-form" novalidate>
            <div class="form-group">
              <label for="name" class="form-label">Full Name</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                class="form-input" 
                required 
                aria-describedby="name-error"
                autocomplete="name"
              >
              <div id="name-error" class="form-error" aria-live="polite"></div>
            </div>
            
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
                aria-describedby="password-error password-help"
                autocomplete="new-password"
                minlength="8"
              >
              <div id="password-help" class="form-help">At least 8 characters</div>
              <div id="password-error" class="form-error" aria-live="polite"></div>
            </div>
            
            <div class="form-group">
              <label for="confirm-password" class="form-label">Confirm Password</label>
              <input 
                type="password" 
                id="confirm-password" 
                name="confirm-password" 
                class="form-input" 
                required 
                aria-describedby="confirm-password-error"
                autocomplete="new-password"
              >
              <div id="confirm-password-error" class="form-error" aria-live="polite"></div>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              Register
            </button>
          </form>
          
          <div style="text-align: center; margin-top: 20px;">
            <p>Already have an account? <a href="#/login">Sign in here</a></p>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    await super.afterRender();

    const form = document.getElementById("register-form");
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirm-password");

    // Form validation
    const validateName = () => {
      const name = nameInput.value.trim();
      const error = document.getElementById("name-error");

      if (!name) {
        error.textContent = "Name is required";
        return false;
      } else if (name.length < 2) {
        error.textContent = "Name must be at least 2 characters long";
        return false;
      } else {
        error.textContent = "";
        return true;
      }
    };

    const validateEmail = () => {
      const email = emailInput.value.trim();
      const error = document.getElementById("email-error");

      if (!email) {
        error.textContent = "Email is required";
        return false;
      } else if (!email.includes("@")) {
        error.textContent = "Invalid email format";
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
        error.textContent = "Password must be at least 8 characters long";
        return false;
      } else {
        error.textContent = "";
        return true;
      }
    };

    const validateConfirmPassword = () => {
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      const error = document.getElementById("confirm-password-error");

      if (!confirmPassword) {
        error.textContent = "Please confirm your password";
        return false;
      } else if (password !== confirmPassword) {
        error.textContent = "Passwords do not match";
        return false;
      } else {
        error.textContent = "";
        return true;
      }
    };

    nameInput.addEventListener("blur", validateName);
    emailInput.addEventListener("blur", validateEmail);
    passwordInput.addEventListener("blur", validatePassword);
    confirmPasswordInput.addEventListener("blur", validateConfirmPassword);

    confirmPasswordInput.addEventListener("input", validateConfirmPassword);

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const validName = validateName();
      const validEmail = validateEmail();
      const validPassword = validatePassword();
      const validConfirm = validateConfirmPassword();

      if (validName && validEmail && validPassword && validConfirm) {
        const formData = new FormData(form);
        this.presenter.handleRegister(formData);
      }
    });
  }
}

export default RegisterPage;
