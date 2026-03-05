/* =========================================================
   GUIA DE NEGÓCIOS - main.js (ORGANIZADO)
   - API (Render) + fallback localStorage
   ========================================================= */

/* =========================
   1) CONFIG
   ========================= */
const CONFIG = {
  whatsappPadrao: "258842043370",

  // ✅ Coloque aqui a URL do seu backend Render
  // Exemplo: "https://guia-chimoio-api.onrender.com/api"
  API_BASE: "https://SEU-SERVIDOR.onrender.com/api",

  // Fallback local
  STORAGE_KEY_EMPRESAS: "Guia de Negocio",
  STORAGE_KEY_THEME: "theme",

  // UI
  LIMITE_HOME: 10,
};

/* =========================
   2) DADOS PADRÃO (fallback)
   ========================= */
const EMPRESAS_PADRAO = [
  {
    id: 1,
    nome: "Farmácia Popular Chimoio",
    categoria: "Farmácias",
    bairro: "Centro",
    contacto: "+258 84 123 4567",
    whatsapp: "258841234567",
    horario: "08:00 - 20:00",
    destaque: true,
    plano: "destaque",
    ativo: true,
    descricao: "Farmácia completa com vasto stock de medicamentos.",
    data_cadastro: "2024-01-15",
  },
  {
    id: 2,
    nome: "Restaurante Sabores da Terra",
    categoria: "Restaurantes",
    bairro: "Vila Nova",
    contacto: "+258 86 234 5678",
    whatsapp: "258862345678",
    horario: "09:00 - 22:00",
    destaque: true,
    plano: "destaque",
    ativo: true,
    descricao: "Autêntica cozinha moçambicana.",
    data_cadastro: "2024-01-14",
  },
  {
    id: 3,
    nome: "Oficina Mecânica do Zé",
    categoria: "Oficinas",
    bairro: "7 de Abril",
    contacto: "+258 87 345 6789",
    whatsapp: "258873456789",
    horario: "07:30 - 17:30",
    destaque: false,
    plano: "pro",
    ativo: true,
    descricao: "Mecânica automotiva completa.",
    data_cadastro: "2024-01-13",
  },
];

/* =========================
   3) CATEGORIAS
   ========================= */
const CATEGORIAS = [
  "Restaurantes",
  "Farmácias",
  "Oficinas",
  "Escolas",
  "Clínicas",
  "Supermercados",
  "Salões de Beleza",
  "Alfaiatarias",
  "Materiais de Construção",
  "Transportes",
  "Hotéis",
  "ONGs",
  "Associação",
  "Serviços de Informática",
  "Eletrodomésticos",
  "Eventos & Decoração",
  "Bancos",
  "Segurança",
  "Imobiliárias",
];

/* =========================
   4) UTILITÁRIOS
   ========================= */
const $ = (id) => document.getElementById(id);

function waLink(numero, texto) {
  const msg = encodeURIComponent(texto);
  return `https://wa.me/${numero}?text=${msg}`;
}

function copyText(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => alert("Contacto copiado: " + text))
    .catch(() => prompt("Copie manualmente:", text));
}

function normalizeWhatsApp(value) {
  return String(value || "").replace(/\D/g, "");
}

/* =========================
   5) STORAGE (fallback)
   ========================= */
const Storage = {
  getEmpresas() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY_EMPRESAS);
      if (!raw) return null;
      const empresas = JSON.parse(raw);
      return Array.isArray(empresas) ? empresas : null;
    } catch {
      return null;
    }
  },

  setEmpresas(empresas) {
    try {
      localStorage.setItem(
        CONFIG.STORAGE_KEY_EMPRESAS,
        JSON.stringify(empresas),
      );
    } catch {}
  },
};

/* =========================
   6) API (Render)
   ========================= */
const Api = {
  async listarEmpresas() {
    const url = `${CONFIG.API_BASE}/empresas`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("Falha ao buscar empresas");
    const data = await r.json();
    return Array.isArray(data.empresas) ? data.empresas : [];
  },
};

/* =========================
   7) REPOSITÓRIO (fonte de dados)
   - tenta API
   - se falhar, usa localStorage
   - se não tiver, usa padrão
   ========================= */
const EmpresasRepo = {
  async carregar() {
    // 1) tenta API
    try {
      const empresas = await Api.listarEmpresas();
      // opcional: cache local
      Storage.setEmpresas(empresas);
      return empresas.filter((e) => e.ativo !== false);
    } catch (e) {
      console.warn("⚠️ API indisponível, usando fallback:", e.message);
    }

    // 2) tenta localStorage
    const local = Storage.getEmpresas();
    if (local && local.length) {
      return local.filter((e) => e.ativo !== false);
    }

    // 3) fallback padrão
    Storage.setEmpresas(EMPRESAS_PADRAO);
    return EMPRESAS_PADRAO;
  },
};

/* =========================
   8) RENDER (UI)
   ========================= */
