(() => {
  try {
    const allowedPaths = [
      '/pages/laudo/construcao/cadastrarlaudo.xhtml',
      '/pages/laudo/cadastrarlaudo.xhtml'
    ];
    if (!allowedPaths.some((path) => location.href.includes(path))) return;

    const BTN_CPF_ID = 'similCpfFillBtn';
    const BTN_DOC_REPLICATE_ID = 'similDocReplicateBtn';
    const BTN_INTERNAL_DIVISION_ZERO_ID = 'similInternalDivisionZeroBtn';
    const BTN_AREA_ZERO_ID = 'similAreaZeroBtn';
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

    const DOC_FIELD_GROUPS = [
      {
        key: 'art',
        name: 'ART',
        aliases: ['ART', 'ART/RRT'],
        attrTokens: ['art', 'artrrt']
      },
      {
        key: 'responsavel',
        name: 'Respons. tec.',
        aliases: ['Respons. tec', 'Respons. técnico', 'Respons tecnico', 'Responsável tec', 'Responsável técnico', 'Responsavel tecnico'],
        attrTokens: ['responstec', 'responstecnico', 'resptecnico', 'responsaveltec', 'responsaveltecnico']
      },
      {
        key: 'cpf',
        name: 'CPF',
        aliases: ['CPF'],
        attrTokens: ['cpf']
      },
      {
        key: 'entidade',
        name: 'Entidade',
        aliases: ['Entidade'],
        attrTokens: ['entidade']
      },
      {
        key: 'registro',
        name: 'Número de Registro',
        aliases: ['Número de Registro', 'Numero de Registro', 'Número do Registro', 'Numero do Registro', 'Número Registro', 'Numero Registro', 'Nº de Registro', 'N° de Registro'],
        attrTokens: ['numeroregistro', 'numregistro', 'nroregistro']
      }
    ];

    const DOC_PROJECT_TARGETS = [
      { name: 'Projeto Arquitetônico', aliases: ['Projeto Arquitetônico', 'Projeto Arquitetonico'] },
      { name: 'Projeto Estrutural', aliases: ['Projeto Estrutural'] },
      { name: 'Projeto Elétrico', aliases: ['Projeto Elétrico', 'Projeto Eletrico'] },
      { name: 'Projeto Hidrossanitário', aliases: ['Projeto Hidrossanitário', 'Projeto Hidrossanitario'] },
      { name: 'Projeto de Impermeabilização', aliases: ['Projeto de Impermeabilização', 'Projeto de Impermeabilizacao'] }
    ];

    const DOC_PROJECT_EXCLUDED_ALIASES = [
      'Outros Projetos, Vide inform. complementares',
      'Outros Projetos Vide inform complementares',
      'Outros Projetos'
    ];

    const VALUE_FIELD_SELECTOR = 'input:not([type]), input[type="text"], input[type="search"], input[type="tel"], input[type="number"], textarea, select';
    const PROJECT_TITLE_SELECTOR = 'label, span, div, td, th, strong, b, legend';

    const normalizeText = (value) =>
      (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    const normalizeFieldLabel = (value) =>
      normalizeText(value)
        .replace(/n[º°]/g, 'numero')
        .replace(/[.:;*]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const normalizeAttr = (value) =>
      normalizeText(value)
        .replace(/n[º°]/g, 'numero')
        .replace(/[^a-z0-9]/g, '');

    const uniqueElements = (items) => [...new Set(items.filter(Boolean))];

    const sortByDocumentOrder = (items) =>
      [...items].sort((a, b) => {
        if (a === b) return 0;
        return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });

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
          bottom: 308px;
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

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const isValueField = (el) => {
      if (!el?.matches?.(VALUE_FIELD_SELECTOR)) return false;
      const type = normalizeText(el.type || '');
      return !['hidden', 'radio', 'checkbox', 'button', 'submit', 'reset'].includes(type);
    };

    const fieldValue = (el) => String(el?.value || '').trim();

    const labelMatches = (value, aliases) => {
      const text = normalizeFieldLabel(value);
      if (!text) return false;

      return aliases.some((alias) => {
        const expected = normalizeFieldLabel(alias);
        return text === expected || (text.startsWith(`${expected} `) && text.length <= expected.length + 12);
      });
    };

    const getLabelCandidates = (root, aliases, selector = 'label, span, div, td, th') =>
      [...root.querySelectorAll(selector)]
        .filter(isVisible)
        .filter((el) => labelMatches(el.textContent, aliases));

    const getValueFields = (container) =>
      container ? [...container.querySelectorAll(VALUE_FIELD_SELECTOR)].filter(isValueField).filter(isVisible) : [];

    const pickFieldAfterLabel = (labelLike, fields) =>
      fields.find((field) => labelLike.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING)
      || fields[0]
      || null;

    const fieldFromForAttribute = (labelLike, scope) => {
      const labelWithFor = labelLike.matches?.('label[for]')
        ? labelLike
        : labelLike.closest?.('label[for]');

      if (!labelWithFor?.htmlFor) return null;

      const target = document.getElementById(labelWithFor.htmlFor)
        || scope.querySelector(`#${escapeCss(labelWithFor.htmlFor)}`);

      return isValueField(target) && isVisible(target) ? target : null;
    };

    const getValueFieldForLabelLike = (labelLike, scope) => {
      if (!labelLike) return null;

      const directTarget = fieldFromForAttribute(labelLike, scope);
      if (directTarget) return directTarget;

      if (isValueField(labelLike) && isVisible(labelLike)) return labelLike;

      const directField = getValueFields(labelLike)[0];
      if (directField) return directField;

      const cell = labelLike.closest?.('td, th, .ui-panelgrid-cell');
      const nextCell = cell?.nextElementSibling;
      const nextCellField = getValueFields(nextCell)[0];
      if (nextCellField) return nextCellField;

      const row = labelLike.closest?.('tr');
      const rowField = pickFieldAfterLabel(labelLike, getValueFields(row));
      if (rowField) return rowField;

      let current = labelLike.parentElement;
      for (let level = 0; level < 6 && current && current !== scope; level += 1) {
        const field = pickFieldAfterLabel(labelLike, getValueFields(current));
        if (field) return field;
        current = current.parentElement;
      }

      return null;
    };

    const findFieldsByAttributes = (root, tokens) =>
      [...root.querySelectorAll(VALUE_FIELD_SELECTOR)]
        .filter(isValueField)
        .filter(isVisible)
        .filter((field) => {
          const attr = normalizeAttr(`${field.id || ''} ${field.name || ''} ${field.getAttribute('aria-label') || ''} ${field.title || ''}`);
          return tokens.some((token) => attr.includes(normalizeAttr(token)));
        });

    const findDocFields = (root, group) => {
      const byLabel = getLabelCandidates(root, group.aliases)
        .map((label) => getValueFieldForLabelLike(label, root));
      const labelFields = sortByDocumentOrder(uniqueElements(byLabel));
      if (labelFields.length) return labelFields;

      return sortByDocumentOrder(uniqueElements(findFieldsByAttributes(root, group.attrTokens)));
    };

    const getProjectTitleCandidates = (root) => {
      const includedAliases = DOC_PROJECT_TARGETS.flatMap((project) => project.aliases);
      const candidates = [
        ...getLabelCandidates(root, includedAliases, PROJECT_TITLE_SELECTOR).map((el) => ({ el, excluded: false })),
        ...getLabelCandidates(root, DOC_PROJECT_EXCLUDED_ALIASES, PROJECT_TITLE_SELECTOR).map((el) => ({ el, excluded: true }))
      ];

      return sortByDocumentOrder(uniqueElements(candidates.map((candidate) => candidate.el)))
        .map((el) => candidates.find((candidate) => candidate.el === el));
    };

    const getProjectTitleBefore = (field, root) => {
      const titles = getProjectTitleCandidates(root)
        .filter(({ el }) => el.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING);

      return titles[titles.length - 1] || null;
    };

    const getDocFieldsForReplication = (root, group) => {
      const fields = findDocFields(root, group)
        .filter((field) => !getProjectTitleBefore(field, root)?.excluded);

      const maxFields = DOC_PROJECT_TARGETS.length + 1;
      return fields.length > maxFields ? fields.slice(0, maxFields) : fields;
    };

    const getDocFinalizationRoot = () => {
      const idCandidates = [
        'formCadastro-tab-finalizacao',
        'formCadastro-tab-docFinalizacao',
        'formCadastro-tab-docfinalizacao',
        'formCadastro-tab-documentacao',
        'formCadastro-tab-docs'
      ];

      for (const id of idCandidates) {
        const panel = document.getElementById(id);
        if (panel && isVisible(panel) && !panel.classList.contains('ui-helper-hidden')) return panel;
      }

      const docPanelCandidates = [...document.querySelectorAll('fieldset, table, tbody, div, form')]
        .filter(isVisible)
        .filter((el) => {
          const text = normalizeFieldLabel(el.textContent);
          return text.includes(normalizeFieldLabel('ART/RRT/TRT de Execução'))
            && text.includes(normalizeFieldLabel('Projetos Apresentados'));
        })
        .sort((a, b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length);

      return docPanelCandidates[0] || document;
    };

    const positiveRadioScore = (radio) => {
      const radioId = radio.id || '';
      const labelByFor = radioId
        ? [...document.querySelectorAll('label[for]')].find((label) => label.htmlFor === radioId)
        : null;
      const parentText = normalizeFieldLabel(radio.parentElement?.textContent);
      const labelText = [
        radio.value,
        radio.getAttribute('aria-label'),
        radio.title,
        labelByFor?.textContent,
        radio.closest('label')?.textContent,
        radio.nextElementSibling?.textContent,
        parentText.length <= 24 ? parentText : ''
      ].map(normalizeFieldLabel).join(' ');

      if (/\b(sim|s|yes|true|1)\b/.test(labelText)) return 2;
      if (/\b(nao|n|no|false|0)\b/.test(labelText)) return -2;
      return 0;
    };

    const pickEnablingRadio = (radios) => {
      const enabledRadios = radios.filter((radio) => !radio.disabled);
      if (!enabledRadios.length) return null;
      return enabledRadios.find((radio) => positiveRadioScore(radio) > 0)
        || enabledRadios.find((radio) => positiveRadioScore(radio) >= 0)
        || enabledRadios[0];
    };

    const findRadioNearField = (field, scope) => {
      let current = field?.parentElement;
      for (let level = 0; level < 7 && current && current !== scope; level += 1) {
        const radios = [...current.querySelectorAll('input[type="radio"]')];
        const radio = pickEnablingRadio(radios);
        if (radio) return radio;
        current = current.parentElement;
      }

      const row = field?.closest?.('tr');
      return pickEnablingRadio(row ? [...row.querySelectorAll('input[type="radio"]')] : []);
    };

    const formatValueForGroup = (group, value) => {
      if (group.key !== 'cpf') return value;
      const digits = value.replace(/\D/g, '');
      return digits.length === 11 ? digits : value;
    };

    const setValueField = (field, value) => {
      if (!field || field.disabled || field.readOnly) return false;
      if (field.value === value) return false;

      field.focus();
      field.value = value;
      dispatchValueEvents(field);
      return true;
    };

    const getInternalDivisionRoot = () => {
      const legend = [...document.querySelectorAll('legend, fieldset > div, fieldset > span, strong, b')]
        .filter(isVisible)
        .find((el) => normalizeFieldLabel(el.textContent) === normalizeFieldLabel('Divisão Interna'));

      const fieldset = legend?.closest?.('fieldset');
      if (fieldset) return fieldset;

      const candidates = [...document.querySelectorAll('fieldset, div, table, form')]
        .filter(isVisible)
        .filter((el) => normalizeFieldLabel(el.textContent).includes(normalizeFieldLabel('Divisão Interna')))
        .sort((a, b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length);

      return candidates[0] || null;
    };

    const fillEmptyInternalDivisionWithZero = () => {
      const root = getInternalDivisionRoot();
      if (!root) {
        toast('Não encontrei o quadro Divisão Interna.');
        return;
      }

      const fields = [...root.querySelectorAll('input:not([type]), input[type="text"], input[type="tel"], input[type="number"]')]
        .filter(isVisible)
        .filter((field) => !field.disabled && !field.readOnly);

      let filled = 0;
      fields.forEach((field) => {
        if (/\d/.test(fieldValue(field))) return;
        if (setValueField(field, '0')) filled += 1;
      });

      if (filled) {
        toast(`Preenchi ${filled} campo(s) vazio(s) da Divisão Interna com 0.`);
      } else {
        toast('Todos os campos da Divisão Interna já têm número.');
      }
    };

    const getConstructionAreasRoot = () => {
      const legend = [...document.querySelectorAll('legend, fieldset > div, fieldset > span, strong, b')]
        .filter(isVisible)
        .find((el) => normalizeFieldLabel(el.textContent) === normalizeFieldLabel('Áreas de Construção'));

      const fieldset = legend?.closest?.('fieldset');
      if (fieldset) return fieldset;

      const candidates = [...document.querySelectorAll('fieldset, div, table, form')]
        .filter(isVisible)
        .filter((el) => normalizeFieldLabel(el.textContent).includes(normalizeFieldLabel('Áreas de Construção')))
        .sort((a, b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length);

      return candidates[0] || null;
    };

    const fillEmptyConstructionAreasWithZero = () => {
      const root = getConstructionAreasRoot();
      if (!root) {
        toast('Não encontrei o quadro Áreas de Construção.');
        return;
      }

      const fields = [...root.querySelectorAll('input:not([type]), input[type="text"], input[type="tel"], input[type="number"]')]
        .filter(isVisible)
        .filter((field) => !field.disabled && !field.readOnly);

      let filled = 0;
      fields.forEach((field) => {
        if (/\d/.test(fieldValue(field))) return;
        if (setValueField(field, '0,00')) filled += 1;
      });

      if (filled) {
        toast(`Preenchi ${filled} campo(s) vazio(s) de Áreas de Construção com 0,00.`);
      } else {
        toast('Todos os campos de Áreas de Construção já têm número.');
      }
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

    const getRadiosNearProjectTitle = (title, root) => {
      const directRadio = getRadioForLabelLike(title, root);
      if (directRadio) return [directRadio];

      let current = title.parentElement;
      for (let level = 0; level < 5 && current && current !== root; level += 1) {
        const radios = [...current.querySelectorAll('input[type="radio"]')];
        if (radios.length && radios.length <= 4) return radios;
        current = current.parentElement;
      }

      return [];
    };

    const findProjectRadio = (root, project) => {
      const titles = getLabelCandidates(root, project.aliases, PROJECT_TITLE_SELECTOR);

      for (const title of titles) {
        const radio = pickEnablingRadio(getRadiosNearProjectTitle(title, root));
        if (radio) return { radio, clickTarget: title };
      }

      return null;
    };

    const activateProjectDocRadios = async () => {
      const touched = new Set();
      let activated = 0;

      for (const project of DOC_PROJECT_TARGETS) {
        const currentRoot = getDocFinalizationRoot();
        const match = findProjectRadio(currentRoot, project);
        const radio = match?.radio;

        if (!radio || touched.has(radio) || radio.disabled) continue;

        const wasChecked = radio.checked;
        touched.add(radio);
        if (activateRadio(radio, match.clickTarget)) {
          if (!wasChecked) activated += 1;
          await delay(wasChecked ? 100 : 650);
        }
      }

      for (const group of DOC_FIELD_GROUPS) {
        const currentRoot = getDocFinalizationRoot();
        for (const field of getDocFieldsForReplication(currentRoot, group)) {
          if (!field.disabled && !field.readOnly) continue;

          const radio = findRadioNearField(field, currentRoot);
          if (!radio || touched.has(radio) || radio.disabled) continue;

          touched.add(radio);
          const wasChecked = radio.checked;
          if (activateRadio(radio, radio)) {
            if (!wasChecked) activated += 1;
            await delay(wasChecked ? 100 : 650);
          }
        }
      }

      return activated;
    };

    const fillDocFinalizationFromFirstValues = (root) => {
      const missing = [];
      let fieldsFilled = 0;
      let groupsFilled = 0;
      let lockedFields = 0;
      let targetFields = 0;
      let filledTargets = 0;
      let emptyTargets = 0;

      DOC_FIELD_GROUPS.forEach((group) => {
        const fields = getDocFieldsForReplication(root, group);
        if (fields.length < 2) {
          missing.push(group.name);
          return;
        }

        const sourceIndex = fields.findIndex((field) => fieldValue(field));
        if (sourceIndex < 0) {
          missing.push(`${group.name} sem valor`);
          return;
        }

        const value = formatValueForGroup(group, fieldValue(fields[sourceIndex]));
        let filledInGroup = 0;

        fields.slice(sourceIndex + 1).forEach((field) => {
          targetFields += 1;

          if (field.disabled || field.readOnly) {
            lockedFields += 1;
            return;
          }

          if (setValueField(field, value)) {
            fieldsFilled += 1;
            filledInGroup += 1;
          }

          if (fieldValue(field)) {
            filledTargets += 1;
          } else {
            emptyTargets += 1;
          }
        });

        if (filledInGroup) groupsFilled += 1;
      });

      return { fieldsFilled, groupsFilled, lockedFields, targetFields, filledTargets, emptyTargets, missing };
    };

    const replicateDocFinalization = async () => {
      if (window.__SIMIL_DOC_REPLICATING__) return;
      window.__SIMIL_DOC_REPLICATING__ = true;

      try {
        const radiosActivated = await activateProjectDocRadios();
        let totalFieldsFilled = 0;
        let finalResult = null;

        for (let attempt = 0; attempt < 7; attempt += 1) {
          if (attempt > 0) await delay(350);

          finalResult = fillDocFinalizationFromFirstValues(getDocFinalizationRoot());
          totalFieldsFilled += finalResult.fieldsFilled;

          if (finalResult.targetFields && !finalResult.lockedFields && !finalResult.emptyTargets) break;
        }

        if (finalResult?.filledTargets) {
          const radioText = radiosActivated ? ` Rádios ativados: ${radiosActivated}.` : '';
          const changedText = totalFieldsFilled ? ` Atualizados: ${totalFieldsFilled}.` : '';
          const lockedText = finalResult.lockedFields ? ` ${finalResult.lockedFields} campo(s) ainda bloqueado(s).` : '';
          toast(`Doc./Finalização replicada (${finalResult.filledTargets}/${finalResult.targetFields}).${changedText}${radioText}${lockedText}`);
          return;
        }

        if (radiosActivated) {
          toast(`Ativei ${radiosActivated} rádio(s), mas não encontrei valores para replicar.`);
          return;
        }

        toast('Não encontrei dados preenchidos na aba Doc./Finalização.');
      } finally {
        window.__SIMIL_DOC_REPLICATING__ = false;
      }
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
        id: BTN_DOC_REPLICATE_ID,
        text: 'Replicar Doc.',
        title: 'Atalho: Alt+D',
        bottom: 160,
        right: 16,
        onClick: replicateDocFinalization,
        background: '#6f42c1'
      });

      ensureButton({
        id: BTN_INTERNAL_DIVISION_ZERO_ID,
        text: 'Zerar Divisão',
        title: 'Atalho: Alt+Z',
        bottom: 208,
        right: 16,
        onClick: fillEmptyInternalDivisionWithZero,
        background: '#0d9488'
      });

      ensureButton({
        id: BTN_AREA_ZERO_ID,
        text: 'Zerar Áreas',
        title: 'Atalho: Alt+A',
        bottom: 256,
        right: 16,
        onClick: fillEmptyConstructionAreasWithZero,
        background: '#475569'
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

        if (e.altKey && (e.key === 'd' || e.key === 'D')) {
          e.preventDefault();
          replicateDocFinalization();
        }

        if (e.altKey && (e.key === 'z' || e.key === 'Z')) {
          e.preventDefault();
          fillEmptyInternalDivisionWithZero();
        }

        if (e.altKey && (e.key === 'a' || e.key === 'A')) {
          e.preventDefault();
          fillEmptyConstructionAreasWithZero();
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
