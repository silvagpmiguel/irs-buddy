import { PDFParser } from "./pdf-parser.js";

export class XTBParser extends PDFParser {
  async parse(file) {
    const text = await this.extractText(file);
    return {
      rows92A: this.extractCapitalGains92A(text),
      rows92B: this.extractCapitalGains92B(text),
      rows8A: this.extractInvestmentIncome8A(text),
    };
  }

  extractCapitalGains92A(text) {
    const pattern =
      /(\d{3})\s+(\d{3})\s+([A-Z]\d{2})\s+(\d{4})\s+(\d{1,2})\s+(\d{1,2})\s+([\d.,]+)\s+(\d{4})\s+(\d{1,2})\s+(\d{1,2})\s+([\d.,]+)(?:\s+([\d.,]+))?\s*(?:([\d.,]+))?\s*(\d{3})?\s*(SIM|NÃO)?/gi;

    const rows = [];
    let match;

    while ((match = pattern.exec(text)) !== null) {
      rows.push({
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

    // Padrão flexível se o primeiro não funcionar
    if (rows.length === 0) {
      const flexiblePattern =
        /(\d{3})\s+(\d{3})\s+([A-Z]\d{2})\s+(\d{4})\s+(\d{1,2})\s+(\d{1,2})\s+([\d.,]+)\s+(\d{4})\s+(\d{1,2})\s+(\d{1,2})\s+([\d.,]+)/gi;
      while ((match = flexiblePattern.exec(text)) !== null) {
        rows.push({
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

    console.log(`[XTB] Linhas 9.2A encontradas: ${rows.length}`);
    return rows;
  }

  extractCapitalGains92B(text) {
    const pattern =
      /(\d{3})\s+([A-Z]\d{2})\s+(\d{3})\s+([\d.,]+)(?:\s+([\d.,]+))?\s*(\d{3})?/gi;
    const rows = [];
    let match;

    while ((match = pattern.exec(text)) !== null) {
      rows.push({
        CodRendimento: match[2],
        CodPais: match[3],
        RendimentoLiquido: this.parseDecimal(match[4]),
        ImpostoPagoEstrangeiro: match[5] ? this.parseDecimal(match[5]) : 0,
        CodPaisContraparte: match[6] || "",
      });
    }
    console.log(`[XTB] Linhas 9.2B encontradas: ${rows.length}`);
    return rows;
  }

  extractInvestmentIncome8A(text) {
    const pattern = /(\d{3})\s+([A-Z]\d{2})\s+(\d{3})\s+([\d.,]+)\s+([\d.,]+)/g;
    const rows = [];
    let match;

    while ((match = pattern.exec(text)) !== null) {
      rows.push({
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

    console.log(`[XTB] Linhas 8A encontradas: ${rows.length}`);
    return rows;
  }
}
