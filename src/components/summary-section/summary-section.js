import { loadTemplate, loadStyles } from "../../js/template-loader.js";

export class SummarySection {
  constructor(originalXmlString, currentData, originalParsedData) {
    this.originalXmlString = originalXmlString;
    this.currentData = currentData;
    this.originalParsedData = originalParsedData;
    this.element = null;
    this.onBackCallback = null;
    this.onConfirmCallback = null;
  }

  async render() {
    loadStyles("components/summary-section/summary-section");
    const template = await loadTemplate(
      "components/summary-section/summary-section",
    );

    const container = document.createElement("div");
    container.className = "summary-section";
    container.innerHTML = template;
    this.element = container;

    this.attachEvents();
    await this.renderSummary();
    return this.element;
  }

  renderSummary() {
    const summaryContent = this.element.querySelector("#summaryContent");
    if (!summaryContent) return;
    const changes = this.calculateChanges();
    summaryContent.innerHTML = `
      ${this.renderAnexoCard("G", changes.anexoG)}
      ${this.renderAnexoCard("H", changes.anexoH)}
      ${this.renderAnexoCard("J", changes.anexoJ)}
    `;
  }

  calculateChanges() {
    return {
      anexoG: this.calculateAnexoGChanges(),
      anexoH: this.calculateAnexoHChanges(),
      anexoJ: this.calculateAnexoJChanges(),
    };
  }

  calculateAnexoGChanges() {
    const originalRows = this.originalParsedData?.anexoG?.quadro09 || [];
    const currentRows = this.currentData?.anexoG?.quadro09 || [];
    const tableChanges = this.calculateTableChanges(
      originalRows,
      currentRows,
      "NLinha",
    );

    const anexoExisteOriginal = !!this.originalParsedData?.anexoG?.presente;
    const anexoExisteAtual =
      currentRows.length > 0 || this.currentData?.anexoG?.incluir === true;

    return {
      ...tableChanges,
      anexoExisteOriginal,
      anexoExisteAtual,
      englobamento: this.currentData?.anexoG?.englobamento || "N",
      originalEnglobamento:
        this.originalParsedData?.anexoG?.englobamento || "N",
    };
  }

  calculateAnexoHChanges() {
    const originalRows =
      this.originalParsedData?.anexoH?.beneficiosFiscais || [];
    const currentRows = this.currentData?.anexoH?.beneficiosFiscais || [];
    const tableChanges = this.calculateTableChanges(
      originalRows,
      currentRows,
      "CodBeneficio",
    );

    const anexoExisteOriginal = !!this.originalParsedData?.anexoH?.presente;
    const anexoExisteAtual =
      currentRows.length > 0 || this.currentData?.anexoH?.incluir === true;

    return {
      ...tableChanges,
      anexoExisteOriginal,
      anexoExisteAtual,
    };
  }

