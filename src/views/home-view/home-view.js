import { loadTemplate, loadStyles } from "../../js/template-loader.js";
import { ProgressSteps } from "../../components/progress-steps/progress-steps.js";
import { XMLUpload } from "../../components/xml-upload/xml-upload.js";
import { BrokerImport } from "../../components/broker-import/broker-import.js";
import { AnexoG } from "../../components/anexo-g/anexo-g.js";
import { AnexoH } from "../../components/anexo-h/anexo-h.js";
import { AnexoJ } from "../../components/anexo-j/anexo-j.js";

export class HomeView {
  constructor() {
    this.element = null;
    this.progressSteps = null;
    this.xmlUpload = null;
    this.brokerImport = null;
    this.data = null;
    this.onDataChange = null;
    this.currentTab = "anexoG";
    this.anexoComponents = {
      anexoG: null,
      anexoH: null,
      anexoJ: null,
    };
    this.isRendering = false; // Flag para evitar renderizações duplicadas
    this.currentAnexoComponent = null; // Guardar referência do componente atual

    this.onFileUploadCallback = null;
    this.onBrokerProcessCallback = null;
    this.onExportCallback = null;
  }

  async render() {
    loadStyles("views/home-view/home-view");
    const template = await loadTemplate("views/home-view/home-view");

    const container = document.createElement("div");
    container.id = "homeView";
    container.className = "view active";
    container.innerHTML = template;

    this.element = container;
    await this.initComponents();
    this.attachEvents();

    return this.element;
  }

  async initComponents() {
    // Progress Steps
    this.progressSteps = new ProgressSteps();
    const progressElement = await this.progressSteps.render();
    this.element
      .querySelector("#progressStepsContainer")
      .appendChild(progressElement);

    // XML Upload
    this.xmlUpload = new XMLUpload();
    const xmlElement = await this.xmlUpload.render();
    this.element.querySelector("#xmlUploadContainer").appendChild(xmlElement);

    this.xmlUpload.setOnUpload((file, error) => {
      if (error) {
        console.error(error);
      } else if (file) {
        this.goToStep(2);
        if (this.onFileUploadCallback) this.onFileUploadCallback(file);
      }
    });

    // Broker Import
    this.brokerImport = new BrokerImport([
      {
        id: "xtb",
        name: "XTB",
        icon: "📈",
        description: "Plataforma de investimento internacional",
        instructions:
          'A XTB disponibiliza dois relatórios em PDF: "Capital Gains" (mais-valias) e "Investment Income" (dividendos/juros).',
        requiredFiles: [
          {
            type: "capitalGains",
            label: "Capital Gains",
            icon: "📊",
            description: "Mais-valias de ações, ETFs e CFDs",
          },
          {
            type: "investmentIncome",
            label: "Investment Income",
            icon: "💰",
            description: "Dividendos e juros",
          },
        ],
      },
    ]);
    const brokerElement = await this.brokerImport.render();
    this.element
      .querySelector("#brokerImportContainer")
      .appendChild(brokerElement);

    this.brokerImport.setOnProcess(async (files) => {
      if (this.onBrokerProcessCallback) {
        await this.onBrokerProcessCallback(files);
        this.goToStep(3);
        // Não chamar renderActiveTab aqui, pois goToStep já vai chamar
      }
    });
  }

  setData(data, onDataChange) {
    this.data = data;
    this.onDataChange = onDataChange;
    // Só recarregar a tab se estivermos no passo 3 e se já tiver sido renderizada
    const step3 = this.element?.querySelector("#step3Container");
    if (step3 && step3.style.display !== "none" && this.currentAnexoComponent) {
      this.refreshActiveTab();
    }
  }

  async refreshActiveTab() {
    // Atualizar os dados do componente atual sem recriar tudo
    if (this.currentAnexoComponent && this.currentAnexoComponent.updateData) {
      this.currentAnexoComponent.updateData(this.data);
    } else {
      // Fallback: recriar a tab
      this.renderActiveTab();
    }
  }

