// ... (código anterior mantido) ...

// Estado global expandido
let adminState = {
  currentUser: null,
  empresas: [],
  pagamentos: [],
  mensagens: [],
  mensagensFiltro: "todas",
  mensagemSelecionada: null,
  logs: [],
  filtros: {
    status: "todos",
    plano: "todos",
    busca: "",
  },
};

// Inicialização expandida
function initAdmin() {
  initLogin();
  loadEmpresas();
  loadMensagens(); // NOVO
  initSidebar();
  initTheme();
  initNotifications();

  // Inicializar páginas específicas
  if (document.getElementById("dashboardStats")) initDashboard();
  if (document.getElementById("empresasTable")) initEmpresasPage();
  if (document.getElementById("pagamentosTable")) initPagamentosPage();
  if (document.getElementById("chartPlanos")) initEstatisticasPage();
  if (document.getElementById("listaMensagens")) initMensagensPage(); // NOVO
}

// ==================== SISTEMA DE MENSAGENS FUNCIONAL ====================

// Carregar mensagens do localStorage
function loadMensagens() {
  try {
    // Tentar carregar do localStorage
    const data = localStorage.getItem("guia_chimoio_mensagens");
    const mensagens = data ? JSON.parse(data) : [];

    // Se não houver mensagens, usar dados de exemplo
    if (mensagens.length === 0) {
      adminState.mensagens = getMensagensExemplo();
      // Salvar exemplos para teste
      localStorage.setItem(
        "guia_chimoio_mensagens",
        JSON.stringify(adminState.mensagens),
      );
    } else {
      adminState.mensagens = mensagens;
    }

    updateContadorMensagens();

    // Configurar listener para novas mensagens
    window.addEventListener("storage", (e) => {
      if (e.key === "guia_chimoio_mensagens") {
        console.log("Nova mensagem detectada!");
        loadMensagensFromStorage();
        showNotification("📨 Nova mensagem recebida!", "info");
      }
    });
  } catch (error) {
    console.error("Erro ao carregar mensagens:", error);
    adminState.mensagens = getMensagensExemplo();
  }
}

// Recarregar do storage (quando outra aba envia mensagem)
function loadMensagensFromStorage() {
  try {
    const data = localStorage.getItem("guia_chimoio_mensagens");
    if (data) {
      adminState.mensagens = JSON.parse(data);
      updateContadorMensagens();

      // Se estiver na página de mensagens, atualizar view
      if (document.getElementById("listaMensagens")) {
        renderEstatisticasMensagens();
        renderListaMensagens();
        if (adminState.mensagemSelecionada) {
          const atualizada = adminState.mensagens.find(
            (m) => m.id === adminState.mensagemSelecionada.id,
          );
          if (atualizada) {
            renderDetalheMensagem(atualizada);
          }
        }
      }
    }
  } catch (e) {
    console.error("Erro ao recarregar mensagens:", e);
  }
}

// Mensagens de exemplo
function getMensagensExemplo() {
  return [
    {
      id: 1705672800000,
      nome: "Carlos Manuel",
      email: "carlos.manuel@email.com",
      telefone: "+258 84 123 4567",
      assunto: "Quero anunciar minha empresa",
      mensagem:
        "Olá, tenho um restaurante no bairro Vila Nova e gostaria de saber mais sobre os planos de anúncio. Qual o procedimento para cadastrar?",
      data_envio: new Date(Date.now() - 3600000).toISOString(),
      lida: false,
      respondida: false,
      prioridade: "alta",
      origem: "formulario_contato",
      ip: "192.168.1.100",
    },
  ];
}

// Atualizar contador de mensagens
function updateContadorMensagens() {
  const naoLidas = adminState.mensagens.filter((m) => !m.lida).length;
  const total = adminState.mensagens.length;

  // Atualizar em todos os lugares
  const badges = [
    document.getElementById("menuBadge"),
    document.getElementById("headerBadge"),
    document.getElementById("notifCount"),
  ];

  badges.forEach((badge) => {
    if (badge) {
      if (naoLidas > 0) {
        badge.textContent = naoLidas > 99 ? "99+" : naoLidas;
        badge.style.display = "inline-flex";
      } else {
        badge.style.display = "none";
      }
    }
  });

  // Atualizar título da página
  if (naoLidas > 0 && !window.location.pathname.includes("mensagens.html")) {
    const tituloBase = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = `(${naoLidas}) ${tituloBase}`;
  } else {
    document.title = document.title.replace(/^\(\d+\)\s*/, "");
  }

  console.log(`Contador atualizado: ${naoLidas} não lidas de ${total} total`);
}

