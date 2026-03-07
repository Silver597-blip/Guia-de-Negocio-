const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos (frontend)
app.use(express.static(path.join(__dirname, "public")));

// Caminhos dos arquivos de dados
const DATA_DIR = path.join(__dirname, "data");
const EMPRESAS_FILE = path.join(DATA_DIR, "empresas.json");
const MENSAGENS_FILE = path.join(DATA_DIR, "mensagens.json");
const PAGAMENTOS_FILE = path.join(DATA_DIR, "pagamentos.json");

// Garantir que a pasta data existe
async function garantirDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {
    console.log("Pasta data já existe");
  }
}

// Ler arquivo JSON
async function lerJSON(arquivo) {
  try {
    await garantirDataDir();
    const conteudo = await fs.readFile(arquivo, "utf8");
    return JSON.parse(conteudo);
  } catch (e) {
    // Retorna estrutura vazia se arquivo não existir
    if (arquivo.includes("empresas")) {
      return { meta: {}, empresas: [] };
    } else if (arquivo.includes("mensagens")) {
      return { meta: {}, mensagens: [] };
    } else if (arquivo.includes("pagamentos")) {
      return { meta: {}, pagamentos: [] };
    }
    return {};
  }
}

// Escrever arquivo JSON
async function escreverJSON(arquivo, dados) {
  await garantirDataDir();
  await fs.writeFile(arquivo, JSON.stringify(dados, null, 2));
}

// ==========================================
// ROTAS DE EMPRESAS
// ==========================================

// Listar todas as empresas
app.get("/api/empresas", async (req, res) => {
  try {
    const dados = await lerJSON(EMPRESAS_FILE);
    res.json({ 
      success: true, 
      empresas: dados.empresas || [],
      meta: dados.meta || {}
    });
  } catch (erro) {
    res.status(500).json({ success: false, error: erro.message });
  }
});

// Buscar empresa por ID
app.get("/api/empresas/:id", async (req, res) => {
  try {
    const dados = await lerJSON(EMPRESAS_FILE);
    const empresa = dados.empresas.find(e => e.id == req.params.id);
    if (empresa) {
      res.json({ success: true, empresa });
    } else {
      res.status(404).json({ success: false, error: "Empresa não encontrada" });
    }
  } catch (erro) {
    res.status(500).json({ success: false, error: erro.message });
  }
});

// Criar nova empresa
app.post("/api/empresas", async (req, res) => {
  try {
    const dados = await lerJSON(EMPRESAS_FILE);
    const novaEmpresa = {
      id: Date.now(),
      ...req.body,
      data_cadastro: new Date().toISOString(),
      ativo: req.body.ativo !== undefined ? req.body.ativo : true,
      destaque: req.body.destaque || false,
    };
    
    dados.empresas = dados.empresas || [];
    dados.empresas.push(novaEmpresa);
    
    dados.meta = {
      ...dados.meta,
      total_empresas: dados.empresas.length,
      ultima_atualizacao: new Date().toISOString(),
    };
    
    await escreverJSON(EMPRESAS_FILE, dados);
    res.json({ success: true, id: novaEmpresa.id, empresa: novaEmpresa });
  } catch (erro) {
    res.status(500).json({ success: false, error: erro.message });
  }
});

// Atualizar empresa
app.put("/api/empresas/:id", async (req, res) => {
  try {
    const dados = await lerJSON(EMPRESAS_FILE);
    const index = dados.empresas.findIndex(e => e.id == req.params.id);
    
    if (index >= 0) {
      dados.empresas[index] = { 
        ...dados.empresas[index], 
        ...req.body,
        data_atualizacao: new Date().toISOString()
      };
      
      dados.meta = {
        ...dados.meta,
        ultima_atualizacao: new Date().toISOString(),
      };
      
      await escreverJSON(EMPRESAS_FILE, dados);
      res.json({ success: true, empresa: dados.empresas[index] });
    } else {
      res.status(404).json({ success: false, error: "Empresa não encontrada" });
    }
  } catch (erro) {
    res.status(500).json({ success: false, error: erro.message });
  }
});

// Excluir empresa
app.delete("/api/empresas/:id", async (req, res) => {
  try {
    const dados = await lerJSON(EMPRESAS_FILE);
    const antes = dados.empresas.length;
    dados.empresas = dados.empresas.filter(e => e.id != req.params.id);
    
    if (dados.empresas.length < antes) {
      dados.meta = {
        ...dados.meta,
        total_empresas: dados.empresas.length,
        ultima_atualizacao: new Date().toISOString(),
      };
      
      await escreverJSON(EMPRESAS_FILE, dados);
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: "Empresa não encontrada" });
    }
  } catch (erro) {
    res.status(500).json({ success: false, error: erro.message });
  }
});

