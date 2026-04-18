// src/js/table.js - Componente de tabela com headers de múltiplos níveis

export class DynamicTable {
  constructor(containerId, options) {
    this.containerId = containerId;
    this.options = options;
    this.data = options.data || [];
    this.onChange = options.onChange || (() => {});
    this.headers = options.headers || [];
    this.catalogs = options.catalogs || {};
    this.summary = options.summary || null;
    this.footerGroups = options.footerGroups || null;
    this.isRendered = false;
    this.maxDepth = 1;
    this.render();
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
            <div class="at-table-container">
                <table class="at-table">
                    <thead>
                        ${this.renderHeaders()}
                    </thead>
                    <tbody id="${this.containerId}-tbody">
                        ${this.renderRows()}
                    </tbody>
                    ${this.renderFooter()}
                    <tfoot>
                        <tr class="table-add-row-footer">
                            <td colspan="100">
                                <button class="btn-add-row" id="${this.containerId}-add-btn">+ Adicionar Linha</button>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

    this.attachEvents();
    this.isRendered = true;
  }

  calculateMaxDepth(headers, currentDepth = 1) {
    let max = currentDepth;
    for (const header of headers) {
      if (header.subHeaders) {
        const depth = this.calculateMaxDepth(
          header.subHeaders,
          currentDepth + 1,
        );
        max = Math.max(max, depth);
      }
    }
    return max;
  }

  renderHeaders() {
    // Calcular profundidade máxima
    this.maxDepth = this.calculateMaxDepth(this.headers);

    // Gerar as linhas de cabeçalho dinamicamente
    let html = "";

    for (let level = 0; level < this.maxDepth; level++) {
      html += `<tr class="header-row-${level + 1}">`;
      html += this.renderHeaderLevel(this.headers, level, 0);

      // Adicionar coluna de ações APENAS na primeira linha (com rowspan = maxDepth)
      if (level === 0) {
        html += `<th rowspan="${this.maxDepth}" class="action-col-header">Ações</th>`;
      }

      html += `<\/tr>`;
    }

    return html;
  }

  renderHeaderLevel(headers, targetLevel, currentLevel) {
    let html = "";

    for (const header of headers) {
      if (currentLevel === targetLevel) {
        if (header.subHeaders) {
          let colspan = this.countLeafColumns(header.subHeaders);
          html += `<th colspan="${colspan}" class="${header.class || ""}">${header.label}</th>`;
        } else {
          const rowspan = this.maxDepth - targetLevel;
          html += `<th rowspan="${rowspan}" class="${header.class || ""}">${header.label}</th>`;
        }
      } else if (header.subHeaders && currentLevel < targetLevel) {
        html += this.renderHeaderLevel(
          header.subHeaders,
          targetLevel,
          currentLevel + 1,
        );
      }
    }

    return html;
  }

  getTotalCols() {
    let totalCols = this.countLeafColumns(this.headers);
    totalCols++; // coluna de ações
    return totalCols;
  }

  countLeafColumns(headers) {
    let count = 0;
    for (const header of headers) {
      if (header.subHeaders) {
        count += this.countLeafColumns(header.subHeaders);
      } else {
        count++;
      }
    }
    return count;
  }

  renderFooter() {
    if (this.footerGroups && this.footerGroups.length > 0) {
      return this.renderFooterGroups();
    }
    if (this.summary) {
      return this.renderSummaryFooter();
    }
    return "";
  }

  renderSummaryFooter() {
    let summaryValue = 0;
    if (this.summary.field) {
      summaryValue = this.data.reduce((acc, row) => {
        const val = parseFloat(row[this.summary.field]) || 0;
        return acc + val;
      }, 0);
    }

    let displayValue = summaryValue.toFixed(2) + " €";
    if (this.summary.formatter) {
      displayValue = this.summary.formatter(summaryValue, this.data);
    }

    const totalCols = this.getTotalCols();

    return `
            <tfoot class="table-summary-footer">
                <tr class="summary-row">
                    <td colspan="${totalCols - 1}" class="summary-label-cell">${this.summary.label || "Soma de Controlo"}<\/td>
                    <td class="summary-value-cell">${displayValue}<\/td>
                <\/tr>
            </tfoot>
        `;
  }

