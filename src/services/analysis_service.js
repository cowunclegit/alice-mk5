/**
 * AnalysisService provides advanced DOM analysis using real computed state from the browser.
 * This matches the accuracy of professional tools like OpenClaw.
 */
export class AnalysisService {
  /**
   * Converts the browser-captured raw tree into a simplified AXTree for the LLM.
   * @param {Object} rawTree - The JSON tree returned by 'Capture Accessibility Tree'.
   * @returns {Array<Object>} List of flattened AXNodes.
   */
  static processRawAXTree(rawTree) {
    const candidates = [];
    let refCounter = 0;

    const flatten = (node, depth = 0) => {
      const role = this._normalizeRole(node.tag, node.role);
      const name = node.name || '';
      
      // Filter out non-semantic containers with no text
      const isMeaningful = name.length > 0 || ['button', 'link', 'textbox', 'checkbox', 'radio'].includes(role);
      
      if (isMeaningful) {
        const refId = `e${++refCounter}`;
        const selector = this._buildSelector(node);

        candidates.push({
          refId,
          role,
          text: name,
          selector,
          depth
        });
      }

      if (node.children) {
        node.children.forEach(child => flatten(child, depth + 1));
      }
    };

    if (rawTree) flatten(rawTree);
    return candidates.sort((a, b) => a.refId.slice(1) - b.refId.slice(1));
  }

  static getAccessibilityTree(candidates) {
    return candidates
      .map(c => `${'  '.repeat(Math.min(c.depth, 10))}- ${c.role} "${c.text}" [ref=${c.refId}]`)
      .join('\n');
  }

  static _normalizeRole(tag, rawRole) {
    if (rawRole && rawRole !== tag) return rawRole;
    
    const map = {
      a: 'link', button: 'button', input: 'textbox', select: 'combobox', textarea: 'textbox',
      h1: 'heading', h2: 'heading', h3: 'heading', h4: 'heading', h5: 'heading', h6: 'heading',
      span: 'text', strong: 'text', em: 'text', b: 'text', p: 'text'
    };
    return map[tag] || 'generic';
  }

  static _buildSelector(node) {
    // 1. Prioritize stable semantic attributes (ARIA)
    if (node.name && node.role && !['text', 'generic'].includes(node.role)) {
      // Use XPath for semantic search as it's often more stable for "Name"
      const escapedName = node.name.replace(/'/g, "&apos;");
      if (node.role === 'button') return `xpath://button[contains(., '${escapedName}')]`;
      if (node.role === 'link') return `xpath://a[contains(., '${escapedName}')]`;
    }

    // 2. Fallback to ID
    if (node.id) return `css:#${node.id}`;

    // 3. Fallback to Class + Tag
    if (node.class) {
      const cleanClass = node.class.split(/\s+/).filter(c => c && !c.includes(':')).join('.');
      if (cleanClass) return `css:${node.tag}.${cleanClass}`;
    }

    // 4. Ultimate fallback to Tag
    return `css:${node.tag}`;
  }
}
