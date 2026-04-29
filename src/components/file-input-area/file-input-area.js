import { loadTemplate, loadStyles } from "../../js/template-loader.js";

export class FileInputArea {
  constructor(options = {}) {
    this.type = options.type || "file";
    this.accept = options.accept || ".pdf,.xml";
    this.title = options.title || "Upload de Ficheiro";
    this.description = options.description || "";
    this.icon = options.icon || "📄";
    this.onFileChange = options.onFileChange || (() => {});
    this.element = null;
    this.currentFile = null;
  }

  async render() {
    loadStyles("components/file-input-area/file-input-area");
    let template = await loadTemplate(
      "components/file-input-area/file-input-area",
    );

    template = template
      .replace(/\${type}/g, this.type)
      .replace(/\${accept}/g, this.accept)
      .replace(/\${title}/g, this.title)
      .replace(/\${description}/g, this.description)
      .replace(/\${icon}/g, this.icon);

    const container = document.createElement("div");
    container.className = "file-input-area";
    container.innerHTML = template;
    this.element = container.firstElementChild;

    this.attachEvents();
    return this.element;
  }

  attachEvents() {
    const card = this.element;
    const fileInput = this.element.querySelector(".file-input-hidden");
    const clearBtn = this.element.querySelector(".clear-file-btn");
    const emptyState = this.element.querySelector(".file-input-empty-state");
    const preview = this.element.querySelector(".file-input-preview");
    const fileNameSpan = this.element.querySelector(".file-name");
    const fileSizeSpan = this.element.querySelector(".file-size");
    const statusDiv = this.element.querySelector(".file-input-status");

    // Prevenir comportamento padrão do browser para drag-and-drop
    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // ========== CARD INTEIRO É A ZONA DE DROP ==========
    card.addEventListener("dragenter", preventDefaults, false);
    card.addEventListener("dragover", preventDefaults, false);
    card.addEventListener("dragleave", preventDefaults, false);
    card.addEventListener("drop", preventDefaults, false);

    card.addEventListener("dragenter", (e) => {
      e.preventDefault();
      e.stopPropagation();
      card.classList.add("drag-over");
    });

    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      card.classList.add("drag-over");
    });

    card.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const relatedTarget = e.relatedTarget;
      if (!card.contains(relatedTarget)) {
        card.classList.remove("drag-over");
      }
    });

    card.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      card.classList.remove("drag-over");

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFile(
          files[0],
          fileInput,
          emptyState,
          preview,
          fileNameSpan,
          fileSizeSpan,
          statusDiv,
        );
      }
    });

    // ========== INPUT FILE CHANGE (já é tratado nativamente pelo label) ==========
    fileInput.addEventListener("change", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.target.files && e.target.files.length > 0) {
        this.handleFile(
          e.target.files[0],
          fileInput,
          emptyState,
          preview,
          fileNameSpan,
          fileSizeSpan,
          statusDiv,
        );
      }
    });

    // ========== REMOVER FICHEIRO ==========
    if (clearBtn) {
      clearBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.clearFile(fileInput, emptyState, preview, statusDiv);
      });
    }
  }

  handleFile(
    file,
    fileInput,
    emptyState,
    preview,
    fileNameSpan,
    fileSizeSpan,
    statusDiv,
  ) {
    // Validar tipo de ficheiro
    const acceptTypes = this.accept.split(",").map((t) => t.trim());
    const fileExtension = `.${file.name.split(".").pop()}`;
    const isValidType = acceptTypes.some((type) => {
      if (type.startsWith(".")) {
        return fileExtension.toLowerCase() === type.toLowerCase();
      }
      if (type.includes("/")) {
        return file.type === type;
      }
      return false;
    });

    if (!isValidType) {
      this.showStatus(
        statusDiv,
        `Tipo de ficheiro inválido. Aceite: ${this.accept}`,
        "error",
      );
      return;
    }

    this.currentFile = file;
    this.element.classList.add("has-file");

    if (emptyState) emptyState.style.display = "none";
    if (preview) preview.style.display = "flex";
    if (fileNameSpan) fileNameSpan.textContent = file.name;
    if (fileSizeSpan)
      fileSizeSpan.textContent = `${(file.size / 1024).toFixed(2)} KB`;
    this.showStatus(statusDiv, "✅ Ficheiro carregado com sucesso!", "success");

    this.onFileChange(file, null);

    this.element.classList.add("upload-success");
    setTimeout(() => this.element.classList.remove("upload-success"), 600);
  }

  clearFile(fileInput, emptyState, preview, statusDiv) {
    this.currentFile = null;
    if (fileInput) fileInput.value = "";
    this.element.classList.remove("has-file");

    if (emptyState) emptyState.style.display = "block";
    if (preview) preview.style.display = "none";
    this.showStatus(statusDiv, "", "");

    this.onFileChange(null, null);
  }

  showStatus(statusDiv, message, type) {
    if (!statusDiv) return;
    if (message) {
      statusDiv.innerHTML = `<span class="status-${type}">${message}</span>`;
    } else {
      statusDiv.innerHTML = "";
    }
  }

  getFile() {
    return this.currentFile;
  }

  setEnabled(enabled) {
    if (enabled) {
      this.element.classList.remove("disabled");
    } else {
      this.element.classList.add("disabled");
    }
  }
}