// Salvar mensagens no storage (para persistência)
function saveMensagensToStorage() {
  try {
    localStorage.setItem(
      "guia_chimoio_mensagens",
      JSON.stringify(adminState.mensagens),
    );
    atualizarMetaMensagens();
  } catch (e) {
    console.error("Erro ao salvar mensagens:", e);
  }
}

// Atualizar metadata
function atualizarMetaMensagens() {
  const meta = {
    total: adminState.mensagens.length,
    nao_lidas: adminState.mensagens.filter((m) => !m.lida).length,
    pendentes: adminState.mensagens.filter((m) => !m.respondida).length,
    ultima_atualizacao: new Date().toISOString(),
  };
  localStorage.setItem("guia_chimoio_mensagens_meta", JSON.stringify(meta));
  return meta;
}

// Inicializar página de mensagens
function initMensagensPage() {
  renderEstatisticasMensagens();
  renderListaMensagens();

  // Atualizar a cada 5 segundos (para detectar mensagens de outras abas)
  setInterval(() => {
    loadMensagensFromStorage();
  }, 5000);
}

// Render estatísticas
function renderEstatisticasMensagens() {
  const total = adminState.mensagens.length;
  const naoLidas = adminState.mensagens.filter((m) => !m.lida).length;
  const pendentes = adminState.mensagens.filter((m) => !m.respondida).length;
  const respondidas = adminState.mensagens.filter((m) => m.respondida).length;

  const elements = {
    statTotal: document.getElementById("statTotal"),
    statNaoLidas: document.getElementById("statNaoLidas"),
    statPendentes: document.getElementById("statPendentes"),
    statRespondidas: document.getElementById("statRespondidas"),
  };

  if (elements.statTotal) elements.statTotal.textContent = total;
  if (elements.statNaoLidas) elements.statNaoLidas.textContent = naoLidas;
  if (elements.statPendentes) elements.statPendentes.textContent = pendentes;
  if (elements.statRespondidas)
    elements.statRespondidas.textContent = respondidas;
}

// Render lista de mensagens
function renderListaMensagens() {
  const container = document.getElementById("listaMensagens");
  if (!container) return;

  let mensagens = [...adminState.mensagens]; // Cópia para não alterar original

  // Aplicar filtros
  if (adminState.mensagensFiltro === "nao-lidas") {
    mensagens = mensagens.filter((m) => !m.lida);
  } else if (adminState.mensagensFiltro === "pendentes") {
    mensagens = mensagens.filter((m) => !m.respondida);
  }

  if (mensagens.length === 0) {
    container.innerHTML = `
      <div style="padding: 60px 20px; text-align: center; color: var(--muted);">
        <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;">📭</div>
        <p>Nenhuma mensagem encontrada</p>
      </div>
    `;
    return;
  }

  container.innerHTML = mensagens
    .map((m) => {
      const data = new Date(m.data_envio);
      const dataFormatada = formatarDataRelativa(data);
      const iniciais = m.nome
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

      const prioridadeClasses = {
        urgente: "badge-urgente",
        alta: "badge-alta",
        media: "badge-media",
        baixa: "badge-baixa",
      };
      const prioridadeClass = prioridadeClasses[m.prioridade] || "badge-media";

      return `
      <div class="mensagem-item ${!m.lida ? "nao-lida" : ""} ${adminState.mensagemSelecionada?.id === m.id ? "active" : ""}" 
           onclick="selecionarMensagem(${m.id})">
        <div class="mensagem-preview-header">
          <span class="mensagem-preview-nome">${escapeHtml(m.nome)}</span>
          <span class="mensagem-preview-data">${dataFormatada}</span>
        </div>
        <div class="mensagem-preview-assunto">${getIconeAssunto(m.assunto)} ${escapeHtml(m.assunto)}</div>
        <div class="mensagem-preview-texto">${escapeHtml(m.mensagem)}</div>
        <div style="margin-top: 8px;">
          <span class="mensagem-preview-badge ${prioridadeClass}">${m.prioridade.toUpperCase()}</span>
          ${m.respondida ? '<span style="margin-left: 8px; font-size: 11px; color: var(--success);">✓ Respondida</span>' : ""}
        </div>
      </div>
    `;
    })
    .join("");
}

