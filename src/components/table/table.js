import { loadTemplate, loadStyles } from "../../js/template-loader.js";

export class DynamicTable {
  constructor(containerId, options) {
    if (this.isRendering) return;
    this.isRendering = true;
    this.containerId = containerId;
    this.options = options;
    this.data = options.data || [];
    this.onChange = options.onChange || (() => {});
    this.headers = options.headers || [];
    this.catalogs = options.catalogs || {};
    this.summary = options.summary || null;
    this.footerGroups = options.footerGroups || null;
    this.paginated = options.paginated === true;
    this.pageSize = options.pageSize || 10;
    this.currentPage = 1;
    this.rowElements = new Map();
    this.footerValues = new Map();
    this.nextRowId = 0;
    this.maxDepth = 1;
    this.isRendering = false;
    this.currentIndex = 0;
    this.pageData = null;
    this.startIdx = 0;
    this.render();
    this.isRendering = false;
  }

  async render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    loadStyles("components/table/table");
    let template = await loadTemplate("components/table/table");

    this.maxDepth = this.calculateMaxDepth(this.headers);
    const totalCols = this.getTotalCols();

    // Construir o HTML da tabela
    let footerHtml = "";
    footerHtml += this.renderAddRowFooter();
    if (this.paginated) {
      footerHtml += this.renderPaginationRow();
    }
    footerHtml += this.renderFooter();

    container.innerHTML = `
      <div class="at-table-container">
        <table class="at-table">
          <thead>${this.renderHeaders()}</thead>
          <tbody id="${this.containerId}-tbody">${this.isLoading ? this.renderSkeletonRows(3) : ""}</tbody>
          <tfoot>
            ${footerHtml}
          </tfoot>
        </table>
      </div>
    `;

    this.attachGlobalEvents();