const UI = {
  renderCategoriasOptions(selectId, includeTodas = true) {
    const sel = $(selectId);
    if (!sel) return;

    let html = includeTodas ? `<option value="">Todas as categorias</option>` : "";
    html += CATEGORIAS.map((c) => `<option value="${c}">${c}</option>`).join("");
    sel.innerHTML = html;
  },

  renderLista(targetId, items, limite = null) {
    const el = $(targetId);
    if (!el) return;

    let empresas = (items || [])
      .filter((e) => e.ativo !== false)
      .sort((a, b) => (b.destaque === true) - (a.destaque === true));

    if (limite) empresas = empresas.slice(0, limite);

    if (!empresas.length) {
      el.innerHTML = `
        <div class="card" style="text-align:center; padding:40px;">
          <p style="color: var(--muted);">Nenhuma empresa encontrada.</p>
        </div>
      `;
      return;
    }

    el.innerHTML = empresas
      .map((e, i) => {
        const badge = e.destaque
          ? `<span class="tag hot">⭐ Destaque</span>`
          : `<span class="tag">${e.categoria}</span>`;

        const wa = normalizeWhatsApp(e.whatsapp) || CONFIG.whatsappPadrao;
        const texto = `Olá! Vi a empresa "${e.nome}" no Guia de Negócios de Chimoio. Quero mais informações.`;

        return `
          <article class="item" style="animation-delay:${i * 0.05}s">
            <div class="top">
              <div>
                <div style="font-weight:800;font-size:16px">${e.nome}</div>
                <div class="meta">${e.categoria} • ${e.bairro}</div>
              </div>
              ${badge}
            </div>
            <div class="meta">📞 ${e.contacto || "-"} • ⏰ ${e.horario || "-"}</div>
            ${
              e.descricao
                ? `<div class="meta" style="margin-top:8px;">
                    ${String(e.descricao).substring(0, 100)}${String(e.descricao).length > 100 ? "..." : ""}
                   </div>`
                : ""
            }
            <div class="actions">
              <a class="btn green" target="_blank" href="${waLink(wa, texto)}">💬 WhatsApp</a>
              <button class="btn" type="button" onclick="copyText('${(e.contacto || "").replace(/'/g, "\\'")}')">📋 Copiar</button>
              <a class="btn" href="empresa.html?id=${e.id}">ℹ️ Ver mais</a>
            </div>
          </article>
        `;
      })
      .join("");
  },

  filtrar(lista, q, cat) {
    const termo = (q || "").toLowerCase().trim();
    return (lista || [])
      .filter((e) => {
        const okCat = !cat || e.categoria === cat;
        const okQ =
          !termo ||
          String(e.nome || "").toLowerCase().includes(termo) ||
          String(e.bairro || "").toLowerCase().includes(termo) ||
          String(e.categoria || "").toLowerCase().includes(termo);
        return okCat && okQ && e.ativo !== false;
      })
      .sort((a, b) => (b.destaque === true) - (a.destaque === true));
  },

  atualizarKPI(empresas) {
    const list = empresas || [];
    const total = list.length;
    const destaque = list.filter((e) => e.destaque).length;
    const cats = new Set(list.map((e) => e.categoria)).size;
    const bairros = new Set(list.map((e) => e.bairro)).size;

    if ($("kpiTotal")) $("kpiTotal").textContent = total;
    if ($("kpiDestaque")) $("kpiDestaque").textContent = destaque;
    // compatibilidade com IDs diferentes (algumas páginas usam kpiCats ou kpiVip etc)
    if ($("kpiCats")) $("kpiCats").textContent = cats;
    if ($("kpiBairros")) $("kpiBairros").textContent = bairros;
  },
};

/* =========================
   9) PÁGINAS
   ========================= */
async function initHome() {
  const empresas = await EmpresasRepo.carregar();

  UI.renderCategoriasOptions("catHome", true);
  UI.atualizarKPI(empresas);

  const qEl = $("qHome");
  const cEl = $("catHome");

  const run = () => {
    const items = UI.filtrar(empresas, qEl?.value, cEl?.value);
    UI.renderLista("listaHome", items, CONFIG.LIMITE_HOME);
  };

  qEl?.addEventListener("input", run);
  cEl?.addEventListener("change", run);

  run();
}

async function initCategorias() {
  const empresas = await EmpresasRepo.carregar();

  UI.renderCategoriasOptions("catAll", true);

  const qEl = $("qAll");
  const cEl = $("catAll");

  const run = () => {
    const items = UI.filtrar(empresas, qEl?.value, cEl?.value);
    UI.renderLista("listaAll", items);
  };

  qEl?.addEventListener("input", run);
  cEl?.addEventListener("change", run);

  run();
}

/* =========================
   10) TEMA
   ========================= */
function initTheme() {
  const themeToggle = $("themeToggle");
  const themeIcon = $("themeIcon");
  const root = document.documentElement;
  if (!themeToggle) return;

  const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEY_THEME) || "dark";
  root.setAttribute("data-theme", savedTheme);
  if (themeIcon) themeIcon.textContent = savedTheme === "dark" ? "☀️" : "🌙";

  themeToggle.addEventListener("click", () => {
    const current = root.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem(CONFIG.STORAGE_KEY_THEME, next);
    if (themeIcon) themeIcon.textContent = next === "dark" ? "☀️" : "🌙";
  });
}

/* =========================
   11) BOOT
   ========================= */
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();

  // footer
  const anoEl = $("ano");
  if (anoEl) anoEl.textContent = new Date().getFullYear();

  const path = window.location.pathname.toLowerCase();

  // Heurística simples
  if (path.includes("categorias")) {
    await initCategorias();
  } else {
    // index / home
    await initHome();
  }
});

// Export global (se precisar em outras páginas)
window.GuiaChimoio = {
  EmpresasRepo,
  UI,
  CONFIG,
};