// Selecionar mensagem
function selecionarMensagem(id) {
  const mensagem = adminState.mensagens.find((m) => m.id === id);
  if (!mensagem) return;

  adminState.mensagemSelecionada = mensagem;

  // Marcar como lida
  if (!mensagem.lida) {
    mensagem.lida = true;
    saveMensagensToStorage();
    updateContadorMensagens();
    renderEstatisticasMensagens();
  }

  renderListaMensagens();
  renderDetalheMensagem(mensagem);
}

// Render detalhe
function renderDetalheMensagem(m) {
  const container = document.getElementById("mensagemDetalhe");
  if (!container) return;

  const data = new Date(m.data_envio);
  const dataFormatada = data.toLocaleString("pt-BR");
  const iniciais = m.nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const prioridadeClasses = {
    urgente: "badge-urgente",
    alta: "badge-alta",
    media: "badge-media",
    baixa: "badge-baixa",
  };

  let html = `
    <div class="mensagem-detalhe-header">
      <div class="mensagem-detalhe-meta">
        <div class="mensagem-detalhe-autor">
          <div class="mensagem-avatar">${iniciais}</div>
          <div class="mensagem-detalhe-info">
            <h4>${escapeHtml(m.nome)}</h4>
            <p>📧 ${escapeHtml(m.email)} • 📱 ${escapeHtml(m.telefone)}</p>
          </div>
        </div>
        <div class="mensagem-detalhe-badges">
          <span class="mensagem-preview-badge ${prioridadeClasses[m.prioridade]}">${m.prioridade.toUpperCase()}</span>
          ${m.respondida ? '<span class="mensagem-preview-badge" style="background: rgba(16, 185, 129, 0.1); color: var(--success);">RESPONDIDA</span>' : ""}
        </div>
      </div>
      <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px;">
        <span style="font-size: 13px; color: var(--muted);">📅 ${dataFormatada}</span>
        ${m.ip ? `<span style="font-size: 13px; color: var(--muted);">🌐 ${m.ip}</span>` : ""}
        <span style="font-size: 13px; color: var(--muted);">📍 ${m.origem}</span>
      </div>
    </div>
    
    <div class="mensagem-conteudo">
      <div class="mensagem-conteudo-box">
        <h5>Assunto: ${getIconeAssunto(m.assunto)} ${escapeHtml(m.assunto)}</h5>
        <p>${escapeHtml(m.mensagem).replace(/\n/g, "<br>")}</p>
      </div>
  `;

  if (m.respondida && m.resposta) {
    const dataResposta = m.data_resposta
      ? new Date(m.data_resposta).toLocaleString("pt-BR")
      : "";
    html += `
      <div class="mensagem-historico">
        <div class="mensagem-historico-header">✅ Sua resposta ${dataResposta ? `• ${dataResposta}` : ""}</div>
        <div class="mensagem-historico-texto">${escapeHtml(m.resposta).replace(/\n/g, "<br>")}</div>
      </div>
    `;
  }

  html += `</div>`;

  if (!m.respondida) {
    html += `
      <div class="mensagem-resposta">
        <div class="mensagem-resposta-header">
          <h4>📝 Responder Mensagem</h4>
          <button class="btn btn-outline" onclick="marcarRespondido(${m.id})" style="padding: 6px 12px; font-size: 12px;">
            ✓ Já respondi (WhatsApp/Email)
          </button>
        </div>
        <form class="mensagem-resposta-form" onsubmit="responderMensagemSubmit(event, ${m.id})">
          <textarea id="respostaTexto" placeholder="Digite sua resposta aqui..." required></textarea>
          <div class="mensagem-resposta-actions">
            <a href="mailto:${encodeURIComponent(m.email)}?subject=Re: ${encodeURIComponent(m.assunto)}&body=Olá ${encodeURIComponent(m.nome)},%0D%0A%0D%0A" class="btn btn-outline">📧 Email</a>
            <a href="https://wa.me/${m.telefone.replace(/\D/g, "")}?text=Olá ${encodeURIComponent(m.nome)}, vimos sua mensagem no Guia de Chimoio." target="_blank" class="btn btn-green">💬 WhatsApp</a>
            <button type="submit" class="btn btn-primary">💾 Salvar Resposta</button>
          </div>
        </form>
      </div>
    `;
  } else {
    html += `
      <div style="padding: 16px; background: var(--bg); border-radius: 10px; text-align: center; color: var(--muted);">
        ✅ Esta mensagem já foi respondida
        <button class="btn btn-outline" style="margin-left: 12px;" onclick="reabrirMensagem(${m.id})">Reabrir</button>
      </div>
    `;
  }

  html += `
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--line); display: flex; gap: 12px; flex-wrap: wrap;">
      <button class="btn btn-outline" onclick="arquivarMensagem(${m.id})">🗃️ Arquivar</button>
      <select onchange="marcarPrioridade(${m.id}, this.value)" style="padding: 8px 12px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg); color: var(--text);">
        <option value="baixa" ${m.prioridade === "baixa" ? "selected" : ""}>🔵 Prioridade Baixa</option>
        <option value="media" ${m.prioridade === "media" ? "selected" : ""}>🟡 Prioridade Média</option>
        <option value="alta" ${m.prioridade === "alta" ? "selected" : ""}>🟠 Prioridade Alta</option>
        <option value="urgente" ${m.prioridade === "urgente" ? "selected" : ""}>🔴 Prioridade Urgente</option>
      </select>
      <button class="btn btn-red" onclick="excluirMensagem(${m.id})" style="margin-left: auto;">🗑️ Excluir</button>
    </div>
  `;

  container.innerHTML = html;
}

