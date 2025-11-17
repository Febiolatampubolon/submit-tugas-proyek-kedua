import HomePage from "../pages/home/home-page.js";
import AboutPage from "../pages/about/about-page.js";
import LoginPage from "../pages/auth/login-page.js";
import RegisterPage from "../pages/auth/register-page.js";
import StoriesPage from "../pages/stories/stories-page.js";
import AddStoryPage from "../pages/add-story/add-story-page.js";
import FavoritesPage from "../pages/favorites/favorites-page.js";
import TestPage from "../pages/test/test-page.js";

const routes = {
  "/": new HomePage(),
  "/about": new AboutPage(),
  "/login": new LoginPage(),
  "/register": new RegisterPage(),
  "/stories": new StoriesPage(),
  "/add-story": new AddStoryPage(),
  "/favorites": new FavoritesPage(),
  "/test": new TestPage(),
};

export default routes;
