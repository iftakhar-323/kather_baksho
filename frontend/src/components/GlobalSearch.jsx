import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";

function fmtBDT(n) {
  return "৳" + Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await API.get(`/products?q=${encodeURIComponent(query)}`);
        setResults(data.products?.slice(0, 5) || []);
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleResultClick = (id) => {
    setIsOpen(false);
    setQuery("");
    navigate(`/product/${id}`);
  };

  return (
    <div className="nav-global-search" ref={wrapperRef}>
      <div className="nav-search-input-wrap">
        <span className="nav-search-icon">🔍</span>
        <input
          type="text"
          className="nav-search-input"
          placeholder="Search products..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
        />
        {loading && <div className="nav-search-spinner" />}
      </div>

      {isOpen && query.trim() && (
        <div className="nav-search-dropdown">
          {results.length > 0 ? (
            <div className="nav-search-list">
              {results.map((p) => {
                const cat = p.category || "plant";
                const emoji = cat === "plant" ? "🌿" : cat === "care" ? "🧴" : "🏺";
                return (
                  <button
                    key={p.ID}
                    className="nav-search-item"
                    onClick={() => handleResultClick(p.ID)}
                  >
                    <div className="nav-search-thumb">{emoji}</div>
                    <div className="nav-search-info">
                      <div className="nav-search-name">{p.name}</div>
                      <div className="nav-search-cat">{cat}</div>
                    </div>
                    <div className="nav-search-price">{fmtBDT(p.price)}</div>
                  </button>
                );
              })}
              <button
                className="nav-search-all-btn"
                onClick={() => {
                  setIsOpen(false);
                  navigate(`/?q=${encodeURIComponent(query)}`);
                  setQuery("");
                }}
              >
                View all results →
              </button>
            </div>
          ) : !loading ? (
            <div className="nav-search-empty">
              <span>🌱</span>
              <p>No products found for "{query}"</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