    if (this.paginated) {
      this.showSkeletonAndLoadPage();
    } else {
      this.renderAllRows();
    }
  }

  // ========== MÉTODOS DE RENDERIZAÇÃO ==========
  renderSkeletonRows(count) {
    let html = "";
    for (let i = 0; i < count; i++) {
      html += `<tr class="skeleton-row">`;
      html += this.renderSkeletonCells(this.headers);
      html += `<td class="action-col"><div class="skeleton-cell skeleton-icon"></div></td>`;
      html += `</tr>`;
    }
    return html;
  }

  renderSkeletonCells(headers) {
    let html = "";
    for (const h of headers) {
      if (h.subHeaders) {
        html += this.renderSkeletonCells(h.subHeaders);
      } else {
        html += `<td class="${h.class || ""}"><div class="skeleton-cell"></div></td>`;
      }
    }
    return html;
  }

  renderAddRowFooter() {
    const totalCols = this.getTotalCols();
    return `<tr class="table-add-row-footer">
              <td colspan="${totalCols}">
                <button type="button" class="btn-add-row" id="${this.containerId}-add-btn">+ Adicionar Linha</button>
              </td>
            </tr>`;
  }

  renderPaginationRow() {
    const totalCols = this.getTotalCols();
    return `<tr class="pagination-row"><td colspan="${totalCols}"><div id="${this.containerId}-pagination-inline"></div></td></tr>`;
  }

  // ========== LÓGICA DE PAGINAÇÃO ==========
  getCurrentPageData() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.data.slice(start, end);
  }

  getTotalPages() {
    return Math.max(1, Math.ceil(this.data.length / this.pageSize));
  }

  showSkeletonAndLoadPage() {
    const tbody = document.getElementById(`${this.containerId}-tbody`);
    if (!tbody) return;
    tbody.innerHTML = this.renderSkeletonRows(this.pageSize);
    setTimeout(() => this.loadPageData(), 50);
  }

  loadPageData() {
    const tbody = document.getElementById(`${this.containerId}-tbody`);
    if (!tbody) return;

    const pageData = this.getCurrentPageData();
    const startIdx = (this.currentPage - 1) * this.pageSize;

    if (pageData.length === 0) {
      tbody.innerHTML = this.getEmptyRowHtml();
      this.updateFooter();
      this.renderPaginationControls();
      return;
    }

    tbody.innerHTML = "";
    this.currentIndex = 0;
    this.pageData = pageData;
    this.startIdx = startIdx;
    this.renderPageChunk();
  }

  renderPageChunk() {
    const tbody = document.getElementById(`${this.containerId}-tbody`);
    if (!tbody) return;

    const chunkSize = 15;
    const end = Math.min(this.currentIndex + chunkSize, this.pageData.length);
    const fragment = document.createDocumentFragment();

    for (let i = this.currentIndex; i < end; i++) {
      const row = this.pageData[i];
      const actualIdx = this.startIdx + i;
      const rowId = this.nextRowId++;
      const tr = this.createRowElement(row, actualIdx, rowId);
      fragment.appendChild(tr);
    }

    tbody.appendChild(fragment);
    this.currentIndex = end;

    if (this.currentIndex < this.pageData.length) {
      requestAnimationFrame(() => this.renderPageChunk());
    } else {
      this.cacheRowElements();
      this.attachRowEvents();
      this.updateFooter();
      this.renderPaginationControls();
      this.pageData = null;
    }
  }

  renderAllRows() {
    const tbody = document.getElementById(`${this.containerId}-tbody`);
    if (!tbody) return;

    if (this.data.length === 0) {
      tbody.innerHTML = this.getEmptyRowHtml();
      this.updateFooter();
      return;
    }

    tbody.innerHTML = "";
    this.currentIndex = 0;
    this.renderAllRowsChunk();
  }

  renderAllRowsChunk() {
    const tbody = document.getElementById(`${this.containerId}-tbody`);
    if (!tbody) return;

    const chunkSize = 15;
    const end = Math.min(this.currentIndex + chunkSize, this.data.length);
    const fragment = document.createDocumentFragment();

    for (let i = this.currentIndex; i < end; i++) {
      const row = this.data[i];
      const rowId = this.nextRowId++;
      const tr = this.createRowElement(row, i, rowId);
      fragment.appendChild(tr);
    }

    tbody.appendChild(fragment);
    this.currentIndex = end;

    if (this.currentIndex < this.data.length) {
      requestAnimationFrame(() => this.renderAllRowsChunk());
    } else {
      this.cacheRowElements();
      this.attachRowEvents();
      this.updateFooter();
    }
  }

  // ========== CRIAÇÃO DE ELEMENTOS DOM ==========
  createRowElement(row, idx, rowId) {
    const tr = document.createElement("tr");
    tr.className = "at-table-row";
    tr.setAttribute("data-row-idx", idx);
    tr.setAttribute("data-row-id", rowId);
    tr.appendChild(this.createCellsFragment(row, idx, rowId));
    tr.appendChild(this.createActionCell(idx, rowId));
    return tr;
  }

  createCellsFragment(row, idx, rowId) {
    const fragment = document.createDocumentFragment();
    for (const header of this.headers) {
      this.addCellsForHeader(header, row, idx, rowId, fragment);
    }
    return fragment;
  }

  addCellsForHeader(header, row, idx, rowId, parent) {
    if (header.subHeaders) {
      for (const sub of header.subHeaders) {
        this.addCellsForHeader(sub, row, idx, rowId, parent);
      }
    } else {
      const td = document.createElement("td");
      td.className = header.class || "";
      td.setAttribute("data-field", header.field);
      td.innerHTML = this.getCellHtml(
        header,
        row[header.field] ?? "",
        idx,
        rowId,
      );
      parent.appendChild(td);
    }
  }

  getCellHtml(header, value, idx, rowId) {
    const { field, type, options = {}, formatter, float } = header;
    const catalog = this.catalogs[field];

    if (formatter) {
      return `<span class="at-table-static">${formatter(value, idx, this.data[idx])}</span>`;
    }
    if (type === "auto-number") {
      const start = options.start || 1;
      return `<span class="at-table-static">${start + idx}</span>`;
    }
    if (type === "static-text") {
      return `<span class="at-table-static">${value}</span>`;
    }
    if (type === "select") {
      const selectOptions = options || [];
      let selectHtml = `<select class="at-table-select" data-field="${field}" data-row="${idx}" data-row-id="${rowId}">`;
      for (const opt of selectOptions) {
        const selected = opt.value === value ? "selected" : "";
        selectHtml += `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
      }
      selectHtml += `</select>`;
      return selectHtml;
    }
    if (type === "checkbox") {
      const checked = value === "S";
      return `<input type="checkbox" class="at-table-checkbox" data-field="${field}" data-row="${idx}" data-row-id="${rowId}" ${checked ? "checked" : ""}>`;
    }
    if (type === "number") {
      const step = float ? "any" : "1";
      const spinnerClass = float ? "no-spinner" : "";
      const min = options.min !== undefined ? `min="${options.min}"` : "";
      const max = options.max !== undefined ? `max="${options.max}"` : "";
      const displayValue =
        value !== undefined && value !== null && value !== "" ? value : 0;
      return `<input type="number" class="at-table-input ${spinnerClass}" value="${displayValue}" step="${step}" ${min} ${max} data-field="${field}" data-row="${idx}" data-row-id="${rowId}">`;
    }
    return `<input type="text" class="at-table-input" value="${value}" data-field="${field}" data-row="${idx}" data-row-id="${rowId}">`;
  }

  createActionCell(idx, rowId) {
    const td = document.createElement("td");
    td.className = "action-col";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-remove-row";
    btn.setAttribute("data-row-idx", idx);
    btn.setAttribute("data-row-id", rowId);
    btn.textContent = "🗑️";
    btn.title = "Remover linha";
    td.appendChild(btn);
    return td;
  }

  getEmptyRowHtml() {
    const colCount = this.getTotalCols();
    return `<tr class="empty-row"><td colspan="${colCount}" class="text-center">Nenhum registo encontrado</tr>`;
  }

  // ========== CABEÇALHOS ==========
  calculateMaxDepth(headers, depth = 1) {
    let max = depth;
    for (const h of headers) {
      if (h.subHeaders) {
        max = Math.max(max, this.calculateMaxDepth(h.subHeaders, depth + 1));
      }
    }
    return max;
  }

  renderHeaders() {
    let html = "";
    for (let level = 0; level < this.maxDepth; level++) {
      html += `<tr class="header-row-${level + 1}">`;
      html += this.renderHeaderLevel(this.headers, level, 0);
      if (level === 0) {
        html += `<th rowspan="${this.maxDepth}" class="action-col-header">
                    <div class="action-header-content">
                      <span>Ações</span>
                      <button type="button" class="btn-remove-all-rows" id="${this.containerId}-remove-all-btn" title="Remover todas as linhas">🗑️</button>
                    </div>
                  </th>`;
      }
      html += `</tr>`;
    }
    return html;
  }

  renderHeaderLevel(headers, targetLevel, currentLevel) {
    let html = "";
    for (const h of headers) {
      if (currentLevel === targetLevel) {
        if (h.subHeaders) {
          html += `<th colspan="${this.countLeafColumns(h.subHeaders)}" class="${h.class || ""}">${h.label}</th>`;
        } else {
          const rowspan = this.maxDepth - targetLevel;
          html += `<th rowspan="${rowspan}" class="${h.class || ""}">${h.label}</th>`;
        }
      } else if (h.subHeaders && currentLevel < targetLevel) {
        html += this.renderHeaderLevel(
          h.subHeaders,
          targetLevel,
          currentLevel + 1,
        );
      }
    }
    return html;
  }

  countLeafColumns(headers) {
    let count = 0;
    for (const h of headers) {
      count += h.subHeaders ? this.countLeafColumns(h.subHeaders) : 1;
    }
    return count;
  }

  getTotalCols() {
    return this.countLeafColumns(this.headers) + 1;
  }

  // ========== FOOTER ==========
  renderFooter() {
    if (!this.footerGroups) return "";
    const totalCols = this.getTotalCols();
    const groups = this.footerGroups.map((g) => ({
      ...g,
      value: typeof g.value === "function" ? g.value(this.data) : g.value || 0,
    }));

    let html = '<tr class="footer-row">';
    const groupWidth = Math.floor(totalCols / groups.length);
    groups.forEach((g, i) => {
      const colspan =
        i === groups.length - 1 ? totalCols - i * groupWidth : groupWidth;
      const display = g.formatter
        ? g.formatter(g.value, this.data)
        : g.value.toFixed(2) + " €";
      html += `<td colspan="${colspan}" class="footer-group-cell" data-footer-field="${g.field}">
                 <div class="footer-group">
                   <span class="footer-label">${g.label}</span>
                   <span class="footer-value">${display}</span>
                 </div>
                </td>`;
      this.footerValues.set(g.field, g.value);
    });
    html += `</tr>`;
    return html;
  }

  updateFooter() {
    if (!this.footerGroups) return;
    this.updateFooterValues();
    this.updateFooterDisplay();
  }

  updateFooterValues() {
    for (const g of this.footerGroups) {
      const value =
        typeof g.value === "function" ? g.value(this.data) : g.value || 0;
      this.footerValues.set(g.field, value);
    }
  }

  updateFooterDisplay() {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    const footerCells = container.querySelectorAll(".footer-group-cell");
    footerCells.forEach((cell) => {
      const field = cell.getAttribute("data-footer-field");
      if (field && this.footerValues.has(field)) {
        const value = this.footerValues.get(field);
        const group = this.footerGroups?.find((g) => g.field === field);
        const display = group?.formatter
          ? group.formatter(value, this.data)
          : value.toFixed(2) + " €";
        const valueSpan = cell.querySelector(".footer-value");
        if (valueSpan) valueSpan.textContent = display;
      }
    });
  }

  // ========== PAGINAÇÃO CONTROLS ==========
  renderPaginationControls() {
    const paginationDiv = document.getElementById(
      `${this.containerId}-pagination-inline`,
    );
    if (!paginationDiv) return;

    const totalPages = this.getTotalPages();
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.data.length);

    paginationDiv.innerHTML = `
      <div class="pagination-controls">
        <button class="btn-page" id="${this.containerId}-page-first" ${this.currentPage === 1 ? "disabled" : ""}>⏮️ Primeira</button>
        <button class="btn-page" id="${this.containerId}-page-prev" ${this.currentPage === 1 ? "disabled" : ""}>◀ Anterior</button>
        <span class="page-info">Página ${this.currentPage} de ${totalPages} (${this.data.length} registos, mostrando ${start}-${end})</span>
        <button class="btn-page" id="${this.containerId}-page-next" ${this.currentPage === totalPages ? "disabled" : ""}>Próxima ▶</button>
        <button class="btn-page" id="${this.containerId}-page-last" ${this.currentPage === totalPages ? "disabled" : ""}>Última ⏭️</button>
        <select id="${this.containerId}-page-size" class="page-size-select">
          <option value="10" ${this.pageSize === 10 ? "selected" : ""}>10 por página</option>
          <option value="25" ${this.pageSize === 25 ? "selected" : ""}>25 por página</option>
          <option value="50" ${this.pageSize === 50 ? "selected" : ""}>50 por página</option>
          <option value="75" ${this.pageSize === 75 ? "selected" : ""}>75 por página</option>
          <option value="100" ${this.pageSize === 100 ? "selected" : ""}>100 por página</option>
          <option value="150" ${this.pageSize === 150 ? "selected" : ""}>150 por página</option>
          <option value="200" ${this.pageSize === 200 ? "selected" : ""}>200 por página</option>
        </select>
      </div>
    `;

    document
      .getElementById(`${this.containerId}-page-first`)
      ?.addEventListener("click", () => this.goToPage(1));
    document
      .getElementById(`${this.containerId}-page-prev`)
      ?.addEventListener("click", () => this.goToPage(this.currentPage - 1));
    document
      .getElementById(`${this.containerId}-page-next`)
      ?.addEventListener("click", () => this.goToPage(this.currentPage + 1));
    document
      .getElementById(`${this.containerId}-page-last`)
      ?.addEventListener("click", () => this.goToPage(totalPages));
    document
      .getElementById(`${this.containerId}-page-size`)
      ?.addEventListener("change", (e) =>
        this.setPageSize(parseInt(e.target.value)),
      );
  }

  goToPage(page) {
    const totalPages = this.getTotalPages();
    if (page < 1 || page > totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.showSkeletonAndLoadPage();
  }

  setPageSize(newSize) {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.showSkeletonAndLoadPage();
  }

  // ========== EVENTOS ==========
  attachGlobalEvents() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const addBtn = document.getElementById(`${this.containerId}-add-btn`);
    if (addBtn) {
      addBtn.replaceWith(addBtn.cloneNode(true));
      const newBtn = document.getElementById(`${this.containerId}-add-btn`);
      newBtn?.addEventListener("click", () => this.addRow());
    }

    const removeAllBtn = document.getElementById(
      `${this.containerId}-remove-all-btn`,
    );
    if (removeAllBtn) {
      removeAllBtn.replaceWith(removeAllBtn.cloneNode(true));
      const newRemoveAll = document.getElementById(
        `${this.containerId}-remove-all-btn`,
      );
      newRemoveAll?.addEventListener("click", () => this.removeAllRows());
    }
  }

  attachRowEvents() {
    const tbody = document.getElementById(`${this.containerId}-tbody`);
    if (!tbody) return;

    tbody.removeEventListener("change", this._changeHandler);
    tbody.removeEventListener("click", this._clickHandler);

    this._changeHandler = (e) => {
      const target = e.target;
      if (
        target.classList.contains("at-table-input") ||
        target.classList.contains("at-table-select")
      ) {
        const field = target.dataset.field;
        const rowIdx = parseInt(target.dataset.row);
        let value = target.value;
        if (target.type === "number") {
          value = parseFloat(value) || 0;
        }
        if (!isNaN(rowIdx) && this.data[rowIdx]) {
          this.data[rowIdx][field] = value;
          this.updateFooter();
          this.onChange(this.data);
        }
      } else if (target.classList.contains("at-table-checkbox")) {
        const field = target.dataset.field;
        const rowIdx = parseInt(target.dataset.row);
        const value = target.checked ? "S" : "N";
        if (!isNaN(rowIdx) && this.data[rowIdx]) {
          this.data[rowIdx][field] = value;
          this.updateFooter();
          this.onChange(this.data);
        }
      }
    };

    this._clickHandler = (e) => {
      const btn = e.target.closest(".btn-remove-row");
      if (btn) {
        const rowIdx = parseInt(btn.dataset.rowIdx);
        if (!isNaN(rowIdx)) this.removeRow(rowIdx);
      }
    };

    tbody.addEventListener("change", this._changeHandler);
    tbody.addEventListener("click", this._clickHandler);
  }

  // ========== MANIPULAÇÃO DE LINHAS ==========
  addRow() {
    const newRow = {};
    const addFields = (headers) => {
      for (const h of headers) {
        if (h.subHeaders) addFields(h.subHeaders);
        else if (h.field) {
          let defaultValue = "";
          if (h.defaultValue !== undefined) {
            defaultValue =
              typeof h.defaultValue === "function"
                ? h.defaultValue()
                : h.defaultValue;
          } else if (h.type === "number") {
            defaultValue = 0;
          } else if (h.type === "checkbox") {
            defaultValue = "N";
          }
          newRow[h.field] = defaultValue;
        }
      }
    };
    addFields(this.headers);

    this.data.push(newRow);
    this.refreshData();
  }

  removeRow(rowIdx) {
    if (rowIdx < 0 || rowIdx >= this.data.length) return;
    this.data.splice(rowIdx, 1);
    this.refreshData();
  }

  removeAllRows() {
    if (this.data.length === 0) return;
    if (!confirm(`Remover todas as ${this.data.length} linhas?`)) return;

    console.log("removeAllRows - before:", this.data.length);
    this.data = [];
    console.log("removeAllRows - after:", this.data.length);

    this.refreshData();
  }

  refreshData() {
    if (this.paginated) {
      const totalPages = this.getTotalPages();
      if (this.currentPage > totalPages) this.currentPage = totalPages;
      this.showSkeletonAndLoadPage();
    } else {
      this.renderAllRows();
    }
    this.updateFooter();
    this.onChange(this.data);
  }

  cacheRowElements() {
    const tbody = document.getElementById(`${this.containerId}-tbody`);
    if (!tbody) return;
    const rows = tbody.querySelectorAll(".at-table-row");
    rows.forEach((row) => {
      const rowId = row.getAttribute("data-row-id");
      if (rowId) this.rowElements.set(rowId, row);
    });
  }

  setEnabled(enabled) {
    const addBtn = document.getElementById(`${this.containerId}-add-btn`);
    const removeAllBtn = document.getElementById(
      `${this.containerId}-remove-all-btn`,
    );
    const tbody = document.getElementById(`${this.containerId}-tbody`);
    if (addBtn) {
      addBtn.disabled = !enabled;
      addBtn.style.opacity = enabled ? "1" : "0.5";
    }
    if (removeAllBtn) {
      removeAllBtn.disabled = !enabled;
      removeAllBtn.style.opacity = enabled ? "1" : "0.5";
    }
    if (tbody) {
      const btns = tbody.querySelectorAll(".btn-remove-row");
      btns.forEach((btn) => (btn.disabled = !enabled));
      const inputs = tbody.querySelectorAll(
        ".at-table-input, .at-table-select, .at-table-checkbox",
      );
      inputs.forEach((inp) => (inp.disabled = !enabled));
    }
  }

  getFooterValue(fieldName) {
    return this.footerValues.get(fieldName) || 0;
  }

  setData(newData) {
    this.data = newData;
    this.refreshData();
  }
}
