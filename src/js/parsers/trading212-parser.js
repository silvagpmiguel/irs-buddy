import { PDFParser } from "./pdf-parser.js";

export class Trading212Parser extends PDFParser {
  async parse(file) {
    const text = await this.extractText(file);
    const overviewData = this.extractOverviewData(text);
    console.log("[Trading212] Overview data:", overviewData);

    const rows92A = [];
    const rows8A = [];

    // 1. Extrair vendas realizadas (sell trades) - para 9.2A
    const sellTradesRows = this.extractSellTrades(text);
    rows92A.push(...sellTradesRows);
    console.log(
      `[Trading212] Linhas de vendas encontradas: ${sellTradesRows.length}`,
    );

    // 2. Se não houver vendas, tentar posições abertas (fallback)
    if (sellTradesRows.length === 0 && overviewData.closedResult !== 0) {
      const closedResultsRows = this.extractClosedResults(text);
      rows92A.push(...closedResultsRows);
    }

    // 3. Dividendos
    if (overviewData.netDividends > 0) {
      const dividendRows = this.extractDividendsByCountry(text);
      rows8A.push(...dividendRows);
      console.log(
        `[Trading212] Linhas de dividendos encontradas: ${dividendRows.length}`,
      );
    }

    // 4. Juros
    if (overviewData.interestOnCash > 0) {
      const interestRow = this.extractInterestOnCash(overviewData);
      if (interestRow) {
        rows8A.push(interestRow);
        console.log(
          `[Trading212] Juros encontrados: ${overviewData.interestOnCash}€`,
        );
      }
    }

    return {
      rows92A: rows92A,
      rows92B: [],
      rows8A: rows8A,
    };
  }

  extractOverviewData(text) {
    let closedResult = 0;
    const closedResultMatch = text.match(/Closed result[€\s]*([\d.,]+)/i);
    if (closedResultMatch) {
      closedResult = this.parseDecimal(closedResultMatch[1]);
    }

    let netDividends = 0;
    const netDividendsMatch = text.match(/Net Dividends[€\s]*([\d.,]+)/i);
    if (netDividendsMatch) {
      netDividends = this.parseDecimal(netDividendsMatch[1]);
    }

    let interestOnCash = 0;
    const interestMatch = text.match(/Interest on cash[€\s]*([\d.,]+)/i);
    if (interestMatch) {
      interestOnCash = this.parseDecimal(interestMatch[1]);
    }

    return { closedResult, netDividends, interestOnCash };
  }

  /**
   * Extrai vendas realizadas da tabela "Invest account - sell trades"
   */
  extractSellTrades(text) {
    const rows = [];

    const sellMatch = text.match(
      /Invest account - sell trades[\s\S]*?(?=Invest account -|Distribution|Dividend|$)/i,
    );
    if (!sellMatch) {
      console.log("[Trading212] Tabela 'sell trades' não encontrada");
      return rows;
    }

    const sellText = sellMatch[0];
    const lines = sellText.split("\n");

    let foundHeader = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === "") continue;

      if (
        !foundHeader &&
        (line.includes("EXECUTION TIME") || line.includes("INSTRUMENT"))
      ) {
        foundHeader = true;
        continue;
      }

      if (!foundHeader) continue;

      if (line.includes("Invest account -") || line.includes("Distribution")) {
        break;
      }

