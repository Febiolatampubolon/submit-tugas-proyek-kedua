import axios from "axios";
import { API_CONFIG } from "../config/api-config.js";

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      headers: API_CONFIG.DEFAULT_HEADERS,
      timeout: 10000, // 10 second timeout
      validateStatus: function (status) {
        return status < 500; // Accept all status codes less than 500
      },
    });

    // Add request interceptor to include auth token if available
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      console.log(
        `API Request: ${config.method?.toUpperCase()} ${config.url}`,
        config.data
      );
      return config;
    });

    // Add response interceptor for better error handling
    this.api.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status}`, response.data);
        return response;
      },
      (error) => {
        console.error("API Error:", error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Stories API methods
  async getStories() {
    try {
      const response = await this.api.get(API_CONFIG.ENDPOINTS.STORIES);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch stories: ${error.message}`);
    }
  }

  async getStoriesWithLocation() {
    try {
      const response = await this.api.get(
        API_CONFIG.ENDPOINTS.STORIES_WITH_LOCATION
      );
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to fetch stories with location: ${error.message}`
      );
    }
  }

  async addStory(formData) {
    try {
      const response = await this.api.post(
        API_CONFIG.ENDPOINTS.ADD_STORY,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to add story: ${error.message}`);
    }
  }

  // Auth API methods
  async register(userData) {
    try {
      console.log("Sending registration data:", userData);
      const response = await this.api.post(
        API_CONFIG.ENDPOINTS.REGISTER,
        userData
      );
      console.log("Registration response:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Registration error details:",
        error.response?.data || error
      );

      // Get detailed error message from API response
      const errorMessage =
        error.response?.data?.message ||
        error.response?.statusText ||
        error.message ||
        "Registration failed";

      throw new Error(errorMessage);
    }
  }

  async login(credentials) {
    try {
      console.log("Sending login data:", credentials);
      const response = await this.api.post(
        API_CONFIG.ENDPOINTS.LOGIN,
        credentials
      );
      console.log("Login response:", response.data);

      if (response.data.loginResult?.token) {
        localStorage.setItem("token", response.data.loginResult.token);
      }
      return response.data;
    } catch (error) {
      console.error("Login error details:", error.response?.data || error);

      // Get detailed error message from API response
      const errorMessage =
        error.response?.data?.message ||
        error.response?.statusText ||
        error.message ||
        "Login failed";

      throw new Error(errorMessage);
    }
  }

  logout() {
    localStorage.removeItem("token");
    // Announce logout for accessibility
    import("../utils/accessibility.js").then(({ AccessibilityUtils }) => {
      AccessibilityUtils.announce("Anda telah berhasil logout", "polite");
    });
    // Redirect to home
    window.location.hash = "#/";
    // Trigger navigation update
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  isAuthenticated() {
    return !!localStorage.getItem("token");
  }
}

export default new ApiService();
