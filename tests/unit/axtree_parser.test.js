import { AXTreeParser } from '../../src/lib/axtree_parser.js';

describe('AXTreeParser', () => {
  it('should extract interactive elements with correct roles', () => {
    const html = `
      <body>
        <button id="btn1">Click Me</button>
        <a href="#" class="nav-link">Home</a>
        <input type="text" placeholder="Search..." />
      </body>
    `;
    const tree = AXTreeParser.parse(html);
    
    expect(tree).toHaveLength(3);
    expect(tree[0]).toMatchObject({ role: 'button', name: 'Click Me', selector: '#btn1' });
    expect(tree[1]).toMatchObject({ role: 'link', name: 'Home' });
    expect(tree[2]).toMatchObject({ role: 'textbox', name: 'Search...' });
  });

  it('should ignore non-visual and empty elements', () => {
    const html = `
      <body>
        <script>console.log("ignore");</script>
        <div><span></span></div>
        <p>Visible Text</p>
      </body>
    `;
    const tree = AXTreeParser.parse(html);
    
    expect(tree).toHaveLength(1);
    expect(tree[0]).toMatchObject({ role: 'text', name: 'Visible Text' });
  });

  it('should generate correct hierarchy depth', () => {
    const html = `
      <main>
        <ul>
          <li>Item 1</li>
        </ul>
      </main>
    `;
    const tree = AXTreeParser.parse(html);
    
    // main (depth 0) -> list (depth 1) -> listitem (depth 2)
    expect(tree[0].role).toBe('main');
    expect(tree[0].depth).toBe(0);
    expect(tree[1].role).toBe('list');
    expect(tree[1].depth).toBe(1);
    expect(tree[2].role).toBe('listitem');
    expect(tree[2].depth).toBe(2);
  });
});
