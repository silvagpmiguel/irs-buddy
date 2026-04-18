// src/js/form-renderer.js
import { DynamicTable } from "./table.js";
import {
  CatalogoBeneficios,
  CatalogoCodigosRendimento,
  CatalogoPaises,
} from "./constants/catalogs.js";

export class FormRenderer {
  constructor(data, onDataChange) {
    this.data = data;
    this.onDataChange = onDataChange;
    this.tables = {};
  }

  // ============ ANEXO G ============
  renderAnexoGForm() {
    const anexoG = this.data.anexoG || {};
    const isIncluded = anexoG.incluir !== false;

    return `
        <div id="anexoGContent" class="${!isIncluded ? "disabled-section-content" : ""}">
            <div class="card-header">
                <div class="card-header-left">
                    <div class="card-icon">📈</div>
                    <h2 class="card-title">Anexo G - Mais-Valias e Rendimentos de Capitais</h2>
                </div>
                <div class="toggle-container">
                    <label class="toggle-switch">
                        <input type="checkbox" id="incluirAnexoG" class="toggle-input" ${isIncluded ? "checked" : ""}>
                        <span class="toggle-slider"></span>
                    </label>
                    <span class="toggle-label">Incluir Anexo G</span>
                </div>
            </div>
            
            <div class="${!isIncluded ? "disabled-section-content" : ""}">
                <div class="form-section">
                    <h3>📈 Mais-Valias de Ações / Fundos</h3>
                    <div id="maisValiasGContainer"></div>
                </div>
            </div>
        </div>
    `;
  }

  initMaisValiasGTable() {
    const container = document.getElementById("maisValiasGContainer");
    if (!container) return;

    const anexoG = this.data.anexoG || {};
    const maisValias = anexoG.alienacaoParticipacoes || [];

    if (this.tables.maisValiasG) {
      container.innerHTML = "";
    }

    this.tables.maisValiasG = new DynamicTable("maisValiasGContainer", {
      data: maisValias.map((mv, idx) => ({
        NIFEntidades: mv.NIFEntidades || "",
        ValorRealizacao: mv.ValorRealizacao || "",
        ValorAquisicao: mv.ValorAquisicao || "",
      })),
      headers: [
        {
          label: "NIF da Entidade",
          field: "NIFEntidades",
          type: "text",
          class: "col-nif",
        },
        {
          label: "Valor de Realização (€)",
          field: "ValorRealizacao",
          type: "number",
          class: "col-valor",
        },
        {
          label: "Valor de Aquisição (€)",
          field: "ValorAquisicao",
          type: "number",
          class: "col-valor",
        },
        {
          label: "Mais-Valia (€)",
          field: "MaisValia",
          type: "computed",
          class: "col-valor",
        },
      ],
      onChange: (newData) => {
        if (!this.data.anexoG) this.data.anexoG = {};
        this.data.anexoG.alienacaoParticipacoes = newData;
        this.onDataChange(this.data);
      },
    });
  }

