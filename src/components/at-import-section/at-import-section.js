import { loadTemplate, loadStyles } from "../../js/template-loader.js";
import { FileInputArea } from "../file-input-area/file-input-area.js";

export class ATImportSection {
  constructor() {
    this.element = null;
    this.fileInputArea = null;
    this.onCompleteCallback = null;
    this.currentFile = null;
  }

  async render() {
    loadStyles("components/at-import-section/at-import-section");
    const template = await loadTemplate(
      "components/at-import-section/at-import-section",
    );

    const container = document.createElement("div");
    container.className = "at-import-section";
    container.innerHTML = template;
    this.element = container;

    await this.initFileInputArea();
    return this.element;
  }

  async initFileInputArea() {
    const container = this.element.querySelector("#atFileInputContainer");
    if (!container) return;

    this.fileInputArea = new FileInputArea({
      type: "xml",
      accept: ".xml",
      title: "Ficheiro XML da AT",
      description: "Exportado pela aplicação da Autoridade Tributária",
      icon: "📁",
      onFileChange: (file, error) => {
        if (error) {
          console.error("Erro no upload:", error);
        } else if (file) {
          this.currentFile = file;
          if (this.onCompleteCallback) this.onCompleteCallback(file);
        } else {
          this.currentFile = null;
        }
      },
    });

    const element = await this.fileInputArea.render();
    container.appendChild(element);
  }

  getFile() {
    return this.currentFile;
  }

  setOnComplete(callback) {
    this.onCompleteCallback = callback;
  }
}
