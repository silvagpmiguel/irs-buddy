import { loadTemplate, loadStyles } from "../../js/template-loader.js";
import { DynamicTable } from "../table/table.js";
import {
  CatalogoPaises,
  CatalogoCodigosRendimentoJ8A,
  CatalogoCodigosRendimentoJ9A,
  CatalogoCodigosRendimentoJ9B,
} from "../../js/constants/catalogs.js";

export class AnexoJ {
  constructor(data, onDataChange) {
    this.data = data;
    this.onDataChange = onDataChange;
    this.tables = {};
    this.element = null;
  }

  async render() {
    loadStyles("components/anexo-j/anexo-j");
    const template = await loadTemplate("components/anexo-j/anexo-j");
    const container = document.createElement("div");
    container.className = "anexo-j";
    container.innerHTML = template;
    this.element = container;
    setTimeout(() => {
      this.applyData();
      this.initTables();
      this.attachEvents();
    });
    return this.element;
  }

  applyData() {
    const anexoJ = this.data.anexoJ || {};
    const isIncluded = anexoJ.incluir !== false;
    const englobamentoSec8 = anexoJ.englobamentoSec8 || "N";
    const englobamentoSec92 = anexoJ.englobamento || "N";

    const toggle = this.element.querySelector("#incluirAnexoJ");
    if (toggle) toggle.checked = isIncluded;

    const content = this.element.querySelector(".anexo-j-content");
    if (content && !isIncluded) {
      content.classList.add("disabled-section-content");
    }

    const radioSimSec8 = this.element.querySelector(
      'input[name="englobamentoSec8"][value="S"]',
    );
    const radioNaoSec8 = this.element.querySelector(
      'input[name="englobamentoSec8"][value="N"]',
    );
    if (radioSimSec8 && englobamentoSec8 === "S") radioSimSec8.checked = true;
    if (radioNaoSec8 && englobamentoSec8 === "N") radioNaoSec8.checked = true;

    const radioSimSec92 = this.element.querySelector(
      'input[name="englobamentoSec92"][value="S"]',
    );
    const radioNaoSec92 = this.element.querySelector(
      'input[name="englobamentoSec92"][value="N"]',
    );
    if (radioSimSec92 && englobamentoSec92 === "S")
      radioSimSec92.checked = true;
    if (radioNaoSec92 && englobamentoSec92 === "N")
      radioNaoSec92.checked = true;
  }

  initTables() {
    this.initRendimentosJurosTable();
    this.initMaisValiasJTable();
    this.initMaisValiasJTableB();
    this.initIbanTable();
  }

  initRendimentosJurosTable() {
    const container = this.element.querySelector("#rendimentosJurosContainer");
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
    const container = this.element.querySelector("#maisValiasJContainer");
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
          options: CatalogoCodigosRendimentoJ9A,
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
    const container = this.element.querySelector("#maisValiasJContainerB");
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
    const container = this.element.querySelector("#ibanContainer");
    if (!container) return;

    const anexoJ = this.data.anexoJ || {};
    const ibans = anexoJ.iban || [];
    const ibanData = ibans.length > 0 ? ibans : [{ Iban: "", Bic: "" }];

    this.tables.iban = new DynamicTable("ibanContainer", {
      data: ibanData.map((iban) => ({
        Iban: iban.Iban || "",
        Bic: iban.Bic || "",
      })),
      headers: [
        { label: "IBAN", field: "Iban", type: "text", class: "col-iban" },
        { label: "BIC/SWIFT", field: "Bic", type: "text", class: "col-bic" },
      ],
      onChange: (newData) => {
        if (!this.data.anexoJ) this.data.anexoJ = {};
        this.data.anexoJ.iban = newData;
        if (this.onDataChange) this.onDataChange(this.data);
      },
    });
  }

  attachEvents() {
    const toggle = this.element.querySelector("#incluirAnexoJ");
    if (toggle) {
      toggle.addEventListener("change", (e) => {
        const isChecked = e.target.checked;
        this.updateData("anexoJ.incluir", isChecked);
        const content = this.element.querySelector(".anexo-j-content");
        if (content) {
          if (isChecked) {
            content.classList.remove("disabled-section-content");
            if (this.tables.rendimentosJuros)
              this.tables.rendimentosJuros.setEnabled(true);
            if (this.tables.maisValiasJ)
              this.tables.maisValiasJ.setEnabled(true);
            if (this.tables.maisValiasJB)
              this.tables.maisValiasJB.setEnabled(true);
            if (this.tables.iban) this.tables.iban.setEnabled(true);
          } else {
            content.classList.add("disabled-section-content");
            if (this.tables.rendimentosJuros)
              this.tables.rendimentosJuros.setEnabled(false);
            if (this.tables.maisValiasJ)
              this.tables.maisValiasJ.setEnabled(false);
            if (this.tables.maisValiasJB)
              this.tables.maisValiasJB.setEnabled(false);
            if (this.tables.iban) this.tables.iban.setEnabled(false);
          }
        }
      });
    }

    const radioSimSec8 = this.element.querySelector(
      'input[name="englobamentoSec8"][value="S"]',
    );
    const radioNaoSec8 = this.element.querySelector(
      'input[name="englobamentoSec8"][value="N"]',
    );
    if (radioSimSec8) {
      radioSimSec8.addEventListener("change", (e) => {
        if (e.target.checked) this.updateData("anexoJ.englobamentoSec8", "S");
      });
    }
    if (radioNaoSec8) {
      radioNaoSec8.addEventListener("change", (e) => {
        if (e.target.checked) this.updateData("anexoJ.englobamentoSec8", "N");
      });
    }

    const radioSimSec92 = this.element.querySelector(
      'input[name="englobamentoSec92"][value="S"]',
    );
    const radioNaoSec92 = this.element.querySelector(
      'input[name="englobamentoSec92"][value="N"]',
    );
    if (radioSimSec92) {
      radioSimSec92.addEventListener("change", (e) => {
        if (e.target.checked) this.updateData("anexoJ.englobamento", "S");
      });
    }
    if (radioNaoSec92) {
      radioNaoSec92.addEventListener("change", (e) => {
        if (e.target.checked) this.updateData("anexoJ.englobamento", "N");
      });
    }
  }

  updateData(path, value) {
    const parts = path.split(".");
    let current = this.data;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    if (this.onDataChange) this.onDataChange(this.data);
  }
}
