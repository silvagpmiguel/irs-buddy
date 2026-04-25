// src/js/form-renderer.js
import { DynamicTable } from "./table.js";
import {
  CatalogoBeneficios,
  CatalogCodigosRendimentoJ9A,
  CatalogoCodigosRendimentoJ8A,
  CatalogoPaises,
  CatalogoCodigosRendimentoJ9B,
} from "./constants/catalogs.js";

export class FormRenderer {
  constructor(data, onDataChange) {
    this.data = data;
    this.onDataChange = onDataChange;
    this.tables = {};
    this.initializedTabs = new Set();
  }

  // ============ ANEXO G ============
  renderAnexoGForm() {
    const anexoG = this.data.anexoG || {};
    const isIncluded = anexoG.incluir !== false;
    const englobamento = anexoG.englobamento || "N";

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
          <h3>9. Alienação Onerosa de Partes Sociais e Outros Valores Mobiliários [art.º 10.º, n.º 1, al. b), do CIRS]</h3>
          <div id="anexoGTableContainer"></div>
        </div>

        <div class="form-section">
          <h3>15. Opção pelo Englobamento</h3>
          <div class="question-box">
            <p class="question-text">Opta pelo englobamento dos rendimentos do Anexo G?</p>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" name="englobamentoAnexoG" value="S" ${englobamento === "S" ? "checked" : ""} ${!isIncluded ? "disabled" : ""}>
                <span>Sim</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="englobamentoAnexoG" value="N" ${englobamento === "N" ? "checked" : ""} ${!isIncluded ? "disabled" : ""}>
                <span>Não</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  }

  initAnexoGTable() {
    if (this.tables.anexoG) return;
    const container = document.getElementById("anexoGTableContainer");
    if (!container) return;
    const anexoG = this.data.anexoG || {};
    const rows = anexoG.quadro09 || [];
    const nifTitular = anexoG.nif || this.data.nif;

    this.tables.anexoG = new DynamicTable("anexoGTableContainer", {
      data: rows.map((row) => ({
        NLinha: row.NLinha || "",
        Titular: "A",
        NIF: row.NIF || "",
        CodEncargos: row.CodEncargos || "",
        AnoRealizacao: row.AnoRealizacao || "",
        MesRealizacao: row.MesRealizacao || "",
        DiaRealizacao: row.DiaRealizacao || "",
        ValorRealizacao:
          row.ValorRealizacao !== undefined ? row.ValorRealizacao : 0,
        AnoAquisicao: row.AnoAquisicao || "",
        MesAquisicao: row.MesAquisicao || "",
        DiaAquisicao: row.DiaAquisicao || "",
        ValorAquisicao:
          row.ValorAquisicao !== undefined ? row.ValorAquisicao : 0,
        DespesasEncargos:
          row.DespesasEncargos !== undefined ? row.DespesasEncargos : 0,
        PaisContraparte: row.PaisContraparte || "",
        RespeitaValoresMobiliarios: row.RespeitaValoresMobiliarios || "N",
      })),
      headers: [
        {
          label: "Nº Linha (9001 a ...)",
          field: "NLinha",
          type: "auto-number",
          options: { start: 9001 },
          class: "col-nlinha",
        },
        {
          label: "Titular",
          field: "Titular",
          type: "static-text",
          class: "col-titular",
          formatter: () => nifTitular,
        },
        {
          label: "NIF da entidade emitente",
          field: "NIF",
          type: "text",
          class: "col-nif",
        },
        {
          label: "Código da operação",
          field: "CodEncargos",
          type: "select",
          options: [
            { value: "G01", label: "G01 - Ações" },
            { value: "G02", label: "G02 - Outros valores mobiliários" },
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
              options: { min: 1900, max: 2099 },
              defaultValue: () => new Date().getFullYear(),
              class: "col-data",
            },
            {
              label: "Mês",
              field: "MesRealizacao",
              type: "number",
              options: { min: 1, max: 12 },
              defaultValue: () => new Date().getMonth() + 1,
              class: "col-data",
            },
            {
              label: "Dia",
              field: "DiaRealizacao",
              type: "number",
              options: { min: 1, max: 31 },
              defaultValue: () => new Date().getDate(),
              class: "col-data",
            },
            {
              label: "Valor (€)",
              field: "ValorRealizacao",
              type: "number",
              float: true,
              defaultValue: 0,
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
              options: { min: 1900, max: 2099 },
              defaultValue: () => new Date().getFullYear(),
              class: "col-data",
            },
            {
              label: "Mês",
              field: "MesAquisicao",
              type: "number",
              options: { min: 1, max: 12 },
              defaultValue: () => new Date().getMonth() + 1,
              class: "col-data",
            },
            {
              label: "Dia",
              field: "DiaAquisicao",
              type: "number",
              options: { min: 1, max: 31 },
              defaultValue: () => new Date().getDate(),
              class: "col-data",
            },
            {
              label: "Valor (€)",
              field: "ValorAquisicao",
              type: "number",
              float: true,
              defaultValue: 0,
              class: "col-valor",
            },
          ],
        },
        {
          label: "Despesas e Encargos (€)",
          field: "DespesasEncargos",
          type: "number",
          float: true,
          defaultValue: 0,
          class: "col-valor",
        },
        {
          label: "País da contraparte",
          field: "PaisContraparte",
          type: "select",
          options: CatalogoPaises,
          class: "col-pais",
        },
        {
          label:
            "Respeita a valores mobiliários admitidos à negociação ou a partes de OIC abertos?",
          field: "RespeitaValoresMobiliarios",
          type: "checkbox",
          selectAll: true,
          defaultValue: "N",
          class: "col-booleano",
        },
      ],
      footerGroups: [
        {
          label: "Soma Valor Realização",
          field: "somaRealizacao",
          value: (rows) =>
            rows.reduce((s, r) => s + (parseFloat(r.ValorRealizacao) || 0), 0),
          formatter: (v) => v.toFixed(2) + " €",
        },
        {
          label: "Soma Valor Aquisição",
          field: "somaAquisicao",
          value: (rows) =>
            rows.reduce((s, r) => s + (parseFloat(r.ValorAquisicao) || 0), 0),
          formatter: (v) => v.toFixed(2) + " €",
        },
        {
          label: "Soma Despesas e Encargos",
          field: "somaDespesas",
          value: (rows) =>
            rows.reduce((s, r) => s + (parseFloat(r.DespesasEncargos) || 0), 0),
          formatter: (v) => v.toFixed(2) + " €",
        },
      ],
      paginated: true,
      pageSize: 10,
      onChange: (newData) => {
        if (!this.data.anexoG) this.data.anexoG = {};
        this.data.anexoG.quadro09 = newData;
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
    const nifTitular = anexoH.nif || this.data.nif;

    if (this.tables.beneficios) {
      container.innerHTML = "";
    }

    // Criar tabela - skeleton aparece automaticamente
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
          options: CatalogoBeneficios,
        },
        {
          label: "Titular",
          field: "Titular",
          type: "static-text",
          class: "col-titular",
          formatter: () => nifTitular,
        },
        {
          label: "Importância Aplicada",
          field: "ImportanciaAplicada",
          type: "number",
          class: "col-valor",
          float: true,
          defaultValue: 0,
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
              options: CatalogoPaises,
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
      footerGroups: [
        {
          label: "Soma de Controlo",
          field: "somaImportancia",
          value: (rows) => {
            const soma = rows.reduce((acc, row) => {
              return acc + (parseFloat(row.ImportanciaAplicada) || 0);
            }, 0);
            return soma;
          },
          formatter: (value) => value.toFixed(2) + " €",
        },
      ],
      onChange: (newData) => {
        if (!this.data.anexoH) this.data.anexoH = {};
        this.data.anexoH.beneficiosFiscais = newData;
        this.onDataChange(this.data);
      },
    });

    if (!isIncluded) {
      this.tables.beneficios.setEnabled(false);
    }
  }

  // ============ ANEXO J ============
  renderAnexoJForm() {
    const anexoJ = this.data.anexoJ || {};
    const isIncluded = anexoJ.incluir !== false;
    const englobamentoSec8 = anexoJ.englobamentoSec8 || "N";
    const englobamentoSec92 = anexoJ.englobamento || "N";

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
                    
                    <!-- Novo: Subsecção B - Opção de Englobamento -->
                    <div class="sub-section">
                        <h4>B - Opção de Englobamento</h4>
                        <div class="question-box">
                            <p class="question-text">Opta pelo englobamento destes rendimentos?</p>
                            <div class="radio-group">
                                <label class="radio-label">
                                    <input type="radio" name="englobamentoSec8" value="S" ${englobamentoSec8 === "S" ? "checked" : ""} ${!isIncluded ? "disabled" : ""}>
                                    <span>Sim</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="englobamentoSec8" value="N" ${englobamentoSec8 === "N" ? "checked" : ""} ${!isIncluded ? "disabled" : ""}>
                                    <span>Não</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Secção 9. Rendimentos de Incrementos Patrimoniais (Categoria G) -->
                <div class="form-section">
                    <h3>9. Rendimentos de Incrementos Patrimoniais (Categoria G)</h3>
                    
                    <div class="sub-section">
                        <h4>9.2 Incrementos Patrimoniais de Opção de Englobamento</h4>
                        
                        <div class="sub-section">
                            <h5>A. Alienação Onerosa de Partes Sociais e Outros Valores Mobiliários</h5>
                            <div id="maisValiasJContainer"></div>
                        </div>
                        <!-- Subsecção B - Outros Incrementos Patrimoniais de Opção de Englobamento -->
                        <div class="sub-section">
                          <h4>B - Outros Incrementos Patrimoniais de Opção de Englobamento</h4>
                          <div id="maisValiasJContainerB"></div>
                        </div>
                        <div class="sub-section">
                            <h5>C. Opção de Englobamento</h5>
                            <div class="question-box">
                                <p class="question-text">1 - Opta pelo englobamento dos rendimentos do quadro 9.2?</p>
                                <div class="radio-group">
                                    <label class="radio-label">
                                        <input type="radio" name="englobamento" value="S" ${englobamentoSec92 === "S" ? "checked" : ""} ${!isIncluded ? "disabled" : ""}>
                                        <span>Sim</span>
                                    </label>
                                    <label class="radio-label">
                                        <input type="radio" name="englobamento" value="N" ${englobamentoSec92 === "N" ? "checked" : ""} ${!isIncluded ? "disabled" : ""}>
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
    if (this.tables.rendimentosJuros) return;
    const container = document.getElementById("rendimentosJurosContainer");
    if (!container) return;

    const anexoJ = this.data.anexoJ || {};
    const rendimentos = anexoJ.rendimentosCategoriaE || [];

    this.tables.rendimentosJuros = new DynamicTable(
      "rendimentosJurosContainer",
      {
        data: rendimentos.map((r, idx) => ({
          NLinha: r.NLinha || 801 + idx,
          CodRendimento: r.CodRendimento || "",
          CodPais: r.CodPais || "",
          RendimentoBruto: r.RendimentoBruto || "",
          ImpostoPagoEstrangeiroPaisFonte:
            r.ImpostoPagoEstrangeiroPaisFonte || "",
          CodPaisAgentePagador: r.ImpostoPagoEstrangeiroCodPaisPagador || "",
          ImpostoRetidoAgente: r.ImpostoPagoEstrangeiroImpostoRetido || "",
          NIFEntRetentora: r.NIFEntRetentora || "",
          RetencaoFonte: r.RetencaoFonte || "",
        })),
        headers: [
          {
            label: "Nº Linha (801...)",
            field: "NLinha",
            type: "auto-number",
            options: { start: 801 },
            class: "col-nlinha",
          },
          {
            label: "Código Rendimento",
            field: "CodRendimento",
            type: "select",
            options: CatalogoCodigosRendimentoJ8A,
            class: "col-codigo",
          },
          {
            label: "País da Fonte",
            field: "CodPais",
            type: "select",
            class: "col-pais",
            options: CatalogoPaises,
          },
          {
            label: "Rendimento Bruto (€)",
            field: "RendimentoBruto",
            type: "number",
            float: true,
            defaultValue: 0,
            class: "col-valor",
          },
          {
            label: "Imposto pago no Estrangeiro",
            field: "ImpostoEstrangeiroGroup",
            class: "col-imposto-estrangeiro",
            subHeaders: [
              {
                label: "No País da fonte (€)",
                field: "ImpostoPagoEstrangeiroPaisFonte",
                type: "number",
                float: true,
                defaultValue: 0,
                class: "col-valor",
              },
              {
                label: "País do Agente Pagador",
                field: "AgentePagadorGroup",
                subHeaders: [
                  {
                    label: "Código do País",
                    field: "CodPaisAgentePagador",
                    type: "select",
                    class: "col-pais",
                    options: CatalogoPaises,
                  },
                  {
                    label: "Imposto retido (€)",
                    field: "ImpostoRetidoAgente",
                    type: "number",
                    float: true,
                    defaultValue: 0,
                    class: "col-valor",
                  },
                ],
              },
            ],
          },
          {
            label: "Imposto Retido em Portugal",
            field: "ImpostoPortugalGroup",
            class: "col-imposto-portugal",
            subHeaders: [
              {
                label: "NIF da Entidade Retentora",
                field: "NIFEntRetentora",
                type: "text",
                defaultValue: "",
                class: "col-nif",
              },
              {
                label: "Retenção na Fonte (€)",
                field: "RetencaoFonte",
                type: "number",
                float: true,
                defaultValue: 0,
                class: "col-valor",
              },
            ],
          },
        ],
        footerGroups: [
          {
            label: "Soma Rendimento Bruto",
            field: "somaRendimentoBruto",
            value: (rows) =>
              rows.reduce(
                (s, r) => s + (parseFloat(r.RendimentoBruto) || 0),
                0,
              ),
            formatter: (v) => v.toFixed(2) + " €",
          },
          {
            label: "Soma Imposto no País Fonte",
            field: "somaImpostoPaisFonte",
            value: (rows) =>
              rows.reduce(
                (s, r) =>
                  s + (parseFloat(r.ImpostoPagoEstrangeiroPaisFonte) || 0),
                0,
              ),
            formatter: (v) => v.toFixed(2) + " €",
          },
          {
            label: "Soma Imposto Retido (Agente)",
            field: "somaImpostoRetidoAgente",
            value: (rows) =>
              rows.reduce(
                (s, r) => s + (parseFloat(r.ImpostoRetidoAgente) || 0),
                0,
              ),
            formatter: (v) => v.toFixed(2) + " €",
          },
          {
            label: "Soma Retenção na Fonte (PT)",
            field: "somaRetencaoPortugal",
            value: (rows) =>
              rows.reduce(
                (s, r) => s + (parseFloat(r.RetencaoFontePortugal) || 0),
                0,
              ),
            formatter: (v) => v.toFixed(2) + " €",
          },
        ],
        paginated: true,
        pageSize: 10,
        onChange: (newData) => {
          if (!this.data.anexoJ) this.data.anexoJ = {};
          this.data.anexoJ.rendimentosCategoriaE = newData;
          this.onDataChange(this.data);
        },
      },
    );
  }

  initMaisValiasJTable() {
    if (this.tables.maisValiasJ) return;
    const container = document.getElementById("maisValiasJContainer");
    if (!container) return;

    const anexoJ = this.data.anexoJ || {};
    const maisValias = anexoJ.rendimentosCategoriaG || [];
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
        RespeitaValoresMobiliarios: mv.RespeitaValoresMobiliarios || "N",
      })),
      headers: [
        {
          label: "Nº Linha (951...)",
          field: "NLinha",
          type: "auto-number",
          options: { start: 951 },
          class: "col-nlinha",
        },
        {
          label: "País da Fonte",
          field: "CodPais",
          type: "select",
          class: "col-pais",
          options: CatalogoPaises,
        },
        {
          label: "Código",
          field: "Codigo",
          type: "select",
          options: CatalogCodigosRendimentoJ9A,
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
              defaultValue: () => new Date().getFullYear(),
              options: { min: 1900, max: 2099 },
              class: "col-data",
            },
            {
              label: "Mês",
              field: "MesRealizacao",
              type: "number",
              defaultValue: () => new Date().getMonth() + 1,
              options: { min: 1, max: 12 },
              class: "col-data",
            },
            {
              label: "Dia",
              field: "DiaRealizacao",
              type: "number",
              defaultValue: () => new Date().getDate(),
              options: { min: 1, max: 31 },
              class: "col-data",
            },
            {
              label: "Valor (€)",
              field: "ValorRealizacao",
              type: "number",
              float: true,
              defaultValue: 0,
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
              defaultValue: () => new Date().getFullYear(),
              options: { min: 1900, max: 2099 },
              class: "col-data",
            },
            {
              label: "Mês",
              field: "MesAquisicao",
              type: "number",
              defaultValue: () => new Date().getMonth() + 1,
              options: { min: 1, max: 12 },
              class: "col-data",
            },
            {
              label: "Dia",
              field: "DiaAquisicao",
              type: "number",
              defaultValue: () => new Date().getDate(),
              options: { min: 1, max: 31 },
              class: "col-data",
            },
            {
              label: "Valor (€)",
              field: "ValorAquisicao",
              type: "number",
              float: true,
              defaultValue: 0,
              class: "col-valor",
            },
          ],
        },
        {
          label: "Despesas e Encargos (€)",
          field: "DespesasEncargos",
          type: "number",
          float: true,
          defaultValue: 0,
          class: "col-valor",
        },
        {
          label: "Imposto pago no Estrangeiro (€)",
          field: "ImpostoPagoNoEstrangeiro",
          type: "number",
          float: true,
          defaultValue: 0,
          class: "col-valor",
        },
        {
          label: "País da Contraparte",
          field: "CodPaisContraparte",
          type: "select",
          class: "col-pais",
          options: CatalogoPaises,
        },
        {
          label: "Respeita valores mobiliários?",
          field: "RespeitaValoresMobiliarios",
          type: "checkbox",
          defaultValue: "N",
          class: "col-booleano",
        },
      ],
      footerGroups: [
        {
          label: "Soma Valor Realização",
          field: "somaRealizacao",
          value: (rows) =>
            rows.reduce((s, r) => s + (parseFloat(r.ValorRealizacao) || 0), 0),
          formatter: (v) => v.toFixed(2) + " €",
        },
        {
          label: "Soma Valor Aquisição",
          field: "somaAquisicao",
          value: (rows) =>
            rows.reduce((s, r) => s + (parseFloat(r.ValorAquisicao) || 0), 0),
          formatter: (v) => v.toFixed(2) + " €",
        },
        {
          label: "Soma Despesas e Encargos",
          field: "somaDespesas",
          value: (rows) =>
            rows.reduce((s, r) => s + (parseFloat(r.DespesasEncargos) || 0), 0),
          formatter: (v) => v.toFixed(2) + " €",
        },
        {
          label: "Soma Imposto pago no Estrangeiro",
          field: "somaImpostoEstrangeiro",
          value: (rows) =>
            rows.reduce(
              (s, r) => s + (parseFloat(r.ImpostoPagoNoEstrangeiro) || 0),
              0,
            ),
          formatter: (v) => v.toFixed(2) + " €",
        },
      ],
      paginated: true,
      pageSize: 10,
      onChange: (newData) => {
        if (!this.data.anexoJ) this.data.anexoJ = {};
        this.data.anexoJ.rendimentosCategoriaG = newData;
        this.onDataChange(this.data);
      },
    });
  }

  initMaisValiasJTableB() {
    if (this.tables.maisValiasJB) return;
    const container = document.getElementById("maisValiasJContainerB");
    if (!container) return;

    const anexoJ = this.data.anexoJ || {};
    const maisValiasB = anexoJ.rendimentosCategoriaG_B || [];

    this.tables.maisValiasJB = new DynamicTable("maisValiasJContainerB", {
      data: maisValiasB.map((mv, idx) => ({
        NLinha: mv.NLinha || 991 + idx,
        CodRendimento: mv.CodRendimento || "",
        CodPais: mv.CodPais || "",
        RendimentoLiquido:
          mv.RendimentoLiquido !== undefined ? mv.RendimentoLiquido : 0,
        ImpostoPagoEstrangeiro:
          mv.ImpostoPagoEstrangeiro !== undefined
            ? mv.ImpostoPagoEstrangeiro
            : 0,
        CodPaisContraparte: mv.CodPaisContraparte || "",
      })),
      headers: [
        {
          label: "Nº Linha (991 a ...)",
          field: "NLinha",
          type: "auto-number",
          options: { start: 991 },
          class: "col-nlinha",
        },
        {
          label: "Código Rendimento",
          field: "CodRendimento",
          type: "select",
          options: CatalogoCodigosRendimentoJ9B,
          class: "col-codigo",
        },
        {
          label: "País da Fonte",
          field: "CodPais",
          type: "select",
          options: CatalogoPaises,
          class: "col-pais",
        },
        {
          label: "Rendimento Líquido (€)",
          field: "RendimentoLiquido",
          type: "number",
          float: true,
          defaultValue: 0,
          class: "col-valor",
        },
        {
          label: "Imposto Pago no Estrangeiro (€)",
          field: "ImpostoPagoEstrangeiro",
          type: "number",
          float: true,
          defaultValue: 0,
          class: "col-valor",
        },
        {
          label: "País da Contraparte",
          field: "CodPaisContraparte",
          type: "select",
          options: CatalogoPaises,
          class: "col-pais",
        },
      ],
      footerGroups: [
        {
          label: "Soma Rendimento Líquido",
          field: "somaRendimento",
          value: (rows) =>
            rows.reduce(
              (s, r) => s + (parseFloat(r.RendimentoLiquido) || 0),
              0,
            ),
          formatter: (v) => v.toFixed(2) + " €",
        },
        {
          label: "Soma Imposto Pago",
          field: "somaImposto",
          value: (rows) =>
            rows.reduce(
              (s, r) => s + (parseFloat(r.ImpostoPagoEstrangeiro) || 0),
              0,
            ),
          formatter: (v) => v.toFixed(2) + " €",
        },
      ],
      paginated: true,
      pageSize: 10,
      onChange: (newData) => {
        if (!this.data.anexoJ) this.data.anexoJ = {};
        this.data.anexoJ.rendimentosCategoriaG_B = newData;
        this.onDataChange(this.data);
      },
    });
  }

  initIbanTable() {
    if (this.tables.iban) return;
    const container = document.getElementById("ibanContainer");
    if (!container) return;
    const anexoJ = this.data.anexoJ || {};
    const ibans = anexoJ.iban || [];

    this.tables.iban = new DynamicTable("ibanContainer", {
      data: ibans.map((iban) => ({
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
              setTimeout(() => this.initAnexoGTable(), 50);
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

    // Radio buttons do Anexo G

    const radioSimG = container.querySelector(
      'input[name="englobamentoAnexoG"][value="S"]',
    );
    const radioNaoG = container.querySelector(
      'input[name="englobamentoAnexoG"][value="N"]',
    );
    if (radioSimG) {
      radioSimG.addEventListener("change", (e) => {
        if (e.target.checked) this.updateData("anexoG.englobamento", "S");
      });
    }
    if (radioNaoG) {
      radioNaoG.addEventListener("change", (e) => {
        if (e.target.checked) this.updateData("anexoG.englobamento", "N");
      });
    }

    // Radio buttons do Anexo H
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

    const radioSimSec8 = container.querySelector(
      'input[name="englobamentoSec8"][value="S"]',
    );
    const radioNaoSec8 = container.querySelector(
      'input[name="englobamentoSec8"][value="N"]',
    );

    if (radioSimSec8) {
      radioSimSec8.addEventListener("change", (e) => {
        if (e.target.checked) {
          this.updateData("anexoJ.englobamentoSec8", "S");
        }
      });
    }

    if (radioNaoSec8) {
      radioNaoSec8.addEventListener("change", (e) => {
        if (e.target.checked) {
          this.updateData("anexoJ.englobamentoSec8", "N");
        }
      });
    }

    // Radio buttons do Anexo J - Secção 9.2 (englobamento)
    const radioSimSec92 = container.querySelector(
      'input[name="englobamento"][value="S"]',
    );
    const radioNaoSec92 = container.querySelector(
      'input[name="englobamento"][value="N"]',
    );

    if (radioSimSec92) {
      radioSimSec92.addEventListener("change", (e) => {
        if (e.target.checked) {
          this.updateData("anexoJ.englobamento", "S");
        }
      });
    }

    if (radioNaoSec92) {
      radioNaoSec92.addEventListener("change", (e) => {
        if (e.target.checked) {
          this.updateData("anexoJ.englobamento", "N");
        }
      });
    }

    // Bind dos campos com data-path
    container.querySelectorAll("[data-path]").forEach((input) => {
      input.addEventListener("change", () => {
        const path = input.getAttribute("data-path");
        const value = input.value;
        this.updateData(path, value);
      });
    });

    // Inicializar tabelas
    setTimeout(() => {
      this.initAnexoGTable();
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

  activateTab(tabId) {
    if (this.initializedTabs.has(tabId)) return;
    this.initializedTabs.add(tabId);
    switch (tabId) {
      case "anexoG":
        this.initAnexoGTable();
        break;
      case "anexoH":
        this.initBeneficiosTable();
        break;
      case "anexoJ":
        this.initRendimentosJurosTable();
        this.initMaisValiasJTable();
        this.initMaisValiasJTableB();
        this.initIbanTable();
        break;
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
