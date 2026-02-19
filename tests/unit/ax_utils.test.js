import { AXUtils } from '../../src/lib/ax_utils.js';

describe('AXUtils', () => {
  const mockTree = {
    role: 'body',
    name: '',
    children: [
      {
        role: 'nav',
        name: 'Navigation',
        children: [
          { role: 'link', name: 'Home', selector: 'nav a.home' },
          { role: 'link', name: 'Settings', selector: 'nav a.settings' }
        ]
      },
      {
        role: 'main',
        name: 'Main Content',
        children: [
          { role: 'heading', name: 'Welcome' },
          { role: 'button', name: 'Submit', selector: 'main button#submit' }
        ]
      }
    ]
  };

  it('should parse tree and assign sequential refs', () => {
    const { tree, refMap } = AXUtils.parse(mockTree);
    
    expect(tree.children[0].children[0].ref).toBe('e1');
    expect(tree.children[0].children[1].ref).toBe('e2');
    expect(tree.children[1].children[1].ref).toBe('e3');
    
    expect(refMap['e1']).toBe('nav a.home');
    expect(refMap['e3']).toBe('main button#submit');
  });

  it('should serialize tree to indented text', () => {
    const { tree } = AXUtils.parse(mockTree);
    const serialized = AXUtils.serialize(tree);
    
    expect(serialized).toContain('- nav "Navigation"');
    expect(serialized).toContain('  - link "Home" [ref=e1]');
    expect(serialized).toContain('  - button "Submit" [ref=e3]');
  });

  it('should prune empty branches', () => {
    const emptyTree = {
      role: 'div',
      name: '',
      children: [
        { role: 'span', name: '', children: [] }
      ]
    };
    const pruned = AXUtils.prune(emptyTree);
    expect(pruned).toBeNull();
  });
});
