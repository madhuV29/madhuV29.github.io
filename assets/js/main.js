(function () {
  const root = document.documentElement;

  // ---- Theme ----
  const saved = localStorage.getItem("theme");
  if (saved) root.setAttribute("data-theme", saved);

  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }

  // ---- Year ----
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- Publications ----
  const pubList = document.getElementById("pubList");
  const pubSearch = document.getElementById("pubSearch");
  const pubFilter = document.getElementById("pubFilter");

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getPrimaryUrl(p) {
    if (!p) return "";
    if (p.primary_url) return p.primary_url;
    if (Array.isArray(p.links) && p.links.length > 0 && p.links[0].url) return p.links[0].url;
    return "";
  }

  function renderPubs(pubs, query, filter) {
    if (!pubList) return;

    const q = (query || "").trim().toLowerCase();
    const f = filter || "all";

    const filtered = pubs.filter(p => {
      const hay = [
        p.title, p.venue, p.year, p.type, (p.keywords || []).join(" "),
        p.authors
      ].join(" ").toLowerCase();

      const okQuery = q ? hay.includes(q) : true;
      const okType = (f === "all") ? true : (p.type === f);
      return okQuery && okType;
    });

    if (filtered.length === 0) {
      pubList.innerHTML = `<div class="card"><b>No matches.</b><div class="muted">Try a different keyword or filter.</div></div>`;
      return;
    }

    pubList.innerHTML = filtered.map(p => {
      const links = (p.links || []).map(l => {
        const safeLabel = escapeHtml(l.label);
        const safeUrl = escapeHtml(l.url);
        return `<a class="pill" href="${safeUrl}" target="_blank" rel="noopener">${safeLabel}</a>`;
      }).join("");

      const badge = p.badge ? `<span class="badge">${escapeHtml(p.badge)}</span>` : "";

      const primary = getPrimaryUrl(p);
      const titleHtml = primary
        ? `<a href="${escapeHtml(primary)}" target="_blank" rel="noopener">${escapeHtml(p.title)}</a>`
        : `${escapeHtml(p.title)}`;

      return `
        <article class="pub">
          <div class="pub-top">
            <div>
              <div class="pub-title">${titleHtml}</div>
              <div class="pub-meta">${escapeHtml(p.authors)}</div>
              <div class="pub-meta">${escapeHtml(p.venue)} · ${escapeHtml(String(p.year))}</div>
            </div>
            <div>${badge}</div>
          </div>
          <div class="pub-blurb">${escapeHtml(p.blurb || "")}</div>
          <div class="pub-links">${links}</div>
        </article>
      `;
    }).join("");
  }

  async function loadPubs() {
    if (!pubList) return;
    try {
      const res = await fetch("assets/data/publications.json", { cache: "no-store" });
      const pubs = await res.json();

      // newest first
      pubs.sort((a, b) => (b.year || 0) - (a.year || 0));

      renderPubs(pubs, "", "all");

      const rerender = () => renderPubs(pubs, pubSearch?.value || "", pubFilter?.value || "all");
      pubSearch?.addEventListener("input", rerender);
      pubFilter?.addEventListener("change", rerender);

    } catch (e) {
      pubList.innerHTML = `<div class="card"><b>Could not load publications.</b><div class="muted">Check that <code>assets/data/publications.json</code> exists.</div></div>`;
      console.error(e);
    }
  }

  loadPubs();
})();
