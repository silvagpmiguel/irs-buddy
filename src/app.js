import { FormRenderer } from "./js/form-renderer.js";
import { XMLExporter } from "./js/xml-exporter.js";
import { UIController } from "./js/ui-controller.js";
import { XMLParser } from "./js/xml-parser.js";

class IRSBuddy {
  constructor() {
    this.ui = null;
    this.formRenderer = null;
    this.parsedData = null;
    this.editedData = null;
    this.currentFile = null;
  }

  async init() {
    this.ui = new UIController();
    await this.ui.init();
    this.setupUploadListeners();
    this.setupActionButtons();
  }

  setupUploadListeners() {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      const uploadButton = document.getElementById("uploadButton");
      const fileInput = document.getElementById("fileInput");
      const uploadZone = document.getElementById("uploadZone");
      const clearFileBtn = document.getElementById("clearFileBtn");

      if (uploadButton) {
        uploadButton.addEventListener("click", () => fileInput?.click());
      }

      if (fileInput) {
        fileInput.addEventListener("change", (e) => this.handleFileSelect(e));
      }

      if (uploadZone) {
        uploadZone.addEventListener("dragover", (e) => {
          e.preventDefault();
          uploadZone.classList.add("drag-over");
        });

        uploadZone.addEventListener("dragleave", () => {
          uploadZone.classList.remove("drag-over");
        });

        uploadZone.addEventListener("drop", (e) => {
          e.preventDefault();
          uploadZone.classList.remove("drag-over");
          const files = e.dataTransfer.files;
          if (files.length > 0) this.processFile(files[0]);
        });
      }

      if (clearFileBtn) {
        clearFileBtn.addEventListener("click", () => this.clearFile());
      }
    }, 100);
  }

  setupActionButtons() {
    setTimeout(() => {
      const backToHomeBtn = document.getElementById("backToHomeBtn");
      const exportXMLBtn = document.getElementById("exportXMLBtn");

      if (backToHomeBtn) {
        backToHomeBtn.addEventListener("click", () =>
          this.ui.switchView("home"),
        );
      }

      if (exportXMLBtn) {
        exportXMLBtn.addEventListener("click", () => this.exportXML());
      }
    }, 100);
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) this.processFile(file);
  }

  processFile(file) {
    if (!file.name.toLowerCase().endsWith(".xml")) {
      this.ui.showError("Por favor, selecione um ficheiro XML válido.");
      return;
    }

    this.currentFile = file;
    this.displayFileInfo(file);
    this.readXMLFile(file);
  }

  displayFileInfo(file) {
    const fileName = document.getElementById("fileName");
    const fileSize = document.getElementById("fileSize");
    const uploadContent = document.querySelector(".upload-content");
    const filePreview = document.getElementById("filePreview");

    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = `${(file.size / 1024).toFixed(2)} KB`;
    if (uploadContent) uploadContent.style.display = "none";
    if (filePreview) filePreview.style.display = "flex";
  }

  clearFile() {
    const fileInput = document.getElementById("fileInput");
    const uploadContent = document.querySelector(".upload-content");
    const filePreview = document.getElementById("filePreview");

    if (fileInput) fileInput.value = "";
    if (uploadContent) uploadContent.style.display = "block";
    if (filePreview) filePreview.style.display = "none";

    this.currentFile = null;
    this.parsedData = null;
    this.editedData = null;
  }

  readXMLFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => this.parseXML(e.target.result);
    reader.onerror = () => this.ui.showError("Erro ao ler o ficheiro.");
    reader.readAsText(file, "UTF-8");
  }

  parseXML(xmlString) {
    const parser = new XMLParser(xmlString);
    const result = parser.parse();

    if (result.success) {
      this.parsedData = result.data;
      this.editedData = JSON.parse(JSON.stringify(result.data));
      this.renderDeclaracaoView();
      this.ui.switchView("declaracao");
      this.ui.showSuccess("XML carregado com sucesso!");
    } else {
      this.ui.showError("Erro ao processar XML: " + result.error);
    }
  }

  renderDeclaracaoView() {
    this.formRenderer = new FormRenderer(this.editedData, (newData) => {
      this.editedData = newData;
    });

    this.ui.renderTabs();

    const tabContent = document.getElementById("tabContent");
    if (!tabContent) return;

    tabContent.innerHTML = `
        <div id="anexoGTab" class="tab-content active">
            <div class="card">
                ${this.formRenderer.renderAnexoGForm()}
            </div>
        </div>
        <div id="anexoHTab" class="tab-content" style="display: none;">
            <div class="card">
                ${this.formRenderer.renderAnexoHForm()}
            </div>
        </div>
        <div id="anexoJTab" class="tab-content" style="display: none;">
            <div class="card">
                ${this.formRenderer.renderAnexoJForm()}
            </div>
        </div>
    `;

    this.ui.tabs = {
      anexoG: document.getElementById("anexoGTab"),
      anexoH: document.getElementById("anexoHTab"),
      anexoJ: document.getElementById("anexoJTab"),
    };

    this.formRenderer.bindEvents(tabContent);
    this.setupActionButtons();
  }

  exportXML() {
    if (!this.editedData) {
      this.ui.showError("Não há dados para exportar.");
      return;
    }

    // TODO: Implement XML generation from editedData
    this.ui.showSuccess(
      "Funcionalidade de exportação em desenvolvimento. Em breve poderá exportar o XML atualizado.",
    );
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  window.irsBuddy = new IRSBuddy();
  window.irsBuddy.init();
});
