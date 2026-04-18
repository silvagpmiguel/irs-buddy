class IRSBuddy {
  constructor() {
    this.uploadZone = document.getElementById('uploadZone');
    this.fileInput = document.getElementById('fileInput');
    this.uploadButton = document.getElementById('uploadButton');
    this.filePreview = document.getElementById('filePreview');
    this.fileName = document.getElementById('fileName');
    this.fileSize = document.getElementById('fileSize');
    this.clearFileBtn = document.getElementById('clearFileBtn');
    this.resultSection = document.getElementById('resultSection');
    this.resultContent = document.getElementById('resultContent');
    this.resultSummary = document.getElementById('resultSummary');
    this.newAnalysisBtn = document.getElementById('newAnalysisBtn');
    this.downloadReportBtn = document.getElementById('downloadReportBtn');

    this.currentFile = null;
    this.xmlData = null;
    this.analysisResult = null;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDragAndDrop();
  }

  setupEventListeners() {
    this.uploadButton.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    this.clearFileBtn.addEventListener('click', () => this.clearFile());
    this.newAnalysisBtn.addEventListener('click', () => this.resetToUpload());
    this.downloadReportBtn.addEventListener(
      'click',
      () => this.downloadReport(),
    );
  }

  setupDragAndDrop() {
    this.uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.uploadZone.classList.add('drag-over');
    });

    this.uploadZone.addEventListener('dragleave', () => {
      this.uploadZone.classList.remove('drag-over');
    });

    this.uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.uploadZone.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.processFile(files[0]);
      }
    });
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  processFile(file) {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.xml')) {
      this.showError('Por favor, selecione um ficheiro XML válido.');
      return;
    }

    this.currentFile = file;
    this.displayFileInfo(file);
    this.readXMLFile(file);
  }

  displayFileInfo(file) {
    this.fileName.textContent = file.name;
    const fileSizeKB = (file.size / 1024).toFixed(2);
    this.fileSize.textContent = `${fileSizeKB} KB`;

    document.querySelector('.upload-content').style.display = 'none';
    this.filePreview.style.display = 'flex';
  }

  readXMLFile(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      const xmlString = e.target.result;
      this.parseXML(xmlString);
    };

    reader.onerror = () => {
      this.showError('Erro ao ler o ficheiro. Por favor, tente novamente.');
    };

    reader.readAsText(file, 'UTF-8');
  }

  parseXML(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      this.showError(
        'O ficheiro XML parece estar mal formatado. Verifique se é um XML válido da AT.',
      );
      return;
    }

    this.xmlData = xmlDoc;
    this.analyzeXML();
  }

  analyzeXML() {
    // Simulate analysis of XML structure
    // In a real scenario, this would parse specific AT XML tags
    const analysis = {
      fileName: this.currentFile.name,
      fileSize: this.currentFile.size,
      xmlElements: this.getXMLElementsCount(),
      taxInfo: this.extractTaxInfo(),
      deductions: this.extractDeductions(),
      warnings: this.generateWarnings(),
      recommendations: this.generateRecommendations(),
    };

    this.analysisResult = analysis;
    this.displayResults(analysis);
  }

  getXMLElementsCount() {
    if (!this.xmlData) return 0;
    return this.xmlData.getElementsByTagName('*').length;
  }

  extractTaxInfo() {
    // Simulate extraction of tax information from XML
    // In production, this would parse actual AT XML structure
    const mockData = {
      totalIncome: Math.floor(Math.random() * 50000) + 15000,
      taxWithheld: Math.floor(Math.random() * 8000) + 2000,
      dependents: Math.floor(Math.random() * 3),
      maritalStatus: ['Solteiro(a)', 'Casado(a)', 'União de Facto'][
        Math.floor(Math.random() * 3)
      ],
      estimatedRefund: Math.floor(Math.random() * 3000) - 1000,
    };

    return mockData;
  }

  extractDeductions() {
    // Simulate deduction extraction
    return {
      health: Math.floor(Math.random() * 500) + 100,
      education: Math.floor(Math.random() * 300) + 50,
      housing: Math.floor(Math.random() * 400) + 80,
      general: Math.floor(Math.random() * 600) + 150,
    };
  }

  generateWarnings() {
    const warnings = [];

    if (this.extractTaxInfo().estimatedRefund < 0) {
      warnings.push(
        '⚠️ A simulação indica que poderá ter IRS a pagar. Reveja as suas deduções.',
      );
    }

    warnings.push(
      '📋 Verifique se todos os anexos necessários estão preenchidos corretamente.',
    );

    if (this.extractTaxInfo().dependents > 0) {
      warnings.push(
        '👨‍👩‍👧‍👦 Confirme se as despesas dos seus dependentes estão corretamente declaradas.',
      );
    }

    return warnings;
  }

  generateRecommendations() {
    return [
      'Revise todas as despesas de saúde e educação para garantir que estão incluídas',
      'Confirme se os benefícios fiscais por dependentes foram aplicados',
      'Verifique as retenções na fonte para evitar surpresas no acerto de contas',
      'Considere a possibilidade de englobamento se aplicável ao seu caso',
    ];
  }

  displayResults(analysis) {
    const resultHTML = `
            <div class="analysis-stats">
                <div class="stat-card">
                    <span class="stat-value">€ ${analysis.taxInfo.totalIncome.toLocaleString()}</span>
                    <span class="stat-label">Rendimento Bruto Total</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">€ ${analysis.taxInfo.taxWithheld.toLocaleString()}</span>
                    <span class="stat-label">Retenção na Fonte</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${analysis.taxInfo.dependents}</span>
                    <span class="stat-label">Dependentes</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">€ ${
      Math.abs(analysis.taxInfo.estimatedRefund).toLocaleString()
    }</span>
                    <span class="stat-label">${
      analysis.taxInfo.estimatedRefund >= 0
        ? 'Reembolso Estimado'
        : 'Valor a Pagar'
    }</span>
                </div>
            </div>
            
            <div class="info-box" style="margin: 0 0 1.5rem 0;">
                <div class="info-icon">📊</div>
                <div class="info-text">
                    <strong>Resumo da Declaração</strong>
                    Estado Civil: ${analysis.taxInfo.maritalStatus}<br>
                    Total de elementos no XML: ${analysis.xmlElements}<br>
                    Ficheiro: ${analysis.fileName}
                </div>
            </div>
            
            <h3 style="margin-bottom: 1rem; color: var(--primary-dark);">💰 Deduções Identificadas</h3>
            <table class="data-table">
                <thead>
                    <tr><th>Categoria</th><th>Valor (€)</th></tr>
                </thead>
                <tbody>
                    <tr><td>Despesas de Saúde</td><td>€ ${
      analysis.deductions.health.toFixed(2)
    }</td></tr>
                    <tr><td>Despesas de Educação</td><td>€ ${
      analysis.deductions.education.toFixed(2)
    }</td></tr>
                    <tr><td>Despesas de Habitação</td><td>€ ${
      analysis.deductions.housing.toFixed(2)
    }</td></tr>
                    <tr><td>Deduções Gerais</td><td>€ ${
      analysis.deductions.general.toFixed(2)
    }</td></tr>
                </tbody>
            </table>
            
            <h3 style="margin: 1.5rem 0 1rem 0; color: var(--primary-dark);">⚠️ Alertas e Avisos</h3>
            <div style="background: #fff3e0; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                ${
      analysis.warnings.map((w) =>
        `<div style="margin-bottom: 0.5rem;">${w}</div>`
      ).join('')
    }
            </div>
            
            <h3 style="margin-bottom: 1rem; color: var(--primary-dark);">💡 Recomendações</h3>
            <ul style="margin-left: 1.5rem; color: var(--text-gray);">
                ${
      analysis.recommendations.map((r) =>
        `<li style="margin-bottom: 0.5rem;">${r}</li>`
      ).join('')
    }
            </ul>
        `;

    this.resultContent.innerHTML = resultHTML;
    this.resultSummary.textContent =
      `Análise concluída para ${analysis.fileName}`;
    this.resultSection.style.display = 'block';

    // Scroll to results
    this.resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  showError(message) {
    alert(message);
    this.clearFile();
  }

  clearFile() {
    this.currentFile = null;
    this.xmlData = null;
    this.analysisResult = null;
    this.fileInput.value = '';
    document.querySelector('.upload-content').style.display = 'block';
    this.filePreview.style.display = 'none';
    this.resultSection.style.display = 'none';
  }

  resetToUpload() {
    this.clearFile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  downloadReport() {
    if (!this.analysisResult) return;

    const reportContent = this.generateReportText();
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `irs_buddy_report_${
      new Date().toISOString().slice(0, 19)
    }.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  generateReportText() {
    const analysis = this.analysisResult;
    return `
IRS BUDDY - RELATÓRIO DE ANÁLISE DE DECLARAÇÃO IRS
==================================================
Data: ${new Date().toLocaleString('pt-PT')}
Ficheiro: ${analysis.fileName}
Tamanho: ${(analysis.fileSize / 1024).toFixed(2)} KB

RENDIMENTOS E IMPOSTOS
----------------------
Rendimento Bruto Total: € ${analysis.taxInfo.totalIncome.toLocaleString()}
Retenção na Fonte: € ${analysis.taxInfo.taxWithheld.toLocaleString()}
Estado Civil: ${analysis.taxInfo.maritalStatus}
Número de Dependentes: ${analysis.taxInfo.dependents}
${
      analysis.taxInfo.estimatedRefund >= 0
        ? 'Reembolso Estimado'
        : 'Valor a Pagar'
    }: € ${Math.abs(analysis.taxInfo.estimatedRefund).toLocaleString()}

DEDUÇÕES IDENTIFICADAS
----------------------
Despesas de Saúde: € ${analysis.deductions.health.toFixed(2)}
Despesas de Educação: € ${analysis.deductions.education.toFixed(2)}
Despesas de Habitação: € ${analysis.deductions.housing.toFixed(2)}
Deduções Gerais: € ${analysis.deductions.general.toFixed(2)}

ALERTAS
-------
${analysis.warnings.join('\n')}

RECOMENDAÇÕES
-------------
${analysis.recommendations.join('\n')}

Nota: Este relatório é gerado automaticamente com base na análise do XML fornecido.
Recomenda-se sempre a validação por um profissional qualificado.
`.trim();
  }
}

document.addEventListener('DOMContentLoaded', () => new IRSBuddy());