  renderFooterGroups() {
    const groupValues = this.footerGroups.map((group) => {
      let value = 0;
      if (group.value) {
        if (typeof group.value === "function") {
          value = group.value(this.data);
        } else {
          value = group.value;
        }
      } else if (group.field) {
        value = this.data.reduce((acc, row) => {
          const val = parseFloat(row[group.field]) || 0;
          return acc + val;
        }, 0);
        value = value.toFixed(2) + " €";
      }

      return {
        label: group.label,
        value: value,
        align: group.align || "right",
      };
    });

    const totalCols = this.getTotalCols();
    const groupWidth = Math.floor(totalCols / groupValues.length);

    let html = '<tfoot class="table-footer-groups">';
    html += '<tr class="footer-row">';

    for (let i = 0; i < groupValues.length; i++) {
      const g = groupValues[i];
      const colspan =
        i === groupValues.length - 1 ? totalCols - i * groupWidth : groupWidth;

      html += `<td colspan="${colspan}" class="footer-group-cell">`;
      html += `<div class="footer-group">`;
      html += `<span class="footer-label">${g.label}</span>`;
      html += `<span class="footer-value">${g.value}</span>`;
      html += `</div>`;
      html += `<\/td>`;
    }

    html += `<\/tr>`;
    html += `</tfoot>`;

    return html;
  }

  renderRows() {
    if (this.data.length === 0) {
      const colCount = this.getTotalCols();
      return `<tr class="empty-row"><td colspan="${colCount}" class="text-center">Nenhum registo encontrado<\/tr>`;
    }

    let html = "";
    this.data.forEach((row, idx) => {
      html += this.renderRow(row, idx);
    });
    return html;
  }

  renderRow(row, idx) {
    let html = `<tr data-row-idx="${idx}" class="at-table-row">`;

    const renderCells = (headers, currentRow) => {
      let cellsHtml = "";
      for (const header of headers) {
        if (header.subHeaders) {
          cellsHtml += renderCells(header.subHeaders, currentRow);
        } else {
          const field = header.field;
          const value =
            currentRow[field] !== undefined ? currentRow[field] : "";
          const type = header.type || "text";
          const catalog = this.catalogs[field];
          const options = header.options || [];
          const formatter = header.formatter || null;

          cellsHtml += `<td class="${header.class || ""}">`;
          cellsHtml += this.renderCell(
            field,
            value,
            type,
            catalog,
            idx,
            options,
            formatter,
          );
          cellsHtml += `<\/td>`;
        }
      }
      return cellsHtml;
    };

    html += renderCells(this.headers, row);

    // Coluna de ações
    html += `<td class="action-col">
                    <button class="btn-remove-row" data-row="${idx}" title="Remover Linha">🗑️</button>
                  <\/td>`;
    html += `<\/tr>`;

    return html;
  }