  // ============ ANEXO H ============
  renderAnexoHForm() {
    const anexoH = this.data.anexoH || {};
    const isIncluded = anexoH.incluir !== false;
    const declaracaoAlternativa = anexoH.declaracaoAlternativa || "N";

    return `
        <div id="anexoHContent" class="${!isIncluded ? "disabled-section-content" : ""}">
            <div class="card-header">
                <div class="card-header-left">
                    <div class="card-icon">🏥</div>
                    <h2 class="card-title">Anexo H - Benefícios Fiscais e Deduções</h2>
                </div>
                <div class="toggle-container">
                    <label class="toggle-switch">
                        <input type="checkbox" id="incluirAnexoH" class="toggle-input" ${isIncluded ? "checked" : ""}>
                        <span class="toggle-slider"></span>
                    </label>
                    <span class="toggle-label">Incluir Anexo H</span>
                </div>
            </div>
            
            <div class="${!isIncluded ? "disabled-section-content" : ""}">
                <!-- Secção 6 - Deduções à Coleta -->
                <div class="form-section">
                    <h3>6. Deduções à Coleta</h3>
                    
                    <!-- Subsecção B - Benefícios Fiscais -->
                    <div class="sub-section">
                        <h4>B - Benefícios Fiscais e Despesas Relativas a Pessoas com Deficiência</h4>
                        <div id="beneficiosTableContainer" class="table-container"></div>
                    </div>
                </div>
                
                <!-- Secção C - Despesas -->
                <div class="form-section">
                    <h3>C. Despesas de Saúde, Formação e Educação, Encargos com Imóveis, com Lares e com Retribuição pela Prestação de Trabalho Doméstico</h3>
                    
                    <!-- Subsecção C1 -->
                    <div class="sub-section">
                        <h4>C1. Agregado Familiar</h4>
                        <div class="question-box">
                            <p class="question-text">Em alternativa aos valores comunicados à Autoridade Tributária e Aduaneira (AT), pretende declarar as despesas de saúde, de formação e educação, os encargos com imóveis, os encargos com lares relativos ao agregado familiar e encargos com retribuição pela prestação de trabalho doméstico?</p>
                            <div class="radio-group">
                                <label class="radio-label">
                                    <input type="radio" name="declaracaoAlternativa" value="S" ${declaracaoAlternativa === "S" ? "checked" : ""} ${!isIncluded ? "disabled" : ""}>
                                    <span>Sim</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="declaracaoAlternativa" value="N" ${declaracaoAlternativa === "N" ? "checked" : ""} ${!isIncluded ? "disabled" : ""}>
                                    <span>Não</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
  }

  initBeneficiosTable() {
    const container = document.getElementById("beneficiosTableContainer");
    if (!container) return;

    const anexoH = this.data.anexoH || {};
    const beneficios = anexoH.beneficiosFiscais || [];
    const isIncluded = anexoH.incluir !== false;

    if (this.tables.beneficios) {
      container.innerHTML = "";
    }

    const nifTitular = anexoH.nif || "";

    this.tables.beneficios = new DynamicTable("beneficiosTableContainer", {
      data: beneficios.map((b) => ({
        CodBeneficio: b.CodBeneficio || "",
        Titular: "A",
        ImportanciaAplicada: b.ImportanciaAplicada || "",
        NifPortugues: b.NifPortugues || "",
        Pais: b.Pais || "",
        NumeroFiscalUE: b.NumeroFiscalUE || "",
      })),
      headers: [
        {
          label: "Código do Benefício",
          field: "CodBeneficio",
          type: "select",
          class: "col-codigo",
        },
        {
          label: "Titular",
          field: "Titular",
          type: "static-text",
          class: "col-titular",
          formatter: (value, rowIdx, rowData) => {
            return `A - ${nifTitular}`;
          },
        },
        {
          label: "Importância Aplicada",
          field: "ImportanciaAplicada",
          type: "number",
          class: "col-valor",
        },
        {
          label: "Entidade Gestora / Donatária",
          field: "EntidadeGestora",
          class: "col-entidade",
          subHeaders: [
            {
              label: "NIF Português",
              field: "NifPortugues",
              type: "text",
              class: "col-nif",
            },
            {
              label: "País",
              field: "Pais",
              type: "select",
              class: "col-pais",
            },
            {
              label: "Número Fiscal (UE ou EEE)",
              field: "NumeroFiscalUE",
              type: "text",
              class: "col-numero-fiscal",
            },
          ],
        },
      ],
      catalogs: {
        CodBeneficio: CatalogoBeneficios,
        Pais: CatalogoPaises,
      },
      footerGroups: [
        {
          label: "Soma de Controlo",
          value: (rows) => {
            const soma = rows.reduce((acc, row) => {
              return acc + (parseFloat(row.ImportanciaAplicada) || 0);
            }, 0);
            return soma.toFixed(2) + " €";
          },
        },
      ],
      onChange: (newData) => {
        if (!this.data.anexoH) this.data.anexoH = {};

        const cleanData = newData.map((row) => ({
          CodBeneficio: row.CodBeneficio,
          Titular: row.Titular,
          ImportanciaAplicada: row.ImportanciaAplicada,
          NifPortugues: row.NifPortugues,
          Pais: row.Pais,
          NumeroFiscalUE: row.NumeroFiscalUE,
        }));

        this.data.anexoH.beneficiosFiscais = cleanData;
        this.onDataChange(this.data);
      },
    });

    // Aplicar estado inicial do toggle
    if (!isIncluded) {
      this.tables.beneficios.setEnabled(false);
    }
  }

  // ============ ANEXO J ============
  renderAnexoJForm() {
    const anexoJ = this.data.anexoJ || {};
    const isIncluded = anexoJ.incluir !== false;

    return `
        <div id="anexoJContent" class="${!isIncluded ? "disabled-section-content" : ""}">
            <div class="card-header">
                <div class="card-header-left">
                    <div class="card-icon">🌍</div>
                    <h2 class="card-title">Anexo J - Rendimentos Estrangeiros</h2>
                </div>
                <div class="toggle-container">
                    <label class="toggle-switch">
                        <input type="checkbox" id="incluirAnexoJ" class="toggle-input" ${isIncluded ? "checked" : ""}>
                        <span class="toggle-slider"></span>
                    </label>
                    <span class="toggle-label">Incluir Anexo J</span>
                </div>
            </div>
            
            <div class="${!isIncluded ? "disabled-section-content" : ""}">
                <!-- Secção 8. Rendimentos Capitais (Categoria E) -->
                <div class="form-section">
                    <h3>8. Rendimentos Capitais (Categoria E)</h3>
                    <div class="sub-section">
                        <h4>A - Rendimentos de Juros</h4>
                        <div id="rendimentosJurosContainer"></div>
                    </div>
                </div>
                
                <!-- Secção 9. Rendimentos de Incrementos Patrimoniais (Categoria G) -->
                <div class="form-section">
                    <h3>9. Rendimentos de Incrementos Patrimoniais (Categoria G)</h3>
                    
                    <!-- Subsecção 9.2 Incrementos Patrimoniais de Opção de Englobamento -->
                    <div class="sub-section">
                        <h4>9.2 Incrementos Patrimoniais de Opção de Englobamento</h4>
                        
                        <!-- Subsecção A. Alienação Onerosa de Partes Sociais e Outros Valores Mobiliários -->
                        <div class="sub-section">
                            <h5>A. Alienação Onerosa de Partes Sociais e Outros Valores Mobiliários [art.º 10.º, n.º 1, al. b), do CIRS]</h5>
                            <div id="maisValiasJContainer"></div>
                        </div>
                        
