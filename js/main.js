// ==========================================
// CONFIGURAÇÃO
// ==========================================
const CONFIG = {
  whatsapp: "258842043370",
  API: window.location.hostname === "localhost" 
    ? "http://localhost:3000/api" 
    : "https://SEU-SERVIDOR.onrender.com/api", // Substituir pelo URL real
  useBackend: true, // ⚠️ TRUE para sincronização entre dispositivos
  empresasKey: "guia_chimoio_empresas",
};

// ==========================================
// DADOS PADRÃO (fallback se API falhar)
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
// CARREGAR EMPRESAS DA API
// ==========================================
async function carregarEmpresas() {
  if (!CONFIG.useBackend) {
    // Fallback para localStorage (apenas teste local sem servidor)
    try {
      const data = localStorage.getItem(CONFIG.empresasKey);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.empresas || parsed;
      }
      return EMPRESAS_PADRAO;
    } catch (erro) {
      return EMPRESAS_PADRAO;
    }
  }

  try {
    const resposta = await fetch(`${CONFIG.API}/empresas`);
    const data = await resposta.json();
    if (data.success && data.empresas) {
      // Cache local para performance
      localStorage.setItem(CONFIG.empresasKey, JSON.stringify({
        empresas: data.empresas,
        cache_time: Date.now()
      }));
      return data.empresas.filter((e) => e.ativo !== false);
    }
    return EMPRESAS_PADRAO;
  } catch (erro) {
    console.error("⚠️ Erro ao carregar empresas da API, usando fallback:", erro.message);
    // Tentar cache local
    try {
      const cache = localStorage.getItem(CONFIG.empresasKey);
      if (cache) {
        const parsed = JSON.parse(cache);
        return parsed.empresas || EMPRESAS_PADRAO;
      }
    } catch (e) {}
    return EMPRESAS_PADRAO;
  }
}

// ==========================================
// SALVAR EMPRESA NA API
// ==========================================
async function salvarEmpresa(empresa) {
  if (!CONFIG.useBackend) {
    // Fallback localStorage
    let dados = JSON.parse(localStorage.getItem(CONFIG.empresasKey) || '{"empresas":[]}');
    if (empresa.id) {
      const index = dados.empresas.findIndex(e => e.id === empresa.id);
      if (index >= 0) dados.empresas[index] = empresa;
      else {
        empresa.id = Date.now();
        dados.empresas.push(empresa);
      }
    } else {
      empresa.id = Date.now();
      dados.empresas.push(empresa);
    }
    localStorage.setItem(CONFIG.empresasKey, JSON.stringify(dados));
    window.dispatchEvent(new Event("storage"));
    return { success: true, id: empresa.id };
  }

  try {
    const metodo = empresa.id ? "PUT" : "POST";
    const url = empresa.id 
      ? `${CONFIG.API}/empresas/${empresa.id}`
      : `${CONFIG.API}/empresas`;
    
    const resposta = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(empresa),
    });
    const resultado = await resposta.json();
    
    if (resultado.success) {
      // Atualizar cache local
      const empresas = await carregarEmpresas();
      window.dispatchEvent(new Event("empresas-atualizadas"));
    }
    
    return resultado;
  } catch (erro) {
    console.error("Erro ao salvar empresa:", erro);
    return { success: false, error: erro.message };
  }
}

// ==========================================
// EXCLUIR EMPRESA DA API
// ==========================================
async function excluirEmpresa(id) {
  if (!CONFIG.useBackend) {
    let dados = JSON.parse(localStorage.getItem(CONFIG.empresasKey) || '{"empresas":[]}');
    dados.empresas = dados.empresas.filter(e => e.id !== id);
    localStorage.setItem(CONFIG.empresasKey, JSON.stringify(dados));
    window.dispatchEvent(new Event("storage"));
    return { success: true };
  }

  try {
    const resposta = await fetch(`${CONFIG.API}/empresas/${id}`, {
      method: "DELETE",
    });
    const resultado = await resposta.json();
    
    if (resultado.success) {
      window.dispatchEvent(new Event("empresas-atualizadas"));
    }
    
    return resultado;
  } catch (erro) {
    console.error("Erro ao excluir empresa:", erro);
    return { success: false, error: erro.message };
  }
}

