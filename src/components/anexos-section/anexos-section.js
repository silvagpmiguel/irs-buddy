import { loadTemplate, loadStyles } from "../../js/template-loader.js";
import { AnexoG } from "../anexo-g/anexo-g.js";
import { AnexoH } from "../anexo-h/anexo-h.js";
import { AnexoJ } from "../anexo-j/anexo-j.js";

export class AnexosSection {
  constructor(data, onDataChange) {
    this.data = data;
    this.onDataChange = onDataChange;
    this.element = null;
    this.currentTab = "anexoG";
    this.onBackCallback = null;
    this.onReviewCallback = null;
    this.anexoComponents = {
      anexoG: null,
      anexoH: null,
      anexoJ: null,
    };
  }

  async render() {
    loadStyles("components/anexos-section/anexos-section");
    const template = await loadTemplate(
      "components/anexos-section/anexos-section",
    );

    const container = document.createElement("div");
    container.className = "anexos-section";
    container.innerHTML = template;
    this.element = container;

    this.attachEvents();
    await this.renderActiveTab();
    return this.element;
  }

  async getOrCreateAnexoComponent(anexoId) {
    if (this.anexoComponents[anexoId]) return this.anexoComponents[anexoId];

    let AnexoClass;
    switch (anexoId) {
      case "anexoG":
        AnexoClass = AnexoG;
        break;
      case "anexoH":
        AnexoClass = AnexoH;
        break;
      case "anexoJ":
        AnexoClass = AnexoJ;
        break;
      default:
        return null;
    }

    const anexoComponent = new AnexoClass(this.data || {}, (newData) => {
      this.data = newData;
      if (this.onDataChange) this.onDataChange(this.data);
    });

    const element = await anexoComponent.render();
    anexoComponent.element = element;
    this.anexoComponents[anexoId] = anexoComponent;
    return anexoComponent;
  }

  async renderActiveTab() {
    const tabContent = this.element.querySelector("#tabContent");
    if (!tabContent || this.isRendering) return;

    this.isRendering = true;
    tabContent.innerHTML = '<div class="loading-spinner">Carregando...</div>';

    try {
      const anexoComponent = await this.getOrCreateAnexoComponent(
        this.currentTab,
      );
      if (anexoComponent && anexoComponent.element) {
        tabContent.innerHTML = "";
        tabContent.appendChild(anexoComponent.element);
        this.currentAnexoComponent = anexoComponent;
      }
    } catch (error) {
      console.error("Error rendering anexo:", error);
      tabContent.innerHTML =
        '<div class="error">Erro ao carregar o anexo</div>';
    }
    this.isRendering = false;
  }

  switchTab(tabId) {
    if (this.currentTab === tabId) return;
    this.currentTab = tabId;

    const tabs = this.element.querySelectorAll(".tab-btn");
    tabs.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
    });

    this.renderActiveTab();
  }

  attachEvents() {
    const tabs = this.element.querySelectorAll(".tab-btn");
    tabs.forEach((btn) => {
      btn.addEventListener("click", () =>
        this.switchTab(btn.getAttribute("data-tab")),
      );
    });

    const reviewBtn = this.element.querySelector("#reviewChangesBtn");
    if (reviewBtn) {
      reviewBtn.addEventListener("click", () => {
        if (this.onReviewCallback) this.onReviewCallback();
      });
    }

    // Botão Voltar aos Brokers
    const backBtn = this.element.querySelector("#backToBrokersBtn");
    if (backBtn && this.onBackCallback) {
      backBtn.addEventListener("click", () => this.onBackCallback());
    }
  }

  async getAllTableReferences() {
    await Promise.all([
      this.getOrCreateAnexoComponent("anexoG"),
      this.getOrCreateAnexoComponent("anexoH"),
      this.getOrCreateAnexoComponent("anexoJ"),
    ]);

    return {
      maisValiasGTable: this.anexoComponents.anexoG?.tables?.anexoG,
      beneficiosTable: this.anexoComponents.anexoH?.tables?.beneficios,
      rendimentosJurosTable:
        this.anexoComponents.anexoJ?.tables?.rendimentosJuros,
      maisValiasJTable: this.anexoComponents.anexoJ?.tables?.maisValiasJ,
      maisValiasJBTable: this.anexoComponents.anexoJ?.tables?.maisValiasJB,
    };
  }

  setData(data, onDataChange) {
    this.data = data;
    this.onDataChange = onDataChange;

    Object.values(this.anexoComponents).forEach((component) => {
      if (component && component.data) component.data = data;
    });
  }

  setOnReview(callback) {
    this.onReviewCallback = callback;
  }

  setOnBack(callback) {
    this.onBackCallback = callback;
  }
}