  calculateAnexoJChanges() {
    const originalE =
      this.originalParsedData?.anexoJ?.rendimentosCategoriaE || [];
    const currentE = this.currentData?.anexoJ?.rendimentosCategoriaE || [];
    const originalG =
      this.originalParsedData?.anexoJ?.rendimentosCategoriaG || [];
    const currentG = this.currentData?.anexoJ?.rendimentosCategoriaG || [];
    const originalGB =
      this.originalParsedData?.anexoJ?.rendimentosCategoriaG_B || [];
    const currentGB = this.currentData?.anexoJ?.rendimentosCategoriaG_B || [];
    const originalIban = this.originalParsedData?.anexoJ?.iban || [];
    const currentIban = this.currentData?.anexoJ?.iban || [];

    const anexoExisteOriginal = !!this.originalParsedData?.anexoJ?.presente;
    const anexoExisteAtual =
      currentE.length > 0 ||
      currentG.length > 0 ||
      currentGB.length > 0 ||
      currentIban.length > 0 ||
      this.currentData?.anexoJ?.incluir === true;

    const tableEIbanChanges = this.calculateTableChanges(
      originalE,
      currentE,
      "NLinha",
    );
    const tableGChanges = this.calculateTableChanges(
      originalG,
      currentG,
      "NLinha",
    );
    const tableGBChanges = this.calculateTableChanges(
      originalGB,
      currentGB,
      "NLinha",
    );
    const tableIbanChanges = this.calculateIbanChanges(
      originalIban,
      currentIban,
    );

    const hasChanges =
      tableEIbanChanges.hasChanges ||
      tableGChanges.hasChanges ||
      tableGBChanges.hasChanges ||
      tableIbanChanges.hasChanges;

    return {
      hasChanges,
      anexoExisteOriginal,
      anexoExisteAtual,
      totalChanges:
        tableEIbanChanges.totalChanges +
        tableGChanges.totalChanges +
        tableGBChanges.totalChanges +
        tableIbanChanges.totalChanges,
      originalCount:
        originalE.length +
        originalG.length +
        originalGB.length +
        originalIban.length,
      currentCount:
        currentE.length +
        currentG.length +
        currentGB.length +
        currentIban.length,
      tables: {
        "📊 Rendimentos Categoria E (8. A)": tableEIbanChanges,
        "📈 Mais-Valias (9.2 A)": tableGChanges,
        "🔄 Outros Incrementos (9.2 B)": tableGBChanges,
        "🏦 Contas Bancárias (IBAN)": tableIbanChanges,
      },
      englobamento: this.currentData?.anexoJ?.englobamento || "N",
      englobamentoSec8: this.currentData?.anexoJ?.englobamentoSec8 || "N",
      originalEnglobamento:
        this.originalParsedData?.anexoJ?.englobamento || "N",
      originalEnglobamentoSec8:
        this.originalParsedData?.anexoJ?.englobamentoSec8 || "N",
    };
  }

  calculateIbanChanges(originalRows, currentRows) {
    const originalCount = originalRows.length;
    const currentCount = currentRows.length;
    const hasChanges = originalCount !== currentCount;

    return {
      hasChanges,
      totalChanges: Math.abs(currentCount - originalCount),
      added: currentCount > originalCount ? currentCount - originalCount : 0,
      removed: originalCount > currentCount ? originalCount - currentCount : 0,
      originalCount,
      currentCount,
      originalSum: originalCount > 0 ? 1 : 0, // Apenas para indicar que existe
      currentSum: currentCount > 0 ? 1 : 0,
      sumDifference: (currentCount > 0 ? 1 : 0) - (originalCount > 0 ? 1 : 0),
    };
  }

  calculateTableChanges(originalRows, currentRows, idField) {
    const originalMap = new Map(originalRows.map((r) => [r[idField], r]));
    const currentMap = new Map(currentRows.map((r) => [r[idField], r]));

    const added = [...currentMap.keys()].filter(
      (id) => !originalMap.has(id),
    ).length;
    const removed = [...originalMap.keys()].filter(
      (id) => !currentMap.has(id),
    ).length;

    const originalSum = originalRows.reduce((sum, r) => {
      const valor = parseFloat(
        r.ValorRealizacao ||
          r.ImportanciaAplicada ||
          r.RendimentoBruto ||
          r.RendimentoLiquido ||
          0,
      );
      return sum + (isNaN(valor) ? 0 : valor);
    }, 0);

    const currentSum = currentRows.reduce((sum, r) => {
      const valor = parseFloat(
        r.ValorRealizacao ||
          r.ImportanciaAplicada ||
          r.RendimentoBruto ||
          r.RendimentoLiquido ||
          0,
      );
      return sum + (isNaN(valor) ? 0 : valor);
    }, 0);

    const hasChanges = added > 0 || removed > 0 || originalSum !== currentSum;

    return {
      hasChanges,
      totalChanges: added + removed,
      added,
      removed,
      originalCount: originalRows.length,
      currentCount: currentRows.length,
      originalSum,
      currentSum,
      sumDifference: currentSum - originalSum,
    };
  }

