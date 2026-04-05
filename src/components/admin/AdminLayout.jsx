import React from "react";
import clsx from "clsx";
import { Link, NavLink } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, Package, List, Box, LogOut, Eye, Truck, ScanLine, ImageUp, Star } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import logo from "@/assets/logo-removebd.png";

const navItems = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Products", to: "/admin/products", icon: Package },
  { label: "Suppliers", to: "/admin/suppliers", icon: Truck },
  { label: "Categories", to: "/admin/categories", icon: List },
  { label: "Inventory", to: "/admin/inventory", icon: Box },
  { label: "Barcodes", to: "/admin/barcodes", icon: ScanLine },
  { label: "Media", to: "/admin/media", icon: ImageUp },
  { label: "Carousel", to: "/admin/carousel", icon: ImageUp },
  { label: "Orders", to: "/admin/orders", icon: ShoppingBag },
  { label: "Reviews", to: "/admin/reviews", icon: Star },
];

export default function AdminLayout({ children, currentPageName }) {
  const { user, logout, navigateToLogin } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigateToLogin();
  };

  const activeItem = navItems.find((item) => item.to === `/${currentPageName}`);
  const pageTitle = activeItem?.label || "Admin Panel";

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col justify-between">
        <div>
          <div className="px-6 py-8 border-b border-slate-200">
            <Link to="/admin/dashboard" className="text-2xl font-bold tracking-tight text-slate-900">
              
              <img src={logo} alt="trenchcart logo" />
            </Link>
           
          </div>
          <nav className="px-4 py-6 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition",
                    isActive
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="px-4 pb-6 space-y-3 border-t border-slate-200">
          <Link
            to="/"
            className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500 hover:text-slate-900"
          >
            <span>View Store</span>
            <Eye className="w-4 h-4" />
          </Link>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{user?.email || "Guest"}</span>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-slate-900"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="px-10 py-6 border-b border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-[0.3em]">Admin</p>
              <h1 className="text-2xl font-semibold text-slate-900">{pageTitle}</h1>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="font-medium text-slate-900">{user?.email || "Admin"}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-10 py-10">{children}</main>
      </div>
    </div>
  );
}
