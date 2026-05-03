import { loadTemplate, loadStyles } from "../../js/template-loader.js";

export class ErrorsList {
  constructor(errors = [], onFocusError = null) {
    this.errors = errors;
    this.onFocusError = onFocusError;
    this.element = null;
  }

  async render() {
    loadStyles("components/errors-list/errors-list");

    const container = document.createElement("div");
    container.className = "errors-list";

    container.innerHTML = `
    <div class="errors-list-container">
      <div class="errors-list-header">
        <span class="errors-list-icon">⚠️</span>
        <h4 class="errors-list-title">Erros encontrados</h4>
        <span class="errors-list-count">${this.errors.length}</span>
      </div>
      <ul class="errors-list">
        ${this.errors
          .map(
            (error, index) => `
          <li class="error-item" data-error-index="${index}" data-row="${error.row}" data-field="${error.field}">
            <div class="error-item-content">
              <span class="error-item-row">Linha ${error.row}</span>
              <span class="error-item-field">${this.escapeHtml(error.field)}</span>
              <span class="error-item-message">${this.escapeHtml(error.message)}</span>
            </div>
            <button class="error-item-focus-btn" title="Ir para este erro">🔍</button>
          </li>
        `,
          )
          .join("")}
      </ul>
    </div>
  `;

    this.element = container;
    return this.element;
  }

  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  updateErrors(errors) {
    this.errors = errors;
    this.render();
  }

  setOnFocusError(callback) {
    this.onFocusError = callback;
  }
}
