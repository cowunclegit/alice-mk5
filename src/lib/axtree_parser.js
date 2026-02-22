import * as cheerio from 'cheerio';

/**
 * AXTreeParser converts HTML into a simplified Accessibility Tree (AXTree)
 * for LLM consumption. It prunes non-visual elements and extracts semantic roles.
 */
export class AXTreeParser {
  /**
   * Parses HTML string into a simplified AXTree JSON structure.
   * @param {string} html - Raw HTML content.
   * @returns {Array<Object>} List of AXNodes.
   */
  static parse(html) {
    const $ = cheerio.load(html);
    
    // Prune non-visual elements
    $('script, style, svg, path, iframe, img, link, meta, noscript, head').remove();

    const candidates = [];
    let refCounter = 0;

    const walk = (el, depth = 0) => {
      const $el = $(el);
      const role = this._getRole(el);
      const name = this._getAccessibleName($, el);
      
      // Skip elements that have no semantic value (generic with no name)
      // OR elements mapped to 'text' role but have no text content
      if (!role || (role === 'generic' && !name) || (role === 'text' && !name)) {
        $el.children().each((i, child) => walk(child, depth + 1));
        return;
      }

      const refId = `e${++refCounter}`;
      const selector = this._getSelector($, el);

      candidates.push({
        refId,
        role,
        name,
        selector,
        depth
      });

      $el.children().each((i, child) => walk(child, depth + 1));
    };

    $('body').children().each((i, el) => walk(el));
    return candidates; // Return flat list, hierarchy is implicit via depth/order
  }

  static _getRole(el) {
    const { name, attribs } = el;
    if (attribs.role) return attribs.role;

    const map = {
      a: 'link', button: 'button', input: 'textbox', select: 'combobox', textarea: 'textbox',
      h1: 'heading', h2: 'heading', h3: 'heading', h4: 'heading', h5: 'heading', h6: 'heading',
      ul: 'list', ol: 'list', li: 'listitem', form: 'form', nav: 'navigation',
      main: 'main', article: 'article', section: 'region',
      span: 'text', strong: 'text', em: 'text', b: 'text', p: 'text', div: 'generic'
    };
    
    if (name === 'input') {
      const type = attribs.type || 'text';
      if (['checkbox', 'radio'].includes(type)) return type;
      if (['submit', 'button', 'reset'].includes(type)) return 'button';
    }

    return map[name] || 'generic';
  }

  static _getAccessibleName($, el) {
    const $el = $(el);
    return (
      $el.attr('aria-label') || 
      $el.attr('placeholder') || 
      $el.attr('title') || 
      $el.attr('alt') || 
      $el.text().replace(/\s+/g, ' ').trim()
    ).slice(0, 200);
  }

  static _getSelector($, el) {
    if (el.attribs.id) return `#${el.attribs.id}`;
    
    const path = [];
    $(el).parents().addBack().each((i, e) => {
      let entry = e.name;
      if (e.attribs.id) {
        entry = '#' + e.attribs.id;
      } else if (e.attribs.class) {
        const cleanClass = e.attribs.class.split(/\s+/).filter(c => c && !c.includes(':') && !c.includes('[')).join('.');
        if (cleanClass) entry += '.' + cleanClass;
      } else {
        const index = $(e).prevAll(e.name).length + 1;
        if (index > 1) entry += `:nth-of-type(${index})`;
      }
      path.push(entry);
    });
    
    // Optimize: shortest unique suffix
    return path.slice(-4).join(' > ');
  }
}
