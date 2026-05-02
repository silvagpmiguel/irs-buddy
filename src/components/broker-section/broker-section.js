import { loadTemplate, loadStyles } from "../../js/template-loader.js";
import { FileInputArea } from "../file-input-area/file-input-area.js";

export class BrokerSection {
  constructor() {
    this.element = null;
    this.selectedBrokers = new Set();
    this.uploadedFiles = {};
    this.fileInputAreas = {};
    this.onCompleteCallback = null;
    this.onProcessCallback = null;
    this.onBackCallback = null;
    this.brokersConfig = [
      {
        id: "xtb",
        name: "XTB",
        icon: "",
        description: "Plataforma de investimento internacional",
        instructions: this.getXTBInstructions(),
        requiredFiles: [
          {
            type: "capitalGains",
            label: "Capital Gains",
            icon: "📊",
            description: "Mais-valias de ações, ETFs e CFDs",
          },
          {
            type: "investmentIncome",
            label: "Investment Income",
            icon: "💰",
            description: "Dividendos e juros",
          },
        ],
      },
      {
        id: "trading212",
        name: "Trading 212",
        icon: "",
        description: "Plataforma de investimento mobile",
        instructions: this.getTrading212Instructions(),
        requiredFiles: [
          {
            type: "annualStatement",
            label: "Annual Statement",
            icon: "📅",
            description: "Extrato anual da Trading212 (PDF)",
          },
        ],
      },
    ];
  }

  getXTBInstructions() {
    return `
      <div class="broker-instructions">
        <div class="instructions-steps">
          <div class="step-item">
            <div class="step-number">1</div>
            <div class="step-content">
              <a href="https://xstation5.xtb.com/" target="_blank" rel="noopener noreferrer" class="step-link">
                <strong>Aceda à XTB</strong>
              </a>
              <span class="step-detail">Faça login na plataforma X Station 5</span>
            </div>
          </div>
          <div class="step-arrow">→</div>
          <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-content">
              <strong>Dirija-se à secção "A minha conta"</strong>
              <span class="step-detail">No menu principal da plataforma</span>
            </div>
          </div>
          <div class="step-arrow">→</div>
          <div class="step-item">
            <div class="step-number">3</div>
            <div class="step-content">
              <strong>Selecione a opção "Documentos"</strong>
              <span class="step-detail">Aceda à área de relatórios e documentos</span>
            </div>
          </div>
          <div class="step-arrow">→</div>
          <div class="step-item">
            <div class="step-number">4</div>
            <div class="step-content">
              <strong>Descarregue os documentos fiscais</strong>
              <span class="step-detail">Capital Gains e Dividends & Interests para o ano em questão</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getTrading212Instructions() {
    return `
      <div class="broker-instructions">
        <div class="instructions-steps">
          <div class="step-item">
            <div class="step-number">1</div>
            <div class="step-content">
              <a href="https://www.trading212.com/" target="_blank" rel="noopener noreferrer" class="step-link">
                <strong>Aceda à Trading212</strong>
              </a>
              <span class="step-detail">Faça login na sua conta</span>
            </div>
          </div>
          <div class="step-arrow">→</div>
          <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-content">
              <strong>Dirija-se a "Documentos"</strong>
              <span class="step-detail">No menu principal da plataforma</span>
            </div>
          </div>
          <div class="step-arrow">→</div>
          <div class="step-item">
            <div class="step-number">3</div>
            <div class="step-content">
              <strong>Selecione "Extratos"</strong>
              <span class="step-detail">Escolha o ano pretendido</span>
            </div>
          </div>
          <div class="step-arrow">→</div>
          <div class="step-item">
            <div class="step-number">4</div>
            <div class="step-content">
              <strong>Descarregue o "Annual Statement"</strong>
              <span class="step-detail">Faça o download do PDF</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async render() {
    loadStyles("components/broker-section/broker-section");
    const template = await loadTemplate(
      "components/broker-section/broker-section",
    );

    const container = document.createElement("div");
    container.className = "broker-section";
    container.innerHTML = template;
    this.element = container;

    this.renderBrokersGrid();
    this.attachEvents();
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
          <div class="broker-icon">${broker.icon}</div>
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
          this.updateStatusBadge(card, "Selecionado", "selected");
          this.showBrokerUploadSection(brokerId);
        } else {
          this.selectedBrokers.delete(brokerId);
          card.classList.remove("selected");
          this.updateStatusBadge(card, "Por selecionar", "pending");
          this.hideBrokerUploadSection(brokerId);
        }
        this.updateProcessButton();
      });
    });
  }

  updateStatusBadge(card, text, className) {
    const statusBadge = card.querySelector(".status-badge");
    if (statusBadge) {
      statusBadge.textContent = text;
      statusBadge.classList.remove("pending", "selected");
      statusBadge.classList.add(className);
    }
  }

  showBrokerUploadSection(brokerId) {
    const broker = this.brokersConfig.find((b) => b.id === brokerId);
    if (!broker) return;

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
    section.innerHTML = `
      <h3>${broker.name} - Faça upload dos PDFs</h3>
      ${broker.instructions}
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

    if (!this.fileInputAreas[brokerId]) this.fileInputAreas[brokerId] = {};

    for (const fileConfig of broker.requiredFiles) {
      const fileInputArea = new FileInputArea({
        type: fileConfig.type,
        accept: ".pdf",
        title: fileConfig.label,
        description: fileConfig.description,
        icon: fileConfig.icon,
        onFileChange: (file, error) => {
          if (!this.uploadedFiles[brokerId]) this.uploadedFiles[brokerId] = {};

          if (error) {
            delete this.uploadedFiles[brokerId][fileConfig.type];
          } else if (file) {
            this.uploadedFiles[brokerId][fileConfig.type] = file;
          } else {
            delete this.uploadedFiles[brokerId][fileConfig.type];
          }
          this.updateProcessButton();
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
      if (this.fileInputAreas[brokerId]) delete this.fileInputAreas[brokerId];
    }
    this.updateProcessButton();
  }

  updateProcessButton() {
    const processBtn = this.element.querySelector("#processBrokersBtn");
    if (!processBtn) return;

    if (this.selectedBrokers.size === 0) {
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
        if (!hasAtLeastOneFile) {
          allBrokersHaveAtLeastOneFile = false;
          break;
        }
      }
    }
    processBtn.disabled = !allBrokersHaveAtLeastOneFile;
  }

  attachEvents() {
    const processBtn = this.element.querySelector("#processBrokersBtn");
    if (processBtn) {
      processBtn.addEventListener("click", async () => {
        if (this.onProcessCallback) {
          await this.onProcessCallback(this.uploadedFiles);
          if (this.onCompleteCallback) this.onCompleteCallback();
        }
      });
    }
    // Botão Voltar ao passo 1
    const backBtn = this.element.querySelector("#backToStep1Btn");
    if (backBtn && this.onBackCallback) {
      backBtn.addEventListener("click", () => this.onBackCallback());
    }
  }

  getUploadedFiles() {
    return this.uploadedFiles;
  }

  setOnProcess(callback) {
    this.onProcessCallback = callback;
  }

  setOnComplete(callback) {
    this.onCompleteCallback = callback;
  }

  setOnBack(callback) {
    this.onBackCallback = callback;
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
      this.updateStatusBadge(card, "Por selecionar", "pending");
    });

    const sections = this.element.querySelectorAll(".broker-upload-section");
    sections.forEach((section) => (section.style.display = "none"));

    this.updateProcessButton();
  }
}
