import { loadTemplate, loadStyles } from "../../js/template-loader.js";

export class BrokerImport {
  constructor(brokersConfig = []) {
    this.brokersConfig = brokersConfig;
    this.element = null;
    this.selectedBrokers = new Set();
    this.uploadedFiles = {};
    this.onChangeCallback = null;
    this.onProcessCallback = null;
  }

  async render() {
    loadStyles("components/broker-import/broker-import");
    const template = await loadTemplate(
      "components/broker-import/broker-import",
    );

    const container = document.createElement("div");
    container.className = "broker-import";
    container.innerHTML = template;

    this.element = container;
    this.renderBrokersGrid();
    this.attachGlobalEvents();
    return this.element;
  }

  renderBrokersGrid() {
    const grid = this.element.querySelector("#brokerGrid");
    if (!grid) return;

    grid.innerHTML = this.brokersConfig
      .map(
        (broker) => `
      <label class="broker-card" data-broker="${broker.id}">
        <input type="checkbox" value="${broker.id}" class="broker-checkbox" style="display: none;">
        <div class="broker-card-content">
          <div class="broker-icon">${broker.icon || "📈"}</div>
          <div class="broker-name">${broker.name}</div>
          <div class="broker-description">${broker.description}</div>
          <div class="broker-status">
            <span class="status-badge pending">Por selecionar</span>
          </div>
        </div>
      </label>
    `,
      )
      .join("");

    const cards = this.element.querySelectorAll(".broker-card");
    cards.forEach((card) => {
      card.addEventListener("click", (e) => {
        e.stopPropagation();
        const checkbox = card.querySelector(".broker-checkbox");
        const brokerId = checkbox.value;
        checkbox.checked = !checkbox.checked;

        if (checkbox.checked) {
          this.selectedBrokers.add(brokerId);
          card.classList.add("selected");
          const statusBadge = card.querySelector(".status-badge");
          if (statusBadge) {
            statusBadge.textContent = "Selecionado";
            statusBadge.classList.remove("pending");
            statusBadge.classList.add("selected");
          }
          this.showBrokerUploadSection(brokerId);
        } else {
          this.selectedBrokers.delete(brokerId);
          card.classList.remove("selected");
          const statusBadge = card.querySelector(".status-badge");
          if (statusBadge) {
            statusBadge.textContent = "Por selecionar";
            statusBadge.classList.remove("selected");
            statusBadge.classList.add("pending");
          }
          this.hideBrokerUploadSection(brokerId);
        }
        this.updateProcessButton();
        if (this.onChangeCallback) {
          this.onChangeCallback(this.selectedBrokers, this.uploadedFiles);
        }
      });
    });
  }

  showBrokerUploadSection(brokerId) {
    const broker = this.brokersConfig.find((b) => b.id === brokerId);
    if (!broker || !broker.requiredFiles) return;

    const sectionsContainer = this.element.querySelector(
      "#brokerUploadSections",
    );
    if (!sectionsContainer) return;

    let section = sectionsContainer.querySelector(
      `#${brokerId}-upload-section`,
    );
    if (section) {
      section.style.display = "block";
      return;
    }

    section = document.createElement("div");
    section.id = `${brokerId}-upload-section`;
    section.className = "broker-upload-section";
    section.style.display = "block";
    section.innerHTML = `
      <h3>${broker.name} - Faça upload dos PDFs</h3>
      <p class="info-text">${broker.instructions || ""}</p>
      <div class="upload-grid" id="${brokerId}-upload-grid">
        ${broker.requiredFiles
          .map(
            (file) => `
          <div class="upload-card-item" data-type="${file.type}">
            <div class="upload-card-icon">${file.icon || "📄"}</div>
            <div class="upload-card-title">${file.label}</div>
            <div class="upload-card-desc">${file.description || ""}</div>
            <input type="file" accept=".pdf" class="pdf-input" data-broker="${brokerId}" data-type="${file.type}" style="display: none;">
            <div class="upload-area">
              <span class="upload-placeholder">Arraste ou clique para carregar</span>
              <span class="upload-filename" style="display: none;"></span>
            </div>
            <div class="upload-status"></div>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
    sectionsContainer.appendChild(section);
    this.initUploadSection(brokerId);
  }

