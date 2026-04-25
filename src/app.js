import { HomeView } from "./views/home-view/home-view.js";
import { XMLParser } from "./js/xml-parser.js";
import { XMLExporter } from "./js/xml-exporter.js";

class IRSBuddy {
  constructor() {
    this.homeView = null;
    this.data = null;
    this.originalXmlString = null;
    this.pdfParser = null;
  }

  async init() {
    await this.initializeApp();
  }

  async initializeApp() {
    const app = document.getElementById("app");
    if (!app) return;

    // Criar e renderizar a home view
    this.homeView = new HomeView();
    const homeElement = await this.homeView.render();
    app.appendChild(homeElement);

    // Configurar callbacks
    this.homeView.setOnFileUpload(async (file) => {
      await this.processXMLFile(file);
    });

    this.homeView.setOnBrokerProcess(async (files) => {
      await this.processBrokerFiles(files);
    });

    this.homeView.setOnExport(() => {
      this.exportXML();
    });
  }

  async processXMLFile(file) {
    if (!file.name.toLowerCase().endsWith(".xml")) {
      this.showError("Por favor, selecione um ficheiro XML válido.");
      return;
    }
    this.readXMLFile(file);
  }

  readXMLFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => this.parseXML(e.target.result);
    reader.onerror = () => this.showError("Erro ao ler o ficheiro.");
    reader.readAsText(file, "UTF-8");
  }

  async parseXML(xmlString) {
    this.originalXmlString = xmlString;
    const parser = new XMLParser(xmlString);
    const result = parser.parse();

    if (result.success) {
      this.data = result.data;
      this.homeView.setData(this.data, (newData) => {
        this.data = newData;
      });
      this.showSuccess(
        "XML carregado! Agora importe os PDFs dos seus brokers.",
      );
    } else {
      this.showError("Erro ao processar XML: " + result.error);
    }
  }

  async processBrokerFiles(files) {
    this.showSuccess("A processar PDFs...");

    try {
      const { PDFParser } = await import("./js/pdf-parser.js");
      this.pdfParser = new PDFParser();

      let totalRows92A = 0;
      let totalRows92B = 0;
      let totalRows8A = 0;

      for (const [brokerId, brokerFiles] of Object.entries(files)) {
        if (brokerId === "xtb") {
          // Processar Capital Gains PDF (mais-valias)
          if (brokerFiles.capitalGains) {
            console.log("Processando Capital Gains PDF...");
            const { rows92A, rows92B } = await this.pdfParser.parseCapitalGains(
              brokerFiles.capitalGains,
            );

            console.log(
              `Encontradas ${rows92A.length} linhas para a tabela 9.2A`,
            );
            console.log(
              `Encontradas ${rows92B.length} linhas para a tabela 9.2B`,
            );

            totalRows92A = rows92A.length;
            totalRows92B = rows92B.length;

            // Adicionar ao Anexo J - 9.2A
            if (rows92A.length > 0) {
              this.addMaisValiasData(rows92A);
            }

            // Adicionar ao Anexo J - 9.2B
            if (rows92B.length > 0) {
              this.addOutrosIncrementosData(rows92B);
            }
          }

          // Processar Investment Income PDF (dividendos/juros)
          if (brokerFiles.investmentIncome) {
            console.log("Processando Investment Income PDF...");
            const { rows8A } = await this.pdfParser.parseInvestmentIncome(
              brokerFiles.investmentIncome,
            );

            console.log(`Encontradas ${rows8A.length} linhas para a tabela 8A`);

            totalRows8A = rows8A.length;

            if (rows8A.length > 0) {
              this.addRendimentosJurosData(rows8A);
            }
          }
        }
      }

      // Forçar atualização da UI
      if (this.homeView && this.homeView.currentAnexoComponent) {
        // Recarregar as tabelas se estivermos no Anexo J
        if (this.homeView.currentTab === "anexoJ") {
          const anexoJ = this.homeView.currentAnexoComponent;

          // Atualizar tabela 9.2A
          if (
            anexoJ.tables &&
            anexoJ.tables.maisValiasJ &&
            this.data.anexoJ?.rendimentosCategoriaG
          ) {
            anexoJ.tables.maisValiasJ.setData(
              this.data.anexoJ.rendimentosCategoriaG,
            );
            console.log(
              "Tabela 9.2A atualizada com",
              this.data.anexoJ.rendimentosCategoriaG.length,
              "linhas",
            );
          }

          // Atualizar tabela 9.2B
          if (
            anexoJ.tables &&
            anexoJ.tables.maisValiasJB &&
            this.data.anexoJ?.rendimentosCategoriaG_B
          ) {
            anexoJ.tables.maisValiasJB.setData(
              this.data.anexoJ.rendimentosCategoriaG_B,
            );
            console.log(
              "Tabela 9.2B atualizada com",
              this.data.anexoJ.rendimentosCategoriaG_B.length,
              "linhas",
            );
          }

          // Atualizar tabela 8A
          if (
            anexoJ.tables &&
            anexoJ.tables.rendimentosJuros &&
            this.data.anexoJ?.rendimentosCategoriaE
          ) {
            anexoJ.tables.rendimentosJuros.setData(
              this.data.anexoJ.rendimentosCategoriaE,
            );
            console.log(
              "Tabela 8A atualizada com",
              this.data.anexoJ.rendimentosCategoriaE.length,
              "linhas",
            );
          }
        }
      }

      this.showSuccess(
        `Dados importados com sucesso! (${totalRows92A + totalRows92B + totalRows8A} linhas)`,
      );
    } catch (error) {
      console.error("Erro ao processar PDFs:", error);
      this.showError("Erro ao processar PDFs: " + error.message);
    }
  }

  addMaisValiasData(rows) {
    if (!this.data) this.data = {};
    if (!this.data.anexoJ) this.data.anexoJ = {};
    if (!this.data.anexoJ.rendimentosCategoriaG) {
      this.data.anexoJ.rendimentosCategoriaG = [];
    }
    this.data.anexoJ.rendimentosCategoriaG.push(...rows);
    console.log(
      "Dados adicionados a rendimentosCategoriaG:",
      this.data.anexoJ.rendimentosCategoriaG.length,
    );
  }

  addOutrosIncrementosData(rows) {
    if (!this.data) this.data = {};
    if (!this.data.anexoJ) this.data.anexoJ = {};
    if (!this.data.anexoJ.rendimentosCategoriaG_B) {
      this.data.anexoJ.rendimentosCategoriaG_B = [];
    }
    this.data.anexoJ.rendimentosCategoriaG_B.push(...rows);
    console.log(
      "Dados adicionados a rendimentosCategoriaG_B:",
      this.data.anexoJ.rendimentosCategoriaG_B.length,
    );
  }

  addRendimentosJurosData(rows) {
    if (!this.data) this.data = {};
    if (!this.data.anexoJ) this.data.anexoJ = {};
    if (!this.data.anexoJ.rendimentosCategoriaE) {
      this.data.anexoJ.rendimentosCategoriaE = [];
    }
    this.data.anexoJ.rendimentosCategoriaE.push(...rows);
    console.log(
      "Dados adicionados a rendimentosCategoriaE:",
      this.data.anexoJ.rendimentosCategoriaE.length,
    );
  }

  exportXML() {
    if (!this.data) {
      this.showError("Não há dados para exportar.");
      return;
    }
    if (!this.originalXmlString) {
      this.showError("XML original não encontrado.");
      return;
    }

    const includedAnexos = {
      anexoJ: this.data.anexoJ?.incluir !== false,
      anexoH: this.data.anexoH?.incluir !== false,
      anexoG: this.data.anexoG?.incluir !== false,
    };

    if (
      !includedAnexos.anexoG &&
      !includedAnexos.anexoH &&
      !includedAnexos.anexoJ
    ) {
      this.showError("Nenhum anexo selecionado para exportar.");
      return;
    }

    // Desabilitar botão durante a exportação
    const exportBtn = document.getElementById("exportXMLBtn");
    if (exportBtn) {
      exportBtn.disabled = true;
      exportBtn.textContent = "⏳ A exportar...";
    }

    setTimeout(() => {
      try {
        // TODO: Adicionar referências das tabelas quando disponíveis
        const tableReferences = {};

        const exporter = new XMLExporter(
          this.originalXmlString,
          this.data,
          includedAnexos,
          tableReferences,
        );

        const result = exporter.export();

        if (result.success) {
          const blob = new Blob([result.xml], { type: "application/xml" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `declaracao_irs_atualizada_${new Date().toISOString().slice(0, 19)}.xml`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          this.showSuccess(result.message);
        } else {
          this.showError("Erro ao exportar: " + result.error);
        }
      } catch (error) {
        this.showError("Erro inesperado: " + error.message);
      } finally {
        if (exportBtn) {
          exportBtn.disabled = false;
          exportBtn.textContent = "💾 Exportar XML";
        }
      }
    }, 100);
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
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Inicializar a aplicação
document.addEventListener("DOMContentLoaded", () => {
  window.irsBuddy = new IRSBuddy();
  window.irsBuddy.init();
});
