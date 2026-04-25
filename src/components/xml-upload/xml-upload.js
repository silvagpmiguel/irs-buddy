import { loadTemplate, loadStyles } from "../../js/template-loader.js";

export class XMLUpload {
  constructor() {
    this.element = null;
    this.onUploadCallback = null;
    this.currentFile = null;
  }

  async render() {
    // Carregar estilos específicos do componente
    loadStyles("components/xml-upload/xml-upload");

    // Carregar template HTML
    const template = await loadTemplate("components/xml-upload/xml-upload");

    const container = document.createElement("div");
    container.className = "xml-upload";
    container.innerHTML = template;

    this.element = container;
    this.attachEvents();
    return this.element;
  }

  attachEvents() {
    const uploadButton = this.element.querySelector("#uploadButton");
    const fileInput = this.element.querySelector("#fileInput");
    const uploadZone = this.element.querySelector("#uploadZone");
    const clearFileBtn = this.element.querySelector("#clearFileBtn");

    if (uploadButton) {
      uploadButton.addEventListener("click", () => fileInput?.click());
    }

    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) this.handleFileSelect(file);
      });
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
        if (files.length > 0) this.handleFileSelect(files[0]);
      });
    }

    if (clearFileBtn) {
      clearFileBtn.addEventListener("click", () => this.clearFile());
    }
  }

  handleFileSelect(file) {
    if (!file.name.toLowerCase().endsWith(".xml")) {
      if (this.onUploadCallback) {
        this.onUploadCallback(
          null,
          "Por favor, selecione um ficheiro XML válido.",
        );
      }
      return;
    }
    this.currentFile = file;
    this.displayFileInfo(file);
    if (this.onUploadCallback) {
      this.onUploadCallback(file, null);
    }
  }

  displayFileInfo(file) {
    const fileName = this.element.querySelector("#fileName");
    const fileSize = this.element.querySelector("#fileSize");
    const uploadContent = this.element.querySelector(".upload-content");
    const filePreview = this.element.querySelector("#filePreview");

    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = `${(file.size / 1024).toFixed(2)} KB`;
    if (uploadContent) uploadContent.style.display = "none";
    if (filePreview) filePreview.style.display = "flex";
  }

  clearFile() {
    const fileInput = this.element.querySelector("#fileInput");
    const uploadContent = this.element.querySelector(".upload-content");
    const filePreview = this.element.querySelector("#filePreview");

    if (fileInput) fileInput.value = "";
    if (uploadContent) uploadContent.style.display = "block";
    if (filePreview) filePreview.style.display = "none";

    this.currentFile = null;
    if (this.onUploadCallback) {
      this.onUploadCallback(null, null);
    }
  }

  getFile() {
    return this.currentFile;
  }

  setOnUpload(callback) {
    this.onUploadCallback = callback;
  }

  showSuccessFeedback() {
    const uploadZone = this.element.querySelector("#uploadZone");
    if (!uploadZone) return;

    // Adicionar classe de sucesso
    uploadZone.classList.add("upload-success");

    // Criar elemento de feedback
    const successIcon = document.createElement("div");
    successIcon.className = "upload-success-icon";
    successIcon.innerHTML = "✅";
    successIcon.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    font-size: 3rem;
    opacity: 0;
    pointer-events: none;
    z-index: 10;
  `;
    uploadZone.style.position = "relative";
    uploadZone.appendChild(successIcon);

    // Animação do ícone
    setTimeout(() => {
      successIcon.style.transition = "transform 0.3s ease, opacity 0.3s ease";
      successIcon.style.transform = "translate(-50%, -50%) scale(1)";
      successIcon.style.opacity = "1";
    }, 10);

    // Remover após animação
    setTimeout(() => {
      successIcon.style.transform = "translate(-50%, -50%) scale(0)";
      successIcon.style.opacity = "0";
      setTimeout(() => successIcon.remove(), 300);
      uploadZone.classList.remove("upload-success");
    }, 1500);
  }
}
