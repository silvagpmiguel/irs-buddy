import { loadTemplate, loadStyles } from "../../js/template-loader.js";

export class Modal {
  constructor(options = {}) {
    this.title = options.title || "Aviso";
    this.message = options.message || "";
    this.type = options.type || "info";
    this.buttons = options.buttons || [
      { text: "OK", type: "primary", actionId: "close" },
    ];
    this.onClose = options.onClose || null;
    this.element = null;
  }

  getIcon() {
    const icons = {
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
      success: "✅",
    };
    return icons[this.type] || icons.info;
  }

  async render() {
    loadStyles("components/modal/modal");
    let template = await loadTemplate("components/modal/modal");

    // Criar elementos do DOM manualmente
    const container = document.createElement("div");
    container.className = `modal-overlay modal-${this.type}`;

    // Se a mensagem contém HTML, usar innerHTML
    const messageContainer = document.createElement("div");
    messageContainer.className = "modal-body";
    if (typeof this.message === "string" && this.message.includes("<")) {
      messageContainer.innerHTML = this.message;
    } else {
      messageContainer.innerHTML = `<p>${this.message}</p>`;
    }

    container.innerHTML = `
    <div class="modal-content">
      <div class="modal-header modal-header-${this.type}">
        <span class="modal-icon">${this.getIcon()}</span>
        <h3 class="modal-title">${this.escapeHtml(this.title)}</h3>
        <button class="modal-close-btn" aria-label="Fechar">✕</button>
      </div>
      <div class="modal-footer">
        ${this.buttons
          .map(
            (btn) => `
          <button class="btn btn-${btn.type} modal-btn" data-action="${btn.actionId || "close"}">
            ${btn.text}
          </button>
        `,
          )
          .join("")}
      </div>
    </div>
  `;

    // Inserir o body depois
    const modalContent = container.querySelector(".modal-content");
    const footer = container.querySelector(".modal-footer");
    modalContent.insertBefore(messageContainer, footer);

    this.element = container;
    this.attachEvents();
    return this.element;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  attachEvents() {
    const closeBtn = this.element.querySelector(".modal-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.close());
    }

    const buttons = this.element.querySelectorAll(".modal-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const action = btn.dataset.action;
        const buttonConfig = this.buttons.find((b) => b.actionId === action);
        if (buttonConfig && buttonConfig.action) {
          buttonConfig.action();
        }
        this.close();
      });
    });

    // Clicar fora do modal fecha
    this.element.addEventListener("click", (e) => {
      if (e.target === this.element) {
        this.close();
      }
    });
  }

  close() {
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
    if (this.onClose) {
      this.onClose();
    }
  }

  show() {
    document.body.appendChild(this.element);
  }

  // Métodos estáticos para facilitar o uso
  static async show(options) {
    const modal = new Modal(options);
    await modal.render();
    modal.show();
    return modal;
  }

  static async error(title, message, onClose = null) {
    return await Modal.show({ title, message, type: "error", onClose });
  }

  static async warning(title, message, onClose = null) {
    return await Modal.show({ title, message, type: "warning", onClose });
  }

  static async info(title, message, onClose = null) {
    return await Modal.show({ title, message, type: "info", onClose });
  }

  static async success(title, message, onClose = null) {
    return await Modal.show({ title, message, type: "success", onClose });
  }
}
