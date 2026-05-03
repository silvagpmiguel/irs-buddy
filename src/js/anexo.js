export class BaseAnexo {
  constructor(data, onDataChange) {
    this.data = data;
    this.onDataChange = onDataChange;
    this.tables = {};
    this.element = null;
    this.isInitialized = false;
  }

  async render() {
    throw new Error("Método render deve ser implementado");
  }

  initialize() {
    if (this.isInitialized) return;
    this.initTables();
    this.isInitialized = true;
  }

  initTables() {
    throw new Error("Método initTables deve ser implementado");
  }

  getTables() {
    return this.tables;
  }
}
