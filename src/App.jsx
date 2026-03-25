// import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { CartProvider } from '@/lib/CartContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Toaster } from './components/ui/sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import { CustomerAuthProvider } from '@/lib/CustomerAuthContext';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => {
  const location = useLocation();
  const isAdminRoute =
    location.pathname.startsWith('/admin') &&
    !location.pathname.startsWith('/admin/login');

  if (isAdminRoute) {
    return <AdminLayout currentPageName={currentPageName}>{children}</AdminLayout>;
  }

  return Layout ? <Layout currentPageName={currentPageName}>{children}</Layout> : <>{children}</>;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking app public settings or auth
  if ((isLoadingPublicSettings || isLoadingAuth) && location.pathname.startsWith('/admin')) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    if (
      authError.type === 'auth_required' &&
      location.pathname.startsWith('/admin') &&
      !location.pathname.startsWith('/admin/login')
    ) {
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      <Route
        path="/ProductDetail/:id"
        element={
          <LayoutWrapper currentPageName="ProductDetail">
            {Pages.ProductDetail ? <Pages.ProductDetail /> : <></>}
          </LayoutWrapper>
        }
      />
      <Route
        path="/checkout"
        element={
          <LayoutWrapper currentPageName="Checkout">
            {Pages.Checkout ? <Pages.Checkout /> : <></>}
          </LayoutWrapper>
        }
      />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <CustomerAuthProvider>
            <QueryClientProvider client={queryClientInstance}>
              <AuthenticatedApp />
            </QueryClientProvider>
          </CustomerAuthProvider>
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
