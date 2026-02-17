import { AnalysisService } from '../../src/services/analysis_service.js';

describe('AnalysisService', () => {
  describe('pruneDOM', () => {
    it('should remove scripts, styles and noisy tags', () => {
      const html = '<html><head><style>body { color: red; }</style></head><body><script>alert(1)</script><div><button id="btn">Click me</button><svg>...</svg></div></body></html>';
      const pruned = AnalysisService.pruneDOM(html);
      
      expect(pruned).not.toContain('<script>');
      expect(pruned).not.toContain('<style>');
      expect(pruned).not.toContain('<svg>');
      expect(pruned).toContain('<button');
      expect(pruned).toContain('Click me');
    });
  });

  describe('extractInteractiveElements', () => {
    it('should extract buttons and inputs with selectors', () => {
      const html = '<div><button id="submit-btn" class="primary">Submit</button><input name="username" data-testid="user-input"></div>';
      const elements = AnalysisService.extractInteractiveElements(html);
      
      expect(elements).toHaveLength(2);
      expect(elements[0].tag).toBe('button');
      expect(elements[0].text).toBe('Submit');
      expect(elements[0].selector).toBe('#submit-btn');
      
      expect(elements[1].tag).toBe('input');
      expect(elements[1].selector).toBe('[data-testid="user-input"]');
    });
  });
});