// Responder mensagem (submit do form)
function responderMensagemSubmit(event, id) {
  event.preventDefault();
  const resposta = document.getElementById("respostaTexto").value.trim();

  if (!resposta) {
    alert("Digite uma resposta!");
    return;
  }

  const mensagem = adminState.mensagens.find((m) => m.id === id);
  if (mensagem) {
    mensagem.respondida = true;
    mensagem.resposta = resposta;
    mensagem.data_resposta = new Date().toISOString();

    saveMensagensToStorage();
    renderEstatisticasMensagens();
    renderDetalheMensagem(mensagem);
    renderListaMensagens();
    showNotification("✅ Resposta salva com sucesso!", "success");
  }
}

// Marcar como respondido (sem texto)
function marcarRespondido(id) {
  const mensagem = adminState.mensagens.find((m) => m.id === id);
  if (mensagem) {
    mensagem.respondida = true;
    mensagem.resposta = "Respondido via WhatsApp/Email externo";
    mensagem.data_resposta = new Date().toISOString();

    saveMensagensToStorage();
    renderEstatisticasMensagens();
    renderDetalheMensagem(mensagem);
    renderListaMensagens();
    showNotification("✅ Marcado como respondido!", "success");
  }
}

// Reabrir mensagem
function reabrirMensagem(id) {
  const mensagem = adminState.mensagens.find((m) => m.id === id);
  if (mensagem) {
    mensagem.respondida = false;
    mensagem.resposta = null;
    mensagem.data_resposta = null;

    saveMensagensToStorage();
    renderEstatisticasMensagens();
    renderDetalheMensagem(mensagem);
    renderListaMensagens();
    showNotification("📨 Mensagem reaberta!", "info");
  }
}

// Marcar prioridade
function marcarPrioridade(id, prioridade) {
  const mensagem = adminState.mensagens.find((m) => m.id === id);
  if (mensagem) {
    mensagem.prioridade = prioridade;
    saveMensagensToStorage();
    renderDetalheMensagem(mensagem);
    renderListaMensagens();
    showNotification(`Prioridade alterada para ${prioridade}!`, "warning");
  }
}