// ==========================================
// ROTAS DE MENSAGENS
// ==========================================

app.get("/api/mensagens", async (req, res) => {
  try {
    const dados = await lerJSON(MENSAGENS_FILE);
    res.json({ success: true, mensagens: dados.mensagens || [], meta: dados.meta || {} });
  } catch (erro) {
    res.json({ success: true, mensagens: [], meta: {} });
  }
});

app.post("/api/mensagens", async (req, res) => {
  try {
    const dados = await lerJSON(MENSAGENS_FILE);
    const mensagem = {
      id: Date.now(),
      ...req.body,
      data_envio: new Date().toISOString(),
      lida: false,
      respondida: false,
      ip: req.ip,
    };
    
    dados.mensagens = dados.mensagens || [];
    dados.mensagens.unshift(mensagem);
    
    dados.meta = {
      ...dados.meta,
      total_mensagens: dados.mensagens.length,
      nao_lidas: dados.mensagens.filter(m => !m.lida).length,
      ultima_atualizacao: new Date().toISOString(),
    };
    
    await escreverJSON(MENSAGENS_FILE, dados);
    res.json({ success: true, id: mensagem.id });
  } catch (erro) {
    res.status(500).json({ success: false, error: erro.message });
  }
});

app.put("/api/mensagens/:id", async (req, res) => {
  try {
    const dados = await lerJSON(MENSAGENS_FILE);
    const index = dados.mensagens.findIndex(m => m.id == req.params.id);
    
    if (index >= 0) {
      dados.mensagens[index] = { ...dados.mensagens[index], ...req.body };
      await escreverJSON(MENSAGENS_FILE, dados);
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: "Não encontrado" });
    }
  } catch (erro) {
    res.status(500).json({ success: false, error: erro.message });
  }
});

// ==========================================
// ROTAS DE PAGAMENTOS
// ==========================================

app.get("/api/pagamentos", async (req, res) => {
  try {
    const dados = await lerJSON(PAGAMENTOS_FILE);
    res.json({ success: true, pagamentos: dados.pagamentos || [] });
  } catch (erro) {
    res.json({ success: true, pagamentos: [] });
  }
});

app.post("/api/pagamentos", async (req, res) => {
  try {
    const dados = await lerJSON(PAGAMENTOS_FILE);
    const pagamento = {
      id: Date.now(),
      ...req.body,
      data_registro: new Date().toISOString(),
    };
    
    dados.pagamentos = dados.pagamentos || [];
    dados.pagamentos.push(pagamento);
    
    await escreverJSON(PAGAMENTOS_FILE, dados);
    res.json({ success: true, id: pagamento.id });
  } catch (erro) {
    res.status(500).json({ success: false, error: erro.message });
  }
});

// ==========================================
// ESTATÍSTICAS GERAIS
// ==========================================

app.get("/api/estatisticas", async (req, res) => {
  try {
    const empresasData = await lerJSON(EMPRESAS_FILE);
    const mensagensData = await lerJSON(MENSAGENS_FILE);
    const pagamentosData = await lerJSON(PAGAMENTOS_FILE);
    
    const empresas = empresasData.empresas || [];
    const estatisticas = {
      total_empresas: empresas.length,
      empresas_ativas: empresas.filter(e => e.ativo !== false).length,
      empresas_destaque: empresas.filter(e => e.destaque).length,
      total_mensagens: (mensagensData.mensagens || []).length,
      mensagens_nao_lidas: (mensagensData.mensagens || []).filter(m => !m.lida).length,
      categorias: new Set(empresas.map(e => e.categoria)).size,
      bairros: new Set(empresas.map(e => e.bairro)).size,
      planos: {
        basico: empresas.filter(e => e.plano === "basico").length,
        pro: empresas.filter(e => e.plano === "pro").length,
        destaque: empresas.filter(e => e.plano === "destaque").length,
        vip: empresas.filter(e => e.plano === "vip").length,
      }
    };
    
    res.json({ success: true, estatisticas });
  } catch (erro) {
    res.status(500).json({ success: false, error: erro.message });
  }
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║  🚀 Servidor Guia de Negócios de Chimoio  ║
╠════════════════════════════════════════════╣
║  📍 API: http://localhost:${PORT}/api          ║
║  🌐 Site: http://localhost:${PORT}             ║
║  💾 Dados: ./data/                         ║
╚════════════════════════════════════════════╝
  `);
});
