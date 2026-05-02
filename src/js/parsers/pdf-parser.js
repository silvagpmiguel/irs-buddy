import { CatalogoPaisesEN } from "../constants/catalogs.js";

export class PDFParser {
  constructor() {
    this.pdfjsLib = window.pdfjsLib;
    this.countryCatalog = CatalogoPaisesEN;
    this.countryMap = this.buildCountryMap();
  }

  buildCountryMap() {
    const map = new Map();
    const extraMappings = {
      us: "840",
      usa: "840",
      "united states": "840",
      "united states of america": "840",
      uk: "826",
      "united kingdom": "826",
      "u.k.": "826",
      portugal: "620",
      spain: "724",
      france: "250",
      germany: "276",
      italy: "380",
      netherlands: "528",
      belgium: "56",
      ireland: "372",
      switzerland: "756",
      austria: "40",
      sweden: "752",
      norway: "578",
      denmark: "208",
      finland: "246",
      poland: "616",
      greece: "300",
      "czech republic": "203",
      hungary: "348",
      romania: "642",
      bulgaria: "100",
      croatia: "191",
      slovakia: "703",
      slovenia: "705",
      estonia: "233",
      latvia: "428",
      lithuania: "440",
      cyprus: "196",
      malta: "470",
      luxembourg: "442",
      canada: "124",
      mexico: "484",
      brazil: "76",
      argentina: "32",
      chile: "152",
      japan: "392",
      china: "156",
      india: "356",
      australia: "36",
      "new zealand": "554",
      "south africa": "710",
      russia: "643",
      turkey: "792",
      israel: "376",
      uae: "784",
      "united arab emirates": "784",
      singapore: "702",
      "hong kong": "344",
      jersey: "832",
      guernsey: "831",
      "isle of man": "833",
    };
    for (const [name, code] of Object.entries(extraMappings)) {
      map.set(name.toLowerCase(), code);
    }
    for (const country of this.countryCatalog) {
      if (country.value && country.label && country.label !== "Select") {
        map.set(country.label.toLowerCase(), country.value);
      }
    }

    return map;
  }

  simplifyText(text) {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z\s]/g, "")
      .trim();
  }

  getCountryCode(countryName) {
    if (!countryName) {
      return null;
    }

    const simplifiedName = this.simplifyText(countryName);
    if (this.countryMap.has(simplifiedName)) {
      return this.countryMap.get(simplifiedName);
    }

    throw new Error(
      `Código do país não encontrado para: "${countryName}" (simplificado: "${simplifiedName}")`,
    );
  }

  /**
   * Extrai uma tabela do texto do PDF de forma genérica
   * @param {string} text - Texto completo extraído do PDF
   * @param {string} tableTitle - Título da tabela (ex: "Dividends by country")
   * @param {number} expectedColumns - Número esperado de colunas
   * @param {boolean} skipHeader - Se true, ignora a primeira linha da tabela (cabeçalho)
   * @returns {Array<Array<string>>} - Array de linhas, cada linha é um array de colunas
   */
  extractTable(text, tableTitle, expectedColumns, skipHeader = true) {
    const rows = [];

    const startIndex = text.indexOf(tableTitle);
    if (startIndex === -1) {
      console.log(`[PDFParser] Tabela "${tableTitle}" não encontrada`);
      return rows;
    }

    let endIndex = text.indexOf("\n\n", startIndex);
    if (endIndex === -1) {
      endIndex = text.length;
    }

    const tableSection = text.substring(startIndex, endIndex);
    const lines = tableSection.split("\n");

    let dataStarted = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === "") continue;

      if (line.includes(tableTitle)) continue;

      const columns = line.split(/\s{2,}|\t/);
      const cleanedColumns = columns.filter((col) => col.trim() !== "");

      if (cleanedColumns.length === expectedColumns) {
        if (!dataStarted) {
          dataStarted = true;
          if (skipHeader) {
            continue;
          }
        }
        rows.push(cleanedColumns);
      } else if (dataStarted && cleanedColumns.length > 0) {
        break;
      }
    }

    console.log(
      `[PDFParser] Tabela "${tableTitle}" extraída: ${rows.length} linhas`,
    );
    return rows;
  }

  /**
   * Extrai texto do PDF mantendo a ordem correta das linhas
   * @param {File} file - Ficheiro PDF
   * @returns {Promise<string>} - Texto extraído
   */
  async extractText(file) {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = this.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Ordenar os itens por posição Y (linha) e depois por posição X (coluna)
      // Usar precisão maior (2 casas decimais) para ordenação mais precisa
      const items = textContent.items.map((item) => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        height: item.height,
      }));

      // Ordenar por Y (crescente) e depois por X (crescente)
      items.sort((a, b) => {
        // Mesma linha? (diferença menor que 5 unidades)
        if (Math.abs(a.y - b.y) < 5) {
          return a.x - b.x;
        }
        return b.y - a.y; // Y decrescente porque PDF tem Y invertido
      });

      // Agrupar por linha (diferença Y menor que 5 unidades)
      const lines = [];
      let currentLine = [];
      let currentY = null;

      for (const item of items) {
        if (currentY === null || Math.abs(item.y - currentY) < 5) {
          currentLine.push(item.text);
          currentY = item.y;
        } else {
          if (currentLine.length > 0) {
            lines.push(currentLine.join(" "));
          }
          currentLine = [item.text];
          currentY = item.y;
        }
      }

      if (currentLine.length > 0) {
        lines.push(currentLine.join(" "));
      }

      fullText += lines.join("\n") + "\n\n";
    }

    return fullText;
  }

  parseDecimal(value) {
    if (!value || value === "") return 0;

    // Se for um número já (typeof number)
    if (typeof value === "number") return value;

    let str = String(value).trim();

    // Se a string contém "€", remover
    str = str.replace(/[€\s]/g, "");

    // Se contém vírgula e ponto (ex: "1.234,56")
    if (str.includes(",") && str.includes(".")) {
      str = str.replace(/\./g, "").replace(",", ".");
    }
    // Se contém apenas vírgula (ex: "1234,56")
    else if (str.includes(",")) {
      str = str.replace(",", ".");
    }

    // Se contém apenas ponto como separador de milhares (ex: "1.234")
    else if (str.includes(".") && !str.includes(",")) {
      // Verificar se é um separador de milhares
      const parts = str.split(".");
      if (parts.length > 2) {
        str = str.replace(/\./g, "");
      }
    }

    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  async parse(file) {
    throw new Error("Método parse deve ser implementado pela subclasse");
  }
}
