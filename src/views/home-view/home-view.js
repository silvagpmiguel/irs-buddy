import { loadTemplate, loadStyles } from "../../js/template-loader.js";
import { ProgressSteps } from "../../components/progress-steps/progress-steps.js";
import { ATImportSection } from "../../components/at-import-section/at-import-section.js";
import { BrokerSection } from "../../components/broker-section/broker-section.js";
import { AnexosSection } from "../../components/anexos-section/anexos-section.js";
import { SummarySection } from "../../components/summary-section/summary-section.js";
import { EndingSection } from "../../components/ending-section/ending-section.js";

export class HomeView {
  constructor() {
    this.element = null;
    this.progressSteps = null;
    this.currentStep = 1;

    // Secções
    this.atImportSection = null;
    this.brokerSection = null;
    this.anexosSection = null;
    this.summarySection = null;
    this.endingSection = null;

    // Dados
    this.data = null;
    this.originalXmlString = null;
    this.originalParsedData = null;

    // Callbacks externos
    this.onFileUploadCallback = null;
    this.onBrokerProcessCallback = null;
    this.onExportCallback = null;
    this.onDataChangeCallback = null;
  }

  async render() {
    loadStyles("views/home-view/home-view");
    const template = await loadTemplate("views/home-view/home-view");

    const container = document.createElement("div");
    container.id = "homeView";
    container.className = "view active";
    container.innerHTML = template;
    this.element = container;

    await this.initSections();
    return this.element;
  }

  async initSections() {
    // Progress Steps
    this.progressSteps = new ProgressSteps();
    const progressElement = await this.progressSteps.render();
    this.element
      .querySelector("#progressStepsContainer")
      .appendChild(progressElement);

    // Secção 1: Importação da AT
    await this.renderATImportSection();

    // Secção 2: Brokers
    await this.renderBrokerSection();
  }

  async renderATImportSection() {
    const container = this.element.querySelector("#step1Container");
    if (!container) return;

    container.innerHTML = "";

    this.atImportSection = new ATImportSection();
    this.atImportSection.setOnComplete((file) => {
      if (this.onFileUploadCallback) this.onFileUploadCallback(file);
      this.goToStep(2);
    });

    const element = await this.atImportSection.render();
    container.appendChild(element);
  }

  async renderBrokerSection() {
    const container = this.element.querySelector("#step2Container");
    if (!container) return;

    container.innerHTML = "";

    this.brokerSection = new BrokerSection();

    this.brokerSection.setOnProcess(async (files) => {
      if (this.onBrokerProcessCallback) {
        await this.onBrokerProcessCallback(files);
      }
    });

    this.brokerSection.setOnComplete(() => {
      this.goToStep(3);
    });

    this.brokerSection.setOnBack(() => {
      this.goToStep(1);
    });

    const element = await this.brokerSection.render();
    container.appendChild(element);
  }

  async renderAnexosSection() {
    const container = this.element.querySelector("#step3Container");
    if (!container) return;

    container.innerHTML = "";

    this.anexosSection = new AnexosSection(this.data, (newData) => {
      this.data = newData;
      if (this.onDataChangeCallback) this.onDataChangeCallback(this.data);
    });

    this.anexosSection.setOnReview(() => this.goToStep(4));
    this.anexosSection.setOnBack(() => this.goToStep(2));

    const element = await this.anexosSection.render();
    container.appendChild(element);
  }

  async renderSummarySection() {
    const container = this.element.querySelector("#step4Container");
    if (!container) return;

    container.innerHTML = "";

    this.summarySection = new SummarySection(
      this.originalXmlString,
      this.data,
      this.originalParsedData,
    );

    this.summarySection.setOnBack(() => this.goToStep(3));
    this.summarySection.setOnConfirm(() => {
      if (this.onExportCallback) {
        this.onExportCallback();
      }
      this.goToStep(5);
    });

    const element = await this.summarySection.render();
    container.appendChild(element);
  }

  async renderEndingSection() {
    const container = this.element.querySelector("#step5Container");
    if (!container) return;

    container.innerHTML = "";

    this.endingSection = new EndingSection();

    this.endingSection.setOnBack(() => this.goToStep(4));
    this.endingSection.setOnDownloadAgain(() => {
      if (this.onExportCallback) {
        this.onExportCallback();
      }
    });

    const element = await this.endingSection.render();
    container.appendChild(element);
  }

  goToStep(step) {
    this.currentStep = step;

    const step1 = this.element.querySelector("#step1Container");
    const step2 = this.element.querySelector("#step2Container");
    const step3 = this.element.querySelector("#step3Container");
    const step4 = this.element.querySelector("#step4Container");
    const step5 = this.element.querySelector("#step5Container");

    if (step1) step1.style.display = step === 1 ? "block" : "none";
    if (step2) step2.style.display = step === 2 ? "block" : "none";
    if (step3) step3.style.display = step === 3 ? "block" : "none";
    if (step4) step4.style.display = step === 4 ? "block" : "none";
    if (step5) step5.style.display = step === 5 ? "block" : "none";

    this.updateProgressSteps(step);

    if (step === 3) this.renderAnexosSection();
    if (step === 4) this.renderSummarySection();
    if (step === 5) this.renderEndingSection();
  }

  updateProgressSteps(step) {
    if (!this.progressSteps) return;

    if (step === 1) {
      this.progressSteps.reset();
    } else if (step === 2) {
      this.progressSteps.completeStep(1);
      this.progressSteps.setCurrentStep(2);
    } else if (step === 3) {
      this.progressSteps.completeStep(2);
      this.progressSteps.setCurrentStep(3);
    } else if (step === 4) {
      this.progressSteps.completeStep(3);
      this.progressSteps.setCurrentStep(4);
    } else if (step === 5) {
      this.progressSteps.completeStep(4);
      this.progressSteps.setCurrentStep(5);
    }
  }

  // ============ MÉTODOS PÚBLICOS ============

  setData(data, onDataChange, originalParsedData) {
    this.data = data;
    this.onDataChangeCallback = onDataChange;
    this.originalParsedData = originalParsedData;

    if (this.anexosSection) {
      this.anexosSection.setData(data, onDataChange);
    }
  }

  setOriginalXmlString(xmlString) {
    this.originalXmlString = xmlString;
  }

  async getAllTableReferences() {
    if (this.anexosSection) {
      return await this.anexosSection.getAllTableReferences();
    }
    return {};
  }

  // ============ SETTERS PARA CALLBACKS ============

  setOnFileUpload(callback) {
    this.onFileUploadCallback = callback;
  }

  setOnBrokerProcess(callback) {
    this.onBrokerProcessCallback = callback;
  }

  setOnExport(callback) {
    this.onExportCallback = callback;
  }

  setOnDataChange(callback) {
    this.onDataChangeCallback = callback;
  }

  // ============ MÉTODOS DE UTILIDADE ============

  show() {
    if (this.element) this.element.style.display = "block";
  }

  hide() {
    if (this.element) this.element.style.display = "none";
  }

  reset() {
    this.goToStep(1);
    if (this.brokerSection) this.brokerSection.reset();
    this.data = null;
    this.originalXmlString = null;
    this.originalParsedData = null;
  }
}
