/**
 * Utilities for processing and serializing Accessibility Trees (AXTREE).
 */

export class AXUtils {
  /**
   * Parses a raw AXTree and assigns sequential references (e1, e2, ...).
   * Also generates a flat map of ref to selector.
   * @param {Object} rootNode 
   * @returns {Object} { tree: Object, refMap: Map }
   */
  static parse(rootNode) {
    const refMap = {};
    let counter = 1;

    const traverse = (node) => {
      // Assign ref only to nodes with selectors (interactable)
      if (node.role && node.name && node.selector) {
        const ref = `e${counter++}`;
        node.ref = ref;
        refMap[ref] = node.selector;
      }

      if (node.children) {
        node.children = node.children.map(traverse);
      }
      return node;
    };

    const treeWithRefs = traverse(JSON.parse(JSON.stringify(rootNode)));
    return { tree: treeWithRefs, refMap };
  }

  /**
   * Serializes an AXTree into an indented text format optimized for LLM prompts.
   * @param {Object} node 
   * @param {number} depth 
   * @returns {string}
   */
  static serialize(node, depth = 0) {
    const indent = '  '.repeat(depth);
    let output = '';

    const hasContent = node.name || node.ref;
    
    if (node.role && hasContent) {
      const label = node.name ? ` "${node.name}"` : '';
      const refPart = node.ref ? ` [ref=${node.ref}]` : '';
      output += `${indent}- ${node.role}${label}${refPart}\n`;
    }

    if (node.children) {
      for (const child of node.children) {
        output += this.serialize(child, (node.role && hasContent) ? depth + 1 : depth);
      }
    }

    return output;
  }

  /**
   * Prunes the tree to remove empty branches or redundant nodes.
   * @param {Object} node 
   * @returns {Object|null}
   */
  static prune(node) {
    if (node.children) {
      node.children = node.children.map(c => this.prune(c)).filter(Boolean);
    }

    const hasContent = node.name || node.ref;
    const hasChildren = node.children && node.children.length > 0;

    if (!hasContent && !hasChildren) return null;
    return node;
  }
}