// Arquivar mensagem
function arquivarMensagem(id) {
  const mensagem = adminState.mensagens.find((m) => m.id === id);
  if (mensagem) {
    mensagem.arquivada = true;
    saveMensagensToStorage();

    adminState.mensagemSelecionada = null;
    document.getElementById("mensagemDetalhe").innerHTML = `
      <div class="mensagem-detalhe-vazio">
        <span style="font-size: 48px; opacity: 0.3;">🗃️</span>
        <p>Mensagem arquivada</p>
      </div>
    `;
    renderListaMensagens();
    showNotification("🗃️ Mensagem arquivada!", "success");
  }
}

// Excluir mensagem
function excluirMensagem(id) {
  if (
    !confirm("⚠️ Tem certeza que deseja excluir esta mensagem permanentemente?")
  )
    return;

  adminState.mensagens = adminState.mensagens.filter((m) => m.id !== id);
  saveMensagensToStorage();

  if (adminState.mensagemSelecionada?.id === id) {
    adminState.mensagemSelecionada = null;
    document.getElementById("mensagemDetalhe").innerHTML = `
      <div class="mensagem-detalhe-vazio">
        <span style="font-size: 48px; opacity: 0.3;">✉️</span>
        <p>Selecione uma mensagem para visualizar</p>
      </div>
    `;
  }

  renderEstatisticasMensagens();
  renderListaMensagens();
  updateContadorMensagens();
  showNotification("🗑️ Mensagem excluída!", "success");
}

// Filtrar mensagens
function filtrarMensagens(filtro) {
  adminState.mensagensFiltro = filtro;

  document.querySelectorAll(".tab-filtro").forEach((tab) => {
    tab.classList.remove("active");
  });
  event.target.classList.add("active");

  renderListaMensagens();
}

// Utilitários
function getIconeAssunto(assunto) {
  const icones = {
    "Quero anunciar minha empresa": "📢",
    "Dúvida sobre pagamento": "💳",
    "Sugestão de melhoria": "💡",
    "Corrigir informação": "✏️",
    "Problema no site": "⚠️",
    Elogio: "⭐",
    Cancelamento: "❌",
    Outro: "📋",
    Dúvida: "❓",
  };
  return icones[assunto] || "📧";
}

function formatarDataRelativa(data) {
  const agora = new Date();
  const diff = agora - data;
  const minutos = Math.floor(diff / 60000);
  const horas = Math.floor(diff / 3600000);
  const dias = Math.floor(diff / 86400000);

  if (minutos < 1) return "Agora";
  if (minutos < 60) return `${minutos}min`;
  if (horas < 24) return `${horas}h`;
  if (dias < 7) return `${dias}d`;
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ==================== DASHBOARD ATUALIZADO ====================

function renderResumoMensagens() {
  const container = document.getElementById("resumoMensagensDashboard");
  if (!container) return;

  const naoLidas = adminState.mensagens.filter((m) => !m.lida).length;
  const pendentes = adminState.mensagens.filter((m) => !m.respondida).length;

  container.innerHTML = `
    <div class="stat-card" onclick="location.href='mensagens.html'" style="cursor: pointer;">
      <div class="stat-info">
        <h3 style="color: var(--accent);">${naoLidas}</h3>
        <p>Mensagens Novas</p>
        <span class="stat-change ${pendentes > 0 ? "negative" : "positive"}">
          ${pendentes} pendentes
        </span>
      </div>
      <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1);">✉️</div>
    </div>
  `;
}

// Exportar funções
window.selecionarMensagem = selecionarMensagem;
window.filtrarMensagens = filtrarMensagens;
window.responderMensagemSubmit = responderMensagemSubmit;
window.marcarRespondido = marcarRespondido;
window.reabrirMensagem = reabrirMensagem;
window.marcarPrioridade = marcarPrioridade;
window.arquivarMensagem = arquivarMensagem;
window.excluirMensagem = excluirMensagem;
