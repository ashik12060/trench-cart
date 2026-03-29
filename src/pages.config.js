/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Home from './pages/Home';
import ProductListing from './pages/ProductListing';
import ProductDetail from './pages/ProductDetail';
import Shop from './pages/Shop';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import TrackOrder from './pages/TrackOrder';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminSuppliers from './pages/AdminSuppliers';
import AdminCategories from './pages/AdminCategories';
import AdminOrders from './pages/AdminOrders';
import AdminInventory from './pages/AdminInventory';
import AdminBarcodes from './pages/AdminBarcodes';
import AdminMedia from './pages/AdminMedia';
import AdminCarousel from './pages/AdminCarousel';
import __Layout from './Layout.jsx';

export const PAGES = {
    "Home": Home,
    "ProductListing": ProductListing,
    "ProductDetail": ProductDetail,
    "Shop": Shop,
    "Checkout": Checkout,
    "MyOrders": MyOrders,
    "TrackOrder": TrackOrder,
    "Login": Login,
    "Signup": Signup,
    "admin/login": AdminLogin,
    "admin/dashboard": AdminDashboard,
    "admin/products": AdminProducts,
    "admin/suppliers": AdminSuppliers,
    "admin/categories": AdminCategories,
    "admin/orders": AdminOrders,
    "admin/inventory": AdminInventory,
    "admin/barcodes": AdminBarcodes,
    "admin/media": AdminMedia,
    "admin/carousel": AdminCarousel,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
