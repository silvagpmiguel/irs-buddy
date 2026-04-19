export class UIController {
  constructor() {
    this.currentView = "home";
    this.currentTab = "anexoG";
    this.tabs = {};
    this.homeView = null;
    this.declaracaoView = null;
    this.tabsContainer = null;
    this.tabContent = null;
    this.formRenderer = null;
  }

  setFormRenderer(renderer) {
    this.formRenderer = renderer;
  }

  init() {
    this.initializeViews();
    this.setupNavigation();
  }

  initializeViews() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
      <div id="homeView" class="view active">
        <div class="app-container">
          <header class="main-header">
            <div class="logo-container">
              <div class="logo-icon">🧾</div>
              <div class="logo-text">
                <span class="logo-name">IRS Buddy</span>
                <span class="logo-badge">Beta</span>
              </div>
            </div>
            <nav class="main-nav">
              <a href="#" class="nav-link active" data-view="home">Início</a>
              <a href="#" class="nav-link" data-view="ajuda">Ajuda</a>
            </nav>
          </header>

          <section class="hero">
            <h1 class="hero-title">Simplifique os seus <span class="highlight">Anexos IRS</span></h1>
            <p class="hero-subtitle">Carregue o ficheiro XML da AT e edite os anexos G, H e J com facilidade</p>
          </section>

          <div class="content-grid">
            <div class="card upload-card">
              <div class="card-header">
                <div class="card-icon">📁</div>
                <h2 class="card-title">Upload do Ficheiro XML</h2>
                <p class="card-description">XML gerado pela aplicação da Autoridade Tributária</p>
              </div>
              
              <div class="upload-zone" id="uploadZone">
                <input type="file" id="fileInput" accept=".xml" class="file-input-hidden" />
                <div class="upload-content">
                  <div class="upload-icon">📄</div>
                  <h3 class="upload-title">Arraste ou clique para selecionar</h3>
                  <p class="upload-info">Suporte apenas para ficheiros XML (.xml)</p>
                  <button class="btn btn-primary" id="uploadButton">Selecionar Ficheiro</button>
                </div>
                <div class="file-preview" id="filePreview" style="display: none;">
                  <div class="file-info">
                    <span class="file-name" id="fileName"></span>
                    <span class="file-size" id="fileSize"></span>
                  </div>
                  <button class="btn-icon" id="clearFileBtn">✕</button>
                </div>
              </div>

              <div class="info-box">
                <div class="info-icon">ℹ️</div>
                <div class="info-text">
                  <strong>Anexos suportados:</strong><br>
                  📈 Anexo G - Mais-Valias e Rendimentos de Capitais<br>
                  🏥 Anexo H - Deduções à Coleta<br>
                  🌍 Anexo J - Rendimentos Estrangeiros
                </div>
              </div>
            </div>

            <div class="card instructions-card">
              <div class="card-header">
                <div class="card-icon">🚀</div>
                <h2 class="card-title">Como funciona</h2>
              </div>
              
              <div class="steps-container">
                <div class="step-item">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <h3>Preencha na AT</h3>
                    <p>Preencha sua declaração no Portal das Finanças</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <h3>Grave como XML</h3>
                    <p>Exporte a declaração em formato XML</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <h3>Edite os Anexos</h3>
                    <p>Modifique os anexos G, H e J</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">4</div>
                  <div class="step-content">
                    <h3>Exporte e Submeta</h3>
                    <p>Exporte o XML atualizado para a AT</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="declaracaoView" class="view" style="display: none;">
        <div class="app-container">
          <header class="main-header">
            <div class="logo-container">
              <div class="logo-icon">🧾</div>
              <div class="logo-text">
                <span class="logo-name">IRS Buddy</span>
                <span class="logo-badge">Edição</span>
              </div>
            </div>
            <nav class="main-nav">
              <a href="#" class="nav-link active" data-view="home">Início</a>
              <a href="#" class="nav-link" data-view="declaracao">Anexos</a>
            </nav>
          </header>

          <div class="declaracao-container">
            <div class="tabs-container" id="tabsContainer"></div>
            <div id="tabContent"></div>
            
            <div class="action-buttons">
              <button class="btn btn-secondary" id="backToHomeBtn">← Voltar ao Início</button>
              <button class="btn btn-primary" id="exportXMLBtn">💾 Exportar XML</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.homeView = document.getElementById("homeView");
    this.declaracaoView = document.getElementById("declaracaoView");
    this.tabsContainer = document.getElementById("tabsContainer");
    this.tabContent = document.getElementById("tabContent");
  }

  setupNavigation() {
    document.querySelectorAll("[data-view]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const view = link.getAttribute("data-view");
        if (view === "home") {
          this.switchView("home");
        } else if (view === "declaracao") {
          this.switchView("declaracao");
        }
      });
    });
  }

  switchView(viewName) {
    if (viewName === "home") {
      if (this.homeView) this.homeView.style.display = "block";
      if (this.declaracaoView) this.declaracaoView.style.display = "none";
      this.currentView = "home";
    } else if (viewName === "declaracao") {
      if (this.homeView) this.homeView.style.display = "none";
      if (this.declaracaoView) this.declaracaoView.style.display = "block";
      this.currentView = "declaracao";
    }
    document.querySelectorAll("[data-view]").forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("data-view") === viewName) {
        link.classList.add("active");
      }
    });
  }

  renderTabs() {
    if (!this.tabsContainer) return;
    this.tabsContainer.innerHTML = `
      <button class="tab-btn active" data-tab="anexoG">📈 Anexo G</button>
      <button class="tab-btn" data-tab="anexoJ">🌍 Anexo J</button>
      <button class="tab-btn" data-tab="anexoH">🏥 Anexo H</button>
      `;
    this.setupTabListeners();
  }

  setupTabListeners() {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tabId = btn.getAttribute("data-tab");
        this.switchTab(tabId);
      });
    });
  }

  switchTab(tabId) {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.remove("active");
      if (btn.getAttribute("data-tab") === tabId) btn.classList.add("active");
    });
    Object.keys(this.tabs).forEach((tab) => {
      if (this.tabs[tab]) this.tabs[tab].style.display = "none";
    });
    if (this.tabs[tabId]) this.tabs[tabId].style.display = "block";
    this.currentTab = tabId;

    if (
      this.formRenderer &&
      typeof this.formRenderer.activateTab === "function"
    ) {
      this.formRenderer.activateTab(tabId);
    }
  }

  showModal(modalId, content) {
    let modal = document.getElementById(modalId);

    if (!modal) {
      modal = document.createElement("div");
      modal.id = modalId;
      modal.className = "modal";
      modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2></h2>
                        <span class="modal-close">&times;</span>
                    </div>
                    <div class="modal-body"></div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary modal-close-btn">Fechar</button>
                    </div>
                </div>
            `;
      document.body.appendChild(modal);

      modal.querySelectorAll(".modal-close, .modal-close-btn").forEach((el) => {
        el.addEventListener("click", () => {
          modal.style.display = "none";
        });
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.style.display = "none";
        }
      });
    }

    modal.querySelector(".modal-header h2").textContent =
      content.title || "Informação";
    modal.querySelector(".modal-body").innerHTML = content.body || "";
    modal.style.display = "flex";
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = "none";
    }
  }

  showSuccess(message) {
    this.showToast(message, "success");
  }

  showError(message) {
    this.showToast(message, "error");
  }

  showToast(message, type) {
    const existingToast = document.querySelector(".toast");
    if (existingToast) existingToast.remove();

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    // Remove estilos inline – agora usa apenas CSS
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}