  renderAnexoCard(anexo, changes) {
    // Determinar o estado do anexo
    let statusClass = "unchanged";
    let statusText = "Inalterado";
    let statusIcon = "⚪";

    // Anexo foi criado (não existia no original mas existe agora)
    if (!changes.anexoExisteOriginal && changes.anexoExisteAtual) {
      statusClass = "created";
      statusText = "Criado";
      statusIcon = "✨";
    }
    // Anexo foi removido (existia no original mas não existe agora)
    else if (changes.anexoExisteOriginal && !changes.anexoExisteAtual) {
      statusClass = "removed";
      statusText = "Removido";
      statusIcon = "🗑️";
    }
    // Anexo foi modificado (existia e foi alterado)
    else if (changes.hasChanges) {
      statusClass = "modified";
      statusText = "Modificado";
      statusIcon = "📝";
    }

    let tablesHTML = "";
    if (anexo === "J" && changes.tables) {
      for (const [tableName, tableChanges] of Object.entries(changes.tables)) {
        tablesHTML += this.renderTableSummary(tableName, tableChanges);
      }
    } else {
      tablesHTML = this.renderTableSummary("Dados", changes);
    }

    // Se não há dados e o anexo não foi criado, mostrar mensagem
    if (
      changes.originalCount === 0 &&
      changes.currentCount === 0 &&
      !changes.anexoExisteAtual
    ) {
      tablesHTML = `<div class="no-data">📭 Nenhum dado presente neste anexo</div>`;
    }

    return `
      <div class="anexo-summary-card ${statusClass}">
        <div class="anexo-summary-header">
          <div class="anexo-title">
            <span class="anexo-icon">${this.getAnexoIcon(anexo)}</span>
            <h3>Anexo ${anexo}</h3>
          </div>
          <div class="anexo-status-badge ${statusClass}">
            <span class="status-icon">${statusIcon}</span>
            <span>${statusText}</span>
          </div>
        </div>
        <div class="anexo-summary-content">
          ${this.renderEnglobamentoInfo(anexo, changes)}
          ${tablesHTML}
        </div>
      </div>
    `;
  }

  renderEnglobamentoInfo(anexo, changes) {
    if (anexo === "G") {
      const englobamento = changes.englobamento || "N";
      const originalEnglobamento = changes.originalEnglobamento || "N";
      const hasChange = englobamento !== originalEnglobamento;

      return `
        <div class="englobamento-info ${hasChange ? "has-change" : ""}">
          <span class="englobamento-label">Opção de Englobamento:</span>
          <span class="englobamento-value ${englobamento === "S" ? "yes" : "no"}">
            ${englobamento === "S" ? "✅ Sim" : "❌ Não"}
          </span>
          ${hasChange ? `<span class="change-indicator">(anterior: ${originalEnglobamento === "S" ? "Sim" : "Não"})</span>` : ""}
        </div>
      `;
    } else if (anexo === "J") {
      const englobamento = changes.englobamento || "N";
      const englobamentoSec8 = changes.englobamentoSec8 || "N";
      const hasEnglobamentoChange =
        englobamento !== changes.originalEnglobamento;
      const hasEnglobamentoSec8Change =
        englobamentoSec8 !== changes.originalEnglobamentoSec8;

      return `
        <div class="englobamento-info">
          <div class="englobamento-item ${hasEnglobamentoSec8Change ? "has-change" : ""}">
            <span class="englobamento-label">8. Englobamento Rendimentos Capitais:</span>
            <span class="englobamento-value ${englobamentoSec8 === "S" ? "yes" : "no"}">
              ${englobamentoSec8 === "S" ? "✅ Sim" : "❌ Não"}
            </span>
            ${hasEnglobamentoSec8Change ? `<span class="change-indicator">(anterior: ${changes.originalEnglobamentoSec8 === "S" ? "Sim" : "Não"})</span>` : ""}
          </div>
          <div class="englobamento-item ${hasEnglobamentoChange ? "has-change" : ""}">
            <span class="englobamento-label">9. Englobamento Incrementos Patrimoniais:</span>
            <span class="englobamento-value ${englobamento === "S" ? "yes" : "no"}">
              ${englobamento === "S" ? "✅ Sim" : "❌ Não"}
            </span>
            ${hasEnglobamentoChange ? `<span class="change-indicator">(anterior: ${changes.originalEnglobamento === "S" ? "Sim" : "Não"})</span>` : ""}
          </div>
        </div>
      `;
    }
    return "";
  }

