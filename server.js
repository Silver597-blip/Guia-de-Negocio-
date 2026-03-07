const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("guia-chimoio"));

const MENSAGENS_FILE = path.join(__dirname, "data", "mensagens.json");

// API: Receber mensagem do formulário
app.post("/api/mensagens", async (req, res) => {
  try {
    const mensagem = {
      id: Date.now(),
      ...req.body,
      data_envio: new Date().toISOString(),
      lida: false,
      respondida: false,
      ip: req.ip,
    };

    // Ler mensagens existentes
    let data = { mensagens: [] };
    try {
      const file = await fs.readFile(MENSAGENS_FILE, "utf8");
      data = JSON.parse(file);
    } catch (e) {}

    // Adicionar nova
    data.mensagens.unshift(mensagem);
    data.meta = {
      ...data.meta,
      total_mensagens: data.mensagens.length,
      ultima_atualizacao: new Date().toISOString(),
    };

    // Salvar
    await fs.writeFile(MENSAGENS_FILE, JSON.stringify(data, null, 2));

    res.json({ success: true, id: mensagem.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Listar mensagens (para admin)
app.get("/api/mensagens", async (req, res) => {
  try {
    const file = await fs.readFile(MENSAGENS_FILE, "utf8");
    const data = JSON.parse(file);
    res.json(data);
  } catch (error) {
    res.json({ mensagens: [] });
  }
});

// API: Atualizar mensagem
app.put("/api/mensagens/:id", async (req, res) => {
  try {
    const file = await fs.readFile(MENSAGENS_FILE, "utf8");
    const data = JSON.parse(file);

    const index = data.mensagens.findIndex((m) => m.id == req.params.id);
    if (index >= 0) {
      data.mensagens[index] = { ...data.mensagens[index], ...req.body };
      await fs.writeFile(MENSAGENS_FILE, JSON.stringify(data, null, 2));
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Não encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));
