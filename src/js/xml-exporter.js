export class XMLExporter {
  constructor(
    originalXmlString,
    editedData,
    includedAnexos,
    tableReferences = {},
  ) {
    this.originalXmlString = originalXmlString;
    this.editedData = editedData;
    this.includedAnexos = includedAnexos;
    this.tableReferences = tableReferences; // { beneficiosTable, rendimentosJurosTable, maisValiasJTable, maisValiasGTable }
    this.xmlDoc = null;
    this.namespace = "http://www.dgci.gov.pt/2009/Modelo3IRSv2016";
  }

  // Método principal para exportar
  export() {
    try {
      // Parse do XML original
      const parser = new DOMParser();
      this.xmlDoc = parser.parseFromString(this.originalXmlString, "text/xml");

      // Verificar erros de parsing
      const parserError = this.xmlDoc.querySelector("parsererror");
      if (parserError) {
        throw new Error("XML original mal formatado");
      }

      // Processar cada anexo se estiver incluído
      if (this.includedAnexos.anexoG) {
        this.updateAnexoG();
      }

      if (this.includedAnexos.anexoH) {
        this.updateAnexoH();
      }

      if (this.includedAnexos.anexoJ) {
        this.updateAnexoJ();
      }

      // Serializar o XML atualizado
      const serializer = new XMLSerializer();
      let xmlString = serializer.serializeToString(this.xmlDoc);

      // Limpeza do XML
      xmlString = this.cleanXML(xmlString);

      return {
        success: true,
        xml: xmlString,
        message: "XML exportado com sucesso",
      };
    } catch (error) {
      console.error("Erro na exportação:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Limpar XML (remover nós vazios, formatar)
  cleanXML(xmlString) {
    // Remover nós que estão vazios (opcional)
    // Remover espaços extras entre tags
    xmlString = xmlString.replace(/>\s+</g, "><");
    return xmlString;
  }

  // Helper para obter elemento ou criar
  getOrCreateElement(parent, tagName) {
    let element = parent.getElementsByTagNameNS(this.namespace, tagName);
    if (element.length === 0) {
      element = parent.getElementsByTagName(tagName);
    }

    if (element.length > 0) {
      return element[0];
    }

    // Criar novo elemento
    const newElement = this.xmlDoc.createElementNS(this.namespace, tagName);
    parent.appendChild(newElement);
    return newElement;
  }

  // ============ UPDATE ANEXO G ============
  updateAnexoG() {
    let anexoG = this.xmlDoc.getElementsByTagNameNS(this.namespace, "AnexoG");
    if (anexoG.length === 0)
      anexoG = this.xmlDoc.getElementsByTagName("AnexoG");
    if (anexoG.length === 0) {
      console.warn("Anexo G não encontrado no XML");
      return;
    }

    const anexo = anexoG[0];
    const data = this.editedData.anexoG || {};
    const rows = data.quadro09 || [];

    // Atualizar tabela 9 (AnexoGq09T01)
    this.updateTableRows(anexo, "AnexoGq09T01", "AnexoGq09T01-Linha", rows, [
      { field: "NLinha", format: "text" },
      { field: "Titular", format: "text" },
      { field: "NIF", format: "text" },
      { field: "CodEncargos", format: "text" },
      { field: "AnoRealizacao", format: "text" },
      { field: "MesRealizacao", format: "text" },
      { field: "DiaRealizacao", format: "text" },
      { field: "ValorRealizacao", format: "decimal" },
      { field: "AnoAquisicao", format: "text" },
      { field: "MesAquisicao", format: "text" },
      { field: "DiaAquisicao", format: "text" },
      { field: "ValorAquisicao", format: "decimal" },
      { field: "DespesasEncargos", format: "decimal" },
      { field: "PaisContraparte", format: "text" },
      { field: "RespeitaValoresMobiliarios", format: "text" },
    ]);

    // Calcular somas
    const somaRealizacao = rows.reduce(
      (s, r) => s + (parseFloat(r.ValorRealizacao) || 0),
      0,
    );
    const somaAquisicao = rows.reduce(
      (s, r) => s + (parseFloat(r.ValorAquisicao) || 0),
      0,
    );
    const somaDespesas = rows.reduce(
      (s, r) => s + (parseFloat(r.DespesasEncargos) || 0),
      0,
    );

    this.updateOrCreateSoma(
      anexo,
      "AnexoGq09T01SomaC01",
      somaRealizacao.toFixed(2),
    );
    this.updateOrCreateSoma(
      anexo,
      "AnexoGq09T01SomaC02",
      somaAquisicao.toFixed(2),
    );
    this.updateOrCreateSoma(
      anexo,
      "AnexoGq09T01SomaC03",
      somaDespesas.toFixed(2),
    );

    // Opção de englobamento (secção 15)
    const englobamento = data.englobamento || "N";
    this.updateOrCreateElement(anexo, "AnexoGq15B01", englobamento);
  }

  // ============ UPDATE ANEXO H ============
  updateAnexoH() {
    let anexoH = this.xmlDoc.getElementsByTagNameNS(this.namespace, "AnexoH");
    if (anexoH.length === 0) {
      anexoH = this.xmlDoc.getElementsByTagName("AnexoH");
    }

    if (anexoH.length === 0) {
      console.warn("Anexo H não encontrado no XML");
      return;
    }

    const anexo = anexoH[0];
    const data = this.editedData.anexoH || {};

    // Atualizar benefícios fiscais
    const beneficios = data.beneficiosFiscais || [];
    this.updateTableRows(
      anexo,
      "AnexoHq06BT01",
      "AnexoHq06BT01-Linha",
      beneficios,
      [
        { field: "CodBeneficio", format: "text" },
        { field: "Titular", format: "text" },
        { field: "ImportanciaAplicada", format: "decimal" },
        { field: "NifPortugues", format: "text" },
        { field: "Pais", format: "text" },
        { field: "NumeroFiscalUE", format: "text" },
      ],
    );

    // Buscar a soma do footer usando a referência da tabela
    let somaImportancia = 0;
    if (
      this.tableReferences.beneficiosTable &&
      typeof this.tableReferences.beneficiosTable.getFooterValue === "function"
    ) {
      somaImportancia =
        this.tableReferences.beneficiosTable.getFooterValue("somaImportancia");
    }

    // Atualizar soma
    this.updateOrCreateSoma(
      anexo,
      "AnexoHq06BT01SomaC01",
      somaImportancia.toFixed(2),
    );

    // Atualizar declaração alternativa
    const declaracaoAlternativa = data.declaracaoAlternativa || "N";
    this.updateOrCreateElement(anexo, "AnexoHq06B01", declaracaoAlternativa);
  }

  // ============ UPDATE ANEXO J ============
  updateAnexoJ() {
    let anexoJ = this.xmlDoc.getElementsByTagNameNS(this.namespace, "AnexoJ");
    if (anexoJ.length === 0) {
      anexoJ = this.xmlDoc.getElementsByTagName("AnexoJ");
    }

    if (anexoJ.length === 0) {
      console.warn("Anexo J não encontrado no XML");
      return;
    }

    const anexo = anexoJ[0];
    const data = this.editedData.anexoJ || {};

    // ============ Secção 8 - Rendimentos de Juros ============
    const rendimentosE = data.rendimentosCategoriaE || [];
    this.updateTableRows(
      anexo,
      "AnexoJq08AT01",
      "AnexoJq08AT01-Linha",
      rendimentosE,
      [
        { field: "NLinha", format: "text" },
        { field: "CodRendimento", format: "text" },
        { field: "CodPais", format: "text" },
        { field: "RendimentoBruto", format: "decimal" },
        { field: "ImpostoPagoEstrangeiroPaisFonte", format: "decimal" },
        { field: "ImpostoPagoEstrangeiroCodPaisPagador", format: "text" },
        { field: "ImpostoPagoEstrangeiroImpostoRetido", format: "decimal" },
        { field: "NIFEntRetentora", format: "text" },
        { field: "RetencaoFonte", format: "decimal" },
      ],
    );

    // Buscar somas da secção 8
    let somaRendimentoBruto = 0;
    let somaImpostoPaisFonte = 0;

    if (
      this.tableReferences.rendimentosJurosTable &&
      typeof this.tableReferences.rendimentosJurosTable.getFooterValue ===
        "function"
    ) {
      somaRendimentoBruto =
        this.tableReferences.rendimentosJurosTable.getFooterValue(
          "somaRendimentoBruto",
        );
      somaImpostoPaisFonte =
        this.tableReferences.rendimentosJurosTable.getFooterValue(
          "somaImpostoPaisFonte",
        );
    } else {
      somaRendimentoBruto = rendimentosE.reduce((acc, row) => {
        const val = parseFloat(
          String(row.RendimentoBruto || 0).replace(",", "."),
        );
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      somaImpostoPaisFonte = rendimentosE.reduce((acc, row) => {
        const val = parseFloat(
          String(row.ImpostoPagoEstrangeiroPaisFonte || 0).replace(",", "."),
        );
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
    }

    this.updateOrCreateSoma(
      anexo,
      "AnexoJq08AT01SomaC01",
      somaRendimentoBruto.toFixed(2),
    );
    this.updateOrCreateSoma(
      anexo,
      "AnexoJq08AT01SomaC02",
      somaImpostoPaisFonte.toFixed(2),
    );
    this.updateOrCreateSoma(anexo, "AnexoJq08AT01SomaC03", "0.00");
    this.updateOrCreateSoma(anexo, "AnexoJq08AT01SomaC04", "0.00");

    const englobamentoSec8 = data.englobamentoSec8 || "N";
    this.updateOrCreateElement(anexo, "AnexoJq08B01", englobamentoSec8);

    // ============ Secção 9.2 - Mais-Valias ============
    const maisValias = data.rendimentosCategoriaG || [];
    this.updateTableRows(
      anexo,
      "AnexoJq092AT01",
      "AnexoJq092AT01-Linha",
      maisValias,
      [
        { field: "NLinha", format: "text" },
        { field: "CodPais", format: "text" },
        { field: "Codigo", format: "text" },
        { field: "AnoRealizacao", format: "text" },
        { field: "MesRealizacao", format: "text" },
        { field: "DiaRealizacao", format: "text" },
        { field: "ValorRealizacao", format: "decimal" },
        { field: "AnoAquisicao", format: "text" },
        { field: "MesAquisicao", format: "text" },
        { field: "DiaAquisicao", format: "text" },
        { field: "ValorAquisicao", format: "decimal" },
        { field: "DespesasEncargos", format: "decimal" },
        { field: "ImpostoPagoNoEstrangeiro", format: "decimal" },
        { field: "CodPaisContraparte", format: "text" },
        { field: "RespeitaValoresMobiliarios", format: "text" },
      ],
    );

    // Buscar as 4 somas da secção 9.2
    let somaRealizacao = 0;
    let somaAquisicao = 0;
    let somaDespesas = 0;
    let somaImpostoEstrangeiro = 0;

    if (
      this.tableReferences.maisValiasJTable &&
      typeof this.tableReferences.maisValiasJTable.getFooterValue === "function"
    ) {
      somaRealizacao =
        this.tableReferences.maisValiasJTable.getFooterValue("somaRealizacao");
      somaAquisicao =
        this.tableReferences.maisValiasJTable.getFooterValue("somaAquisicao");
      somaDespesas =
        this.tableReferences.maisValiasJTable.getFooterValue("somaDespesas");
      somaImpostoEstrangeiro =
        this.tableReferences.maisValiasJTable.getFooterValue(
          "somaImpostoEstrangeiro",
        );
    } else {
      somaRealizacao = maisValias.reduce((acc, row) => {
        const val = parseFloat(
          String(row.ValorRealizacao || 0).replace(",", "."),
        );
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      somaAquisicao = maisValias.reduce((acc, row) => {
        const val = parseFloat(
          String(row.ValorAquisicao || 0).replace(",", "."),
        );
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      somaDespesas = maisValias.reduce((acc, row) => {
        const val = parseFloat(
          String(row.DespesasEncargos || 0).replace(",", "."),
        );
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      somaImpostoEstrangeiro = maisValias.reduce((acc, row) => {
        const val = parseFloat(
          String(row.ImpostoPagoNoEstrangeiro || 0).replace(",", "."),
        );
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
    }

    this.updateOrCreateSoma(
      anexo,
      "AnexoJq092AT01SomaC01",
      somaRealizacao.toFixed(2),
    );
    this.updateOrCreateSoma(
      anexo,
      "AnexoJq092AT01SomaC02",
      somaAquisicao.toFixed(2),
    );
    this.updateOrCreateSoma(
      anexo,
      "AnexoJq092AT01SomaC03",
      somaDespesas.toFixed(2),
    );
    this.updateOrCreateSoma(
      anexo,
      "AnexoJq092AT01SomaC04",
      somaImpostoEstrangeiro.toFixed(2),
    );

    // Secção 9.2B - Outros Incrementos Patrimoniais
    const maisValiasB = data.rendimentosCategoriaG_B || [];
    this.updateTableRows(
      anexo,
      "AnexoJq092BT01",
      "AnexoJq092BT01-Linha",
      maisValiasB,
      [
        { field: "NLinha", format: "text" },
        { field: "CodRendimento", format: "text" },
        { field: "CodPais", format: "text" },
        { field: "RendimentoLiquido", format: "decimal" },
        { field: "ImpostoPagoEstrangeiro", format: "decimal" },
        { field: "CodPaisContraparte", format: "text" },
      ],
    );

    // Somas da secção 9.2B
    const somaRendimentoB = maisValiasB.reduce(
      (s, r) => s + (parseFloat(r.RendimentoLiquido) || 0),
      0,
    );
    const somaImpostoB = maisValiasB.reduce(
      (s, r) => s + (parseFloat(r.ImpostoPagoEstrangeiro) || 0),
      0,
    );
    this.updateOrCreateSoma(
      anexo,
      "AnexoJq092BT01SomaC01",
      somaRendimentoB.toFixed(2),
    );
    this.updateOrCreateSoma(
      anexo,
      "AnexoJq092BT01SomaC02",
      somaImpostoB.toFixed(2),
    );

    // 9.2 C
    const englobamento = data.englobamento || "N";
    this.updateOrCreateElement(anexo, "AnexoJq092B01", englobamento);

    // ============ IBAN ============
    if (data.iban && data.iban.Iban) {
      this.updateIban(anexo, data.iban);
    }
  }

  updateIban(anexo, ibanData) {
    let ibanTable = anexo.getElementsByTagNameNS(
      this.namespace,
      "AnexoJq11T01",
    );
    if (ibanTable.length === 0) {
      ibanTable = anexo.getElementsByTagName("AnexoJq11T01");
    }

    let ibanLinha = null;
    if (ibanTable.length > 0) {
      const linhas = ibanTable[0].getElementsByTagNameNS(
        this.namespace,
        "AnexoJq11T01-Linha",
      );
      if (linhas.length > 0) {
        ibanLinha = linhas[0];
      } else {
        const altLinhas =
          ibanTable[0].getElementsByTagName("AnexoJq11T01-Linha");
        if (altLinhas.length > 0) ibanLinha = altLinhas[0];
      }
    }

    if (!ibanLinha) {
      let newTable = this.xmlDoc.createElementNS(
        this.namespace,
        "AnexoJq11T01",
      );
      anexo.appendChild(newTable);
      ibanLinha = this.xmlDoc.createElementNS(
        this.namespace,
        "AnexoJq11T01-Linha",
      );
      ibanLinha.setAttribute("numero", "1");
      newTable.appendChild(ibanLinha);
    }

    // Definir IBAN
    let ibanElement = ibanLinha.getElementsByTagNameNS(this.namespace, "Iban");
    if (ibanElement.length === 0) {
      ibanElement = ibanLinha.getElementsByTagName("Iban");
    }
    if (ibanElement.length > 0) {
      ibanElement[0].textContent = ibanData.Iban;
    } else {
      const newIban = this.xmlDoc.createElementNS(this.namespace, "Iban");
      newIban.textContent = ibanData.Iban;
      ibanLinha.appendChild(newIban);
    }

    // Definir BIC (se existir)
    if (ibanData.Bic) {
      let bicElement = ibanLinha.getElementsByTagNameNS(this.namespace, "Bic");
      if (bicElement.length === 0) {
        bicElement = ibanLinha.getElementsByTagName("Bic");
      }
      if (bicElement.length > 0) {
        bicElement[0].textContent = ibanData.Bic;
      } else {
        const newBic = this.xmlDoc.createElementNS(this.namespace, "Bic");
        newBic.textContent = ibanData.Bic;
        ibanLinha.appendChild(newBic);
      }
    }
  }

  updateOrCreateSoma(parentElement, tagName, value) {
    let element = parentElement.getElementsByTagNameNS(this.namespace, tagName);
    if (element.length === 0) {
      element = parentElement.getElementsByTagName(tagName);
    }

    if (element.length > 0) {
      element[0].textContent = value;
    } else if (value !== "0.00") {
      const newElement = this.xmlDoc.createElementNS(this.namespace, tagName);
      newElement.textContent = value;
      parentElement.appendChild(newElement);
    }
  }

  // Helper para atualizar ou criar elemento simples
  updateOrCreateElement(parentElement, tagName, value) {
    let element = parentElement.getElementsByTagNameNS(this.namespace, tagName);
    if (element.length === 0) {
      element = parentElement.getElementsByTagName(tagName);
    }

    if (element.length > 0) {
      element[0].textContent = value;
    } else {
      const newElement = this.xmlDoc.createElementNS(this.namespace, tagName);
      newElement.textContent = value;
      parentElement.appendChild(newElement);
    }
  }

  updateTableRows(parentElement, tableName, rowName, dataRows, fieldMappings) {
    if (!dataRows || dataRows.length === 0) {
      return;
    }

    let table = parentElement.getElementsByTagNameNS(this.namespace, tableName);
    if (table.length === 0) {
      table = parentElement.getElementsByTagName(tableName);
    }

    let tableElement = null;
    if (table.length > 0) {
      tableElement = table[0];
      const rows = tableElement.getElementsByTagNameNS(this.namespace, rowName);
      const altRows = tableElement.getElementsByTagName(rowName);
      const existingRows = rows.length > 0 ? rows : altRows;

      for (let i = existingRows.length - 1; i >= 0; i--) {
        existingRows[i].remove();
      }
    } else {
      tableElement = this.xmlDoc.createElementNS(this.namespace, tableName);
      parentElement.appendChild(tableElement);
    }

    // Criar novas linhas com os dados
    dataRows.forEach((row, idx) => {
      const rowElement = this.xmlDoc.createElementNS(this.namespace, rowName);
      rowElement.setAttribute("numero", String(idx + 1));

      fieldMappings.forEach((mapping) => {
        let value = row[mapping.field];

        if (value) {
          if (mapping.format === "decimal") {
            value = this.formatDecimal(value);
          } else if (mapping.format === "number") {
            value = this.formatNumberValue(value);
          } else {
            value = this.formatTextValue(value);
          }

          if (value && value !== "") {
            const fieldElement = this.xmlDoc.createElementNS(
              this.namespace,
              mapping.field,
            );
            fieldElement.textContent = value;
            rowElement.appendChild(fieldElement);
          }
        }
      });

      if (rowElement.children.length > 0) {
        tableElement.appendChild(rowElement);
      }
    });
  }

  getFooterValue(tableContainerId, fieldName) {
    const container = document.getElementById(tableContainerId);
    if (!container) return 0;

    const footerCells = container.querySelectorAll(".footer-group-cell");
    for (const cell of footerCells) {
      const field = cell.getAttribute("data-footer-field");
      if (field === fieldName) {
        const value = cell.getAttribute("data-footer-value");
        return parseFloat(value) || 0;
      }
    }
    return 0;
  }

  formatNumberValue(value) {
    if (!value && value !== 0) return "";
    let cleanValue = String(value).trim();
    cleanValue = cleanValue.replace(",", ".");
    const num = parseFloat(cleanValue);
    if (isNaN(num)) return "";
    // Se for inteiro, não mostrar decimais
    if (num === Math.floor(num)) {
      return num.toString();
    }
    return num.toString();
  }

  formatTextValue(value) {
    if (!value) return "";
    return String(value).trim();
  }

  formatDecimal(value) {
    if (!value && value !== 0) return "";
    let cleanValue = String(value).trim();
    cleanValue = cleanValue.replace(",", ".");
    const num = parseFloat(cleanValue);
    if (isNaN(num)) return "";
    return num.toFixed(2);
  }
}
