export class XMLExporter {
  constructor(originalXmlString, editedData, includedAnexos) {
    this.originalXmlString = originalXmlString;
    this.editedData = editedData;
    this.includedAnexos = includedAnexos;
    this.xmlDoc = null;
    this.namespace = "http://www.dgci.gov.pt/2009/Modelo3IRSv2026";
  }

  export() {
    try {
      const parser = new DOMParser();
      this.xmlDoc = parser.parseFromString(this.originalXmlString, "text/xml");

      const parserError = this.xmlDoc.querySelector("parsererror");
      if (parserError) {
        throw new Error("XML original mal formatado");
      }

      const rostoData = this.getRostoData();

      if (this.includedAnexos.anexoG) this.updateAnexoG(rostoData);
      if (this.includedAnexos.anexoH) this.updateAnexoH(rostoData);
      if (this.includedAnexos.anexoJ) this.updateAnexoJ(rostoData);

      return {
        success: true,
        xml: this.cleanXML(new XMLSerializer().serializeToString(this.xmlDoc)),
        message: "XML exportado com sucesso",
      };
    } catch (error) {
      console.error("Erro na exportação:", error);
      return { success: false, error: error.message };
    }
  }

  getRostoData() {
    let ano = "";
    let nif = "";

    let anoElement = this.xmlDoc.getElementsByTagNameNS(
      this.namespace,
      "Q02C01",
    );
    if (anoElement.length === 0) {
      anoElement = this.xmlDoc.getElementsByTagName("Q02C01");
    }
    if (anoElement.length > 0 && anoElement[0].textContent) {
      ano = anoElement[0].textContent.trim();
    }

    let nifElement = this.xmlDoc.getElementsByTagNameNS(
      this.namespace,
      "Q03C01",
    );
    if (nifElement.length === 0) {
      nifElement = this.xmlDoc.getElementsByTagName("Q03C01");
    }
    if (nifElement.length > 0 && nifElement[0].textContent) {
      nif = nifElement[0].textContent.trim();
    }

    return { ano, nif };
  }

  cleanXML(xmlString) {
    return xmlString.replace(/>\s+</g, "><");
  }

  // ============ MÉTODOS AUXILIARES GERAIS ============

  getOrCreateElement(parent, tagName) {
    let element = parent.getElementsByTagNameNS(this.namespace, tagName);
    if (element.length === 0) {
      element = parent.getElementsByTagName(tagName);
    }
    if (element.length > 0) return element[0];

    const newElement = this.xmlDoc.createElementNS(this.namespace, tagName);
    parent.appendChild(newElement);
    return newElement;
  }

  getOrCreateQuadro(anexo, quadroName) {
    let quadro = anexo.getElementsByTagNameNS(this.namespace, quadroName);
    if (quadro.length === 0) {
      quadro = anexo.getElementsByTagName(quadroName);
    }
    if (quadro.length === 0) {
      const newQuadro = this.xmlDoc.createElementNS(this.namespace, quadroName);
      anexo.appendChild(newQuadro);
      return newQuadro;
    }
    return quadro[0];
  }

