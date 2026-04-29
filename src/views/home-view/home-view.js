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

    // Cache de componentes (apenas os que já foram ativados)
    this.anexoComponents = {
      anexoG: null,
      anexoH: null,
      anexoJ: null,
    };

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
        // Ao entrar no passo 3, inicializar a tab ativa
        setTimeout(() => this.renderActiveTab(), 100);
      }
    });
  }

  async getOrCreateAnexoComponent(anexoId, forceCreate = false) {
    // Se já existe em cache e não for force create, retornar
    if (!forceCreate && this.anexoComponents[anexoId]) {
      return this.anexoComponents[anexoId];
    }

    // Se forceCreate=true e já existe, recriar?
    if (forceCreate && this.anexoComponents[anexoId]) {
      // Não recriar, apenas retornar o existente
      // (os dados já estão lá, não precisamos recriar)
      return this.anexoComponents[anexoId];
    }

    // Criar novo componente
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

    // Renderizar o componente
    const element = await anexoComponent.render();
    anexoComponent.element = element;

    this.anexoComponents[anexoId] = anexoComponent;
    return anexoComponent;
  }

  async renderActiveTab() {
    const tabContent = this.element.querySelector("#tabContent");
    if (!tabContent) return;

    if (this.isRendering) return;
    this.isRendering = true;

    tabContent.innerHTML = '<div class="loading-spinner">Carregando...</div>';

    try {
      // Obter ou criar o componente do anexo (as tabelas serão inicializadas aqui)
      const anexoComponent = await this.getOrCreateAnexoComponent(
        this.currentTab,
      );

      if (anexoComponent && anexoComponent.element) {
        tabContent.innerHTML = "";
        tabContent.appendChild(anexoComponent.element);
        this.currentAnexoComponent = anexoComponent;
        console.log(`Tab ${this.currentTab} rendered successfully`);
      } else {
        throw new Error("Componente não retornou elemento válido");
      }
    } catch (error) {
      console.error("Error rendering anexo:", error);
      tabContent.innerHTML =
        '<div class="error">Erro ao carregar o anexo</div>';
    }

    this.isRendering = false;
  }

  async getAllTableReferences() {
    const references = {};

    // Garantir que todos os anexos estão inicializados (reutilizando o método existente)
    const anexosToInitialize = ["anexoG", "anexoH", "anexoJ"];

    for (const anexoId of anexosToInitialize) {
      await this.getOrCreateAnexoComponent(anexoId, true);
    }

    // CORREÇÃO: Usar this.anexoComponents em vez de this.anexoGComponent, etc.
    const anexoGComp = this.anexoComponents.anexoG;
    const anexoHComp = this.anexoComponents.anexoH;
    const anexoJComp = this.anexoComponents.anexoJ;

    // Anexo G
    if (anexoGComp?.tables?.anexoG) {
      references.maisValiasGTable = anexoGComp.tables.anexoG;
      console.log("✅ Referência do Anexo G obtida");
    } else {
      console.warn("⚠️ Anexo G não tem tabela anexoG", anexoGComp?.tables);
    }

    // Anexo H
    if (anexoHComp?.tables?.beneficios) {
      references.beneficiosTable = anexoHComp.tables.beneficios;
      console.log("✅ Referência do Anexo H obtida");
    } else {
      console.warn("⚠️ Anexo H não tem tabela beneficios", anexoHComp?.tables);
    }

    // Anexo J
    if (anexoJComp?.tables) {
      references.rendimentosJurosTable = anexoJComp.tables.rendimentosJuros;
      references.maisValiasJTable = anexoJComp.tables.maisValiasJ;
      references.maisValiasJBTable = anexoJComp.tables.maisValiasJB;
      console.log("✅ Referências do Anexo J obtidas", {
        rendimentosJurosTable: !!references.rendimentosJurosTable,
        maisValiasJTable: !!references.maisValiasJTable,
        maisValiasJBTable: !!references.maisValiasJBTable,
      });
    } else {
      console.warn("⚠️ Anexo J não tem tables", anexoJComp);
    }

    return references;
  }

  switchTab(tabId) {
    if (this.currentTab === tabId) return;
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
    const step1 = this.element.querySelector("#step1Container");
    const step2 = this.element.querySelector("#step2Container");
    const step3 = this.element.querySelector("#step3Container");

    if (step1) step1.style.display = "none";
    if (step2) step2.style.display = "none";
    if (step3) step3.style.display = "none";

    if (step === 1 && step1) step1.style.display = "block";
    if (step === 2 && step2) step2.style.display = "block";
    if (step === 3 && step3) step3.style.display = "block";

    if (this.progressSteps) {
      if (step === 1) {
        this.progressSteps.reset();
      } else if (step === 2) {
        this.progressSteps.completeStep(1);
        this.progressSteps.setCurrentStep(2);
      } else if (step === 3) {
        this.progressSteps.completeStep(2);
        this.progressSteps.setCurrentStep(3);
        // Apenas mostrar a tab ativa se já tiver dados
        if (this.data) {
          setTimeout(() => this.renderActiveTab(), 50);
        }
      }
    }
  }

  setData(data, onDataChange) {
    this.data = data;
    this.onDataChange = onDataChange;

    // Atualizar dados em todos os componentes em cache (se existirem)
    Object.values(this.anexoComponents).forEach((component) => {
      if (component && component.data) {
        component.data = data;
        // Se a tabela já existe, recarregar os dados
        if (component.tables) {
          // Recarregar cada tabela
          Object.values(component.tables).forEach((table) => {
            if (table && table.setData) {
              // Não recarregar para evitar loops, apenas atualizar referência
            }
          });
        }
      }
    });

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
    // Limpar cache dos anexos para recomeçar
    this.anexoComponents = {
      anexoG: null,
      anexoH: null,
      anexoJ: null,
    };
  }
}