  async renderActiveTab() {
    const tabContent = this.element.querySelector("#tabContent");
    if (!tabContent) {
      console.error("tabContent not found");
      return;
    }

    if (this.isRendering) {
      console.log("Já está a renderizar, ignorando...");
      return;
    }

    this.isRendering = true;
    console.log("Rendering tab:", this.currentTab);

    // Mostrar loading
    tabContent.innerHTML = '<div class="loading-spinner">Carregando...</div>';

    let anexoComponent;
    switch (this.currentTab) {
      case "anexoG":
        anexoComponent = new AnexoG(this.data || {}, this.onDataChange);
        break;
      case "anexoH":
        anexoComponent = new AnexoH(this.data || {}, this.onDataChange);
        break;
      case "anexoJ":
        anexoComponent = new AnexoJ(this.data || {}, this.onDataChange);
        break;
      default:
        this.isRendering = false;
        console.error("Tab desconhecida:", this.currentTab);
        return;
    }

    try {
      tabContent.innerHTML = "";
      const element = await anexoComponent.render();
      tabContent.appendChild(element);
      this.currentAnexoComponent = anexoComponent;
      console.log("Tab rendered successfully");
    } catch (error) {
      console.error("Error rendering anexo:", error);
      tabContent.innerHTML =
        '<div class="error">Erro ao carregar o anexo: ' +
        error.message +
        "</div>";
    }

    this.isRendering = false;
  }

  switchTab(tabId) {
    if (this.currentTab === tabId) return; // Não trocar para a mesma tab

    this.currentTab = tabId;

    const tabs = this.element.querySelectorAll(".tab-btn");
    tabs.forEach((btn) => {
      btn.classList.remove("active");
      if (btn.getAttribute("data-tab") === tabId) {
        btn.classList.add("active");
      }
    });

    this.renderActiveTab();
  }

  goToStep(step) {
    // Esconder todas as secções
    const step1 = this.element.querySelector("#step1Container");
    const step2 = this.element.querySelector("#step2Container");
    const step3 = this.element.querySelector("#step3Container");

    if (step1) step1.style.display = "none";
    if (step2) step2.style.display = "none";
    if (step3) step3.style.display = "none";

    // Mostrar a secção correspondente
    if (step === 1 && step1) step1.style.display = "block";
    if (step === 2 && step2) step2.style.display = "block";
    if (step === 3 && step3) step3.style.display = "block";

    // Atualizar progress steps
    if (this.progressSteps) {
      if (step === 1) {
        this.progressSteps.reset();
      } else if (step === 2) {
        this.progressSteps.completeStep(1);
        this.progressSteps.setCurrentStep(2);
      } else if (step === 3) {
        this.progressSteps.completeStep(2);
        this.progressSteps.setCurrentStep(3);
        // Só renderizar a tab se ainda não foi renderizada
        if (!this.currentAnexoComponent) {
          setTimeout(() => this.renderActiveTab(), 50);
        }
      }
    }
  }

  setData(data, onDataChange) {
    this.data = data;
    this.onDataChange = onDataChange;
    // Se já estiver no passo 3, recarregar a tab ativa
    const step3 = this.element?.querySelector("#step3Container");
    if (step3 && step3.style.display !== "none") {
      this.renderActiveTab();
    }
  }

  attachEvents() {
    const tabs = this.element.querySelectorAll(".tab-btn");
    tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabId = btn.getAttribute("data-tab");
        this.switchTab(tabId);
      });
    });

    const exportBtn = this.element.querySelector("#exportXMLBtn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        if (this.onExportCallback) this.onExportCallback();
      });
    }
  }

  setOnFileUpload(callback) {
    this.onFileUploadCallback = callback;
  }

  setOnBrokerProcess(callback) {
    this.onBrokerProcessCallback = callback;
  }

  setOnExport(callback) {
    this.onExportCallback = callback;
  }

  show() {
    if (this.element) this.element.style.display = "block";
  }

  hide() {
    if (this.element) this.element.style.display = "none";
  }

  reset() {
    this.goToStep(1);
    if (this.xmlUpload) this.xmlUpload.clearFile();
    if (this.brokerImport) this.brokerImport.reset();
  }
}
