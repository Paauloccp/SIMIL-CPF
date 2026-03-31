(() => {
  try {
    const allowedPaths = [
      '/pages/laudo/construcao/cadastrarlaudo.xhtml',
      '/pages/laudo/cadastrarlaudo.xhtml'
    ];
    if (!allowedPaths.some((path) => location.href.includes(path))) return;

    const BTN_CPF_ID = 'similCpfFillBtn';
    const BTN_EVAL_FILL_ID = 'similEvalFillBtn';
    const BTN_EVAL_CLEAR_ID = 'similEvalClearBtn';
    const TOAST_ID = 'similCpfToast';

    const EVAL_TARGETS = [
      { group: 'Método', option: 'Comparativo de Dados' },
      { group: 'Precisão', option: 'Grau III' },
      { group: 'Fundamentação', option: 'Grau II' },
      { group: 'Performance', option: 'Sem Destaque' },
      { group: 'Nível de Ofertas no Segmento', option: 'Sem Destaque' },
      { group: 'Liquidez', option: 'Sem Destaque' }
    ];

    const normalizeText = (value) =>
      (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    const uniqueElements = (items) => [...new Set(items.filter(Boolean))];

    const isVisible = (el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
    };

    const escapeCss = (value) => {
      if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
      return String(value).replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
    };

    const toast = (msg) => {
      let t = document.getElementById(TOAST_ID);
      if (!t) {
        t = document.createElement('div');
        t.id = TOAST_ID;
        t.style.cssText = `
          position: fixed;
          right: 16px;
          bottom: 160px;
          z-index: 2147483647;
          background: rgba(0,0,0,.82);
          color: #fff;
          padding: 10px 12px;
          border-radius: 10px;
          font: 13px Arial, sans-serif;
          max-width: 360px;
          box-shadow: 0 8px 24px rgba(0,0,0,.18);
        `;
        (document.body || document.documentElement).appendChild(t);
      }
      t.textContent = msg;
      t.style.display = 'block';
      clearTimeout(window.__similCpfToastTimer);
      window.__similCpfToastTimer = setTimeout(() => {
        t.style.display = 'none';
      }, 2600);
    };

    const clickLikeUser = (el) => {
      if (!el) return;
      try {
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        el.click();
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      } catch (_) { }
    };

    const dispatchValueEvents = (el) => {
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
    };

    const findCpfInputsVisible = () => {
      let inputs = [...document.querySelectorAll('input[type="text"], input:not([type])')]
        .filter(i => /cpf/i.test(i.id || '') || /cpf/i.test(i.name || ''))
        .filter(isVisible)
        .filter(i => !i.disabled && !i.readOnly);

      if (!inputs.length) {
        const labels = [...document.querySelectorAll('label, span, div')]
          .filter(n => normalizeText(n.textContent) === normalizeText('CPF:'));

        inputs = labels.map(lab => {
          const row = lab.closest('div')?.parentElement || lab.parentElement;
          const el = row?.querySelector('input[type="text"], input:not([type])');
          return el && isVisible(el) && !el.disabled && !el.readOnly ? el : null;
        }).filter(Boolean);
      }

      return uniqueElements(inputs);
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
        dispatchValueEvents(el);
      });

      toast(`Preenchi ${inputs.length} CPF(s).`);
    };

    const getSpecPanel = () => document.getElementById('formCadastro-tab-especificacao');

    const isSpecPanelVisible = () => {
      const panel = getSpecPanel();
      if (!panel) return false;
      if (panel.classList.contains('ui-helper-hidden')) return false;
      return isVisible(panel);
    };

    const getTextCandidates = (root, text, selector = 'label, span, div, td, th, strong, b, h1, h2, h3, h4, h5, h6, p') => {
      const expected = normalizeText(text);
      return [...root.querySelectorAll(selector)]
        .filter(el => normalizeText(el.textContent) === expected);
    };

    const getRadioForLabelLike = (labelLike, scope) => {
      if (!labelLike) return null;

      const owningLabel = labelLike.closest('label');
      if (owningLabel?.htmlFor) {
        const target = document.getElementById(owningLabel.htmlFor)
          || scope.querySelector(`#${escapeCss(owningLabel.htmlFor)}`);
        if (target?.matches?.('input[type="radio"]')) return target;
      }

      if (labelLike.matches?.('label[for]')) {
        const target = document.getElementById(labelLike.htmlFor)
          || scope.querySelector(`#${escapeCss(labelLike.htmlFor)}`);
        if (target?.matches?.('input[type="radio"]')) return target;
      }

      let radio = owningLabel?.querySelector('input[type="radio"]')
        || labelLike.querySelector?.('input[type="radio"]');
      if (radio) return radio;

      if (labelLike.previousElementSibling?.matches?.('input[type="radio"]')) return labelLike.previousElementSibling;
      if (labelLike.nextElementSibling?.matches?.('input[type="radio"]')) return labelLike.nextElementSibling;

      radio = labelLike.parentElement?.querySelector?.('input[type="radio"]');
      if (radio) return radio;

      const wrapper = labelLike.closest('tr, td, li, div');
      radio = wrapper?.querySelector?.('input[type="radio"]');
      if (radio) return radio;

      return null;
    };

    const activateRadio = (radio, clickTarget) => {
      if (!radio || radio.disabled) return false;

      try {
        radio.focus();
      } catch (_) { }

      if (!radio.checked) {
        clickLikeUser(clickTarget || radio);
      }

      if (!radio.checked) {
        radio.checked = true;
        radio.dispatchEvent(new Event('input', { bubbles: true }));
        radio.dispatchEvent(new Event('change', { bubbles: true }));
      }

      try {
        radio.blur();
      } catch (_) { }

      return !!radio.checked;
    };

    const findGroupContainers = (root, groupTitle, desiredOption) => {
      const titles = getTextCandidates(root, groupTitle);
      const results = [];

      titles.forEach(titleEl => {
        let current = titleEl;
        for (let level = 0; level < 8 && current && current !== root; level += 1) {
          current = current.parentElement;
          if (!current) break;

          const radios = current.querySelectorAll('input[type="radio"]');
          if (!radios.length) continue;

          const options = getTextCandidates(current, desiredOption, 'label, span, div, td');
          if (!options.length) continue;

          results.push(current);
          break;
        }
      });

      return uniqueElements(results);
    };

    const selectOptionInContainer = (container, optionText) => {
      if (!container) return false;

      const labelCandidates = getTextCandidates(container, optionText, 'label');
      for (const label of labelCandidates) {
        const radio = getRadioForLabelLike(label, container);
        if (activateRadio(radio, label)) return true;
      }

      const genericCandidates = getTextCandidates(container, optionText, 'span, div, td');
      for (const el of genericCandidates) {
        const radio = getRadioForLabelLike(el, container);
        if (activateRadio(radio, el)) return true;
      }

      return false;
    };

    const clearGroupContainer = (container) => {
      if (!container) return 0;
      const radios = [...container.querySelectorAll('input[type="radio"]')].filter(r => !r.disabled);
      let changed = 0;

      radios.forEach(radio => {
        if (!radio.checked) return;
        radio.checked = false;
        radio.dispatchEvent(new Event('input', { bubbles: true }));
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        changed += 1;
      });

      return changed;
    };

    const fillEvaluationSpec = ({ silent = false } = {}) => {
      const root = getSpecPanel() || document;
      let groupsFilled = 0;
      const misses = [];

      EVAL_TARGETS.forEach(({ group, option }) => {
        const containers = findGroupContainers(root, group, option);
        if (!containers.length) {
          misses.push(group);
          return;
        }

        containers.forEach(container => {
          if (selectOptionInContainer(container, option)) {
            groupsFilled += 1;
          } else {
            misses.push(`${group} → ${option}`);
          }
        });
      });

      if (!silent) {
        if (groupsFilled) {
          const missText = misses.length ? ` Falhas: ${misses.length}.` : '';
          toast(`Avaliação preenchida em ${groupsFilled} grupo(s).${missText}`);
        } else {
          toast('Não encontrei os grupos da aba Espec. da Avaliação.');
        }
      }

      return { groupsFilled, misses };
    };

    const clearEvaluationSpec = () => {
      const root = getSpecPanel() || document;
      let groupsFound = 0;
      let radiosCleared = 0;

      EVAL_TARGETS.forEach(({ group, option }) => {
        const containers = findGroupContainers(root, group, option);
        containers.forEach(container => {
          groupsFound += 1;
          radiosCleared += clearGroupContainer(container);
        });
      });

      if (groupsFound) {
        toast(`Limpei ${radiosCleared} marcação(ões) em ${groupsFound} grupo(s).`);
      } else {
        toast('Não encontrei grupos para limpar na aba Espec. da Avaliação.');
      }
    };

    const ensureButton = ({ id, text, title, bottom, right, onClick, background }) => {
      if (document.getElementById(id)) return;

      const btn = document.createElement('button');
      btn.id = id;
      btn.type = 'button';
      btn.textContent = text;
      btn.title = title || '';
      btn.style.cssText = `
        position: fixed;
        right: ${right}px;
        bottom: ${bottom}px;
        z-index: 2147483647;
        padding: 10px 12px;
        border: 0;
        border-radius: 10px;
        background: ${background};
        color: #fff;
        font: 600 13px Arial, sans-serif;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(0,0,0,.18);
      `;

      btn.addEventListener('click', onClick);
      (document.body || document.documentElement).appendChild(btn);
    };

    const SHOW_CLEAR_EVAL_BUTTON = false;
    const ensureButtons = () => {
      ensureButton({
        id: BTN_CPF_ID,
        text: 'Preencher CPFs',
        title: 'Atalho: Alt+V',
        bottom: 16,
        right: 16,
        onClick: fillAllCpfs,
        background: '#1f6feb'
      });

      ensureButton({
        id: BTN_EVAL_FILL_ID,
        text: 'Preencher Espec.',
        title: 'Preenche a aba Espec. da Avaliação',
        bottom: 112,
        right: 16,
        onClick: () => {
          window.__SIMIL_EVAL_AUTO_DONE__ = true;
          fillEvaluationSpec();
        },
        background: '#198754'
      });

      if (SHOW_CLEAR_EVAL_BUTTON) {
        ensureButton({
          id: BTN_EVAL_CLEAR_ID,
          text: 'Limpar Espec.',
          title: 'Limpa os radios da aba Espec. da Avaliação',
          bottom: 112,
          right: 160,
          onClick: clearEvaluationSpec,
          background: '#dc3545'
        });
      } else {
        document.getElementById(BTN_EVAL_CLEAR_ID)?.remove();
      }
    };

    const autoFillEvaluationWhenTabAppears = () => {
      if (window.__SIMIL_EVAL_AUTO_DONE__) return;
      if (!isSpecPanelVisible()) return;

      const result = fillEvaluationSpec({ silent: true });
      if (result.groupsFilled > 0) {
        window.__SIMIL_EVAL_AUTO_DONE__ = true;
        toast(`Espec. da Avaliação preenchida automaticamente (${result.groupsFilled} grupo(s)).`);
      }
    };

    if (!window.__SIMIL_UTILS_INSTALLED__) {
      window.__SIMIL_UTILS_INSTALLED__ = true;

      window.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === 'v' || e.key === 'V')) {
          e.preventDefault();
          fillAllCpfs();
        }
      }, true);
    }

    ensureButtons();
    autoFillEvaluationWhenTabAppears();

    const obs = new MutationObserver(() => {
      ensureButtons();
      autoFillEvaluationWhenTabAppears();
    });

    obs.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'aria-hidden']
    });
  } catch (err) {
    console.error('[SIMIL-UTIL] erro:', err);
  }
})();