  ensureChildElements(parentElement, childTagNames) {
    childTagNames.forEach((tagName) => {
      let element = parentElement.getElementsByTagNameNS(
        this.namespace,
        tagName,
      );
      if (element.length === 0) {
        element = parentElement.getElementsByTagName(tagName);
      }
      if (element.length === 0) {
        const newElement = this.xmlDoc.createElementNS(this.namespace, tagName);
        parentElement.appendChild(newElement);
      }
    });
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

  updateOrCreateElement(parentElement, tagName, value) {
    if (!value || value === "") return;

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
    if (!dataRows || dataRows.length === 0) return;

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

    dataRows.forEach((row, idx) => {
      const rowElement = this.xmlDoc.createElementNS(this.namespace, rowName);
      rowElement.setAttribute("numero", String(idx + 1));

      fieldMappings.forEach((mapping) => {
        let value = row[mapping.field];
        if (value !== undefined && value !== null && value !== "") {
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

  removeTableFromQuadro(quadro, tableName) {
    let table = quadro.getElementsByTagNameNS(this.namespace, tableName);
    if (table.length === 0) {
      table = quadro.getElementsByTagName(tableName);
    }
    if (table.length > 0) {
      table[0].remove();
    }
  }

  removeSomasFromQuadro(quadro, somaNames) {
    somaNames.forEach((somaName) => {
      let soma = quadro.getElementsByTagNameNS(this.namespace, somaName);
      if (soma.length === 0) {
        soma = quadro.getElementsByTagName(somaName);
      }
      if (soma.length > 0) {
        soma[0].remove();
      }
    });
  }

  formatNumberValue(value) {
    if (!value && value !== 0) return "";
    let cleanValue = String(value).trim().replace(",", ".");
    const num = parseFloat(cleanValue);
    if (isNaN(num)) return "";
    if (num === Math.floor(num)) return num.toString();
    return num.toString();
  }

  formatTextValue(value) {
    if (!value) return "";
    return String(value).trim();
  }

  formatDecimal(value) {
    if (!value && value !== 0) return "";
    const num = parseFloat(String(value).trim().replace(",", "."));
    if (isNaN(num)) return "";
    return num.toFixed(2);
  }

  // ============ MÉTODOS DE GARANTIA DE QUADROS OBRIGATÓRIOS ============

  /**
   * Garante que os Quadros obrigatórios (Quadro02 e Quadro03) existem e estão preenchidos
   * @param {Element} anexo - Elemento do anexo
   * @param {Object} rostoData - Dados do Rosto {ano, nif}
   * @param {Object} options - Opções específicas (ex: temC03 para Anexo J)
   */
  ensureObrigatoriosAnexo(anexo, rostoData, options = {}) {
    // Quadro02 - Ano
    let quadro02 = this.getOrCreateQuadro(anexo, "Quadro02");
    this.updateOrCreateElement(
      quadro02,
      options.quadro02TagName || "AnexoGq02C01",
      rostoData.ano || "",
    );

    // Quadro03 - NIF
    let quadro03 = this.getOrCreateQuadro(anexo, "Quadro03");
    this.updateOrCreateElement(
      quadro03,
      options.quadro03TagName01 || "AnexoGq03C01",
      rostoData.nif || "",
    );

    // Para Anexo J, também precisa do campo C03
    if (options.hasC03) {
      this.updateOrCreateElement(
        quadro03,
        options.quadro03TagName03 || "AnexoJq03C03",
        rostoData.nif || "",
      );
    }
  }

  // ============ UPDATE ANEXO G ============
  // Suporta: Quadro09 (ponto 9.A) e Quadro15 (ponto 15)
  updateAnexoG(rostoData) {
    const data = this.editedData.anexoG || {};
    const rows = data.quadro09 || [];

    console.log("🔍 updateAnexoG - rows.length:", rows.length);

    let anexoG = this.xmlDoc.getElementsByTagNameNS(this.namespace, "AnexoG");
    if (anexoG.length === 0) {
      anexoG = this.xmlDoc.getElementsByTagName("AnexoG");
    }

    const hasUserData = rows.length > 0;
    const anexoExistsInXml = anexoG.length > 0;

    // Criar Anexo G se necessário
    if (hasUserData && !anexoExistsInXml) {
      console.log(
        "📝 Anexo G não existe no XML, a criar com dados do utilizador",
      );
      const newAnexo = this.xmlDoc.createElementNS(this.namespace, "AnexoG");
      this.xmlDoc.documentElement.appendChild(newAnexo);
      anexoG = [newAnexo];
    }

    if (!hasUserData && !anexoExistsInXml) {
      console.log("ℹ️ Anexo G não existe no XML e utilizador sem dados");
      return;
    }

    const anexo = anexoG[0];

    // ========== QUADROS OBRIGATÓRIOS ==========
    this.ensureObrigatoriosAnexo(anexo, rostoData, {
      quadro02TagName: "AnexoGq02C01",
      quadro03TagName01: "AnexoGq03C01",
    });

    // ========== QUADRO 09 (ponto 9.A) - replace da tabela ==========
    let quadro09 = this.getOrCreateQuadro(anexo, "Quadro09");
    this.removeTableFromQuadro(quadro09, "AnexoGq09T01");
    this.removeSomasFromQuadro(quadro09, [
      "AnexoGq09T01SomaC01",
      "AnexoGq09T01SomaC02",
      "AnexoGq09T01SomaC03",
    ]);

    if (hasUserData) {
      this.updateTableRows(
        quadro09,
        "AnexoGq09T01",
        "AnexoGq09T01-Linha",
        rows,
        [
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
        ],
      );

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
        quadro09,
        "AnexoGq09T01SomaC01",
        somaRealizacao.toFixed(2),
      );
      this.updateOrCreateSoma(
        quadro09,
        "AnexoGq09T01SomaC02",
        somaAquisicao.toFixed(2),
      );
      this.updateOrCreateSoma(
        quadro09,
        "AnexoGq09T01SomaC03",
        somaDespesas.toFixed(2),
      );
    }

    // ========== QUADRO 15 (ponto 15) ==========
    let quadro15 = this.getOrCreateQuadro(anexo, "Quadro15");
    const englobamento = data.englobamento || "N";
    this.updateOrCreateElement(quadro15, "AnexoGq15B01", englobamento);

    // ========== REMOVER SE VAZIO ==========
    if (!hasUserData && !this.hasOtherDataInAnexoG(anexo)) {
      console.log(
        "🗑️ Anexo G removido - utilizador sem dados e XML sem outros dados",
      );
      anexo.remove();
    }
  }

  hasOtherDataInAnexoG(anexoElement) {
    const quadrosToCheck = [
      "Quadro04",
      "Quadro05",
      "Quadro06",
      "Quadro07",
      "Quadro08",
      "Quadro10",
      "Quadro11",
      "Quadro12",
      "Quadro13",
      "Quadro14",
      "Quadro16",
      "Quadro17",
      "Quadro18",
      "Quadro19",
    ];
    return this.hasContentInQuadros(anexoElement, quadrosToCheck);
  }

  // ============ UPDATE ANEXO H ============
  // Suporta: Quadro06 ponto B (benefícios fiscais) e ponto C1 (declaração alternativa)
  updateAnexoH(rostoData) {
    const data = this.editedData.anexoH || {};
    const beneficios = data.beneficiosFiscais || [];

    console.log("🔍 updateAnexoH - beneficios.length:", beneficios.length);

    let anexoH = this.xmlDoc.getElementsByTagNameNS(this.namespace, "AnexoH");
    if (anexoH.length === 0) {
      anexoH = this.xmlDoc.getElementsByTagName("AnexoH");
    }

    const hasUserData = beneficios.length > 0;
    const anexoExistsInXml = anexoH.length > 0;

    // Criar Anexo H se necessário
    if (hasUserData && !anexoExistsInXml) {
      console.log(
        "📝 Anexo H não existe no XML, a criar com dados do utilizador",
      );
      const newAnexo = this.xmlDoc.createElementNS(this.namespace, "AnexoH");
      this.xmlDoc.documentElement.appendChild(newAnexo);
      anexoH = [newAnexo];
    }

    if (!hasUserData && !anexoExistsInXml) {
      console.log("ℹ️ Anexo H não existe no XML e utilizador sem dados");
      return;
    }

    const anexo = anexoH[0];

    // ========== QUADROS OBRIGATÓRIOS ==========
    this.ensureObrigatoriosAnexo(anexo, rostoData, {
      quadro02TagName: "AnexoHq02C01",
      quadro03TagName01: "AnexoHq03C01",
    });

    // ========== QUADRO 06 - PONTO B (Benefícios Fiscais) ==========
    let quadro06 = this.getOrCreateQuadro(anexo, "Quadro06");

    // Remover tabela antiga
    this.removeTableFromQuadro(quadro06, "AnexoHq06BT01");
    this.removeSomasFromQuadro(quadro06, ["AnexoHq06BT01SomaC01"]);

    if (hasUserData) {
      this.updateTableRows(
        quadro06,
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

      const somaImportancia = beneficios.reduce(
        (s, r) => s + (parseFloat(r.ImportanciaAplicada) || 0),
        0,
      );
      this.updateOrCreateSoma(
        quadro06,
        "AnexoHq06BT01SomaC01",
        somaImportancia.toFixed(2),
      );
    }

    // Garantir que os elementos CT existem
    this.ensureChildElements(quadro06, [
      "AnexoHq06CT01",
      "AnexoHq06CT02",
      "AnexoHq06CT03",
      "AnexoHq06CT04",
    ]);

    // ========== REMOVER SE VAZIO ==========
    if (!hasUserData && !this.hasOtherDataInAnexoH(anexo)) {
      console.log(
        "🗑️ Anexo H removido - utilizador sem dados e XML sem outros dados",
      );
      anexo.remove();
    }
  }

  hasOtherDataInAnexoH(anexoElement) {
    const quadrosToCheck = [
      "Quadro04",
      "Quadro05",
      "Quadro07",
      "Quadro08",
      "Quadro09",
      "Quadro10",
    ];
    return this.hasContentInQuadros(anexoElement, quadrosToCheck);
  }

  // ============ UPDATE ANEXO J ============
  // Suporta: Quadro04-07 (estruturas obrigatórias), Quadro08 (pontos A e B),
  // Quadro09.2 (A, B, C), Quadro10 (obrigatório), Quadro11 (IBAN)
  updateAnexoJ(rostoData) {
    const data = this.editedData.anexoJ || {};
    const rendimentosE = data.rendimentosCategoriaE || [];
    const maisValias = data.rendimentosCategoriaG || [];
    const maisValiasB = data.rendimentosCategoriaG_B || [];
    const iban = data.iban;
    const hasUserData =
      rendimentosE?.length ||
      maisValias?.length ||
      maisValiasB?.length ||
      iban?.length;

    let anexoJ = this.xmlDoc.getElementsByTagNameNS(this.namespace, "AnexoJ");
    if (anexoJ.length === 0) {
      anexoJ = this.xmlDoc.getElementsByTagName("AnexoJ");
    }

    const anexoExistsInXml = anexoJ.length > 0;

    // Criar Anexo J se necessário
    if (hasUserData && !anexoExistsInXml) {
      console.log(
        "📝 Anexo J não existe no XML, a criar com dados do utilizador",
      );
      const newAnexo = this.xmlDoc.createElementNS(this.namespace, "AnexoJ");
      this.xmlDoc.documentElement.appendChild(newAnexo);
      anexoJ = [newAnexo];
    }

    if (!hasUserData && !anexoExistsInXml) {
      console.log("ℹ️ Anexo J não existe no XML e utilizador sem dados");
      return;
    }

    const anexo = anexoJ[0];

    // ========== ATRIBUTO ID ==========
    if (rostoData.nif) {
      anexo.setAttribute("id", rostoData.nif);
    }

    // ========== QUADROS OBRIGATÓRIOS ==========
    // Quadro02 - Ano
    const quadro02 = this.getOrCreateQuadro(anexo, "Quadro02");
    this.updateOrCreateElement(quadro02, "AnexoJq02C01", rostoData.ano || "");

    // Quadro03 - NIF (dois campos)
    const quadro03 = this.getOrCreateQuadro(anexo, "Quadro03");
    this.updateOrCreateElement(quadro03, "AnexoJq03C01", rostoData.nif || "");
    this.updateOrCreateElement(quadro03, "AnexoJq03C03", rostoData.nif || "");

    // ========== QUADRO 04 (obrigatório, mesmo vazio) ==========
    const quadro04 = this.getOrCreateQuadro(anexo, "Quadro04");
    this.ensureChildElements(quadro04, ["AnexoJq04AT01", "AnexoJq04CT01"]);

    // ========== QUADRO 05 (obrigatório, mesmo vazio) ==========
    const quadro05 = this.getOrCreateQuadro(anexo, "Quadro05");
    this.ensureChildElements(quadro05, ["AnexoJq05AT01", "AnexoJq05CT01"]);

    // ========== QUADRO 06 (obrigatório, mesmo vazio) ==========
    const quadro06 = this.getOrCreateQuadro(anexo, "Quadro06");
    this.ensureChildElements(quadro06, ["AnexoJq06AT01", "AnexoJq06BT01"]);

    // ========== QUADRO 07 (obrigatório, mesmo vazio) ==========
    const quadro07 = this.getOrCreateQuadro(anexo, "Quadro07");
    this.ensureChildElements(quadro07, ["AnexoJq07AT01"]);

    // ========== QUADRO 08 - Rendimentos de capitais (ponto 8.A e 8.B) ==========
    const quadro08 = this.getOrCreateQuadro(anexo, "Quadro08");
    this.removeTableFromQuadro(quadro08, "AnexoJq08AT01");
    this.removeSomasFromQuadro(quadro08, [
      "AnexoJq08AT01SomaC01",
      "AnexoJq08AT01SomaC02",
      "AnexoJq08AT01SomaC03",
      "AnexoJq08AT01SomaC04",
    ]);

    if (rendimentosE.length > 0) {
      this.updateTableRows(
        quadro08,
        "AnexoJq08AT01",
        "AnexoJq08AT01-Linha",
        rendimentosE,
        [
          { field: "NLinha", format: "text" },
          { field: "CodRendimento", format: "text" },
          { field: "CodPais", format: "text" },
          { field: "RendimentoBruto", format: "decimal" },
          { field: "ImpostoPagoEstrangeiroPaisFonte", format: "decimal" },
          { field: "CodPaisAgentePagador", format: "text" },
          { field: "ImpostoRetidoAgente", format: "decimal" },
          { field: "NIFEntidadeRetentora", format: "text" },
          { field: "RetencaoFontePortugal", format: "decimal" },
        ],
      );

      const somaRendimento = rendimentosE.reduce(
        (s, r) => s + (parseFloat(r.RendimentoBruto) || 0),
        0,
      );
      const somaImposto = rendimentosE.reduce(
        (s, r) => s + (parseFloat(r.ImpostoPagoEstrangeiroPaisFonte) || 0),
        0,
      );
      const somaImpostoRetido = rendimentosE.reduce(
        (s, r) => s + (parseFloat(r.ImpostoRetidoAgente) || 0),
        0,
      );
      const somaRetencao = rendimentosE.reduce(
        (s, r) => s + (parseFloat(r.RetencaoFontePortugal) || 0),
        0,
      );

      this.updateOrCreateSoma(
        quadro08,
        "AnexoJq08AT01SomaC01",
        somaRendimento.toFixed(2),
      );
      this.updateOrCreateSoma(
        quadro08,
        "AnexoJq08AT01SomaC02",
        somaImposto.toFixed(2),
      );
      this.updateOrCreateSoma(
        quadro08,
        "AnexoJq08AT01SomaC03",
        somaImpostoRetido.toFixed(2),
      );
      this.updateOrCreateSoma(
        quadro08,
        "AnexoJq08AT01SomaC04",
        somaRetencao.toFixed(2),
      );

      const englobamentoSec8 = data.englobamentoSec8 || "N";
      this.updateOrCreateElement(quadro08, "AnexoJq08B01", englobamentoSec8);
    }

    // ========== QUADRO 09 - Mais-valias (pontos 9.2.A, 9.2.B e 9.2.C) ==========
    const quadro09 = this.getOrCreateQuadro(anexo, "Quadro09");

    // 9.2.A
    this.removeTableFromQuadro(quadro09, "AnexoJq092AT01");
    this.removeSomasFromQuadro(quadro09, [
      "AnexoJq092AT01SomaC01",
      "AnexoJq092AT01SomaC02",
      "AnexoJq092AT01SomaC03",
      "AnexoJq092AT01SomaC04",
    ]);

    if (maisValias.length > 0) {
      this.updateTableRows(
        quadro09,
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

      const somaRealizacao = maisValias.reduce(
        (s, r) => s + (parseFloat(r.ValorRealizacao) || 0),
        0,
      );
      const somaAquisicao = maisValias.reduce(
        (s, r) => s + (parseFloat(r.ValorAquisicao) || 0),
        0,
      );
      const somaDespesas = maisValias.reduce(
        (s, r) => s + (parseFloat(r.DespesasEncargos) || 0),
        0,
      );
      const somaImposto = maisValias.reduce(
        (s, r) => s + (parseFloat(r.ImpostoPagoNoEstrangeiro) || 0),
        0,
      );

      this.updateOrCreateSoma(
        quadro09,
        "AnexoJq092AT01SomaC01",
        somaRealizacao.toFixed(2),
      );
      this.updateOrCreateSoma(
        quadro09,
        "AnexoJq092AT01SomaC02",
        somaAquisicao.toFixed(2),
      );
      this.updateOrCreateSoma(
        quadro09,
        "AnexoJq092AT01SomaC03",
        somaDespesas.toFixed(2),
      );
      this.updateOrCreateSoma(
        quadro09,
        "AnexoJq092AT01SomaC04",
        somaImposto.toFixed(2),
      );
    }

    // 9.2.B
    this.removeTableFromQuadro(quadro09, "AnexoJq092BT01");
    this.removeSomasFromQuadro(quadro09, [
      "AnexoJq092BT01SomaC01",
      "AnexoJq092BT01SomaC02",
    ]);

    if (maisValiasB.length > 0) {
      this.updateTableRows(
        quadro09,
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

      const somaRendimento = maisValiasB.reduce(
        (s, r) => s + (parseFloat(r.RendimentoLiquido) || 0),
        0,
      );
      const somaImposto = maisValiasB.reduce(
        (s, r) => s + (parseFloat(r.ImpostoPagoEstrangeiro) || 0),
        0,
      );

      this.updateOrCreateSoma(
        quadro09,
        "AnexoJq092BT01SomaC01",
        somaRendimento.toFixed(2),
      );
      this.updateOrCreateSoma(
        quadro09,
        "AnexoJq092BT01SomaC02",
        somaImposto.toFixed(2),
      );
    } else {
      this.updateOrCreateSoma(quadro09, "AnexoJq092BT01SomaC01", "0.00");
      this.updateOrCreateSoma(quadro09, "AnexoJq092BT01SomaC02", "0.00");
    }

    // 9.2.C - Opção de englobamento
    const englobamento = data.englobamento || "N";
    this.updateOrCreateElement(quadro09, "AnexoJq092B01", englobamento);

    // ========== QUADRO 10 (obrigatório, mesmo vazio) ==========
    const quadro10 = this.getOrCreateQuadro(anexo, "Quadro10");
    this.ensureChildElements(quadro10, ["AnexoJq10AT01", "AnexoJq10BT01"]);

    // ========== QUADRO 11 - IBAN ==========
    const quadro11 = this.getOrCreateQuadro(anexo, "Quadro11");
    this.removeTableFromQuadro(quadro11, "AnexoJq11T01");

    if (iban?.length) {
      this.updateTableRows(
        quadro11,
        "AnexoJq11T01",
        "AnexoJq11T01-Linha",
        iban,
        [
          { field: "Iban", format: "text" },
          { field: "Bic", format: "text" },
        ],
      );
    }

    this.ensureChildElements(quadro11, ["AnexoJq11T02"]);

    // ========== REMOVER SE VAZIO ==========
    // Nota: Mesmo que o utilizador não tenha dados, mantemos os quadros obrigatórios (4-7, 10)
    // porque eles são estruturais. Só removemos o Anexo J se não houver dados do utilizador
    // E o XML original também não tiver dados relevantes.
    if (!hasUserData && !this.hasOtherDataInAnexoJ(anexo)) {
      console.log(
        "🗑️ Anexo J removido - utilizador sem dados e XML sem outros dados",
      );
      anexo.remove();
    }
  }

  hasOtherDataInAnexoJ(anexoElement) {
    const quadrosToCheck = [
      "Quadro04",
      "Quadro05",
      "Quadro06",
      "Quadro07",
      "Quadro10",
    ];
    return this.hasContentInQuadros(anexoElement, quadrosToCheck);
  }

  // ============ MÉTODO AUXILIAR COMUM PARA VERIFICAÇÃO DE CONTEÚDO ============

  /**
   * Verifica se algum dos quadros especificados tem conteúdo não vazio
   * @param {Element} anexoElement - Elemento raiz do anexo
   * @param {string[]} quadroNames - Lista de nomes dos quadros a verificar
   * @returns {boolean} - True se algum quadro tiver conteúdo
   */
  hasContentInQuadros(anexoElement, quadroNames) {
    for (const quadroName of quadroNames) {
      let quadro = anexoElement.getElementsByTagNameNS(
        this.namespace,
        quadroName,
      );
      if (quadro.length === 0) {
        quadro = anexoElement.getElementsByTagName(quadroName);
      }
      if (quadro.length > 0 && this.hasNonEmptyContent(quadro[0])) {
        console.log(`hasContentInQuadros - ${quadroName} tem conteúdo`);
        return true;
      }
    }
    return false;
  }

  /**
   * Verifica recursivamente se um elemento tem conteúdo não vazio
   * @param {Element} element - Elemento a verificar
   * @returns {boolean} - True se tiver conteúdo relevante
   */
  hasNonEmptyContent(element) {
    for (const child of element.children) {
      const tagName = child.localName || child.tagName;

      // Ignorar elementos de soma
      if (tagName.includes("Soma")) {
        continue;
      }

      // Verificar se é uma tabela com linhas
      if (tagName.includes("T01") && child.children.length > 0) {
        return true;
      }

      // Verificar elemento de englobamento (se for "S" é conteúdo relevante)
      if (
        (tagName === "AnexoGq15B01" ||
          tagName === "AnexoJq092B01" ||
          tagName === "AnexoJq08B01") &&
        child.textContent?.trim() === "S"
      ) {
        return true;
      }

      // Verificar declaração alternativa do Anexo H
      if (tagName === "AnexoHq06B01" && child.textContent?.trim() === "S") {
        return true;
      }

      // Verificar outros elementos com texto não vazio
      if (
        child.textContent &&
        child.textContent.trim() !== "" &&
        child.textContent.trim() !== "0.00"
      ) {
        if (child.children.length === 0) {
          return true;
        }
      }

      // Verificar recursivamente os filhos
      if (child.children.length > 0 && this.hasNonEmptyContent(child)) {
        return true;
      }
    }
    return false;
  }
}