  getAnexoIcon(anexo) {
    switch (anexo) {
      case "G":
        return "📈";
      case "H":
        return "🏥";
      case "J":
        return "🌍";
      default:
        return "📄";
    }
  }

  renderTableSummary(tableName, changes) {
    // Para tabela de IBAN (não tem valores monetários)
    const isIbanTable =
      tableName.includes("IBAN") || tableName.includes("Contas Bancárias");

    const hasChanges = changes.hasChanges;
    const isEmpty = changes.originalCount === 0 && changes.currentCount === 0;

    if (isEmpty && !hasChanges) {
      return `<div class="table-summary empty">
        <div class="table-name">${tableName}</div>
        <div class="table-stats empty-state">Sem registos</div>
      </div>`;
    }

    const changeTypeMessages = [];
    if (changes.added > 0)
      changeTypeMessages.push(
        `<span class="change-badge added">+${changes.added}</span>`,
      );
    if (changes.removed > 0)
      changeTypeMessages.push(
        `<span class="change-badge removed">-${changes.removed}</span>`,
      );

    if (isIbanTable) {
      return `
        <div class="table-summary ${hasChanges ? "has-changes" : ""}">
          <div class="table-name">${tableName}</div>
          <div class="table-stats-grid">
            <div class="stat-card">
              <div class="stat-label">Contas</div>
              <div class="stat-value-compare">
                <span class="old-value">${changes.originalCount}</span>
                <span class="arrow">→</span>
                <span class="new-value ${changes.added > 0 ? "text-green" : changes.removed > 0 ? "text-red" : ""}">${changes.currentCount}</span>
              </div>
              ${changeTypeMessages.length > 0 ? `<div class="stat-changes">${changeTypeMessages.join(" ")}</div>` : ""}
            </div>
          </div>
        </div>
      `;
    }

    const sumDiff = changes.sumDifference;
    const sumDiffClass =
      sumDiff > 0 ? "added" : sumDiff < 0 ? "removed" : "unchanged";
    const sumDiffSign =
      sumDiff > 0
        ? `+${sumDiff.toFixed(2)}€`
        : sumDiff < 0
          ? `${sumDiff.toFixed(2)}€`
          : "0€";

    return `
      <div class="table-summary ${hasChanges ? "has-changes" : ""}">
        <div class="table-name">${tableName}</div>
        <div class="table-stats-grid">
          <div class="stat-card">
            <div class="stat-label">Linhas</div>
            <div class="stat-value-compare">
              <span class="old-value">${changes.originalCount}</span>
              <span class="arrow">→</span>
              <span class="new-value ${changes.added > 0 ? "text-green" : changes.removed > 0 ? "text-red" : ""}">${changes.currentCount}</span>
            </div>
            ${changeTypeMessages.length > 0 ? `<div class="stat-changes">${changeTypeMessages.join(" ")}</div>` : ""}
          </div>
          <div class="stat-card">
            <div class="stat-label">Valor Total</div>
            <div class="stat-value-compare">
              <span class="old-value">${changes.originalSum.toFixed(2)}€</span>
              <span class="arrow">→</span>
              <span class="new-value ${sumDiffClass}">${changes.currentSum.toFixed(2)}€</span>
            </div>
            <div class="stat-diff ${sumDiffClass}">${sumDiffSign}</div>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    const backBtn = this.element.querySelector("#backToEditBtn");
    if (backBtn && this.onBackCallback) {
      const newBackBtn = backBtn.cloneNode(true);
      backBtn.parentNode.replaceChild(newBackBtn, backBtn);
      newBackBtn.addEventListener("click", () => this.onBackCallback());
    }

    const confirmBtn = this.element.querySelector("#confirmExportBtn");
    if (confirmBtn && this.onConfirmCallback) {
      const newConfirmBtn = confirmBtn.cloneNode(true);
      confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
      newConfirmBtn.addEventListener("click", () => this.onConfirmCallback());
    }
  }

  setOnBack(callback) {
    this.onBackCallback = callback;
  }
  setOnConfirm(callback) {
    this.onConfirmCallback = callback;
  }
}