  initUploadSection(brokerId) {
    const section = this.element.querySelector(`#${brokerId}-upload-section`);
    if (!section) return;

    const uploadCards = section.querySelectorAll(".upload-card-item");
    uploadCards.forEach((card) => {
      const fileInput = card.querySelector(".pdf-input");
      const uploadArea = card.querySelector(".upload-area");
      const statusDiv = card.querySelector(".upload-status");

      uploadArea.addEventListener("click", () => fileInput.click());

      uploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadArea.classList.add("drag-over");
      });

      uploadArea.addEventListener("dragleave", () => {
        uploadArea.classList.remove("drag-over");
      });

      uploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadArea.classList.remove("drag-over");
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.handleFileUpload(brokerId, files[0], card, fileInput, statusDiv);
        }
      });

      fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
          this.handleFileUpload(
            brokerId,
            e.target.files[0],
            card,
            fileInput,
            statusDiv,
          );
        }
      });
    });
  }

  handleFileUpload(brokerId, file, card, fileInput, statusDiv) {
    const type = card.querySelector(".pdf-input").dataset.type;
    const filenameSpan = card.querySelector(".upload-filename");
    const placeholderSpan = card.querySelector(".upload-placeholder");

    if (!this.uploadedFiles[brokerId]) this.uploadedFiles[brokerId] = {};
    this.uploadedFiles[brokerId][type] = file;

    if (filenameSpan && placeholderSpan) {
      filenameSpan.textContent = file.name;
      filenameSpan.style.display = "block";
      placeholderSpan.style.display = "none";
    }

    if (statusDiv) {
      statusDiv.innerHTML =
        '<span class="status-success">✅ Ficheiro carregado</span>';
      setTimeout(() => {
        if (statusDiv) statusDiv.innerHTML = "";
      }, 3000);
    }
    this.updateProcessButton();
    if (this.onChangeCallback) {
      this.onChangeCallback(this.selectedBrokers, this.uploadedFiles);
    }
  }

  hideBrokerUploadSection(brokerId) {
    const section = this.element.querySelector(`#${brokerId}-upload-section`);
    if (section) {
      section.style.display = "none";
      delete this.uploadedFiles[brokerId];
      const uploadCards = section.querySelectorAll(".upload-card-item");
      uploadCards.forEach((card) => {
        const filenameSpan = card.querySelector(".upload-filename");
        const placeholderSpan = card.querySelector(".upload-placeholder");
        const statusDiv = card.querySelector(".upload-status");
        if (filenameSpan) filenameSpan.style.display = "none";
        if (placeholderSpan) placeholderSpan.style.display = "block";
        if (statusDiv) statusDiv.innerHTML = "";
      });
    }
    this.updateProcessButton();
    if (this.onChangeCallback) {
      this.onChangeCallback(this.selectedBrokers, this.uploadedFiles);
    }
  }

  updateProcessButton() {
    const processBtn = this.element.querySelector("#processBrokersBtn");
    if (!processBtn) return;

    let isValid = true;
    for (const brokerId of this.selectedBrokers) {
      const broker = this.brokersConfig.find((b) => b.id === brokerId);
      if (broker && broker.requiredFiles) {
        const uploaded = this.uploadedFiles[brokerId] || {};
        const allRequired = broker.requiredFiles.every(
          (file) => uploaded[file.type],
        );
        if (!allRequired) {
          isValid = false;
          break;
        }
      }
    }
    processBtn.disabled = !isValid;
  }

  attachGlobalEvents() {
    const processBtn = this.element.querySelector("#processBrokersBtn");
    if (processBtn) {
      processBtn.addEventListener("click", async () => {
        if (this.onProcessCallback) {
          const btn = processBtn;
          const btnText = btn.querySelector(".btn-text");
          const btnLoader = btn.querySelector(".btn-loader");

          btn.disabled = true;
          btnText.style.display = "none";
          btnLoader.style.display = "inline";
          btn.classList.add("processing");

          try {
            await this.onProcessCallback(this.uploadedFiles);

            // Notificar que o passo 3 foi concluído (será tratado pelo home-view)
            if (this.onStepCompleteCallback) {
              this.onStepCompleteCallback(3);
            }
          } catch (error) {
            console.error("Process error:", error);
            this.showProcessError();
          } finally {
            btn.disabled = false;
            btnText.style.display = "inline";
            btnLoader.style.display = "none";
            btn.classList.remove("processing");
          }
        }
      });
    }
  }

  getUploadedFiles() {
    return this.uploadedFiles;
  }

  getSelectedBrokers() {
    return this.selectedBrokers;
  }

  setOnChange(callback) {
    this.onChangeCallback = callback;
  }

  setOnProcess(callback) {
    this.onProcessCallback = callback;
  }

  setOnStepComplete(callback) {
    this.onStepCompleteCallback = callback;
  }

  showUploadSuccess(card) {
    // Adicionar classe de sucesso
    card.classList.add("upload-success-animation");

    // Criar checkmark temporário
    const originalContent = card.querySelector(".upload-card-icon").innerHTML;
    const iconElement = card.querySelector(".upload-card-icon");
    const originalIcon = iconElement.innerHTML;
    iconElement.innerHTML = "✅";
    iconElement.style.transition = "transform 0.3s ease";
    iconElement.style.transform = "scale(1.2)";

    setTimeout(() => {
      iconElement.style.transform = "scale(1)";
      setTimeout(() => {
        iconElement.innerHTML = originalIcon;
        card.classList.remove("upload-success-animation");
      }, 800);
    }, 300);
  }

  showProcessSuccess() {
    // Remover toast existente
    const existing = document.querySelector(".process-success");
    if (existing) existing.remove();

    const successMsg = document.createElement("div");
    successMsg.className = "process-success";
    successMsg.innerHTML = `
    <i>✅</i>
    <span>Dados importados com sucesso! A redirecionar para os anexos...</span>
  `;
    document.body.appendChild(successMsg);

    setTimeout(() => {
      successMsg.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => successMsg.remove(), 300);
    }, 2000);
  }

  showProcessError() {
    const errorMsg = document.createElement("div");
    errorMsg.className = "process-success";
    errorMsg.style.background = "linear-gradient(135deg, #dc3545, #b02a37)";
    errorMsg.innerHTML = `
    <i>❌</i>
    <span>Erro ao processar os PDFs. Verifique os ficheiros e tente novamente.</span>
  `;
    document.body.appendChild(errorMsg);

    setTimeout(() => {
      errorMsg.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => errorMsg.remove(), 300);
    }, 3000);
  }

  reset() {
    this.selectedBrokers.clear();
    this.uploadedFiles = {};
    const checkboxes = this.element.querySelectorAll(".broker-checkbox");
    checkboxes.forEach((cb) => (cb.checked = false));
    const cards = this.element.querySelectorAll(".broker-card");
    cards.forEach((card) => {
      card.classList.remove("selected");
      const statusBadge = card.querySelector(".status-badge");
      if (statusBadge) {
        statusBadge.textContent = "Por selecionar";
        statusBadge.classList.remove("selected");
        statusBadge.classList.add("pending");
      }
    });
    const sections = this.element.querySelectorAll(".broker-upload-section");
    sections.forEach((section) => (section.style.display = "none"));
    this.updateProcessButton();
  }
}
