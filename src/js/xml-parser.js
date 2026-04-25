// src/js/xml-parser.js - Parse do XML da AT

export class XMLParser {
  constructor(xmlString) {
    this.xmlString = xmlString;
    this.parser = new DOMParser();
    this.xmlDoc = null;
    this.namespace = "http://www.dgci.gov.pt/2009/Modelo3IRSv2016";
    this.parsedData = {
      anexoG: {},
      anexoH: {},
      anexoJ: {},
    };
  }

  parse() {
    try {
      this.xmlDoc = this.parser.parseFromString(this.xmlString, "text/xml");

      const parserError = this.xmlDoc.querySelector("parsererror");
      if (parserError) {
        throw new Error("XML mal formatado: " + parserError.textContent);
      }

      this.parseNif();
      this.parseAnexoG();
      this.parseAnexoH();
      this.parseAnexoJ();

      return {
        success: true,
        data: this.parsedData,
      };
    } catch (error) {
      console.error("Erro ao fazer parse do XML:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  getElementValue(element, tagName) {
    if (!element) return null;

    let el = element.getElementsByTagNameNS(this.namespace, tagName);
    if (el.length === 0) {
      el = element.getElementsByTagName(tagName);
    }

    if (el.length > 0 && el[0].textContent) {
      return el[0].textContent.trim();
    }
    return null;
  }

  getTableRows(parent, tableName, rowName) {
    const rows = [];

    let table = parent.getElementsByTagNameNS(this.namespace, tableName);
    if (table.length === 0) {
      table = parent.getElementsByTagName(tableName);
    }

    if (table.length > 0) {
      const rowElements = table[0].getElementsByTagNameNS(
        this.namespace,
        rowName,
      );
      const altRows = table[0].getElementsByTagName(rowName);
      const elements = rowElements.length > 0 ? rowElements : altRows;

      for (let i = 0; i < elements.length; i++) {
        const data = {};
        const children = elements[i].children;
        for (let j = 0; j < children.length; j++) {
          const child = children[j];
          const tagName = child.localName || child.tagName;
          const value = child.textContent ? child.textContent.trim() : null;
          if (value !== null && value !== "") {
            data[tagName] = value;
          }
        }
        rows.push(data);
      }
    }

    return rows;
  }

  // ============ ANEXO G - MAIS-VALIAS ============
  parseAnexoG() {
    let anexoG = this.xmlDoc.getElementsByTagNameNS(this.namespace, "AnexoG");
    if (anexoG.length === 0) {
      anexoG = this.xmlDoc.getElementsByTagName("AnexoG");
    }
    if (anexoG.length === 0) {
      this.parsedData.anexoG = { presente: false, incluir: true };
      return;
    }
    const anexo = anexoG[0];
    this.parsedData.anexoG = {
      presente: true,
      incluir: true,
      ano: this.getElementValue(anexo, "AnexoGq02C01"),
      nif: this.getElementValue(anexo, "AnexoGq03C01") ?? this.nif,
      quadro09: this.getTableRows(anexo, "AnexoGq09T01", "AnexoGq09T01-Linha"),
    };
  }

  // ============ ANEXO H - DEDUÇÕES ============
  parseAnexoH() {
    let anexoH = this.xmlDoc.getElementsByTagNameNS(this.namespace, "AnexoH");
    if (anexoH.length === 0) {
      anexoH = this.xmlDoc.getElementsByTagName("AnexoH");
    }

    if (anexoH.length === 0) {
      this.parsedData.anexoH = { presente: false, incluir: true };
      return;
    }

    const anexo = anexoH[0];

    // Obter declaração alternativa (C1)
    let declaracaoAlternativa = this.getElementValue(anexo, "AnexoHq06B01");
    if (!declaracaoAlternativa) {
      declaracaoAlternativa = "N";
    }

    this.parsedData.anexoH = {
      presente: true,
      incluir: true,
      nif: this.getElementValue(anexo, "AnexoHq03C01") ?? this.nif,
      ano: this.getElementValue(anexo, "AnexoHq02C01"),
      pensoes: this.getTableRows(anexo, "AnexoHq04T01", "AnexoHq04T01-Linha"),
      beneficiosFiscais: this.getTableRows(
        anexo,
        "AnexoHq06BT01",
        "AnexoHq06BT01-Linha",
      ),
      declaracaoAlternativa: declaracaoAlternativa,
      deducoes: {
        saude: this.getElementValue(anexo, "AnexoHq08C801a"),
        educacao: this.getElementValue(anexo, "AnexoHq08C802a"),
        imoveis: this.getElementValue(anexo, "AnexoHq08C803a"),
        lares: this.getElementValue(anexo, "AnexoHq08C804a"),
      },
    };
  }

  // ============ ANEXO J - RENDIMENTOS ESTRANGEIROS ============
  parseAnexoJ() {
    let anexoJ = this.xmlDoc.getElementsByTagNameNS(this.namespace, "AnexoJ");
    if (anexoJ.length === 0) {
      anexoJ = this.xmlDoc.getElementsByTagName("AnexoJ");
    }

    if (anexoJ.length === 0) {
      this.parsedData.anexoJ = { presente: false, incluir: true };
      return;
    }

    const anexo = anexoJ[0];

    // Obter opção de englobamento da secção 8
    let englobamentoSec8 = this.getElementValue(anexo, "AnexoJq08B01");
    if (!englobamentoSec8) englobamentoSec8 = "N";

    // Obter opção de englobamento da secção 9.2 (C)
    let englobamentoSec92 = this.getElementValue(anexo, "AnexoJq092B01");
    if (!englobamentoSec92) englobamentoSec92 = "N";

    this.parsedData.anexoJ = {
      presente: true,
      incluir: true,
      ano: this.getElementValue(anexo, "AnexoJq02C01"),
      rendimentosCategoriaE: this.getTableRows(
        anexo,
        "AnexoJq08AT01",
        "AnexoJq08AT01-Linha",
      ),
      rendimentosCategoriaG: this.getTableRows(
        anexo,
        "AnexoJq092AT01",
        "AnexoJq092AT01-Linha",
      ),
      rendimentosCategoriaG_B: this.getTableRows(
        anexo,
        "AnexoJq092BT01",
        "AnexoJq092BT01-Linha",
      ),
      iban: this.getTableRows(anexo, "AnexoJq11T01", "AnexoJq11T01-Linha"),
      englobamentoSec8: englobamentoSec8,
      englobamento: englobamentoSec92,
    };
  }

  parseNif() {
    let rosto = this.xmlDoc.getElementsByTagNameNS(this.namespace, "Rosto");
    if (rosto.length === 0) rosto = this.xmlDoc.getElementsByTagName("Rosto");
    if (rosto.length === 0) return "";
    const quadro03 = rosto[0].getElementsByTagNameNS(
      this.namespace,
      "Quadro03",
    );
    const altQuadro03 = rosto[0].getElementsByTagName("Quadro03");
    const q03 = quadro03.length > 0 ? quadro03[0] : altQuadro03[0];
    if (!q03) return "";
    const q03c01 = q03.getElementsByTagNameNS(this.namespace, "Q03C01");
    const altQ03c01 = q03.getElementsByTagName("Q03C01");
    const nifElement = q03c01.length > 0 ? q03c01[0] : altQ03c01[0];
    if (nifElement && nifElement.textContent) {
      this.parsedData.nif = nifElement.textContent.trim();
    }
  }
}
