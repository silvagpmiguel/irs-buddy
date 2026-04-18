// xml-parser.js - Parse do XML da AT (apenas Anexos G, H, I, J)

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

      this.parseAnexoG();
      this.parseAnexoH();
      this.parseAnexoJ();

      return {
        success: true,
        data: this.parsedData,
      };
    } catch (error) {
      console.error("Erro ao parsear XML:", error);
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
          if (value) data[tagName] = value;
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
      this.parsedData.anexoG = { presente: false };
      return;
    }

    const anexo = anexoG[0];

    this.parsedData.anexoG = {
      presente: true,
      ano: this.getElementValue(anexo, "AnexoGq02C01"),
      alienacaoImoveis: this.getTableRows(
        anexo,
        "AnexoGq04T01",
        "AnexoGq04T01-Linha",
      ),
      rendimentosCapitais: this.getTableRows(
        anexo,
        "AnexoGq10T01",
        "AnexoGq10T01-Linha",
      ),
      alienacaoParticipacoes: this.getTableRows(
        anexo,
        "AnexoGq12BT01",
        "AnexoGq12BT01-Linha",
      ),
    };
  }

  // ============ ANEXO H - DEDUÇÕES ============
  parseAnexoH() {
    let anexoH = this.xmlDoc.getElementsByTagNameNS(this.namespace, "AnexoH");
    if (anexoH.length === 0) {
      anexoH = this.xmlDoc.getElementsByTagName("AnexoH");
    }

    if (anexoH.length === 0) {
      this.parsedData.anexoH = { presente: false };
      return;
    }

    const anexo = anexoH[0];

    this.parsedData.anexoH = {
      presente: true,
      nif: this.getElementValue(anexo, "AnexoHq03C01"),
      ano: this.getElementValue(anexo, "AnexoHq02C01"),
      pensoes: this.getTableRows(anexo, "AnexoHq04T01", "AnexoHq04T01-Linha"),
      beneficiosFiscais: this.getTableRows(
        anexo,
        "AnexoHq06BT01",
        "AnexoHq06BT01-Linha",
      ),
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
      this.parsedData.anexoJ = { presente: false };
      return;
    }

    const anexo = anexoJ[0];

    this.parsedData.anexoJ = {
      presente: true,
      ano: this.getElementValue(anexo, "AnexoJq02C01"),
      rendimentosCategoriaA: this.getTableRows(
        anexo,
        "AnexoJq04AT01",
        "AnexoJq04AT01-Linha",
      ),
      rendimentosCategoriaB: this.getTableRows(
        anexo,
        "AnexoJq05AT01",
        "AnexoJq05AT01-Linha",
      ),
      rendimentosCategoriaE: this.getTableRows(
        anexo,
        "AnexoJq06AT01",
        "AnexoJq06AT01-Linha",
      ),
      rendimentosCategoriaG: this.getTableRows(
        anexo,
        "AnexoJq09AT01",
        "AnexoJq09AT01-Linha",
      ),
    };
  }
}
