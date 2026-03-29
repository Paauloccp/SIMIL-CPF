(() => {
  try {
    if (!location.href.includes('/pages/laudo/construcao/cadastrarlaudo.xhtml')) return;

    const BTN_ID = 'similCpfFillBtn';
    const TOAST_ID = 'similCpfToast';

    const isVisible = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
    };

    const findCpfInputsVisible = () => {
      let inputs = [...document.querySelectorAll('input[type="text"], input:not([type])')]
        .filter(i => /cpf/i.test(i.id || '') || /cpf/i.test(i.name || ''))
        .filter(isVisible)
        .filter(i => !i.disabled && !i.readOnly);

      if (!inputs.length) {
        const labels = [...document.querySelectorAll('label, span, div')]
          .filter(n => (n.textContent || '').trim() === 'CPF:');

        inputs = labels.map(lab => {
          const row = lab.closest('div')?.parentElement || lab.parentElement;
          const el = row?.querySelector('input[type="text"], input:not([type])');
          return el && isVisible(el) && !el.disabled && !el.readOnly ? el : null;
        }).filter(Boolean);
      }

      return [...new Set(inputs)];
    };

    const toast = (msg) => {
      let t = document.getElementById(TOAST_ID);
      if (!t) {
        t = document.createElement('div');
        t.id = TOAST_ID;
        t.style.cssText = `
          position: fixed;
          right: 16px;
          bottom: 64px;
          z-index: 2147483647;
          background: rgba(0,0,0,.82);
          color: #fff;
          padding: 10px 12px;
          border-radius: 10px;
          font: 13px Arial, sans-serif;
          max-width: 320px;
        `;
        (document.body || document.documentElement).appendChild(t);
      }
      t.textContent = msg;
      t.style.display = 'block';
      clearTimeout(window.__similCpfToastTimer);
      window.__similCpfToastTimer = setTimeout(() => {
        t.style.display = 'none';
      }, 2200);
    };

    const fillAllCpfs = () => {
      const cpfRaw = prompt('Cole o CPF (qualquer formato):');
      if (!cpfRaw) return;

      const cpf = cpfRaw.replace(/\D/g, '');
      if (cpf.length !== 11) {
        toast('CPF inválido.');
        return;
      }

      const inputs = findCpfInputsVisible();
      if (!inputs.length) {
        toast('Nenhum campo CPF visível encontrado.');
        return;
      }

      inputs.forEach(el => {
        el.focus();
        el.value = cpf;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.blur();
      });

      toast(`Preenchi ${inputs.length} CPF(s).`);
    };

    const ensureButton = () => {
      if (document.getElementById(BTN_ID)) return;

      const btn = document.createElement('button');
      btn.id = BTN_ID;
      btn.type = 'button';
      btn.textContent = 'Preencher CPFs';
      btn.title = 'Atalho: Alt+V';

      btn.style.cssText = `
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 2147483647;
        padding: 10px 12px;
        border: 0;
        border-radius: 10px;
        background: #1f6feb;
        color: #fff;
        font: 600 13px Arial, sans-serif;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(0,0,0,.18);
      `;

      btn.addEventListener('click', fillAllCpfs);
      (document.body || document.documentElement).appendChild(btn);
    };

    if (!window.__SIMIL_CPF_INSTALLED__) {
      window.__SIMIL_CPF_INSTALLED__ = true;

      window.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === 'v' || e.key === 'V')) {
          e.preventDefault();
          fillAllCpfs();
        }
      }, true);
    }

    ensureButton();

    const obs = new MutationObserver(() => ensureButton());
    obs.observe(document.documentElement, { childList: true, subtree: true });

  } catch (err) {
    console.error('[SIMIL-CPF] erro:', err);
  }
})();