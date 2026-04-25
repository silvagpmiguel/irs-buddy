import { loadTemplate, loadStyles } from "../../js/template-loader.js";

export class ProgressSteps {
  constructor() {
    this.element = null;
    this.currentStep = 1;
    this.completedSteps = [];
  }

  async render() {
    loadStyles("components/progress-steps/progress-steps");
    const template = await loadTemplate(
      "components/progress-steps/progress-steps",
    );

    const container = document.createElement("div");
    container.className = "progress-steps";
    container.innerHTML = template;

    this.element = container;
    this.updateDisplay();
    return this.element;
  }

  // Marcar um passo como concluído
  completeStep(stepNumber) {
    if (!this.completedSteps.includes(stepNumber)) {
      this.completedSteps.push(stepNumber);
      this.updateDisplay();
    }
  }

  // Definir o passo atual (ativo)
  setCurrentStep(stepNumber) {
    this.currentStep = stepNumber;
    this.updateDisplay();
  }

  // Avançar para o próximo passo (completa o atual e avança)
  nextStep() {
    if (this.currentStep < 3) {
      this.completeStep(this.currentStep);
      this.currentStep++;
      this.updateDisplay();
    }
  }

  // Resetar todos os steps (voltar ao início)
  reset() {
    this.completedSteps = [];
    this.currentStep = 1;
    this.updateDisplay();
  }

  // Atualizar a exibição dos steps
  updateDisplay() {
    if (!this.element) return;

    const steps = this.element.querySelectorAll(".step");
    steps.forEach((step, index) => {
      const stepNumber = index + 1;
      step.classList.remove("active", "completed");

      // Se o passo já foi concluído
      if (this.completedSteps.includes(stepNumber)) {
        step.classList.add("completed");
      }
      // Se é o passo atual
      else if (stepNumber === this.currentStep) {
        step.classList.add("active");
      }
    });
  }
}
