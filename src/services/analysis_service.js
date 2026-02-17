import * as cheerio from 'cheerio';

export class AnalysisService {
  static pruneDOM(html) {
    const $ = cheerio.load(html);
    
    $('script').remove();
    $('style').remove();
    $('svg').remove();
    $('path').remove();
    $('iframe').remove();
    $('img').remove();
    $('link').remove();
    $('meta').remove();
    
    return $.html();
  }

  static extractInteractiveElements(html) {
    const $ = cheerio.load(html);
    const elements = [];
    
    $('button, input, a, [role="button"], [role="link"], select, textarea').each((i, el) => {
      const $el = $(el);
      elements.push({
        tag: el.tagName,
        text: $el.text().trim(),
        attributes: el.attribs,
        selector: this.getSelector($el)
      });
    });
    
    return elements;
  }

  static getSelector($el) {
    if ($el.attr('id')) {
      return `#${$el.attr('id')}`;
    }
    if ($el.attr('data-testid')) {
      return `[data-testid="${$el.attr('data-testid')}"]`;
    }
    // Simple fallback: tag + classes
    const classes = $el.attr('class');
    if (classes) {
      return `${$el.prop('tagName').toLowerCase()}.${classes.trim().split(/\s+/).join('.')}`;
    }
    return $el.prop('tagName').toLowerCase();
  }
}