                        <!-- Subsecção C. Opção de Englobamento -->
                        <div class="sub-section">
                            <h5>C. Opção de Englobamento</h5>
                            <div class="question-box">
                                <p class="question-text">1 - Opta pelo englobamento dos rendimentos do quadro 9.2?</p>
                                <div class="radio-group">
                                    <label class="radio-label">
                                        <input type="radio" name="englobamento" value="S" ${anexoJ.englobamento === "S" ? "checked" : ""} ${!isIncluded ? "disabled" : ""}>
                                        <span>Sim</span>
                                    </label>
                                    <label class="radio-label">
                                        <input type="radio" name="englobamento" value="N" ${anexoJ.englobamento === "N" ? "checked" : ""} ${!isIncluded ? "disabled" : ""}>
                                        <span>Não</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Secção 11. Contas de Depósitos ou de Títulos Abertas Fora do Território Português -->
                <div class="form-section">
                    <h3>11. Contas de Depósitos ou de Títulos Abertas Fora do Território Português</h3>
                    <div id="ibanContainer"></div>
                </div>
            </div>
        </div>
    `;
  }

  initRendimentosJurosTable() {
    const container = document.getElementById("rendimentosJurosContainer");
    if (!container) return;

    const anexoJ = this.data.anexoJ || {};
    const rendimentos = anexoJ.rendimentosCategoriaE || [];

    if (this.tables.rendimentosJuros) {
      container.innerHTML = "";
    }

    // Número da linha inicial (801)
    let nextLinha = 801;
    if (rendimentos.length > 0) {
      const maxLinha = Math.max(
        ...rendimentos.map((r) => parseInt(r.NLinha) || 0),
      );
      nextLinha = Math.max(801, maxLinha + 1);
    }

    this.tables.rendimentosJuros = new DynamicTable(
      "rendimentosJurosContainer",
      {
        data: rendimentos.map((r, idx) => ({
          NLinha: r.NLinha || 801 + idx,
          CodRendimento: r.CodRendimento || "",
          CodPais: r.CodPais || "",
          RendimentoBruto: r.RendimentoBruto || "",
          ImpostoPagoEstrangeiro: r.ImpostoPagoEstrangeiro || "",
          CodPaisPagador: r.CodPaisPagador || "",
          ImpostoRetido: r.ImpostoRetido || "",
          NifEntidadeRetentora: r.NifEntidadeRetentora || "",
          RetencaoFonte: r.RetencaoFonte || "",
        })),
        headers: [
          {
            label: "Nº Linha (801 a ...)",
            field: "NLinha",
            type: "auto-number",
            class: "col-nlinha",
          },
          {
            label: "Código Rendimento",
            field: "CodRendimento",
            type: "select",
            class: "col-codigo",
          },
          {
            label: "País da Fonte",
            field: "CodPais",
            type: "select",
            class: "col-pais",
          },
          {
            label: "Rendimento Bruto",
            field: "RendimentoBruto",
            type: "number",
            class: "col-valor",
          },
          {
            label: "Imposto Pago no Estrangeiro",
            field: "ImpostoPagoEstrangeiroGroup",
            class: "col-imposto-estrangeiro",
            subHeaders: [
              {
                label: "No país da fonte",
                field: "ImpostoPagoEstrangeiro",
                type: "number",
                class: "col-valor",
              },
              {
                label: "País do Agente Pagador Diretiva da Poupança 2003/48/CE",
                field: "PaisAgentePagadorGroup",
                class: "col-pais-agente",
                subHeaders: [
                  {
                    label: "Código do País",
                    field: "CodPaisPagador",
                    type: "select",
                    class: "col-pais",
                  },
                  {
                    label: "Imposto retido",
                    field: "ImpostoRetido",
                    type: "number",
                    class: "col-valor",
                  },
                ],
              },
            ],
          },
          {
            label: "Imposto Retido em Portugal",
            field: "ImpostoRetidoPortugalGroup",
            class: "col-imposto-portugal",
            subHeaders: [
              {
                label: "NIF da Entidade Retentora",
                field: "NifEntidadeRetentora",
                type: "text",
                class: "col-nif",
              },
              {
                label: "Retenção na Fonte",
                field: "RetencaoFonte",
                type: "number",
                class: "col-valor",
              },
            ],
          },
        ],
        catalogs: {
          CodRendimento: CatalogoCodigosRendimento,
          CodPais: CatalogoPaises,
          CodPaisPagador: CatalogoPaises,
        },
        onChange: (newData) => {
          if (!this.data.anexoJ) this.data.anexoJ = {};
          this.data.anexoJ.rendimentosCategoriaE = newData;
          this.onDataChange(this.data);
        },
      },
    );
  }

  // Método auxiliar para gerar números de linha automaticamente
  generateLinhaNumber(row, idx, tableData) {
    return 801 + idx;
  }

  initMaisValiasJTable() {
    const container = document.getElementById("maisValiasJContainer");
    if (!container) return;

    const anexoJ = this.data.anexoJ || {};
    const maisValias = anexoJ.rendimentosCategoriaG || [];

    if (this.tables.maisValiasJ) {
      container.innerHTML = "";
    }

    // Número da linha inicial (951)
    let nextLinha = 951;
    if (maisValias.length > 0) {
      const maxLinha = Math.max(
        ...maisValias.map((r) => parseInt(r.NLinha) || 0),
      );
      nextLinha = Math.max(951, maxLinha + 1);
    }

    this.tables.maisValiasJ = new DynamicTable("maisValiasJContainer", {
      data: maisValias.map((mv, idx) => ({
        NLinha: mv.NLinha || 951 + idx,
        CodPais: mv.CodPais || "",
        Codigo: mv.Codigo || "",
        AnoRealizacao: mv.AnoRealizacao || "",
        MesRealizacao: mv.MesRealizacao || "",
        DiaRealizacao: mv.DiaRealizacao || "",
        ValorRealizacao: mv.ValorRealizacao || "",
        AnoAquisicao: mv.AnoAquisicao || "",
        MesAquisicao: mv.MesAquisicao || "",
        DiaAquisicao: mv.DiaAquisicao || "",
        ValorAquisicao: mv.ValorAquisicao || "",
        DespesasEncargos: mv.DespesasEncargos || "",
        ImpostoPagoNoEstrangeiro: mv.ImpostoPagoNoEstrangeiro || "",
        CodPaisContraparte: mv.CodPaisContraparte || "",
        RespeitaValoresMobiliarios: mv.RespeitaValoresMobiliarios || "",
      })),
      headers: [
        {
          label: "Nº Linha (951 a ...)",
          field: "NLinha",
          type: "auto-number",
          class: "col-nlinha",
        },
        {
          label: "País da Fonte",
          field: "CodPais",
          type: "select",
          class: "col-pais",
        },
        {
          label: "Código",
          field: "Codigo",
          type: "select-static",
          options: [
            {
              value: "G01",
              label: "G01 - Alienação onerosa de ações/partes sociais",
            },
            {
              value: "G02",
              label: "G02 - Alienação onerosa de outros valores mobiliários",
            },
            { value: "G03", label: "G03 - Outras alienações" },
          ],
          class: "col-codigo",
        },
        {
          label: "Realização",
          field: "RealizacaoGroup",
          class: "col-realizacao",
          subHeaders: [
            {
              label: "Ano",
              field: "AnoRealizacao",
              type: "number",
              class: "col-data",
            },
            {
              label: "Mês",
              field: "MesRealizacao",
              type: "number",
              class: "col-data",
            },
            {
              label: "Dia",
              field: "DiaRealizacao",
              type: "number",
              class: "col-data",
            },
            {
              label: "Valor",
              field: "ValorRealizacao",
              type: "number",
              class: "col-valor",
            },
          ],
        },
        {
          label: "Aquisição",
          field: "AquisicaoGroup",
          class: "col-aquisicao",
          subHeaders: [
            {
              label: "Ano",
              field: "AnoAquisicao",
              type: "number",
              class: "col-data",
            },
            {
              label: "Mês",
              field: "MesAquisicao",
              type: "number",
              class: "col-data",
            },
            {
              label: "Dia",
              field: "DiaAquisicao",
              type: "number",
              class: "col-data",
            },
            {
              label: "Valor",
              field: "ValorAquisicao",
              type: "number",
              class: "col-valor",
            },
          ],
        },
        {
          label: "Despesas e Encargos",
          field: "DespesasEncargos",
          type: "number",
          class: "col-valor",
        },
        {
          label: "Imposto pago no Estrangeiro",
          field: "ImpostoPagoNoEstrangeiro",
          type: "number",
          class: "col-valor",
        },
        {
          label: "País da Contraparte",
          field: "CodPaisContraparte",
          type: "select",
          class: "col-pais",
        },
        {
          label:
            "Respeita a valores mobiliários admitidos à negociação ou a partes de OIC abertos?",
          field: "RespeitaValoresMobiliarios",
          type: "select-static",
          options: [
            { value: "S", label: "Sim" },
            { value: "N", label: "Não" },
          ],
          class: "col-booleano",
        },
      ],
      catalogs: {
        CodPais: CatalogoPaises,
        CodPaisContraparte: CatalogoPaises,
      },
      onChange: (newData) => {
        if (!this.data.anexoJ) this.data.anexoJ = {};
        this.data.anexoJ.rendimentosCategoriaG = newData;
        this.onDataChange(this.data);
      },
    });
  }

  initIbanTable() {
    const container = document.getElementById("ibanContainer");
    if (!container) return;

    const anexoJ = this.data.anexoJ || {};
    const ibans = anexoJ.iban ? [anexoJ.iban] : [];

    if (this.tables.iban) {
      container.innerHTML = "";
    }

    this.tables.iban = new DynamicTable("ibanContainer", {
      data: ibans.map((iban, idx) => ({
        Iban: iban.Iban || "",
        Bic: iban.Bic || "",
      })),
      headers: [
        { label: "IBAN", field: "Iban", type: "text", class: "col-iban" },
        { label: "BIC/SWIFT", field: "Bic", type: "text", class: "col-bic" },
      ],
      onChange: (newData) => {
        if (!this.data.anexoJ) this.data.anexoJ = {};
        this.data.anexoJ.iban = newData[0] || {};
        this.onDataChange(this.data);
      },
    });
  }

  // ============ MÉTODOS PRINCIPAIS ============
  bindEvents(container) {
    // Toggle do Anexo G
    const toggleG = container.querySelector("#incluirAnexoG");
    if (toggleG) {
      toggleG.addEventListener("change", (e) => {
        const isChecked = e.target.checked;
        this.updateData("anexoG.incluir", isChecked);
        const content = container.querySelector("#anexoGContent");
        if (content) {
          const innerContent = content.querySelector(":scope > div:last-child");
          if (innerContent) {
            if (isChecked) {
              innerContent.classList.remove("disabled-section-content");
              this.enableSectionContent(innerContent);
              // Reativar a tabela
              if (this.tables.maisValiasG) {
                this.tables.maisValiasG.setEnabled(true);
              }
              setTimeout(() => this.initMaisValiasGTable(), 50);
            } else {
              innerContent.classList.add("disabled-section-content");
              this.disableSectionContent(innerContent);
              // Desativar a tabela
              if (this.tables.maisValiasG) {
                this.tables.maisValiasG.setEnabled(false);
              }
            }
          }
        }
      });
    }

    // Toggle do Anexo H
    const toggleH = container.querySelector("#incluirAnexoH");
    if (toggleH) {
      toggleH.addEventListener("change", (e) => {
        const isChecked = e.target.checked;
        this.updateData("anexoH.incluir", isChecked);
        const content = container.querySelector("#anexoHContent");
        if (content) {
          const innerContent = content.querySelector(":scope > div:last-child");
          if (innerContent) {
            if (isChecked) {
              innerContent.classList.remove("disabled-section-content");
              this.enableSectionContent(innerContent);
              // Reativar a tabela
              if (this.tables.beneficios) {
                this.tables.beneficios.setEnabled(true);
              }
              setTimeout(() => this.initBeneficiosTable(), 50);
            } else {
              innerContent.classList.add("disabled-section-content");
              this.disableSectionContent(innerContent);
              // Desativar a tabela
              if (this.tables.beneficios) {
                this.tables.beneficios.setEnabled(false);
              }
            }
          }
        }
      });
    }

    // Toggle do Anexo J
    const toggleJ = container.querySelector("#incluirAnexoJ");
    if (toggleJ) {
      toggleJ.addEventListener("change", (e) => {
        const isChecked = e.target.checked;
        this.updateData("anexoJ.incluir", isChecked);
        const content = container.querySelector("#anexoJContent");
        if (content) {
          const innerContent = content.querySelector(":scope > div:last-child");
          if (innerContent) {
            if (isChecked) {
              innerContent.classList.remove("disabled-section-content");
              this.enableSectionContent(innerContent);
              // Reativar as tabelas
              if (this.tables.rendimentosJuros) {
                this.tables.rendimentosJuros.setEnabled(true);
              }
              if (this.tables.maisValiasJ) {
                this.tables.maisValiasJ.setEnabled(true);
              }
              if (this.tables.iban) {
                this.tables.iban.setEnabled(true);
              }
              setTimeout(() => {
                this.initRendimentosJurosTable();
                this.initMaisValiasJTable();
                this.initIbanTable();
              }, 50);
            } else {
              innerContent.classList.add("disabled-section-content");
              this.disableSectionContent(innerContent);
              // Desativar as tabelas
              if (this.tables.rendimentosJuros) {
                this.tables.rendimentosJuros.setEnabled(false);
              }
              if (this.tables.maisValiasJ) {
                this.tables.maisValiasJ.setEnabled(false);
              }
              if (this.tables.iban) {
                this.tables.iban.setEnabled(false);
              }
            }
          }
        }
      });
    }

    // Radio buttons do Anexo H (declaração alternativa)
    const radioSimH = container.querySelector(
      'input[name="declaracaoAlternativa"][value="S"]',
    );
    const radioNaoH = container.querySelector(
      'input[name="declaracaoAlternativa"][value="N"]',
    );

    if (radioSimH) {
      radioSimH.addEventListener("change", (e) => {
        if (e.target.checked) {
          this.updateData("anexoH.declaracaoAlternativa", "S");
        }
      });
    }

    if (radioNaoH) {
      radioNaoH.addEventListener("change", (e) => {
        if (e.target.checked) {
          this.updateData("anexoH.declaracaoAlternativa", "N");
        }
      });
    }

    // Radio buttons do Anexo J (englobamento)
    const radioSimJ = container.querySelector(
      'input[name="englobamento"][value="S"]',
    );
    const radioNaoJ = container.querySelector(
      'input[name="englobamento"][value="N"]',
    );

    if (radioSimJ) {
      radioSimJ.addEventListener("change", (e) => {
        if (e.target.checked) {
          this.updateData("anexoJ.englobamento", "S");
        }
      });
    }

    if (radioNaoJ) {
      radioNaoJ.addEventListener("change", (e) => {
        if (e.target.checked) {
          this.updateData("anexoJ.englobamento", "N");
        }
      });
    }

    // Bind dos campos com data-path
    container.querySelectorAll("[data-path]").forEach((input) => {
      input.addEventListener("change", (e) => {
        const path = input.getAttribute("data-path");
        const value = input.value;
        this.updateData(path, value);
      });
    });

    // Inicializar tabelas
    setTimeout(() => {
      this.initMaisValiasGTable();
      this.initBeneficiosTable();
      this.initRendimentosJurosTable();
      this.initMaisValiasJTable();
      this.initIbanTable();
    }, 100);
  }

  updateData(path, value) {
    const parts = path.split(".");
    let current = this.data;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = value;

    if (this.onDataChange) {
      this.onDataChange(this.data);
    }
  }

  disableSectionContent(container) {
    container.querySelectorAll("input, select, button").forEach((el) => {
      el.disabled = true;
    });
  }

  enableSectionContent(container) {
    container.querySelectorAll("input, select, button").forEach((el) => {
      el.disabled = false;
    });
  }
}
