import { loadTemplate, loadStyles } from "../../js/template-loader.js";
import { AnexoG } from "../anexo-g/anexo-g.js";
import { AnexoH } from "../anexo-h/anexo-h.js";
import { AnexoJ } from "../anexo-j/anexo-j.js";
import { Modal } from "../modal/modal.js";
import { ErrorsList } from "../errors-list/errors-list.js";

export class AnexosSection {
  constructor(data, onDataChange) {
    this.data = data;
    this.onDataChange = onDataChange;
    this.element = null;
    this.currentTab = "anexoG";
    this.onBackCallback = null;
    this.onReviewCallback = null;
    this.modal = null;

    this.components = {
      anexoG: null,
      anexoH: null,
      anexoJ: null,
    };

    this.initializedTabs = new Set();
    this.tabContent = null;
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
    this.tabContent = this.element.querySelector("#tabContent");
    await this.createAllComponents();
    this.attachEvents();
    // Forçar a inicialização da primeira tab (anexoG)
    setTimeout(async () => await this.showTab("anexoG", true));
    return this.element;
  }

  async createAllComponents() {
    const componentClasses = {
      anexoG: AnexoG,
      anexoH: AnexoH,
      anexoJ: AnexoJ,
    };

    for (const [id, ComponentClass] of Object.entries(componentClasses)) {
      console.log(`[AnexosSection] Criando ${id}...`);
      const component = new ComponentClass(this.data || {}, (newData) => {
        this.data = newData;
        if (this.onDataChange) this.onDataChange(this.data);
      });
      await component.render();
      this.components[id] = component;
    }
  }

  async showTab(tabId, force = false) {
    // Se for a mesma tab e não for force, não fazer nada
    if (this.currentTab === tabId && !force) return;

    this.currentTab = tabId;

    // Limpar conteúdo
    this.tabContent.innerHTML = "";

    // Adicionar o elemento do componente
    const component = this.components[tabId];
    if (component && component.element) {
      this.tabContent.appendChild(component.element);
    }

    // Aguardar um frame para garantir que o DOM está pronto
    await new Promise((resolve) => setTimeout(resolve));

    // Inicializar tabelas se necessário
    if (!this.initializedTabs.has(tabId)) {
      console.log(`[AnexosSection] Inicializando tabelas para ${tabId}`);

      if (typeof component.initTables === "function") {
        component.initTables();
      }

      this.initializedTabs.add(tabId);
    }
  }

  async ensureComponentInitialized(componentId) {
    const component = this.components[componentId];
    if (!component) return false;

    if (!this.initializedTabs.has(componentId)) {
      // Guardar a tab atual
      const previousTab = this.currentTab;

      // Mostrar temporariamente o componente
      this.tabContent.innerHTML = "";
      this.tabContent.appendChild(component.element);

      await new Promise((resolve) => setTimeout(resolve));

      if (typeof component.initTables === "function") {
        component.initTables();
      }

      this.initializedTabs.add(componentId);

      // Restaurar a tab anterior
      if (previousTab !== componentId) {
        this.tabContent.innerHTML = "";
        const previousComponent = this.components[previousTab];
        if (previousComponent && previousComponent.element) {
          this.tabContent.appendChild(previousComponent.element);
        }
      }

      await new Promise((resolve) => setTimeout(resolve));
    }

    return true;
  }

  async validateAll() {
    const errors = [];

    // Garantir que o Anexo J está inicializado para validação
    await this.ensureComponentInitialized("anexoJ");

    // Validar Anexo G
    if (this.components.anexoG?.tables?.anexoG) {
      const tableErrors = this.components.anexoG.tables.anexoG.validateAll();
      errors.push(...tableErrors);
      console.log(`[AnexosSection] Erros no Anexo G: ${tableErrors.length}`);
    }

    // Validar Anexo H
    if (this.components.anexoH?.tables?.beneficios?.validateAll) {
      const tableErrors =
        this.components.anexoH.tables.beneficios.validateAll();
      errors.push(...tableErrors);
      console.log(`[AnexosSection] Erros no Anexo H: ${tableErrors.length}`);
    }

    // Validar Anexo J
    if (this.components.anexoJ?.tables?.maisValiasJ) {
      const tableErrors =
        this.components.anexoJ.tables.maisValiasJ.validateAll();
      errors.push(...tableErrors);
      console.log(`[AnexosSection] Erros no Anexo J: ${tableErrors.length}`);
    }

    console.log(`[AnexosSection] Total de erros: ${errors.length}`);
    return errors;
  }

  async switchTab(tabId) {
    await this.showTab(tabId, false);

    // Atualizar UI dos botões
    const tabs = this.element.querySelectorAll(".tab-btn");
    tabs.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
    });
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
      reviewBtn.addEventListener("click", async () => {
        const originalText = reviewBtn.textContent;
        reviewBtn.textContent = "⏳ A validar...";
        reviewBtn.disabled = true;

        try {
          const errors = await this.validateAll();

          if (errors.length > 0) {
            await this.showValidationErrors(errors);
            return;
          }

          if (this.onReviewCallback) this.onReviewCallback();
        } catch (error) {
          console.error("Erro na validação:", error);
          Modal.error("Erro", "Ocorreu um erro durante a validação.");
        } finally {
          reviewBtn.textContent = originalText;
          reviewBtn.disabled = false;
        }
      });
    }

    const backBtn = this.element.querySelector("#backToBrokersBtn");
    if (backBtn && this.onBackCallback) {
      backBtn.addEventListener("click", () => this.onBackCallback());
    }
  }

  async showValidationErrors(errors) {
    const errorsList = new ErrorsList(errors, (error) => {
      this.modal?.close();
      this.focusError(error);
    });

    const errorsListElement = await errorsList.render();
    const wrapper = document.createElement("div");
    wrapper.className = "modal-errors-wrapper";
    wrapper.appendChild(errorsListElement);

    this.modal = new Modal({
      title: "Dados incompletos",
      message: wrapper.outerHTML,
      type: "warning",
      buttons: [{ text: "Fechar", type: "secondary", actionId: "close" }],
      onClose: () => {
        this.modal = null;
      },
    });

    await this.modal.render();
    this.modal.show();
  }

  async focusError(error) {
    await this.switchTab("anexoJ");

    setTimeout(() => {
      const table = this.components.anexoJ?.tables?.maisValiasJ;
      if (table && table.scrollToInvalidCell) {
        table.scrollToInvalidCell(error.rowId, error.field);
      }
    }, 100);
  }

  async getAllTableReferences() {
    // Inicializar todos os componentes silenciosamente
    for (const [id, component] of Object.entries(this.components)) {
      if (!this.initializedTabs.has(id)) {
        if (typeof component.initTables === "function") {
          component.initTables();
        }
        this.initializedTabs.add(id);
      }
    }

    return {
      maisValiasGTable: this.components.anexoG?.tables?.anexoG,
      beneficiosTable: this.components.anexoH?.tables?.beneficios,
      rendimentosJurosTable: this.components.anexoJ?.tables?.rendimentosJuros,
      maisValiasJTable: this.components.anexoJ?.tables?.maisValiasJ,
      maisValiasJBTable: this.components.anexoJ?.tables?.maisValiasJB,
    };
  }

  setData(data, onDataChange) {
    this.data = data;
    this.onDataChange = onDataChange;

    for (const component of Object.values(this.components)) {
      if (component && component.data) {
        component.data = data;
      }
    }
  }

  setOnReview(callback) {
    this.onReviewCallback = callback;
  }
  setOnBack(callback) {
    this.onBackCallback = callback;
  }
}
