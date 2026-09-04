import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  Link,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider, useCart } from "./context/CartContext";
import Avatar from "./components/Avatar";
// Home is imported eagerly — it's the landing page almost every visit starts
// on, so there's no benefit to paying a second network round trip for it.
// Everything else below is route-specific and only needed once a user
// actually navigates there, so it's lazy-loaded into its own chunk.
import Home from "./pages/Home";
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Cart = lazy(() => import("./pages/Cart"));
const Orders = lazy(() => import("./pages/Orders"));
const Admin = lazy(() => import("./pages/Admin"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Seasonal = lazy(() => import("./pages/Seasonal"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const Consultations = lazy(() => import("./pages/Consultations"));
const Corporate = lazy(() => import("./pages/Corporate"));
const Community = lazy(() => import("./pages/Community"));
// Sprint A — profile + auth + static pages
const Profile = lazy(() => import("./pages/Profile"));
const StaticPage = lazy(() => import("./pages/StaticPage"));
import Notifications from "./components/Notifications";
// Sprint C — UI polish + zero-API features
import { ToastProvider } from "./components/Toast";
import { ConfirmProvider } from "./components/Confirm";
import ScrollProgress from "./components/ScrollProgress";
import ThemeToggle from "./components/ThemeToggle";
import RecentlyViewed from "./components/RecentlyViewed";
import CompareDrawer, { CompareBar } from "./components/CompareDrawer";
import Onboarding from "./components/Onboarding";
import StatsCounter from "./components/StatsCounter";
import FeaturedCollections from "./components/FeaturedCollections";
import QuickView from "./components/QuickView";
// Sprint D — no-API feature pages
const Loyalty = lazy(() => import("./pages/Loyalty"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const Care = lazy(() => import("./pages/Care"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const GiftCards = lazy(() => import("./pages/GiftCards"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
import GlobalSearch from "./components/GlobalSearch";
import ErrorBoundary from "./components/ErrorBoundary";
import LangToggle from "./components/LangToggle";
import { I18nProvider, useTranslation } from "./i18n/I18nProvider";

// Primary (always-visible) nav links — keep these short so the bar stays compact.
const PRIMARY_NAV_ITEMS = [
  { key: "home",      tKey: "nav.shop",      emoji: "" },
  { key: "dashboard", tKey: "nav.dashboard", emoji: "" },
  { key: "wishlist",  tKey: "nav.wishlist",  emoji: "" },
  { key: "cart",      tKey: "nav.cart",      emoji: "" },
  { key: "orders",    tKey: "nav.orders",    emoji: "" },
];

// Overflow items — surfaced through a single "More" dropdown so the bar stays
// tidy. Admin link is appended dynamically when the user has admin role.
const MORE_NAV_ITEMS = [
  { key: "subscriptions", tKey: "nav.subscriptions", emoji: "📦" },
  { key: "consultations", tKey: "nav.consultations", emoji: "🌱" },
  { key: "care",          tKey: "nav.care",          emoji: "🌿" },
  { key: "blog",          tKey: "nav.blog",          emoji: "" },
  { key: "loyalty",       tKey: "nav.loyalty",       emoji: "🏆" },
  { key: "gift-cards",    tKey: "nav.giftCards",     emoji: "🎁" },
  { key: "corporate",     tKey: "nav.corpPortal",    emoji: "🏢" },
  { key: "community",     tKey: "nav.community",     emoji: "" },
  { key: "seasonal",      tKey: "nav.seasonal",      emoji: "" },
];

// Sprint A — supported static-page slugs
const STATIC_SLUGS = ["about", "contact", "faq", "privacy", "terms", "shipping", "refund"];

// ────────────────────────────────────────────────────────────────────────────
// Routing
// ────────────────────────────────────────────────────────────────────────────
// Single source of truth: legacy "view" key  ⇄  URL path.
// Customer-only views that admins should never see.
const CUSTOMER_ONLY = new Set([
  "cart", "orders", "order-detail", "wishlist",
  "seasonal", "subscriptions", "consultations", "corporate",
  "community", "loyalty", "blog", "care",
  "gift-cards", "dashboard",
]);

// View → path. Unknown keys fall back to "/".
function pathFor(view) {
  if (!view) return "/";
  if (view === "home") return "/";
  if (view === "admin") return "/admin";
  if (view === "login") return "/login";
  if (view === "register") return "/register";
  if (view === "profile") return "/profile";
  if (view.startsWith("product-")) return "/product/" + view.slice("product-".length);
  if (view.startsWith("blog-")) return "/blog/" + view.slice("blog-".length);
  if (STATIC_SLUGS.includes(view)) return "/" + view;
  return "/" + view; // cart, orders, wishlist, etc.
}

// Path → view. Returns the legacy key + extracted params.
function viewFromPath(pathname) {
  if (pathname === "/" || pathname === "") return { view: "home" };
  const segs = pathname.split("/").filter(Boolean);
  const first = segs[0];
  if (first === "admin") return { view: "admin" };
  if (first === "login") return { view: "login" };
  if (first === "register") return { view: "register" };
  if (first === "profile") return { view: "profile" };
  if (first === "product" && segs[1]) return { view: "product-" + segs[1], productId: segs[1] };
  if (first === "blog" && segs[1]) return { view: "blog-" + segs[1], blogSlug: segs[1] };
  // /orders/:id is order-detail; bare /orders is the list.
  if (first === "orders" && segs[1]) return { view: "order-detail", orderId: segs[1] };
  if (STATIC_SLUGS.includes(first)) return { view: first };
  // Anything else (cart, wishlist, orders list, etc.) is the key itself.
  return { view: first };
}

function RouteLoader() {
  return (
    <div className="route-loader" aria-busy="true" aria-label="Loading page">
      <div className="pm-spinner" />
    </div>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  // `pathFor` is defined in the same file (after this component) so we just
  // import via the helper. Footer only needs the canonical customer paths.
  const linkTo = (slug) => pathFor(slug);

  if (isAdmin) {
    // Slim workspace footer — admin users don't need the marketing columns.
    return (
      <footer className="footer is-admin-footer" role="contentinfo">
        <div className="footer-inner footer-inner-admin">
          <div className="footer-brand">
            <span className="brand-line">
              <span className="leaf">🌿</span>
              <span>KatherBox</span>
              <span className="nav-admin-badge">ADMIN</span>
            </span>
            <p className="footer-tagline">{t("admin.footer.tagline") || "Admin workspace"}</p>
          </div>
          <div className="footer-admin-meta">
            <span>{t("admin.footer.environment") || "Environment"}: dev</span>
            <span>·</span>
            <span>{t("admin.footer.session") || "Signed in as"}: {user?.name || user?.email}</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {year} KatherBox. {t("footer.rights")}.</span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand-line">
            <span className="leaf">🌿</span>
            <span>KatherBox</span>
          </span>
          <p className="footer-tagline">{t("brand.tagline")}</p>
        </div>

        <div className="footer-col">
          <h4>{t("footer.shop")}</h4>
          <ul>
            <li><Link to={linkTo("home")}>{t("footer.shopAll") || "Shop all plants"}</Link></li>
            <li><Link to={linkTo("subscriptions")}>{t("footer.plantBoxes") || "Plant boxes"}</Link></li>
            <li><Link to={linkTo("consultations")}>{t("nav.consultations")}</Link></li>
            <li><Link to={linkTo("corporate")}>{t("nav.corpPortal")}</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>{t("footer.support")}</h4>
          <ul>
            <li><Link to={linkTo("about")}>{t("footer.aboutUs")}</Link></li>
            <li><Link to={linkTo("contact")}>{t("footer.contactUs")}</Link></li>
            <li><Link to={linkTo("faq")}>{t("footer.faq")}</Link></li>
            <li><Link to={linkTo("shipping")}>{t("footer.shipping")}</Link></li>
            <li><Link to={linkTo("refund")}>{t("footer.refund")}</Link></li>
            <li><Link to={linkTo("privacy")}>{t("footer.privacy")}</Link></li>
            <li><Link to={linkTo("terms")}>{t("footer.terms")}</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>{t("footer.contact")}</h4>
          <div className="footer-contact">
            <div className="row">📧 hello@katherbox.com</div>
            <div className="row">📞 +880 1700 000 000</div>
            <div className="row">📍 House 12, Road 7, Dhanmondi, Dhaka</div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} KatherBox. {t("footer.rights")}.</span>
        <div className="socials">
          <a href="#" aria-label="Facebook">f</a>
          <a href="#" aria-label="Instagram">◎</a>
          <a href="#" aria-label="Twitter">𝕏</a>
          <a href="#" aria-label="YouTube">▶</a>
        </div>
      </div>
    </footer>
  );
}

// Small live badge for the Cart nav item.
function NavCartBadge({ itemKey }) {
  const { count } = useCart();
  if (itemKey !== "cart" || count <= 0) return null;
  return (
    <span className="nav-cart-badge" aria-label={`${count} items in cart`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  // The "current view" for active-link highlighting
  const currentView = viewFromPath(location.pathname).view;

  // Close mobile drawer + dropdown whenever the path changes
  useEffect(() => {
    setOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Close the "More" dropdown on outside click / Escape
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    const onKey = (e) => { if (e.key === "Escape") setMoreOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  const go = (key) => {
    setOpen(false);
    setMoreOpen(false);
    navigate(pathFor(key));
  };

  const isLinkActive = (key) => {
    if (key === "home") {
      return currentView === "home" || currentView.startsWith("product-");
    }
    if (key === "orders") {
      return currentView === "orders" || currentView === "order-detail";
    }
    if (key === "blog") {
      return currentView === "blog" || currentView.startsWith("blog-");
    }
    return currentView === key;
  };

  // Mobile drawer — full list (primary + more + admin) for customers;
  // a slim admin-only menu for staff.
  const moreItemsWithAdmin = isAdmin
    ? [...MORE_NAV_ITEMS, { key: "admin", tKey: "nav.admin", emoji: "🛠", admin: true }]
    : MORE_NAV_ITEMS;

  const drawerItems = isAdmin ? (
    <>
      <button
        onClick={() => go("profile")}
        className={"nav-link" + (currentView === "profile" ? " is-active" : "")}
      >
        <span className="nav-emoji" aria-hidden="true">👤</span>
        <span>{t("nav.profile")}</span>
      </button>
    </>
  ) : (
    <>
      {PRIMARY_NAV_ITEMS.map((it) => (
        <button
          key={it.key}
          onClick={() => go(it.key)}
          className={"nav-link" + (isLinkActive(it.key) ? " is-active" : "")}
        >
          {it.emoji && <span className="nav-emoji" aria-hidden="true">{it.emoji}</span>}
          <span>{t(it.tKey)}</span>
          <NavCartBadge itemKey={it.key} />
        </button>
      ))}
      <div className="nav-drawer-section-title">{t("nav.more") || "More"}</div>
      {moreItemsWithAdmin.map((it) => (
        <button
          key={it.key}
          onClick={() => go(it.key)}
          className={
            "nav-link" +
            (isLinkActive(it.key) ? " is-active" : "") +
            (it.admin ? " nav-admin" : "")
          }
        >
          {it.emoji && <span className="nav-emoji" aria-hidden="true">{it.emoji}</span>}
          <span>{t(it.tKey)}</span>
        </button>
      ))}
    </>
  );

  return (
    <header className={"navbar" + (isAdmin ? " is-admin" : "")}>
      <div className="nav-inner">
        <span
          className="nav-brand"
          onClick={() => go(isAdmin && currentView !== "home" ? "admin" : "home")}
        >
          <span className="leaf">🌿</span>
          <span className="nav-brand-text">KatherBox</span>
          {isAdmin && <span className="nav-admin-badge">ADMIN</span>}
        </span>

        {user && !isAdmin && (
          <nav className="nav-links nav-links-desktop" aria-label="Primary">
            {PRIMARY_NAV_ITEMS.map((it) => (
              <button
                key={it.key}
                onClick={() => go(it.key)}
                className={"nav-link" + (isLinkActive(it.key) ? " is-active" : "")}
              >
                {it.emoji && <span className="nav-emoji" aria-hidden="true">{it.emoji}</span>}
                <span>{t(it.tKey)}</span>
                <NavCartBadge itemKey={it.key} />
              </button>
            ))}

            <div className="nav-more" ref={moreRef}>
              <button
                className={"nav-link nav-more-toggle" + (moreOpen ? " is-open" : "")}
                onClick={() => setMoreOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={moreOpen}
                aria-controls="nav-more-menu"
                title="More pages"
              >
                <span className="nav-emoji" aria-hidden="true">⋯</span>
                <span>{t("nav.more") || "More"}</span>
                <span className="nav-caret" aria-hidden="true">▾</span>
              </button>
              {moreOpen && (
                <div
                  id="nav-more-menu"
                  className="nav-more-menu"
                  role="menu"
                >
                  {moreItemsWithAdmin.map((it) => (
                    <button
                      key={it.key}
                      onClick={() => go(it.key)}
                      role="menuitem"
                      className={
                        "nav-more-item" +
                        (isLinkActive(it.key) ? " is-active" : "") +
                        (it.admin ? " nav-admin" : "")
                      }
                    >
                      {it.emoji && <span className="nav-emoji" aria-hidden="true">{it.emoji}</span>}
                      <span>{t(it.tKey)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>
        )}

        {user && !isAdmin && <GlobalSearch />}

        <span className="nav-spacer" />

        <div className="nav-actions">
          <ThemeToggle />
          <LangToggle />

          {user ? (
            <>
              {isAdmin && (
                <button
                  className={"btn btn-sm nav-view-toggle" + (currentView === "home" ? " is-active" : "")}
                  onClick={() => go(currentView === "home" ? "admin" : "home")}
                  title={currentView === "home" ? "Back to admin panel" : "View storefront"}
                >
                  <span aria-hidden="true">{currentView === "home" ? "🛠" : "🏪"}</span>
                  <span className="nav-view-toggle-text">
                    {currentView === "home" ? t("nav.admin") : (t("nav.viewStorefront") || "Storefront")}
                  </span>
                </button>
              )}
              <button
                className={"btn btn-ghost btn-sm nav-profile-btn" + (currentView === "profile" ? " is-active" : "")}
                onClick={() => go("profile")}
                title="Edit profile, password, addresses"
              >
                <Avatar user={user} size={26} className="nav-profile-avatar" />
                <span className="nav-profile-name">{user.name?.split(" ")[0]}</span>
              </button>
              <button onClick={logout} className="btn btn-secondary btn-sm nav-logout">
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <button onClick={() => go("login")} className="btn btn-primary btn-sm">
              {t("nav.login")}
            </button>
          )}

          {user && (
            <button
              className={"nav-burger" + (open ? " is-open" : "")}
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={open}
              aria-controls="nav-drawer"
            >
              <span /><span /><span />
            </button>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {user && (
        <>
          <div
            className={"nav-drawer-backdrop" + (open ? " is-open" : "")}
            onClick={() => setOpen(false)}
          />
          <aside
            id="nav-drawer"
            className={"nav-drawer" + (open ? " is-open" : "")}
            aria-hidden={!open}
          >
            <div className="nav-drawer-head">
              <span className="nav-brand">
                <span className="leaf">🌿</span>
                <span className="nav-brand-text">KatherBox</span>
                {isAdmin && <span className="nav-admin-badge">ADMIN</span>}
              </span>
              <button
                className="nav-drawer-close"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <nav className="nav-drawer-links" aria-label="Mobile primary">
              {drawerItems}
            </nav>
          </aside>
        </>
      )}
    </header>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Page components
// ────────────────────────────────────────────────────────────────────────────
function HomePage({ onQuickView, isAdmin }) {
  return isAdmin ? (
    <Home slot={<FeaturedCollections onQuickView={onQuickView} />} />
  ) : (
    <>
      <Home
        slot={
          <>
            <FeaturedCollections onQuickView={onQuickView} />
            <StatsCounter />
          </>
        }
      />
      <RecentlyViewed />
    </>
  );
}

function LoginPage({ navigate }) {
  return (
    <Login
      onSwitch={() => navigate("/register")}
      onSuccess={(loggedInUser) => {
        // Admins land directly on the admin panel; everyone else on home.
        navigate(loggedInUser?.role === "admin" ? "/admin" : "/");
      }}
    />
  );
}

function RegisterPage({ navigate }) {
  return (
    <Register
      onSwitch={() => navigate("/login")}
      onSuccess={() => navigate("/")}
    />
  );
}

function StaticSlugPage({ slug }) {
  return <StaticPage slug={slug} />;
}

function ProductDetailPage({ isAdmin, navigate }) {
  const { id } = useParams();
  return (
    <ProductDetail
      productId={Number(id)}
      onBack={() => navigate(isAdmin ? "/admin" : "/")}
    />
  );
}

function BlogDetailPage({ navigate }) {
  const { slug } = useParams();
  return <BlogDetail slug={slug} onBack={() => navigate("/blog")} />;
}

function OrderDetailPage({ orderCtx, navigate }) {
  return <OrderDetail order={orderCtx} onBack={() => navigate("/orders")} />;
}

function MainApp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Quick-view modal id (null = closed)
  const [quickViewId, setQuickViewId] = useState(null);
  // Currently-opened order (used by OrderDetail)
  const [orderCtx, setOrderCtx] = useState(null);

  const isAdmin = user?.role === "admin";
  const currentView = viewFromPath(location.pathname).view;

  // expose navigate globally so deeply nested components (e.g. ProductCard)
  // can navigate without prop-drilling through the entire tree.
  useEffect(() => {
    window.__katherboxSetView = (key) => navigate(pathFor(key));
    window.__katherboxOpenOrder = (order) => {
      setOrderCtx(order);
      navigate("/orders/" + (order?.id ?? order?.ID));
    };
    window.__katherboxOpenQuickView = (id) => setQuickViewId(id);
    return () => {
      delete window.__katherboxSetView;
      delete window.__katherboxOpenOrder;
      delete window.__katherboxOpenQuickView;
    };
  }, [navigate]);

  // Top-level redirect: if an admin hits a customer-only URL, push them to /admin.
  useEffect(() => {
    if (!isAdmin) return;
    if (currentView === "login" || currentView === "register") return;
    if (CUSTOMER_ONLY.has(currentView)) {
      navigate("/admin", { replace: true });
    }
  }, [isAdmin, currentView, navigate]);

  return (
    <div className={"app-shell" + (isAdmin ? " is-admin-shell" : "")}>
      <Navbar />

      <main className="page">
        <ErrorBoundary>
        <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={
            <HomePage
              isAdmin={isAdmin}
              onQuickView={(id) => setQuickViewId(id)}
            />
          } />
          <Route path="/login"    element={<LoginPage navigate={navigate} />} />
          <Route path="/register" element={<RegisterPage navigate={navigate} />} />
          <Route path="/profile"  element={<Profile onExit={() => navigate(isAdmin ? "/admin" : "/")} />} />
          <Route path="/admin"    element={<Admin />} />

          {/* Static footer / link pages */}
          {STATIC_SLUGS.map((slug) => (
            <Route key={slug} path={"/" + slug} element={<StaticSlugPage slug={slug} />} />
          ))}

          {/* Dynamic product detail */}
          <Route path="/product/:id" element={
            <ProductDetailPage isAdmin={isAdmin} navigate={navigate} />
          } />

          {/* Dynamic blog detail */}
          <Route path="/blog/:slug" element={
            <BlogDetailPage navigate={navigate} />
          } />
          <Route path="/blog" element={
            <CustomerOnly isAdmin={isAdmin}><Blog /></CustomerOnly>
          } />

          {/* Order detail (dynamic id) */}
          <Route path="/orders/:id" element={
            <CustomerOnly isAdmin={isAdmin}>
              <OrderDetailPage orderCtx={orderCtx} navigate={navigate} />
            </CustomerOnly>
          } />

          {/* All other top-level pages */}
          <Route path="/cart"          element={<CustomerOnly isAdmin={isAdmin}><Cart onOrderPlaced={() => navigate("/orders")} /></CustomerOnly>} />
          <Route path="/orders"        element={<CustomerOnly isAdmin={isAdmin}><Orders /></CustomerOnly>} />
          <Route path="/wishlist"      element={<CustomerOnly isAdmin={isAdmin}><Wishlist /></CustomerOnly>} />
          <Route path="/seasonal"      element={<CustomerOnly isAdmin={isAdmin}><Seasonal /></CustomerOnly>} />
          <Route path="/subscriptions" element={<CustomerOnly isAdmin={isAdmin}><Subscriptions /></CustomerOnly>} />
          <Route path="/consultations" element={<CustomerOnly isAdmin={isAdmin}><Consultations /></CustomerOnly>} />
          <Route path="/corporate"     element={<CustomerOnly isAdmin={isAdmin}><Corporate /></CustomerOnly>} />
          <Route path="/community"     element={<CustomerOnly isAdmin={isAdmin}><Community /></CustomerOnly>} />
          <Route path="/loyalty"       element={<CustomerOnly isAdmin={isAdmin}><Loyalty /></CustomerOnly>} />
          <Route path="/care"          element={<CustomerOnly isAdmin={isAdmin}><Care /></CustomerOnly>} />
          <Route path="/gift-cards"    element={<CustomerOnly isAdmin={isAdmin}><GiftCards /></CustomerOnly>} />
          <Route path="/dashboard"    element={<CustomerOnly isAdmin={isAdmin}><Dashboard /></CustomerOnly>} />

          {/* Merged pages — old bookmarked URLs redirect into the new tabs */}
          <Route path="/reminders"   element={<Navigate to="/care" replace />} />
          <Route path="/communityqa" element={<Navigate to="/community" replace />} />
          <Route path="/corp-portal" element={<Navigate to="/corporate" replace />} />

          {/* 404 fallback → home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </main>

      {!isAdmin && user && <Notifications />}

      {!isAdmin && quickViewId && (
        <QuickView
          productId={quickViewId}
          onClose={() => setQuickViewId(null)}
        />
      )}
      {!isAdmin && <CompareDrawer />}
      <Footer />
    </div>
  );
}

// Renders children only for non-admin users; admin is redirected to /admin by
// the top-level effect in MainApp. This is here so the router still has a
// component to mount while the redirect happens.
function CustomerOnly({ isAdmin, children }) {
  if (isAdmin) return <Navigate to="/admin" replace />;
  return children;
}

// Inner shell — has access to AuthContext so we can hide customer-only
// global widgets (CompareBar, Onboarding) for admin users.
function AppShell() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  return (
    <ToastProvider>
      <ConfirmProvider>
        <ScrollProgress />
        <MainApp />
        {!isAdmin && <CompareBar />}
        {!isAdmin && <Onboarding />}
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <CartProvider>
            <AppShell />
          </CartProvider>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}