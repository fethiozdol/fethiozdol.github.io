let dialog: HTMLDialogElement | undefined;

function getDialog(): HTMLDialogElement {
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.innerHTML =
    '<div class="lightbox-bar"><button type="button" class="button" data-close>Close</button></div><div class="lightbox-body"></div>';
  dialog.querySelector('[data-close]')?.addEventListener('click', () => dialog?.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog?.close();
  });
  dialog.addEventListener('close', () => dialog?.querySelector('.lightbox-body')?.replaceChildren());
  document.body.append(dialog);
  return dialog;
}

/** Shows `content` enlarged in a modal dialog; focus returns to the opener when it closes. */
export function openLightbox(content: Node, label: string): void {
  const modal = getDialog();
  modal.setAttribute('aria-label', label);
  modal.querySelector('.lightbox-body')?.replaceChildren(content);
  modal.showModal();
}
