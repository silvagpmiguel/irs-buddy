import { PDFParser } from "./pdf-parser.js";

export class Trading212Parser extends PDFParser {
  async parse(file) {
    const text = await this.extractText(file);
    const overviewData = this.extractOverviewData(text);
    console.log("[Trading212] Overview data:", overviewData);

    const rows92A = [];
    const rows8A = [];

    if (overviewData.closedResult > 0) {
      const closedResultsRows = this.extractClosedResults(text);
      rows92A.push(...closedResultsRows);
    }

    if (overviewData.netDividends > 0) {
      const dividendRows = this.extractDividendsByCountry(text);
      rows8A.push(...dividendRows);
      console.log(
        `[Trading212] Linhas de dividendos encontradas: ${dividendRows.length}`,
      );
    }

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
        const currentYear = new Date().getFullYear();
        rows.push({
          CodPais: "620",
          Codigo: "G01",
          AnoRealizacao: String(currentYear),
          MesRealizacao: "12",
          DiaRealizacao: "31",
          ValorRealizacao: Math.abs(totalResult),
          AnoAquisicao: String(currentYear),
          MesAquisicao: "1",
          DiaAquisicao: "1",
          ValorAquisicao: 0,
          DespesasEncargos: 0,
          ImpostoPagoNoEstrangeiro: 0,
          CodPaisContraparte: "620",
          RespeitaValoresMobiliarios: "S",
        });
      }
    }

    return rows;
  }

  extractDividendsByCountry(text) {
    const rows = [];

    // Usar o método genérico para extrair a tabela
    const tableData = this.extractTable(text, "Dividends by country", 5, true);

    console.log(
      `[Trading212] Tabela "Dividends by country" extraída: ${tableData.length} linhas`,
    );

    // Log para debug - mostrar as colunas de cada linha
    for (let i = 0; i < tableData.length; i++) {
      console.log(`[Trading212] Linha ${i}:`, tableData[i]);
    }

    for (const row of tableData) {
      if (row.length >= 5) {
        const country = row[0].trim();

        // Os valores podem estar em diferentes posições dependendo do formato
        // Formato esperado: [País, Gross, Taxa, WHT, Net]
        let grossAmount = 0;
        let taxWithheld = 0;

        // Tentar extrair o Gross Amount (segunda coluna)
        if (row[1]) {
          grossAmount = this.parseDecimal(row[1]);
        }

        // Tentar extrair o WHT (quarta coluna)
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
