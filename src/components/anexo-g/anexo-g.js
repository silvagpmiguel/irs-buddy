import { loadTemplate, loadStyles } from "../../js/template-loader.js";
import { DynamicTable } from "../table/table.js";
import { CatalogoPaises } from "../../js/constants/catalogs.js";
import { BaseAnexo } from '../../js/anexo.js';

export class AnexoG extends BaseAnexo{
  constructor(data, onDataChange) {
    super(data, onDataChange);
  }

  async render() {
    const template = await loadTemplate("components/anexo-g/anexo-g");
    loadStyles("components/anexo-g/anexo-g");
    const container = document.createElement("div");
    container.className = "anexo-g";
    container.innerHTML = template;
    this.element = container;
    this.applyData();
    this.attachEvents();
    return this.element;
  }

  applyData() {
    const anexoG = this.data?.anexoG || {};
    const isIncluded = anexoG.incluir !== false;
    const englobamento = anexoG.englobamento || "N";

    const toggle = this.element.querySelector("#incluirAnexoG");
    if (toggle) toggle.checked = isIncluded;

    const content = this.element.querySelector(".anexo-g-content");
    if (content && !isIncluded) {
      content.classList.add("disabled-section-content");
    }

    const radioSim = this.element.querySelector(
      'input[name="englobamentoAnexoG"][value="S"]',
    );
    const radioNao = this.element.querySelector(
      'input[name="englobamentoAnexoG"][value="N"]',
    );
    if (radioSim && englobamento === "S") radioSim.checked = true;
    if (radioNao && englobamento === "N") radioNao.checked = true;
  }

  initTables() {
    const container = document.getElementById("anexoGTableContainer");

    if (!container) {
      console.error("[AnexoG] Container anexoGTableContainer não encontrado!");
      return;
    }

    const anexoG = this.data?.anexoG || {};
    const rows = anexoG.quadro09 || [];
    console.log("[AnexoG] initTables - rows a processar:", rows.length);

    try {
      this.tables.anexoG = new DynamicTable("anexoGTableContainer", {
        data: rows.map((row) => ({
          NLinha: row.NLinha || "",
          Titular: "A",
          NIF: row.NIF || "",
          CodEncargos: row.CodEncargos || "",
          AnoRealizacao: row.AnoRealizacao || "",
          MesRealizacao: row.MesRealizacao || "",
          DiaRealizacao: row.DiaRealizacao || "",
          ValorRealizacao: row.ValorRealizacao || 0,
          AnoAquisicao: row.AnoAquisicao || "",
          MesAquisicao: row.MesAquisicao || "",
          DiaAquisicao: row.DiaAquisicao || "",
          ValorAquisicao: row.ValorAquisicao || 0,
          DespesasEncargos: row.DespesasEncargos || 0,
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
            label: "Respeita a valores mobiliários?",
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
              rows.reduce(
                (s, r) => s + (parseFloat(r.ValorRealizacao) || 0),
                0,
              ),
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
            label: "Soma Despesas",
            field: "somaDespesas",
            value: (rows) =>
              rows.reduce(
                (s, r) => s + (parseFloat(r.DespesasEncargos) || 0),
                0,
              ),
            formatter: (v) => v.toFixed(2) + " €",
          },
        ],
        paginated: true,
        pageSize: 10,
        onChange: (newData) => {
          console.log("Anexo G onChange - newData length:", newData.length);
          console.log("Anexo G onChange - newData:", newData);

          if (!this.data) this.data = {};
          if (!this.data.anexoG) this.data.anexoG = {};
          this.data.anexoG.quadro09 = newData;

          console.log(
            "Anexo G onChange - data.anexoG.quadro09 length after update:",
            this.data.anexoG.quadro09?.length,
          );

          if (this.onDataChange) this.onDataChange(this.data);
        },
      });
      console.log("[AnexoG] Tabela criada com sucesso");
    } catch (error) {
      console.error("Erro ao criar tabela:", error);
    }
  }

  attachEvents() {
    const toggle = this.element.querySelector("#incluirAnexoG");
    if (toggle) {
      toggle.addEventListener("change", (e) => {
        const isChecked = e.target.checked;
        this.updateData("anexoG.incluir", isChecked);
        const content = this.element.querySelector(".anexo-g-content");
        if (content) {
          if (isChecked) {
            content.classList.remove("disabled-section-content");
            if (this.tables.anexoG) this.tables.anexoG.setEnabled(true);
          } else {
            content.classList.add("disabled-section-content");
            if (this.tables.anexoG) this.tables.anexoG.setEnabled(false);
          }
        }
      });
    }

    const radioSim = this.element.querySelector(
      'input[name="englobamentoAnexoG"][value="S"]',
    );
    const radioNao = this.element.querySelector(
      'input[name="englobamentoAnexoG"][value="N"]',
    );
    if (radioSim) {
      radioSim.addEventListener("change", (e) => {
        if (e.target.checked) this.updateData("anexoG.englobamento", "S");
      });
    }
    if (radioNao) {
      radioNao.addEventListener("change", (e) => {
        if (e.target.checked) this.updateData("anexoG.englobamento", "N");
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
