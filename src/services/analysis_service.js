import * as cheerio from 'cheerio';

/**
 * AnalysisService provides advanced DOM analysis inspired by OpenClaw's role-based snapshots.
 */
export class AnalysisService {
  static pruneDOM(html) {
    const $ = cheerio.load(html);
    $('script, style, svg, path, iframe, img, link, meta, noscript, head').remove();
    return $.html();
  }

  static extractInteractiveElements(html) {
    const $ = cheerio.load(html);
    const candidates = [];
    let refCounter = 0;

    // First pass: identify potential list patterns by counting elements with same class/tag combinations
    const patterns = new Map();
    $('*').each((i, el) => {
      const $el = $(el);
      const tag = el.name;
      const classes = $el.attr('class') || '';
      if (classes) {
        const key = `${tag}.${classes.split(/\s+/).filter(c => c).join('.')}`;
        patterns.set(key, (patterns.get(key) || 0) + 1);
      }
    });

    const walk = (el, depth = 0) => {
      const $el = $(el);
      const role = this._getRole(el);
      const name = this._getAccessibleName($, el);
      
      if (!role || (role === 'generic' && !name)) {
        $el.children().each((i, child) => walk(child, depth + 1));
        return;
      }

      const refId = `e${++refCounter}`;
      const selector = this.getSelector($, $el);
      const tag = el.name;
      const classes = $el.attr('class') || '';
      const patternKey = classes ? `${tag}.${classes.split(/\s+/).filter(c => c).join('.')}` : null;
      const isPartOfPattern = patternKey && patterns.get(patternKey) > 3;

      let score = 0;
      const combinedText = `${name} ${selector} ${role}`.toLowerCase();
      if (name.match(/[-+]?\d+(\.\d+)?/)) score += 10;
      if (name.match(/[°℃℉%]/)) score += 20;
      if (combinedText.match(/날씨|기온|온도|풍속|습도|뉴스|제목|링크|검색|확인|로그인/)) score += 15;
      if (['button', 'link', 'textbox', 'checkbox'].includes(role)) score += 10;
      if (isPartOfPattern) score += 5;

      candidates.push({
        refId,
        role,
        text: name,
        selector,
        isListPattern: isPartOfPattern,
        patternCount: isPartOfPattern ? patterns.get(patternKey) : 0,
        score,
        depth
      });

      $el.children().each((i, child) => walk(child, depth + 1));
    };

    $('body').children().each((i, el) => walk(el));
    return candidates.sort((a, b) => b.score - a.score).slice(0, 250);
  }

  static getAccessibilityTree(candidates) {
    return candidates
      .sort((a, b) => a.refId.slice(1) - b.refId.slice(1)) 
      .map(c => {
        let line = `${'  '.repeat(Math.min(c.depth, 10))}- ${c.role} "${c.text}" [ref=${c.refId}]`;
        if (c.isListPattern) line += ` [list_pattern, count=${c.patternCount}]`;
        return line;
      })
      .join('\n');
  }

  static _getRole(el) {
    const { name, attribs } = el;
    if (attribs.role) return attribs.role;
    const map = {
      a: 'link', button: 'button', select: 'combobox', textarea: 'textbox',
      input: attribs.type === 'checkbox' ? 'checkbox' : (attribs.type === 'radio' ? 'radio' : 'textbox'),
      h1: 'heading', h2: 'heading', h3: 'heading', h4: 'heading', h5: 'heading', h6: 'heading',
      span: 'text', strong: 'text', em: 'text', b: 'text'
    };
    return map[name] || (['div', 'span', 'p'].includes(name) ? 'generic' : null);
  }

  static _getAccessibleName($, el) {
    const $el = $(el);
    return ($el.attr('aria-label') || $el.attr('placeholder') || $el.attr('title') || $el.text().replace(/\s+/g, ' ').trim()).slice(0, 200);
  }

  static getSelector($, $el) {
    const id = $el.attr('id');
    if (id && !id.includes(':')) return `css:#${id}`;
    
    const path = [];
    $el.parents().addBack().each((i, e) => {
      let entry = e.name;
      if (e.attribs.id && !e.attribs.id.includes(':')) {
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
    
    let resultPath = [];
    for (let i = path.length - 1; i >= 0; i--) {
      resultPath.unshift(path[i]);
      if (path[i].startsWith('#')) break;
      if (resultPath.length >= 3) break;
    }
    return `css:${resultPath.join(' > ')}`;
  }
}
