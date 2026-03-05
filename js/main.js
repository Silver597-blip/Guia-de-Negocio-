// ==========================================
// CONFIGURAÇÃO
// ==========================================
const CONFIG = {
  whatsapp: "258842043370",
  empresasKey: "Guia de Negocio",
};

// ==========================================
// DADOS PADRÃO (empresas de exemplo)
// ==========================================
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

// ==========================================
// CARREGAR EMPRESAS
// ==========================================
function carregarEmpresas() {
  try {
    // Tentar carregar do localStorage
    const salvas = localStorage.getItem(CONFIG.empresasKey);

    if (salvas) {
      const empresas = JSON.parse(salvas);
      // Filtrar apenas ativas
      return empresas.filter((e) => e.ativo !== false);
    }

    // Se não houver no localStorage, salvar padrão e retornar
    localStorage.setItem(CONFIG.empresasKey, JSON.stringify(EMPRESAS_PADRAO));
    return EMPRESAS_PADRAO;
  } catch (error) {
    console.error("Erro ao carregar empresas:", error);
    return EMPRESAS_PADRAO;
  }
}

// ==========================================
// CATEGORIAS
// ==========================================
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

// ==========================================
// UTILITÁRIOS
// ==========================================
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

function formatarData(dataString) {
  if (!dataString) return "-";
  const data = new Date(dataString);
  return data.toLocaleDateString("pt-BR");
}

// ==========================================
// RENDERIZAR LISTA DE EMPRESAS
// ==========================================
function renderLista(targetId, items, limite = null) {
  const el = $(targetId);
  if (!el) return;

  // Filtrar apenas ativas e ordenar (destaque primeiro)
  let empresas = items
    .filter((e) => e.ativo !== false)
    .sort((a, b) => (b.destaque === true) - (a.destaque === true));

  // Aplicar limite se especificado
  if (limite) {
    empresas = empresas.slice(0, limite);
  }

  if (empresas.length === 0) {
    el.innerHTML = `
      <div class="card" style="text-align: center; padding: 40px;">
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

      const wa = e.whatsapp || CONFIG.whatsapp;
      const texto = `Olá! Vi a empresa "${e.nome}" no Guia de Negócios de Chimoio. Quero mais informações.`;

      return `
      <article class="item" style="animation-delay: ${i * 0.05}s">
        <div class="top">
          <div>
            <div style="font-weight:800;font-size:16px">${e.nome}</div>
            <div class="meta">${e.categoria} • ${e.bairro}</div>
          </div>
          ${badge}
        </div>
        <div class="meta">📞 ${e.contacto} • ⏰ ${e.horario}</div>
        ${e.descricao ? `<div class="meta" style="margin-top: 8px;">${e.descricao.substring(0, 100)}${e.descricao.length > 100 ? "..." : ""}</div>` : ""}
        <div class="actions">
          <a class="btn green" target="_blank" href="${waLink(wa, texto)}">💬 WhatsApp</a>
          <button class="btn" onclick="copyText('${e.contacto}')">📋 Copiar</button>
          <a class="btn" href="empresa.html?id=${e.id}">ℹ️ Ver mais</a>
        </div>
      </article>
    `;
    })
    .join("");
}

// ==========================================
// RENDERIZAR OPÇÕES DE CATEGORIA
// ==========================================
function renderCategoriasOptions(selectId, todas = true) {
  const sel = $(selectId);
  if (!sel) return;

  let html = todas ? `<option value="">Todas as categorias</option>` : "";
  html += CATEGORIAS.map((c) => `<option value="${c}">${c}</option>`).join("");
  sel.innerHTML = html;
}

// ==========================================
// FILTRAR EMPRESAS
// ==========================================
function filtrar(lista, q, cat) {
  q = (q || "").toLowerCase().trim();
  return lista
    .filter((e) => {
      const okCat = !cat || e.categoria === cat;
      const okQ =
        !q ||
        e.nome.toLowerCase().includes(q) ||
        e.bairro.toLowerCase().includes(q) ||
        e.categoria.toLowerCase().includes(q);
      return okCat && okQ && e.ativo !== false;
    })
    .sort((a, b) => (b.destaque === true) - (a.destaque === true));
}

// ==========================================
// ATUALIZAR KPIs
// ==========================================
function atualizarKPI() {
  const empresas = carregarEmpresas();
  const total = empresas.length;
  const destaque = empresas.filter((e) => e.destaque).length;
  const cats = new Set(empresas.map((e) => e.categoria)).size;
  const bairros = new Set(empresas.map((e) => e.bairro)).size;

  if ($("kpiTotal")) $("kpiTotal").textContent = total;
  if ($("kpiDestaque")) $("kpiDestaque").textContent = destaque;
  if ($("kpiCats")) $("kpiCats").textContent = cats;
  if ($("kpiBairros")) $("kpiBairros").textContent = bairros;
}

// ==========================================
// INICIALIZAR HOME
// ==========================================
function initHome() {
  const empresas = carregarEmpresas();

  renderCategoriasOptions("catHome");
  atualizarKPI();

  const qEl = $("qHome");
  const cEl = $("catHome");

  const run = () => {
    const items = filtrar(empresas, qEl?.value, cEl?.value);
    renderLista("listaHome", items, 10); // Mostrar apenas 10 na home
  };

  qEl?.addEventListener("input", run);
  cEl?.addEventListener("change", run);

  // Atualizar quando houver mudanças no storage
  window.addEventListener("storage", (e) => {
    if (e.key === CONFIG.empresasKey) {
      console.log("🔄 Empresas atualizadas, recarregando...");
      location.reload();
    }
  });

  run();
}

// ==========================================
// INICIALIZAR CATEGORIAS
// ==========================================
function initCategorias() {
  const empresas = carregarEmpresas();

  renderCategoriasOptions("catAll");

  const qEl = $("qAll");
  const cEl = $("catAll");

  const run = () => {
    const items = filtrar(empresas, qEl?.value, cEl?.value);
    renderLista("listaAll", items);
  };

  qEl?.addEventListener("input", run);
  cEl?.addEventListener("change", run);

  // Atualizar quando houver mudanças
  window.addEventListener("storage", (e) => {
    if (e.key === CONFIG.empresasKey) {
      location.reload();
    }
  });

  run();
}

// ==========================================
// TEMA
// ==========================================
function initTheme() {
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const root = document.documentElement;

  if (!themeToggle) return;

  const savedTheme = localStorage.getItem("theme") || "dark";
  root.setAttribute("data-theme", savedTheme);
  if (themeIcon) themeIcon.textContent = savedTheme === "dark" ? "☀️" : "🌙";

  themeToggle.addEventListener("click", () => {
    const current = root.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    if (themeIcon) themeIcon.textContent = next === "dark" ? "☀️" : "🌙";
  });
}

// ==========================================
// INICIALIZAÇÃO GERAL
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initTheme();

  const path = window.location.pathname;

  if (path.includes("index") || path === "/" || path.endsWith("/")) {
    initHome();
  } else if (path.includes("categorias")) {
    initCategorias();
  }

  // Atualizar ano no footer
  const anoEl = document.getElementById("ano");
  if (anoEl) anoEl.textContent = new Date().getFullYear();
});

// Exportar para uso global
window.GuiaChimoio = {
  carregarEmpresas,
  CONFIG,
};
