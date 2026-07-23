export function getWebviewScript(): string {
  return /* js */ `
    const vscode = acquireVsCodeApi();

    let i18n = {};
    let templates = [];
    let themesMap = {};
    let selectedTemplate = null;
    let selectedTheme = null;
    let existingShare = null;
    let hasToken = false;
    let resultUrl = '';
    let currentLocale = 'en';

    const $ = (id) => document.getElementById(id);

    function updateLangSwitch() {
      const zh = $('langZh');
      const en = $('langEn');
      const group = $('langSwitch');
      if (!zh || !en) return;
      zh.textContent = i18n.langZh || '中文';
      en.textContent = i18n.langEn || 'EN';
      zh.classList.toggle('active', currentLocale === 'zh');
      en.classList.toggle('active', currentLocale === 'en');
      if (group) group.setAttribute('aria-label', i18n.langAria || 'Language');
    }

    function showView(name) {
      document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
      const el = $('view-' + name);
      if (el) el.classList.remove('hidden');
    }

    function setWelcomeVisible(visible) {
      const overlay = $('welcomeOverlay');
      if (!overlay) return;
      overlay.classList.toggle('hidden', !visible);
    }

    function renderWelcome() {
      $('welcomeTitle').textContent = i18n.welcomeTitle || '';
      const steps = $('welcomeSteps');
      steps.innerHTML = '';
      [i18n.welcomeStep1, i18n.welcomeStep2, i18n.welcomeStep3].forEach((text) => {
        if (!text) return;
        const li = document.createElement('li');
        li.textContent = text;
        steps.appendChild(li);
      });
      $('welcomeToken').textContent = i18n.welcomeToken || '';
      $('welcomeDismiss').textContent = i18n.welcomeDismiss || 'OK';
    }

    function updateTokenBar() {
      const icon = $('tokenStatusIcon');
      const text = $('tokenStatusText');
      const clearBtn = $('tokenClearBtn');
      const setBtn = $('tokenSetBtn');
      const getBtn = $('tokenGetBtn');
      const badge = $('modeBadge');

      if (hasToken) {
        icon.textContent = '🔑';
        text.textContent = i18n.tokenBarToken || '';
        clearBtn.classList.remove('hidden');
        setBtn.textContent = i18n.tokenSet || 'Set Token';
        badge.textContent = i18n.modeToken || 'Token';
        badge.className = 'mode-badge token';
      } else {
        icon.textContent = '👤';
        text.textContent = i18n.tokenBarGuest || '';
        clearBtn.classList.add('hidden');
        setBtn.textContent = i18n.tokenSet || 'Set Token';
        badge.textContent = i18n.modeGuest || 'Guest';
        badge.className = 'mode-badge guest';
      }

      getBtn.textContent = i18n.tokenGet || 'Get Token';
      clearBtn.textContent = i18n.tokenClear || 'Clear';
    }

    function renderTemplates() {
      const grid = $('templateGrid');
      grid.innerHTML = '';
      templates.forEach(tmpl => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'template-card' + (selectedTemplate === tmpl.id ? ' selected' : '');
        card.dataset.id = tmpl.id;
        card.textContent = tmpl.name;

        card.addEventListener('click', () => {
          selectedTemplate = tmpl.id;
          selectedTheme = null;
          renderTemplates();
          renderThemes();
          updateShareBtn();
        });

        grid.appendChild(card);
      });
    }

    function renderThemes() {
      const section = $('themeSection');
      const list = $('themeList');
      const themes = themesMap[selectedTemplate] || [];

      if (themes.length === 0) {
        section.classList.add('hidden');
        selectedTheme = null;
        return;
      }

      section.classList.remove('hidden');
      list.innerHTML = '';

      if (!selectedTheme) {
        selectedTheme = themes[0].id;
      }

      themes.forEach(theme => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'theme-chip' + (selectedTheme === theme.id ? ' selected' : '');
        chip.textContent = theme.name;
        chip.addEventListener('click', () => {
          selectedTheme = theme.id;
          renderThemes();
        });
        list.appendChild(chip);
      });
    }

    function updateShareBtn() {
      const btn = $('shareBtn');
      const isUpdate = !!(existingShare);
      btn.textContent = isUpdate ? (i18n.updateShare || i18n.publish) : (i18n.publish || 'Share');
      btn.disabled = !selectedTemplate;
    }

    function renderExisting() {
      const banner = $('existingBanner');
      if (existingShare) {
        banner.classList.remove('hidden');
        $('existingText').textContent = i18n.alreadyShared || 'Already shared';
        const link = $('existingLink');
        link.textContent = existingShare.url;
        link.href = existingShare.url;
        link.onclick = (e) => {
          e.preventDefault();
          vscode.postMessage({ type: 'open', url: existingShare.url });
        };
      } else {
        banner.classList.add('hidden');
      }
    }

    function applyI18n() {
      $('labelTemplate').textContent = i18n.template || 'Template';
      $('hintTemplate').textContent = i18n.templateHint || '';
      $('labelTheme').textContent = i18n.themeLabel || i18n.theme || 'Theme';
      $('publishingText').textContent = i18n.publishing || 'Sharing...';
      $('copyBtn').textContent = i18n.resultCopy || 'Copy';
      $('openBtn').textContent = i18n.resultOpen || 'Open';
      $('retryBtn').textContent = i18n.retry || 'Retry';
      $('errorTitle').textContent = i18n.errorTitle || 'Error';
      $('tipBar').textContent = i18n.tip || '';
      $('resultTip').textContent = i18n.resultTip || '';
      updateShareBtn();
      updateTokenBar();
      updateLangSwitch();
      renderWelcome();
    }

    // Event listeners
    $('shareBtn').addEventListener('click', () => {
      if (!selectedTemplate) return;
      vscode.postMessage({
        type: 'share',
        templateId: selectedTemplate,
        theme: selectedTheme || undefined,
      });
    });

    $('copyBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'copy', text: resultUrl });
      $('copyBtn').textContent = i18n.resultCopied || 'Copied!';
      setTimeout(() => {
        $('copyBtn').textContent = i18n.resultCopy || 'Copy';
      }, 2000);
    });

    $('openBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'open', url: resultUrl });
    });

    $('retryBtn').addEventListener('click', () => {
      showView('select');
    });

    $('tokenSetBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'setToken' });
    });

    $('tokenClearBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'clearToken' });
    });

    $('tokenGetBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'openTokenSettings' });
    });

    $('welcomeDismiss').addEventListener('click', () => {
      setWelcomeVisible(false);
      vscode.postMessage({ type: 'dismissWelcome' });
    });

    function onLangClick(locale) {
      if (locale === currentLocale) return;
      vscode.postMessage({ type: 'setLocale', locale: locale });
    }
    $('langZh').addEventListener('click', () => onLangClick('zh'));
    $('langEn').addEventListener('click', () => onLangClick('en'));

    // Message handler
    window.addEventListener('message', (event) => {
      const msg = event.data;
      switch (msg.type) {
        case 'init':
          i18n = msg.i18n || {};
          templates = msg.templates || [];
          themesMap = msg.themesMap || {};
          existingShare = msg.existingShare || null;
          hasToken = !!msg.hasToken;
          currentLocale = msg.locale === 'zh' ? 'zh' : 'en';
          // Keep selection when only language changes
          if (!selectedTemplate) {
            selectedTemplate = existingShare ? existingShare.templateId : (templates[0] ? templates[0].id : null);
            selectedTheme = null;
          } else if (existingShare && !templates.some(t => t.id === selectedTemplate)) {
            selectedTemplate = existingShare.templateId;
            selectedTheme = null;
          }

          $('fileName').textContent = msg.fileName || '';
          $('fileMeta').textContent = (msg.wordCount || 0) + ' ' + (i18n.words || 'words');

          applyI18n();
          renderTemplates();
          renderThemes();
          renderExisting();
          updateShareBtn();
          showView('select');
          setWelcomeVisible(!!msg.showWelcome);
          break;

        case 'tokenState':
          hasToken = !!msg.hasToken;
          updateTokenBar();
          break;

        case 'fileMeta':
          $('fileMeta').textContent = (msg.wordCount || 0) + ' ' + (i18n.words || 'words');
          break;

        case 'publishing':
          showView('publishing');
          break;

        case 'result':
          resultUrl = msg.url || '';
          $('resultUrl').value = resultUrl;
          $('resultTitle').textContent = msg.isUpdate
            ? (i18n.resultUpdated || 'Updated!')
            : (i18n.title || 'Shared!');
          const badge = $('resultBadge');
          if (msg.isTemporary) {
            badge.textContent = i18n.resultTemporary || 'Temporary (24h)';
            badge.className = 'result-badge temporary';
          } else {
            badge.textContent = i18n.resultPermanent || 'Permanent';
            badge.className = 'result-badge permanent';
          }
          showView('result');
          break;

        case 'error':
          $('errorMessage').textContent = msg.message || 'Unknown error';
          showView('error');
          break;
      }
    });
  `;
}
