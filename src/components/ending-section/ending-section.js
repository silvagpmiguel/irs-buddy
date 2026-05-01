import { loadTemplate, loadStyles } from "../../js/template-loader.js";

export class EndingSection {
  constructor() {
    this.element = null;
    this.onBackCallback = null;
    this.onDownloadAgainCallback = null;
  }

  async render() {
    loadStyles("components/ending-section/ending-section");
    const template = await loadTemplate(
      "components/ending-section/ending-section",
    );

    const container = document.createElement("div");
    container.className = "ending-section";
    container.innerHTML = template;
    this.element = container;

    this.attachEvents();
    return this.element;
  }

  attachEvents() {
    const backBtn = this.element.querySelector("#backToSummaryBtn");
    if (backBtn && this.onBackCallback) {
      backBtn.addEventListener("click", () => this.onBackCallback());
    }

    const downloadBtn = this.element.querySelector("#downloadAgainBtn");
    if (downloadBtn && this.onDownloadAgainCallback) {
      downloadBtn.addEventListener("click", () =>
        this.onDownloadAgainCallback(),
      );
    }
  }

  setOnBack(callback) {
    this.onBackCallback = callback;
  }

  setOnDownloadAgain(callback) {
    this.onDownloadAgainCallback = callback;
  }
}