      // Extrair data
      const dateMatch = line.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}:\d{2})/);
      if (!dateMatch) continue;

      const day = dateMatch[1];
      const month = dateMatch[2];
      const year = dateMatch[3];

      // Extrair ISIN
      const isinMatch = line.match(/\b([A-Z]{2}[A-Z0-9]{9}[0-9])\b/);
      if (!isinMatch) continue;

      const isin = isinMatch[1];
      // Usar o método da classe base para extrair país do ISIN
      const paisFonte = this.getCountryCodeFromISIN(isin);

      // Extrair resultado
      const resultMatch = line.match(/€([-]?[\d.,]+)\s*$/);
      if (!resultMatch) continue;

      const totalResult = this.parseDecimal(resultMatch[1]);

      // Extrair valor em EUR
      const eurMatch = line.match(/€([\d.,]+)\s+€/);
      const valorRealizacao = eurMatch
        ? this.parseDecimal(eurMatch[1])
        : Math.abs(totalResult);

      rows.push({
        CodPais: paisFonte,
        Codigo: "G01",
        AnoRealizacao: year,
        MesRealizacao: month,
        DiaRealizacao: day,
        ValorRealizacao: Math.abs(totalResult),
        AnoAquisicao: null, // null em vez de 0
        MesAquisicao: null,
        DiaAquisicao: null,
        ValorAquisicao: null, // null em vez de 0
        DespesasEncargos: null,
        ImpostoPagoNoEstrangeiro: null,
        CodPaisContraparte: "196",
        RespeitaValoresMobiliarios: "S",
      });
    }

    console.log(
      `[Trading212] Extraídas ${rows.length} linhas de vendas realizadas`,
    );
    return rows;
  }

  extractClosedResults(text) {
    const rows = [];
    const positionsMatch = text.match(
      /(?:Invest account - open positions|Open positions)[\s\S]*?(?=Invest account -|Dividend|$)/i,
    );
    if (!positionsMatch) return rows;

    const positionsText = positionsMatch[0];
    const pattern =
      /([A-Za-z0-9&. ]+?)\s+([A-Z]{2}\d{10}[A-Z0-9]?)\s+(Stock|ETF)\s+([\d.]+)\s+\$?([\d.,]+)\s+\$?([\d.,]+)\s+€([-]?[\d.,]+)/gi;

    let match;
    while ((match = pattern.exec(positionsText)) !== null) {
      const totalResult = this.parseDecimal(match[7]);
      if (totalResult !== 0) {
        rows.push({
          CodPais: "620",
          Codigo: "G01",
          AnoRealizacao: null,
          MesRealizacao: null,
          DiaRealizacao: null,
          ValorRealizacao: Math.abs(totalResult),
          AnoAquisicao: null,
          MesAquisicao: null,
          DiaAquisicao: null,
          ValorAquisicao: 0,
          DespesasEncargos: 0,
          ImpostoPagoNoEstrangeiro: 0,
          CodPaisContraparte: "196", // Chipre
          RespeitaValoresMobiliarios: "S",
        });
      }
    }

    console.log(
      `[Trading212] Extraídas ${rows.length} linhas de open positions (datas vazias)`,
    );
    return rows;
  }

  extractDividendsByCountry(text) {
    const rows = [];

    const tableData = this.extractTable(
      text,
      "Distributions by country",
      5,
      true,
    );

    console.log(
      `[Trading212] Tabela "Distributions by country" extraída: ${tableData.length} linhas`,
    );

    for (let i = 0; i < tableData.length; i++) {
      console.log(`[Trading212] Linha ${i}:`, tableData[i]);
    }

    for (const row of tableData) {
      if (row.length >= 5) {
        const country = row[0].trim();
        let grossAmount = 0;
        let taxWithheld = 0;

        if (row[1]) {
          grossAmount = this.parseDecimal(row[1]);
        }
        if (row[3]) {
          taxWithheld = this.parseDecimal(row[3]);
        }

        const taxRate = row[2] || "";

        console.log(
          `[Trading212] Dividendo: País="${country}", Gross=${grossAmount}, WHT=${taxWithheld}, Taxa=${taxRate}`,
        );

        if (country && grossAmount > 0) {
          try {
            const countryCode = this.getCountryCode(country);
            rows.push({
              CodRendimento: "E11",
              CodPais: countryCode,
              RendimentoBruto: grossAmount,
              ImpostoPagoEstrangeiroPaisFonte: taxWithheld,
              CodPaisAgentePagador: "",
              ImpostoRetidoAgente: 0,
              NIFEntidadeRetentora: "",
              RetencaoFontePortugal: 0,
            });
          } catch (error) {
            console.warn(
              `[Trading212] Erro ao obter código do país para "${country}":`,
              error.message,
            );
          }
        }
      }
    }

    console.log(
      `[Trading212] Extraídas ${rows.length} linhas de dividendos por país`,
    );
    return rows;
  }

  extractInterestOnCash(overviewData) {
    if (!overviewData || overviewData.interestOnCash <= 0) return null;
    console.log(
      `[Trading212] Interest on cash (do overview): ${overviewData.interestOnCash}€`,
    );
    return {
      CodRendimento: "E21",
      CodPais: "196", // Chipre
      RendimentoBruto: overviewData.interestOnCash,
      ImpostoPagoEstrangeiroPaisFonte: 0,
      CodPaisAgentePagador: "",
      ImpostoRetidoAgente: 0,
      NIFEntidadeRetentora: "",
      RetencaoFontePortugal: 0,
    };
  }
}
