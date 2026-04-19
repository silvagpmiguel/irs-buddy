// src/js/table.js - Versão final com checkbox de seleção em massa no header
export class DynamicTable {
  constructor(containerId, options) {
    this.containerId = containerId;
    this.options = options;
    this.allData = options.data || [];
    this.onChange = options.onChange || (() => {});
    this.headers = options.headers || [];
    this.footerGroups = options.footerGroups || null;
    this.paginated = options.paginated === true;
    this.pageSize = options.pageSize || 10;
    this.currentPage = 1;

    this.rowElements = new Map();
    this.footerValues = new Map();
    this.nextRowId = 0;
    this.maxDepth = 1;

    this.render();

    if (this.paginated) {
      this.showSkeletonAndLoadPage();
    } else {
      this.renderAllRows();
    }
  }

  // ========== MÉTODOS PÚBLICOS ==========
  setData(newData) {
    this.allData = newData;
    if (this.paginated) {
      this.currentPage = 1;
      this.showSkeletonAndLoadPage();
    } else {
      this.renderAllRows();
    }
    this.updateFooter();
    this.onChange(this.allData);
  }

  getData() {
    return this.allData;
  }

  getCurrentPageData() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.allData.slice(start, end);
  }

  getTotalPages() {
    return Math.max(1, Math.ceil(this.allData.length / this.pageSize));
  }

  // ========== RENDER PRINCIPAL ==========
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    this.maxDepth = this.calculateMaxDepth(this.headers);
    const totalCols = this.getTotalCols();

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
          <tbody id="${this.containerId}-tbody"></tbody>
          <tfoot>
            ${footerHtml}
          </tfoot>
        </table>
      </div>
    `;

    this.attachGlobalEvents();
  }

  renderAddRowFooter() {
    const totalCols = this.getTotalCols();
    return `<tr class="table-add-row-footer">
              <td colspan="${totalCols}">
                <button type="button" class="btn-add-row" id="${this.containerId}-add-btn" title="Adicionar nova linha">Adicionar Linha</button>
               </td>
            </tr>`;
  }

  renderPaginationRow() {
    const totalCols = this.getTotalCols();
    return `<tr class="pagination-row"><td colspan="${totalCols}"><div id="${this.containerId}-pagination-inline"></div></td></tr>`;
  }

  // ========== RENDERIZAÇÃO SEM PAGINAÇÃO ==========
  renderAllRows() {
    const tbody = document.getElementById(`${this.containerId}-tbody`);
    if (!tbody) return;

    if (this.allData.length === 0) {
      tbody.innerHTML = this.getEmptyRowHtml();
      this.updateFooter();
      return;
    }

    tbody.innerHTML = "";
    this.currentChunk = 0;
    this.renderAllRowsChunk();
  }

  renderAllRowsChunk() {
    const tbody = document.getElementById(`${this.containerId}-tbody`);
    if (!tbody) return;

    const chunkSize = 15;
    const end = Math.min(this.currentChunk + chunkSize, this.allData.length);
    const fragment = document.createDocumentFragment();

    for (let i = this.currentChunk; i < end; i++) {
      const row = this.allData[i];
      const rowId = this.nextRowId++;
      const tr = this.createRowElement(row, i, rowId);
      fragment.appendChild(tr);
    }

    tbody.appendChild(fragment);
    this.currentChunk = end;

    if (this.currentChunk < this.allData.length) {
      requestAnimationFrame(() => this.renderAllRowsChunk());
    } else {
      this.cacheRowElements();
      this.attachRowEvents();
      this.updateFooter();
    }
  }

  // ========== RENDERIZAÇÃO COM PAGINAÇÃO ==========
  showSkeletonAndLoadPage() {
    const tbody = document.getElementById(`${this.containerId}-tbody`);
    if (!tbody) return;
    tbody.innerHTML = this.renderSkeletonRows(this.pageSize);
    setTimeout(() => this.loadPageData(), 30);
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
    this.currentChunk = 0;
    this.pageData = pageData;
    this.startIdx = startIdx;
    this.renderPageChunk();
  }

  renderPageChunk() {
    const tbody = document.getElementById(`${this.containerId}-tbody`);
    if (!tbody) return;

    const chunkSize = 15;
    const end = Math.min(this.currentChunk + chunkSize, this.pageData.length);
    const fragment = document.createDocumentFragment();

    for (let i = this.currentChunk; i < end; i++) {
      const row = this.pageData[i];
      const actualIdx = this.startIdx + i;
      const rowId = this.nextRowId++;
      const tr = this.createRowElement(row, actualIdx, rowId);
      fragment.appendChild(tr);
    }

    tbody.appendChild(fragment);
    this.currentChunk = end;

    if (this.currentChunk < this.pageData.length) {
      requestAnimationFrame(() => this.renderPageChunk());
    } else {
      this.cacheRowElements();
      this.attachRowEvents();
      this.updateFooter();
      this.renderPaginationControls();
      this.pageData = null;
    }
  }

  refreshPage() {
    const tbody = document.getElementById(`${this.containerId}-tbody`);
    if (!tbody) return;
    const pageData = this.getCurrentPageData();
    const startIdx = (this.currentPage - 1) * this.pageSize;
    let html = "";
    for (let i = 0; i < pageData.length; i++) {
      const row = pageData[i];
      const actualIdx = startIdx + i;
      const rowId = this.nextRowId++;
      html += this.renderRow(row, actualIdx, rowId);
    }
    tbody.innerHTML = html;
    this.cacheRowElements();
    this.attachRowEvents();
    this.updateFooter();
    this.renderPaginationControls();
  }

  // ========== CRIAÇÃO DE LINHAS ==========
  createRowElement(row, idx, rowId) {
    const tr = document.createElement("tr");
    tr.className = "at-table-row";
    tr.setAttribute("data-row-idx", idx);
    tr.setAttribute("data-row-id", rowId);
    tr.appendChild(this.createCellsFragment(row, idx, rowId));
    tr.appendChild(this.createActionCell(idx, rowId));
    return tr;
  }

  renderRow(row, idx, rowId) {
    let html = `<tr data-row-idx="${idx}" data-row-id="${rowId}" class="at-table-row">`;
    html += this.renderCellsHtml(this.headers, row, idx, rowId);
    html += `<td class="action-col"><button type="button" class="btn-remove-row" data-row-idx="${idx}" data-row-id="${rowId}" title="Remover linha">🗑️</button></td>`;
    html += `</tr>`;
    return html;
  }

  renderCellsHtml(headers, row, idx, rowId) {
    let html = "";
    for (const h of headers) {
      if (h.subHeaders) {
        html += this.renderCellsHtml(h.subHeaders, row, idx, rowId);
      } else {
        const field = h.field;
        const value = row[field] ?? "";
        html += `<td class="${h.class || ""}" data-field="${field}">`;
        html += this.getCellHtml(h, value, idx, rowId);
        html += `<\/td>`;
      }
    }
    return html;
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
    if (formatter)
      return `<span class="at-table-static">${formatter(value, idx, this.allData[idx])}</span>`;
    if (type === "auto-number")
      return `<span class="at-table-static">${(options.start || 1) + idx}</span>`;
    if (type === "static-text")
      return `<span class="at-table-static">${value}</span>`;
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
    return `<tr class="empty-row"><td colspan="${colCount}" class="text-center">Nenhum registo encontrado<\/tr>`;
  }

  renderSkeletonRows(count) {
    let html = "";
    for (let i = 0; i < count; i++) {
      html += `<tr class="skeleton-row">`;
      html += this.renderSkeletonCells(this.headers);
      html += `<td class="action-col"><div class="skeleton-cell skeleton-icon"></div><\/td>`;
      html += `<\/tr>`;
    }
    return html;
  }

  renderSkeletonCells(headers) {
    let html = "";
    for (const h of headers) {
      if (h.subHeaders) {
        html += this.renderSkeletonCells(h.subHeaders);
      } else {
        html += `<td class="${h.class || ""}"><div class="skeleton-cell"></div><\/td>`;
      }
    }
    return html;
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
      html += `<\/tr>`;
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
          if (h.type === "checkbox" && h.selectAll) {
            html += `<th rowspan="${rowspan}" class="${h.class || ""}">
           <div class="header-checkbox-container">
             <label class="header-checkbox-label">
               <span>${h.label}</span>
               <input type="checkbox" class="header-select-all" data-field="${h.field}" id="selectAll-${this.containerId}-${h.field}">
             </label>
           </div>
         </th>`;
          } else {
            html += `<th rowspan="${rowspan}" class="${h.class || ""}">${h.label}</th>`;
          }
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

  // Anexar evento de seleção em massa após renderização
  attachSelectAllEvent() {
    // Procurar todos os checkboxes "select-all" dentro da tabela
    const container = document.getElementById(this.containerId);
    if (!container) return;
    const selectAllCheckboxes =
      container.querySelectorAll(".header-select-all");
    selectAllCheckboxes.forEach((checkbox) => {
      checkbox.removeEventListener("change", this._selectAllHandler);
      this._selectAllHandler = (e) => {
        const field = e.target.dataset.field;
        const isChecked = e.target.checked;
        // Atualiza todas as linhas da página atual (ou de todas, dependendo da necessidade)
        // Vamos atualizar todas as linhas do conjunto completo (allData)
        for (let i = 0; i < this.allData.length; i++) {
          this.allData[i][field] = isChecked ? "S" : "N";
        }
        // Recarregar a página atual para refletir as mudanças
        if (this.paginated) {
          this.refreshPage();
        } else {
          this.renderAllRows();
        }
        this.updateFooter();
        this.onChange(this.allData);
      };
      checkbox.addEventListener("change", this._selectAllHandler);
    });
  }

  // Sobrescrever attachGlobalEvents para incluir a seleção em massa
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

    // Anexar evento de seleção em massa após a renderização do cabeçalho
    this.attachSelectAllEvent();
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
      value:
        typeof g.value === "function" ? g.value(this.allData) : g.value || 0,
    }));

    let html = '<tr class="footer-row">';
    const groupWidth = Math.floor(totalCols / groups.length);
    groups.forEach((g, i) => {
      const colspan =
        i === groups.length - 1 ? totalCols - i * groupWidth : groupWidth;
      const display = g.formatter
        ? g.formatter(g.value, this.allData)
        : g.value.toFixed(2) + " €";
      html += `<td colspan="${colspan}" class="footer-group-cell" data-footer-field="${g.field}">
                 <div class="footer-group">
                   <span class="footer-label">${g.label}</span>
                   <span class="footer-value">${display}</span>
                 </div>
                <\/td>`;
      this.footerValues.set(g.field, g.value);
    });
    html += `<\/tr>`;
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
        typeof g.value === "function" ? g.value(this.allData) : g.value || 0;
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
          ? group.formatter(value, this.allData)
          : value.toFixed(2) + " €";
        const valueSpan = cell.querySelector(".footer-value");
        if (valueSpan) valueSpan.textContent = display;
      }
    });
  }

  // ========== EVENTOS ==========
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
        if (!isNaN(rowIdx) && this.allData[rowIdx]) {
          this.allData[rowIdx][field] = value;
          this.updateFooterValues();
          this.updateFooterDisplay();
          this.onChange(this.allData);
        }
      } else if (target.classList.contains("at-table-checkbox")) {
        const field = target.dataset.field;
        const rowIdx = parseInt(target.dataset.row);
        const value = target.checked ? "S" : "N";
        if (!isNaN(rowIdx) && this.allData[rowIdx]) {
          this.allData[rowIdx][field] = value;
          this.updateFooterValues();
          this.updateFooterDisplay();
          this.onChange(this.allData);
          // Sincronizar estado do checkbox "selecionar todos" no header
          this.syncSelectAllCheckbox(field);
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

  // Sincroniza o estado do checkbox "select all" no header
  syncSelectAllCheckbox(field) {
    const selectAllCheckbox = document.querySelector(
      `#selectAll-${this.containerId}-${field}`,
    );
    if (!selectAllCheckbox) return;
    const allChecked = this.allData.every((row) => row[field] === "S");
    selectAllCheckbox.checked = allChecked;
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
    this.allData.push(newRow);
    if (this.paginated) {
      const totalPages = this.getTotalPages();
      if (this.currentPage > totalPages) this.currentPage = totalPages;
      this.refreshPage();
    } else {
      this.renderAllRows();
    }
    this.updateFooter();
    this.onChange(this.allData);
  }

  removeRow(rowIdx) {
    if (rowIdx < 0 || rowIdx >= this.allData.length) return;
    this.allData.splice(rowIdx, 1);
    if (this.paginated) {
      const totalPages = this.getTotalPages();
      if (this.currentPage > totalPages) this.currentPage = totalPages;
      this.refreshPage();
    } else {
      this.renderAllRows();
    }
    this.updateFooter();
    this.onChange(this.allData);
  }

  removeAllRows() {
    if (this.allData.length === 0) return;
    if (!confirm(`Remover todas as ${this.allData.length} linhas?`)) return;
    this.allData = [];
    if (this.paginated) {
      this.currentPage = 1;
      this.showSkeletonAndLoadPage();
    } else {
      this.renderAllRows();
    }
    this.updateFooter();
    this.onChange(this.allData);
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

  renderPaginationControls() {
    const paginationDiv = document.getElementById(
      `${this.containerId}-pagination-inline`,
    );
    if (!paginationDiv) return;

    const totalPages = this.getTotalPages();
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.allData.length);

    paginationDiv.innerHTML = `
      <div class="pagination-controls">
        <button class="btn-page" id="${this.containerId}-page-first" ${this.currentPage === 1 ? "disabled" : ""}>⏮️ Primeira</button>
        <button class="btn-page" id="${this.containerId}-page-prev" ${this.currentPage === 1 ? "disabled" : ""}>◀ Anterior</button>
        <span class="page-info">Página ${this.currentPage} de ${totalPages} (${this.allData.length} registos, mostrando ${start}-${end})</span>
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
}
