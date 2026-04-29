import { loadTemplate, loadStyles } from "../../js/template-loader.js";
import { FileInputArea } from "../file-input-area/file-input-area.js";

export class XMLUpload {
  constructor() {
    this.element = null;
    this.fileInputArea = null;
    this.onUploadCallback = null;
  }

  async render() {
    loadStyles("components/xml-upload/xml-upload");

    const template = await loadTemplate("components/xml-upload/xml-upload");

    const container = document.createElement("div");
    container.className = "xml-upload";
    container.innerHTML = template;

    this.element = container;

    await this.initFileInputArea();

    return this.element;
  }

  async initFileInputArea() {
    const container = this.element.querySelector("#xmlFileInputContainer");
    if (!container) {
      console.error("Container #xmlFileInputContainer não encontrado");
      return;
    }

    this.fileInputArea = new FileInputArea({
      type: "xml",
      accept: ".xml",
      title: "Ficheiro XML da AT",
      description: "Exportado pela aplicação da Autoridade Tributária",
      icon: "📁",
      onFileChange: (file, error) => {
        console.log(
          "XMLUpload - onFileChange:",
          file ? file.name : "null",
          error,
        );

        if (error) {
          if (this.onUploadCallback) {
            this.onUploadCallback(null, error);
          }
        } else if (file) {
          if (this.onUploadCallback) {
            this.onUploadCallback(file, null);
          }
        } else {
          if (this.onUploadCallback) {
            this.onUploadCallback(null, null);
          }
        }
      },
    });

    const element = await this.fileInputArea.render();
    container.appendChild(element);

    // Debug: verificar se o botão existe
    const selectBtn = element.querySelector(".select-file-btn");
    console.log("XMLUpload - botão selecionar encontrado:", !!selectBtn);
  }

  getFile() {
    return this.fileInputArea?.getFile() || null;
  }

  clearFile() {
    if (this.fileInputArea) {
      const fileInput = this.element.querySelector(".file-input-hidden");
      const emptyState = this.element.querySelector(".file-input-empty-state");
      const preview = this.element.querySelector(".file-input-preview");
      const statusDiv = this.element.querySelector(".file-input-status");
      if (fileInput && emptyState && preview) {
        this.fileInputArea.clearFile(fileInput, emptyState, preview, statusDiv);
      }
    }
  }

  setOnUpload(callback) {
    this.onUploadCallback = callback;
  }

  showSuccessFeedback() {
    const card = this.element.querySelector(".file-input-area-card");
    if (card) {
      card.classList.add("upload-success");
      setTimeout(() => card.classList.remove("upload-success"), 600);
    }
  }
}
