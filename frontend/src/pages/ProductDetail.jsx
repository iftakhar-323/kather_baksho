import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getProduct, getRelatedProducts, getFrequentlyBoughtTogether } from "../api/products";
import { addToCart } from "../api/cart";
import { CompareStore, SaveForLaterStore, RecentStore } from "../utils/kb";
import { notifyCartChanged } from "../context/CartContext";
import { useToast } from "../components/Toast";
import { useTranslation } from "../i18n/I18nProvider";
import ReviewsSection from "../components/ReviewsSection";
import ProductImage from "../components/ProductImage";
import ProductGallery from "../components/ProductGallery";
import Breadcrumbs from "../components/Breadcrumbs";
import ProductCard from "../components/ProductCard";
import { SkeletonDetail } from "../components/Skeleton";
import { useConfirm } from "../components/Confirm";

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export default function ProductDetail({ productId, onBack }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("idle");
  const [qty, setQty] = useState(1);
  const [inCompare, setInCompare] = useState(CompareStore.has(productId));
  const [inSaved, setInSaved] = useState(SaveForLaterStore.has(productId));
  const [related, setRelated] = useState([]);
  const [fbt, setFbt] = useState([]);
  const [fbtUnchecked, setFbtUnchecked] = useState({});
  const [fbtAdding, setFbtAdding] = useState(false);

  useEffect(() => {
    setLoading(true);
    getProduct(productId)
      .then((res) => {
        setProduct(res.data);
        setLoading(false);
        // Push to recently-viewed the moment we have the data
        RecentStore.push(res.data);
        window.dispatchEvent(new Event("kb:recent-changed"));
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
    getRelatedProducts(productId)
      .then((res) => setRelated((res.data || []).filter((p) => p.ID !== Number(productId))))
      .catch(() => setRelated([]));
    getFrequentlyBoughtTogether(productId)
      .then((res) => {
        setFbt((res.data || []).filter((p) => p.ID !== Number(productId)));
        setFbtUnchecked({});
      })
      .catch(() => setFbt([]));
  }, [productId]);

  if (loading) {
    return <SkeletonDetail />;
  }
  if (!product) {
    return (
      <div className="empty">
        <div className="emoji">🤔</div>
        <h3>{t("productDetail.notFound")}</h3>
        <button className="btn btn-secondary mt-16" onClick={onBack}>
          {t("productDetail.backToShop")}
        </button>
      </div>
    );
  }

  const handleAdd = async () => {
    if (!user) {
      const goLogin = await confirm({
        title: "Log in required",
        body: t("productDetail.loginPrompt"),
        confirmText: "Log in",
      });
      if (goLogin) window.__katherboxSetView?.("login");
      return;
    }
    try {
      setStatus("loading");
      await addToCart(product.ID, qty);
      setStatus("added");
      notifyCartChanged();
      toast.show("ok", t("productDetail.btnAdded"), 3800, {
        label: t("nav.cart"),
        onClick: () => window.__katherboxSetView?.("cart"),
      });
      setTimeout(() => setStatus("idle"), 1500);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  const fbtSelected = fbt.filter((p) => !fbtUnchecked[p.ID]);
  const fbtTotal =
    Number(product.price) + fbtSelected.reduce((sum, p) => sum + Number(p.price), 0);

  const addAllFbt = async () => {
    if (!user) {
      const goLogin = await confirm({
        title: "Log in required",
        body: t("productDetail.loginPrompt"),
        confirmText: "Log in",
      });
      if (goLogin) window.__katherboxSetView?.("login");
      return;
    }
    setFbtAdding(true);
    try {
      await Promise.all(
        [product, ...fbtSelected].map((p) => addToCart(p.ID, 1))
      );
      notifyCartChanged();
      toast.ok(t("productDetail.fbtAdded", { count: 1 + fbtSelected.length }));
    } catch (err) {
      toast.err(err?.response?.data?.error || t("productDetail.fbtAddFailed"));
    } finally {
      setFbtAdding(false);
    }
  };

  const btnLabel =
    status === "loading"
      ? t("productDetail.btnAdding")
      : status === "added"
      ? t("productDetail.btnAdded")
      : status === "error"
      ? t("productDetail.btnFailed")
      : t("productDetail.btnAdd");

  const stockOk = product.stock > 0;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <Breadcrumbs
        items={[
          { label: t("nav.shop"), to: "/" },
          {
            label: capitalize(
              (product.subcategory || product.category || "").replace(/_/g, " ")
            ),
            to: "/",
          },
          { label: product.name },
        ]}
      />
      <button onClick={onBack} className="btn btn-ghost mb-16">
        {t("productDetail.backToShop")}
      </button>

      <div
        className="card card-pad-lg"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(220px, 320px) 1fr",
          gap: 32,
        }}
      >
        <ProductGallery
          product={product}
          zoomHint={t("productDetail.clickToZoom")}
        />

        <div>
          <h1 style={{ marginBottom: 8 }}>{product.name}</h1>

          <div className="row gap-8" style={{ flexWrap: "wrap" }}>
            <span className="tag">{product.category}</span>
            {product.subcategory && (
              <span className="tag tag-bark">
                {product.subcategory.replace(/_/g, " ")}
              </span>
            )}
            {product.indoor_outdoor && (
              <span className="tag tag-info">{product.indoor_outdoor}</span>
            )}
          </div>

          <div
            style={{
              fontFamily: "var(--heading)",
              fontWeight: 700,
              fontSize: 30,
              color: "var(--brand-700)",
              marginTop: 16,
            }}
          >
            ৳{Number(product.price).toLocaleString()}
          </div>

          <div
            className="mt-8 mb-16"
            style={{
              color: stockOk ? "var(--brand-700)" : "var(--danger-strong)",
              fontWeight: 600,
            }}
          >
            {stockOk
              ? product.stock < 5
                ? t("productDetail.stockLow", { count: product.stock })
                : t("productDetail.stockIn", { count: product.stock })
              : t("productDetail.stockOut")}
          </div>

          <p
            style={{
              lineHeight: 1.65,
              color: "var(--ink-500)",
              marginBottom: 20,
            }}
          >
            {product.description || t("productDetail.noDescription")}
          </p>

          <div className="row gap-12" style={{ flexWrap: "wrap" }}>
            {stockOk && (
              <div className="qty" aria-label={t("productDetail.quantity") || "Quantity"}>
                <button
                  type="button"
                  aria-label="decrease quantity"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                >
                  −
                </button>
                <span>{qty}</span>
                <button
                  type="button"
                  aria-label="increase quantity"
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  disabled={qty >= product.stock}
                >
                  +
                </button>
              </div>
            )}
            <button
              onClick={handleAdd}
              disabled={!stockOk || status === "loading"}
              className="btn btn-primary btn-lg"
              style={{
                background: status === "added" ? "var(--success)" : undefined,
              }}
            >
              {btnLabel}
            </button>
          </div>

          <div className="row gap-8 mt-12" style={{ flexWrap: "wrap" }}>
            <button
              className={"btn btn-secondary btn-sm" + (inCompare ? "" : "")}
              onClick={() => {
                if (!product) return;
                const r = CompareStore.toggle(product);
                if (r === "full") { toast.err(t("productDetail.compareFullToast")); return; }
                setInCompare(r);
                window.dispatchEvent(new Event("kb:compare-changed"));
                toast.ok(r ? t("productDetail.compareAddedToast") : t("productDetail.compareRemovedToast"));
              }}
              title={t("productDetail.compareTitle")}
            >
              {inCompare ? t("productDetail.compareAdded") : t("productDetail.compareAdd")}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (!product) return;
                if (SaveForLaterStore.has(product.ID)) {
                  SaveForLaterStore.remove(product.ID);
                  setInSaved(false);
                  toast.ok(t("productDetail.saveRemovedToast"));
                } else {
                  SaveForLaterStore.add(product);
                  setInSaved(true);
                  toast.ok(t("productDetail.saveAddedToast"));
                }
                window.dispatchEvent(new Event("kb:save-changed"));
              }}
              title={t("productDetail.saveTitle")}
            >
              {inSaved ? t("productDetail.saveAdded") : t("productDetail.saveAdd")}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                if (!product) return;
                const url = window.location.href;
                if (navigator.share) {
                  navigator.share({ title: product.name, text: product.description, url }).catch(() => {});
                } else if (navigator.clipboard) {
                  navigator.clipboard.writeText(url);
                  toast.ok(t("productDetail.shareCopied"));
                } else {
                  toast.info(t("productDetail.shareInfo", { url }));
                }
              }}
              title={t("productDetail.shareTitle")}
            >
              {t("productDetail.share")}
            </button>
          </div>
        </div>
      </div>

      {fbt.length > 0 && (
        <section className="card card-pad-lg fbt-section" style={{ marginTop: 24 }}>
          <h2 style={{ marginBottom: 4 }}>{t("productDetail.fbtHeading")}</h2>
          <p className="muted" style={{ marginBottom: 16 }}>{t("productDetail.fbtSubhead")}</p>

          <div className="fbt-row">
            <div className="fbt-tile fbt-tile-main">
              <div className="fbt-thumb">
                <ProductImage src={product.image_url} category={product.category} subcategory={product.subcategory} seed={product.name} alt={product.name} />
              </div>
              <div className="fbt-name">{product.name}</div>
              <div className="fbt-price">৳{Number(product.price).toLocaleString()}</div>
            </div>

            {fbt.map((p) => (
              <div className="fbt-item" key={p.ID}>
                <span className="fbt-plus" aria-hidden="true">+</span>
                <label className={"fbt-tile" + (fbtUnchecked[p.ID] ? " is-off" : "")}>
                  <input
                    type="checkbox"
                    checked={!fbtUnchecked[p.ID]}
                    onChange={() =>
                      setFbtUnchecked((u) => ({ ...u, [p.ID]: !u[p.ID] }))
                    }
                  />
                  <div className="fbt-thumb">
                    <ProductImage src={p.image_url} category={p.category} subcategory={p.subcategory} seed={p.name} alt={p.name} />
                  </div>
                  <div className="fbt-name">{p.name}</div>
                  <div className="fbt-price">৳{Number(p.price).toLocaleString()}</div>
                </label>
              </div>
            ))}
          </div>

          <div className="fbt-footer">
            <div>
              <span className="muted">{t("productDetail.fbtTotalLabel")}</span>{" "}
              <strong className="fbt-total">৳{fbtTotal.toLocaleString()}</strong>
            </div>
            <button
              className="btn btn-primary"
              disabled={fbtAdding}
              onClick={addAllFbt}
            >
              {fbtAdding
                ? t("productDetail.fbtAdding")
                : t("productDetail.fbtAddAll", { count: 1 + fbtSelected.length })}
            </button>
          </div>
        </section>
      )}

      <ReviewsSection productId={product.ID} />

      {related.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ marginBottom: 14 }}>{t("productDetail.relatedHeading")}</h2>
          <div className="product-grid">
            {related.slice(0, 4).map((p) => (
              <ProductCard key={p.ID} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