// ==========================================
// CATEGORIAS
// ==========================================
const CATEGORIAS = [
  "Restaurantes", "Farmácias", "Oficinas", "Escolas", "Clínicas",
  "Supermercados", "Salões de Beleza", "Alfaiatarias", 
  "Materiais de Construção", "Transportes", "Hotéis", "ONGs",
  "Associação", "Serviços de Informática", "Eletrodomésticos",
  "Eventos & Decoração", "Bancos", "Segurança", "Imobiliárias",
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

  let empresas = items
    .filter((e) => e.ativo !== false)
    .sort((a, b) => (b.destaque === true) - (a.destaque === true));

  if (limite) {
    empresas = empresas.slice(0, limite);
  }

  if (empresas.length === 0) {
    el.innerHTML = `<div class="card" style="text-align: center; padding: 40px;">
      <p style="color: var(--muted);">Nenhuma empresa encontrada.</p>
    </div>`;
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
      const okQ = !q ||
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
async function atualizarKPI() {
  try {
    const resposta = await fetch(`${CONFIG.API}/estatisticas`);
    const data = await resposta.json();
    
    if (data.success && data.estatisticas) {
      const stats = data.estatisticas;
      if ($("kpiTotal")) $("kpiTotal").textContent = stats.total_empresas;
      if ($("kpiDestaque")) $("kpiDestaque").textContent = stats.empresas_destaque;
      if ($("kpiCats")) $("kpiCats").textContent = stats.categorias;
      if ($("kpiBairros")) $("kpiBairros").textContent = stats.bairros;
    }
  } catch (erro) {
    console.log("Usando KPI local");
  }
}

// ==========================================
// INICIALIZAR HOME
// ==========================================
async function initHome() {
  const empresas = await carregarEmpresas();
  renderCategoriasOptions("catHome");
  atualizarKPI();

  const qEl = $("qHome");
  const cEl = $("catHome");

  const run = () => {
    const items = filtrar(empresas, qEl?.value, cEl?.value);
    renderLista("listaHome", items, 10);
  };

  qEl?.addEventListener("input", run);
  cEl?.addEventListener("change", run);

  // Recarregar quando empresas forem atualizadas
  window.addEventListener("empresas-atualizadas", () => {
    console.log("🔄 Empresas atualizadas no servidor, recarregando...");
    location.reload();
  });

  run();
}

// ==========================================
// INICIALIZAR CATEGORIAS
// ==========================================
async function initCategorias() {
  const empresas = await carregarEmpresas();
  renderCategoriasOptions("catAll");

  const qEl = $("qAll");
  const cEl = $("catAll");

  const run = () => {
    const items = filtrar(empresas, qEl?.value, cEl?.value);
    renderLista("listaAll", items);
  };

  qEl?.addEventListener("input", run);
  cEl?.addEventListener("change", run);

  window.addEventListener("empresas-atualizadas", () => {
    location.reload();
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
  } else if (path.includes("empresa.html")) {
    initEmpresaDetalhe();
  }

  const anoEl = document.getElementById("ano");
  if (anoEl) anoEl.textContent = new Date().getFullYear();
});

// ==========================================
// PÁGINA DE DETALHES DA EMPRESA
// ==========================================
async function initEmpresaDetalhe() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  
  if (!id) {
    window.location.href = "index.html";
    return;
  }

  try {
    const resposta = await fetch(`${CONFIG.API}/empresas/${id}`);
    const data = await resposta.json();
    
    if (data.success && data.empresa) {
      renderEmpresaDetalhe(data.empresa);
    } else {
      $("empresaNome").textContent = "Empresa não encontrada";
    }
  } catch (erro) {
    console.error("Erro ao carregar empresa:", erro);
  }
}

function renderEmpresaDetalhe(empresa) {
  if ($("empresaNome")) $("empresaNome").textContent = empresa.nome;
  if ($("empresaCategoria")) $("empresaCategoria").textContent = empresa.categoria;
  if ($("empresaBairro")) $("empresaBairro").textContent = empresa.bairro;
  if ($("empresaContacto")) $("empresaContacto").textContent = empresa.contacto;
  if ($("empresaHorario")) $("empresaHorario").textContent = empresa.horario;
  if ($("empresaDescricao")) $("empresaDescricao").textContent = empresa.descricao;
}

// Exportar para uso global
window.GuiaChimoio = {
  carregarEmpresas,
  salvarEmpresa,
  excluirEmpresa,
  CONFIG,
};
