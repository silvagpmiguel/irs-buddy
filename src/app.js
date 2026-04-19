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
    this.exporting = false;
  }

  init() {
    this.ui = new UIController();
    this.ui.init();
    this.setupUploadListeners();
    this.setupActionButtons();
  }

  exportXML() {
    if (this.exporting) return; // impede múltiplas exportações
    if (!this.editedData) {
      this.ui.showError("Não há dados para exportar.");
      return;
    }
    if (!this.originalXmlString) {
      this.ui.showError("XML original não encontrado.");
      return;
    }

    const includedAnexos = {
      anexoJ: this.editedData.anexoJ?.incluir !== false,
      anexoH: this.editedData.anexoH?.incluir !== false,
      anexoG: this.editedData.anexoG?.incluir !== false,
    };

    if (
      !includedAnexos.anexoG &&
      !includedAnexos.anexoH &&
      !includedAnexos.anexoJ
    ) {
      this.ui.showError("Nenhum anexo selecionado para exportar.");
      return;
    }

    // Desabilita o botão e mostra loading
    const exportBtn = document.getElementById("exportXMLBtn");
    if (exportBtn) {
      this.exporting = true;
      exportBtn.disabled = true;
      exportBtn.textContent = "⏳ A exportar...";
    }

    // Pequeno delay para garantir que o botão é desabilitado visualmente
    setTimeout(() => {
      try {
        const tableReferences = {
          beneficiosTable: this.formRenderer?.tables?.beneficios,
          rendimentosJurosTable: this.formRenderer?.tables?.rendimentosJuros,
          maisValiasJTable: this.formRenderer?.tables?.maisValiasJ,
          maisValiasGTable: this.formRenderer?.tables?.maisValiasG,
        };

        const exporter = new XMLExporter(
          this.originalXmlString,
          this.editedData,
          includedAnexos,
          tableReferences,
        );
        const result = exporter.export();

        if (result.success) {
          const blob = new Blob([result.xml], { type: "application/xml" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `declaracao_irs_atualizada_${new Date().toISOString().slice(0, 19)}.xml`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          this.ui.showSuccess(result.message);
        } else {
          this.ui.showError("Erro ao exportar: " + result.error);
        }
      } catch (error) {
        this.ui.showError("Erro inesperado: " + error.message);
      } finally {
        // Reabilita o botão
        if (exportBtn) {
          exportBtn.disabled = false;
          exportBtn.textContent = "💾 Exportar XML";
        }
        this.exporting = false;
      }
    }, 100);
  }

  readXMLFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => this.parseXML(e.target.result);
    reader.onerror = () => this.ui.showError("Erro ao ler o ficheiro.");
    reader.readAsText(file, "UTF-8");
  }

  renderDeclaracaoView() {
    this.formRenderer = new FormRenderer(this.editedData, (newData) => {
      this.editedData = newData;
    });
    this.ui.setFormRenderer(this.formRenderer);
    this.ui.renderTabs();

    const tabContent = document.getElementById("tabContent");
    if (!tabContent) return;

    // Limpar conteúdo existente (por precaução)
    tabContent.innerHTML = "";

    // Adicionar as tabs com a correcta (anexoG) activa
    tabContent.innerHTML = `
    <div id="anexoGTab" class="tab-content" style="display: block;">
      <div class="card">
        ${this.formRenderer.renderAnexoGForm()}
      </div>
    </div>
    <div id="anexoJTab" class="tab-content" style="display: none;">
      <div class="card">
        ${this.formRenderer.renderAnexoJForm()}
      </div>
    </div>
    <div id="anexoHTab" class="tab-content" style="display: none;">
      <div class="card">
        ${this.formRenderer.renderAnexoHForm()}
      </div>
    </div>
  `;

    this.ui.tabs = {
      anexoG: document.getElementById("anexoGTab"),
      anexoJ: document.getElementById("anexoJTab"),
      anexoH: document.getElementById("anexoHTab"),
    };

    this.formRenderer.bindEvents(tabContent);
    // Activar a tab G no formRenderer (para criar as tabelas)
    this.formRenderer.activateTab("anexoG");
    this.setupActionButtons();
  }

  parseXML(xmlString) {
    this.originalXmlString = xmlString;
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
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  window.irsBuddy = new IRSBuddy();
  window.irsBuddy.init();
});
