// Cache para evitar múltiplos carregamentos
const templateCache = new Map();
const styleCache = new Map();

/**
 * Carrega um template HTML a partir do caminho especificado
 * @param {string} componentPath - Caminho relativo à raiz (ex: 'components/xml-upload')
 * @returns {Promise<string>} Conteúdo HTML do template
 */
export async function loadTemplate(componentPath) {
  // Verificar cache
  if (templateCache.has(componentPath)) {
    return templateCache.get(componentPath);
  }

  try {
    // Caminho relativo à raiz do servidor (que é /src/)
    const response = await fetch(`/${componentPath}.html`);
    if (!response.ok) {
      throw new Error(`Template not found: ${componentPath}`);
    }
    const html = await response.text();
    templateCache.set(componentPath, html);
    return html;
  } catch (error) {
    console.error(`Error loading template ${componentPath}:`, error);
    return "";
  }
}

/**
 * Carrega os estilos CSS de um componente/view
 * @param {string} componentPath - Caminho relativo à raiz (ex: 'components/xml-upload')
 */
export function loadStyles(componentPath) {
  // Verificar se já foi carregado
  const styleId = `style-${componentPath.replace(/\//g, "-")}`;
  if (styleCache.has(styleId) || document.getElementById(styleId)) {
    return;
  }

  const link = document.createElement("link");
  link.id = styleId;
  link.rel = "stylesheet";
  link.href = `/${componentPath}.css`;

  link.onload = () => {
    styleCache.set(styleId, true);
  };

  link.onerror = () => {
    console.warn(`Styles not found: ${componentPath}.css`);
  };

  document.head.appendChild(link);
}

/**
 * Carrega múltiplos estilos de uma vez
 * @param {string[]} paths - Array de caminhos de componentes/views
 */
export function loadMultipleStyles(paths) {
  paths.forEach((path) => loadStyles(path));
}
