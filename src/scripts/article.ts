import { openLightbox } from './lightbox';

function addCopyButtons() {
  for (const pre of document.querySelectorAll<HTMLPreElement>('.prose pre.astro-code')) {
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    pre.before(wrapper);
    wrapper.append(pre);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-button';
    button.textContent = 'Copy';
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pre.innerText);
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Copy failed';
      }
      setTimeout(() => (button.textContent = 'Copy'), 2000);
    });
    wrapper.append(button);
  }
}

// Mermaid is bundled locally and only downloaded on pages that contain diagrams.
async function renderDiagrams() {
  const blocks = [...document.querySelectorAll<HTMLElement>('.prose pre > code.language-mermaid')];
  if (blocks.length === 0) return;
  const { default: mermaid } = await import('mermaid');
  mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'strict' });

  for (const [index, code] of blocks.entries()) {
    const pre = code.parentElement as HTMLPreElement;
    try {
      const { svg } = await mermaid.render(`mermaid-diagram-${index}`, code.textContent ?? '');
      const figure = document.createElement('figure');
      figure.className = 'mermaid-diagram';
      figure.innerHTML = svg;
      figure.querySelector('svg')?.setAttribute('role', 'img');
      figure.querySelector('svg')?.setAttribute('aria-label', `Diagram ${index + 1}; its source is available below.`);

      const enlarge = document.createElement('button');
      enlarge.type = 'button';
      enlarge.className = 'button';
      enlarge.textContent = 'Enlarge diagram';
      enlarge.addEventListener('click', () => {
        const copy = figure.querySelector('svg')?.cloneNode(true);
        if (copy) openLightbox(copy, `Diagram ${index + 1}`);
      });

      const source = document.createElement('details');
      source.innerHTML = '<summary>Diagram source</summary>';
      pre.before(figure);
      source.append(pre);
      figure.append(enlarge, source);
    } catch (error) {
      console.error('Mermaid could not render a diagram; showing its source instead.', error);
    }
  }
}

addCopyButtons();
void renderDiagrams();
