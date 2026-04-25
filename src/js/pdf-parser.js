// src/js/pdf-parser.js
export class PDFParser {
  constructor() {
    this.pdfjsLib = window.pdfjsLib;
  }

  async extractText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = this.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Agrupar por posição Y para manter ordem correta
      const lines = new Map();
      for (const item of textContent.items) {
        const y = Math.round(item.transform[5]);
        if (!lines.has(y)) lines.set(y, []);
        lines.get(y).push(item.str);
      }

      const sortedY = Array.from(lines.keys()).sort((a, b) => a - b);
      for (const y of sortedY) {
        fullText += lines.get(y).join(" ") + "\n";
      }
      fullText += "\n";
    }

    return fullText;
  }

  async parseCapitalGains(file) {
    const text = await this.extractText(file);
    return this.extractCapitalGainsTables(text);
  }

  extractCapitalGainsTables(text) {
    // Usar regex global para encontrar todas as linhas da tabela 9.2A
    // Padrão: Nº País Código Ano Mês Dia Valor Ano Mês Dia Valor Despesas Imposto PaísContraparte SIM/NÃO
    // Exemplo: 951 250 G 2020 10 16 168.06 2021 5 7 115.02 0.00 0.00 620 SIM

    const pattern =
      /(\d{3})\s+(\d{3})\s+([A-Z]\d{2})\s+(\d{4})\s+(\d{1,2})\s+(\d{1,2})\s+([\d.,]+)\s+(\d{4})\s+(\d{1,2})\s+(\d{1,2})\s+([\d.,]+)(?:\s+([\d.,]+))?\s*(?:([\d.,]+))?\s*(\d{3})?\s*(SIM|NÃO)?/gi;

    const rows92A = [];
    let match;

    while ((match = pattern.exec(text)) !== null) {
      rows92A.push({
        NLinha: match[1],
        CodPais: match[2],
        Codigo: match[3],
        AnoRealizacao: match[4],
        MesRealizacao: match[5],
        DiaRealizacao: match[6],
        ValorRealizacao: this.parseDecimal(match[7]),
        AnoAquisicao: match[8],
        MesAquisicao: match[9],
        DiaAquisicao: match[10],
        ValorAquisicao: this.parseDecimal(match[11]),
        DespesasEncargos: match[12] ? this.parseDecimal(match[12]) : 0,
        ImpostoPagoNoEstrangeiro: match[13] ? this.parseDecimal(match[13]) : 0,
        CodPaisContraparte: match[14] || "",
        RespeitaValoresMobiliarios: match[15] === "SIM" ? "S" : "N",
      });
    }

    // Se não encontrou com o primeiro padrão, tentar padrão mais flexível
    if (rows92A.length === 0) {
      const flexiblePattern =
        /(\d{3})\s+(\d{3})\s+([A-Z]\d{2})\s+(\d{4})\s+(\d{1,2})\s+(\d{1,2})\s+([\d.,]+)\s+(\d{4})\s+(\d{1,2})\s+(\d{1,2})\s+([\d.,]+)/gi;
      while ((match = flexiblePattern.exec(text)) !== null) {
        rows92A.push({
          NLinha: match[1],
          CodPais: match[2],
          Codigo: match[3],
          AnoRealizacao: match[4],
          MesRealizacao: match[5],
          DiaRealizacao: match[6],
          ValorRealizacao: this.parseDecimal(match[7]),
          AnoAquisicao: match[8],
          MesAquisicao: match[9],
          DiaAquisicao: match[10],
          ValorAquisicao: this.parseDecimal(match[11]),
          DespesasEncargos: 0,
          ImpostoPagoNoEstrangeiro: 0,
          CodPaisContraparte: "",
          RespeitaValoresMobiliarios: "N",
        });
      }
    }

    // Extrair tabela 9.2B (ações fracionadas)
    // Padrão: 991 G98 372 20.26 0.00 620
    const patternB =
      /(\d{3})\s+([A-Z]\d{2})\s+(\d{3})\s+([\d.,]+)(?:\s+([\d.,]+))?\s*(\d{3})?/gi;
    const rows92B = [];

    while ((match = patternB.exec(text)) !== null) {
      const lineNum = parseInt(match[1]);
      if (lineNum >= 991 && lineNum <= 999) {
        rows92B.push({
          NLinha: match[1],
          CodRendimento: match[2],
          CodPais: match[3],
          RendimentoLiquido: this.parseDecimal(match[4]),
          ImpostoPagoEstrangeiro: match[5] ? this.parseDecimal(match[5]) : 0,
          CodPaisContraparte: match[6] || "",
        });
      }
    }

    // Filtrar linhas duplicadas (manter apenas a primeira ocorrência de cada NLinha)
    const uniqueRows92A = [];
    const seenLines = new Set();
    for (const row of rows92A) {
      if (!seenLines.has(row.NLinha)) {
        seenLines.add(row.NLinha);
        uniqueRows92A.push(row);
      }
    }

    // Ordenar por número de linha
    uniqueRows92A.sort((a, b) => parseInt(a.NLinha) - parseInt(b.NLinha));
    rows92B.sort((a, b) => parseInt(a.NLinha) - parseInt(b.NLinha));

    console.log(`Linhas 9.2A encontradas: ${uniqueRows92A.length}`);
    if (uniqueRows92A.length > 0) {
      console.log(`Primeira linha: ${uniqueRows92A[0].NLinha}`);
      console.log(
        `Última linha: ${uniqueRows92A[uniqueRows92A.length - 1].NLinha}`,
      );
      console.log(`Exemplo de linha:`, uniqueRows92A[0]);
    }

    console.log(`Linhas 9.2B encontradas: ${rows92B.length}`);

    return { rows92A: uniqueRows92A, rows92B };
  }

  async parseInvestmentIncome(file) {
    const text = await this.extractText(file);
    return this.extractInvestmentIncomeTables(text);
  }

  extractInvestmentIncomeTables(text) {
    // Padrão: 801 E11 276 102.96 0.35
    const pattern = /(\d{3})\s+([A-Z]\d{2})\s+(\d{3})\s+([\d.,]+)\s+([\d.,]+)/g;
    const rows8A = [];
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const lineNum = parseInt(match[1]);
      if (lineNum >= 801 && lineNum <= 899) {
        rows8A.push({
          NLinha: match[1],
          CodRendimento: match[2],
          CodPais: match[3],
          RendimentoBruto: this.parseDecimal(match[4]),
          ImpostoPagoEstrangeiroPaisFonte: this.parseDecimal(match[5]),
          CodPaisAgentePagador: "",
          ImpostoRetidoAgente: 0,
          NIFEntidadeRetentora: "",
          RetencaoFontePortugal: 0,
        });
      }
    }

    rows8A.sort((a, b) => parseInt(a.NLinha) - parseInt(b.NLinha));

    console.log(`Linhas 8A encontradas: ${rows8A.length}`);
    return { rows8A };
  }

  parseDecimal(value) {
    if (!value || value === "") return 0;

    const str = String(value).trim();

    // Se já for número válido
    if (!isNaN(parseFloat(str)) && isFinite(str) && !str.includes(",")) {
      return parseFloat(str);
    }

    // Converter formato europeu "1.234,56" -> "1234.56"
    let cleaned = str;
    if (cleaned.includes(",") && cleaned.includes(".")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else if (cleaned.includes(",")) {
      cleaned = cleaned.replace(",", ".");
    }

    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
}
