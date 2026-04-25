import { loadTemplate, loadStyles } from "../../js/template-loader.js";
import { DynamicTable } from "../table/table.js";
import {
  CatalogoBeneficios,
  CatalogoPaises,
} from "../../js/constants/catalogs.js";

export class AnexoH {
  constructor(data, onDataChange) {
    this.data = data;
    this.onDataChange = onDataChange;
    this.tables = {};
    this.element = null;
  }

  async render() {
    loadStyles("components/anexo-h/anexo-h");
    const template = await loadTemplate("components/anexo-h/anexo-h");
    const container = document.createElement("div");
    container.className = "anexo-h";
    container.innerHTML = template;
    this.element = container;
    setTimeout(() => {
      this.applyData();
      this.initTable();
      this.attachEvents();
    });
    return this.element;
  }

  applyData() {
    const anexoH = this.data.anexoH || {};
    const isIncluded = anexoH.incluir !== false;
    const declaracaoAlternativa = anexoH.declaracaoAlternativa || "N";

    const toggle = this.element.querySelector("#incluirAnexoH");
    if (toggle) toggle.checked = isIncluded;

    const content = this.element.querySelector(".anexo-h-content");
    if (content && !isIncluded) {
      content.classList.add("disabled-section-content");
    }

    const radioSim = this.element.querySelector(
      'input[name="declaracaoAlternativa"][value="S"]',
    );
    const radioNao = this.element.querySelector(
      'input[name="declaracaoAlternativa"][value="N"]',
    );
    if (radioSim && declaracaoAlternativa === "S") radioSim.checked = true;
    if (radioNao && declaracaoAlternativa === "N") radioNao.checked = true;
  }

  initTable() {
    const container = this.element.querySelector("#beneficiosTableContainer");
    if (!container) return;

    const anexoH = this.data.anexoH || {};
    const beneficios = anexoH.beneficiosFiscais || [];
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
          options: CatalogoBeneficios,
          class: "col-codigo",
        },
        {
          label: "Titular",
          field: "Titular",
          type: "static-text",
          class: "col-titular",
          formatter: () => `A - ${nifTitular}`,
        },
        {
          label: "Importância Aplicada (€)",
          field: "ImportanciaAplicada",
          type: "number",
          float: true,
          defaultValue: 0,
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
              options: CatalogoPaises,
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
      footerGroups: [
        {
          label: "Soma de Controlo",
          field: "somaImportancia",
          value: (rows) =>
            rows.reduce(
              (s, r) => s + (parseFloat(r.ImportanciaAplicada) || 0),
              0,
            ),
          formatter: (v) => v.toFixed(2) + " €",
        },
      ],
      onChange: (newData) => {
        if (!this.data.anexoH) this.data.anexoH = {};
        this.data.anexoH.beneficiosFiscais = newData;
        if (this.onDataChange) this.onDataChange(this.data);
      },
    });
  }

  attachEvents() {
    const toggle = this.element.querySelector("#incluirAnexoH");
    if (toggle) {
      toggle.addEventListener("change", (e) => {
        const isChecked = e.target.checked;
        this.updateData("anexoH.incluir", isChecked);
        const content = this.element.querySelector(".anexo-h-content");
        if (content) {
          if (isChecked) {
            content.classList.remove("disabled-section-content");
            if (this.tables.beneficios) this.tables.beneficios.setEnabled(true);
          } else {
            content.classList.add("disabled-section-content");
            if (this.tables.beneficios)
              this.tables.beneficios.setEnabled(false);
          }
        }
      });
    }

    const radioSim = this.element.querySelector(
      'input[name="declaracaoAlternativa"][value="S"]',
    );
    const radioNao = this.element.querySelector(
      'input[name="declaracaoAlternativa"][value="N"]',
    );
    if (radioSim) {
      radioSim.addEventListener("change", (e) => {
        if (e.target.checked)
          this.updateData("anexoH.declaracaoAlternativa", "S");
      });
    }
    if (radioNao) {
      radioNao.addEventListener("change", (e) => {
        if (e.target.checked)
          this.updateData("anexoH.declaracaoAlternativa", "N");
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
