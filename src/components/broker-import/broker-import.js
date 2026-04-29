import { loadTemplate, loadStyles } from "../../js/template-loader.js";
import { FileInputArea } from "../file-input-area/file-input-area.js";

export class BrokerImport {
  constructor(brokersConfig = []) {
    this.brokersConfig = brokersConfig;
    this.element = null;
    this.selectedBrokers = new Set();
    this.uploadedFiles = {};
    this.fileInputAreas = {}; // Inicializado corretamente
    this.onChangeCallback = null;
    this.onProcessCallback = null;
    this.onStepCompleteCallback = null;
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
    ${broker.instructions || ""}
    <div class="upload-grid" id="${brokerId}-upload-grid"></div>
  `;

    sectionsContainer.appendChild(section);
    this.initUploadSection(brokerId);
  }

  async initUploadSection(brokerId) {
    const grid = this.element.querySelector(`#${brokerId}-upload-grid`);
    if (!grid) return;

    const broker = this.brokersConfig.find((b) => b.id === brokerId);
    if (!broker) return;

    // Inicializar estrutura de armazenamento se necessário
    if (!this.fileInputAreas[brokerId]) {
      this.fileInputAreas[brokerId] = {};
    }

    for (const fileConfig of broker.requiredFiles) {
      const fileInputArea = new FileInputArea({
        type: fileConfig.type,
        accept: ".pdf",
        title: fileConfig.label,
        description: fileConfig.description || "",
        icon: fileConfig.icon || "📄",
        onFileChange: (file, error) => {
          if (!this.uploadedFiles[brokerId]) {
            this.uploadedFiles[brokerId] = {};
          }

          if (error) {
            console.error(`Erro no upload de ${fileConfig.label}:`, error);
            delete this.uploadedFiles[brokerId][fileConfig.type];
          } else if (file) {
            this.uploadedFiles[brokerId][fileConfig.type] = file;
          } else {
            // Ficheiro removido
            delete this.uploadedFiles[brokerId][fileConfig.type];
          }

          this.updateProcessButton();
          if (this.onChangeCallback) {
            this.onChangeCallback(this.selectedBrokers, this.uploadedFiles);
          }
        },
      });
      const element = await fileInputArea.render();
      element.setAttribute("data-type", fileConfig.type);
      grid.appendChild(element);
      this.fileInputAreas[brokerId][fileConfig.type] = fileInputArea;
    }
  }

  hideBrokerUploadSection(brokerId) {
    const section = this.element.querySelector(`#${brokerId}-upload-section`);
    if (section) {
      section.style.display = "none";
      delete this.uploadedFiles[brokerId];
      // Limpar também os componentes FileInputArea
      if (this.fileInputAreas[brokerId]) {
        delete this.fileInputAreas[brokerId];
      }
    }
    this.updateProcessButton();
    if (this.onChangeCallback) {
      this.onChangeCallback(this.selectedBrokers, this.uploadedFiles);
    }
  }

  updateProcessButton() {
    const processBtn = this.element.querySelector("#processBrokersBtn");
    if (!processBtn) return;

    console.log(
      "🔍 updateProcessButton - selectedBrokers:",
      Array.from(this.selectedBrokers),
    );
    console.log("🔍 updateProcessButton - uploadedFiles:", this.uploadedFiles);

    // Se não há brokers selecionados, desativar botão
    if (this.selectedBrokers.size === 0) {
      console.log("🔍 updateProcessButton - no brokers selected, disabling");
      processBtn.disabled = true;
      return;
    }

    let allBrokersHaveAtLeastOneFile = true;

    for (const brokerId of this.selectedBrokers) {
      const broker = this.brokersConfig.find((b) => b.id === brokerId);
      if (broker && broker.requiredFiles) {
        const uploaded = this.uploadedFiles[brokerId] || {};
        const hasAtLeastOneFile = broker.requiredFiles.some(
          (file) => !!uploaded[file.type],
        );

        console.log(
          `🔍 updateProcessButton - broker ${brokerId}, hasAtLeastOneFile:`,
          hasAtLeastOneFile,
        );

        if (!hasAtLeastOneFile) {
          allBrokersHaveAtLeastOneFile = false;
          break;
        }
      }
    }

    console.log(
      "🔍 updateProcessButton - allBrokersHaveAtLeastOneFile:",
      allBrokersHaveAtLeastOneFile,
    );
    processBtn.disabled = !allBrokersHaveAtLeastOneFile;
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
    this.fileInputAreas = {};

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