  renderCell(
    field,
    value,
    type,
    catalog,
    rowIdx,
    options = [],
    formatter = null,
  ) {
    if (formatter) {
      return `<span class="at-table-static">${formatter(value, rowIdx, this.data[rowIdx])}</span>`;
    }

    if (type === "select" && catalog) {
      let selectHtml = `<select class="at-table-select" data-field="${field}" data-row="${rowIdx}">`;
      for (const item of catalog) {
        const selected = item.code === value ? "selected" : "";
        selectHtml += `<option value="${item.code}" ${selected}>${item.description}</option>`;
      }
      selectHtml += `</select>`;
      return selectHtml;
    } else if (type === "select-static" && options) {
      let selectHtml = `<select class="at-table-select" data-field="${field}" data-row="${rowIdx}">`;
      selectHtml += `<option value="">Selecione</option>`;
      for (const opt of options) {
        const selected = opt.value === value ? "selected" : "";
        selectHtml += `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
      }
      selectHtml += `</select>`;
      return selectHtml;
    } else if (type === "auto-number") {
      const autoValue = 951 + rowIdx;
      return `<span class="at-table-static">${autoValue}</span>`;
    } else if (type === "static-text") {
      return `<span class="at-table-static">${value}</span>`;
    } else if (type === "number") {
      return `<input type="number" class="at-table-input" value="${value}" step="0.01" data-field="${field}" data-row="${rowIdx}">`;
    } else {
      return `<input type="text" class="at-table-input" value="${value}" data-field="${field}" data-row="${rowIdx}">`;
    }
  }

  attachEvents() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    if (this._boundAddHandler) {
      const oldBtn = document.getElementById(`${this.containerId}-add-btn`);
      if (oldBtn) {
        oldBtn.removeEventListener("click", this._boundAddHandler);
      }
    }

    this._boundAddHandler = () => this.addRow();
    const addBtn = document.getElementById(`${this.containerId}-add-btn`);
    if (addBtn) {
      addBtn.addEventListener("click", this._boundAddHandler);
    }

    const tbody = document.getElementById(`${this.containerId}-tbody`);
    if (tbody) {
      if (this._boundTbodyHandler) {
        tbody.removeEventListener("change", this._boundTbodyHandler);
        tbody.removeEventListener("click", this._boundClickHandler);
      }

      this._boundTbodyHandler = (e) => {
        const target = e.target;
        if (
          target.classList.contains("at-table-input") ||
          target.classList.contains("at-table-select")
        ) {
          const field = target.dataset.field;
          const rowIdx = parseInt(target.dataset.row);
          const value = target.value;

          if (!isNaN(rowIdx) && this.data[rowIdx]) {
            this.data[rowIdx][field] = value;
            this.onChange(this.data);
            this.updateFooter();
          }
        }
      };

      this._boundClickHandler = (e) => {
        const target = e.target.closest(".btn-remove-row");
        if (target) {
          const rowIdx = parseInt(target.dataset.row);
          if (!isNaN(rowIdx)) {
            this.removeRow(rowIdx);
          }
        }
      };

      tbody.addEventListener("change", this._boundTbodyHandler);
      tbody.addEventListener("click", this._boundClickHandler);
    }
  }

  updateFooter() {
    if (!this.footerGroups && !this.summary) return;

    if (this.summary) {
      let summaryValue = 0;
      if (this.summary.field) {
        summaryValue = this.data.reduce((acc, row) => {
          const val = parseFloat(row[this.summary.field]) || 0;
          return acc + val;
        }, 0);
      }

      let displayValue = summaryValue.toFixed(2) + " €";
      if (this.summary.formatter) {
        displayValue = this.summary.formatter(summaryValue, this.data);
      }

      const summaryCell = document.querySelector(
        `#${this.containerId} .summary-value-cell`,
      );
      if (summaryCell) {
        summaryCell.textContent = displayValue;
      }
    }

    if (this.footerGroups) {
      const footerRow = document.querySelector(
        `#${this.containerId} .footer-row`,
      );
      if (footerRow) {
        const cells = footerRow.querySelectorAll(".footer-group-cell");
        const groupValues = this.footerGroups.map((group) => {
          let value = 0;
          if (group.value) {
            if (typeof group.value === "function") {
              value = group.value(this.data);
            } else {
              value = group.value;
            }
          } else if (group.field) {
            value = this.data.reduce((acc, row) => {
              const val = parseFloat(row[group.field]) || 0;
              return acc + val;
            }, 0);
            value = value.toFixed(2) + " €";
          }
          return { label: group.label, value: value };
        });

        for (let i = 0; i < cells.length && i < groupValues.length; i++) {
          const labelSpan = cells[i].querySelector(".footer-label");
          const valueSpan = cells[i].querySelector(".footer-value");
          if (labelSpan) labelSpan.textContent = groupValues[i].label;
          if (valueSpan) valueSpan.textContent = groupValues[i].value;
        }
      }
    }
  }

  addRow() {
    const newRow = {};

    const addFields = (headers) => {
      for (const header of headers) {
        if (header.subHeaders) {
          addFields(header.subHeaders);
        } else if (header.field) {
          newRow[header.field] = "";
        }
      }
    };

    addFields(this.headers);

    this.data.push(newRow);
    this.refresh();
    this.onChange(this.data);
  }

  removeRow(idx) {
    this.data.splice(idx, 1);
    this.refresh();
    this.onChange(this.data);
  }

  refresh() {
    const tbody = document.getElementById(`${this.containerId}-tbody`);
    if (tbody) {
      tbody.innerHTML = this.renderRows();
    }
    this.updateFooter();
  }

  getData() {
    return this.data;
  }

  setEnabled(enabled) {
    const addBtn = document.getElementById(`${this.containerId}-add-btn`);
    if (addBtn) {
      if (enabled) {
        addBtn.disabled = false;
        addBtn.style.opacity = "1";
        addBtn.style.cursor = "pointer";
      } else {
        addBtn.disabled = true;
        addBtn.style.opacity = "0.5";
        addBtn.style.cursor = "not-allowed";
      }
    }

    const tbody = document.getElementById(`${this.containerId}-tbody`);
    if (tbody) {
      const removeBtns = tbody.querySelectorAll(".btn-remove-row");
      removeBtns.forEach((btn) => {
        if (enabled) {
          btn.disabled = false;
          btn.style.opacity = "1";
          btn.style.cursor = "pointer";
        } else {
          btn.disabled = true;
          btn.style.opacity = "0.5";
          btn.style.cursor = "not-allowed";
        }
      });
    }
  }

  isEnabled() {
    const addBtn = document.getElementById(`${this.containerId}-add-btn`);
    return addBtn ? !addBtn.disabled : true;
  }
}
