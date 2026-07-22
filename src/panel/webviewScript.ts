export function getWebviewScript(): string {
  return `
(function () {
  'use strict';
  var vscode = acquireVsCodeApi();

  var PREVIEWS = {
    plain: 'linear-gradient(160deg,#f5f5f5,#dcdcdc)',
    memo: 'linear-gradient(160deg,#fff6d8,#ffd964)',
    popart: 'linear-gradient(135deg,#ff3d81,#ffd400 55%,#00e5ff)',
    traditionalchinese: 'linear-gradient(150deg,#7a1010,#c62828 60%,#e8b04b)',
    coilnotebook: 'linear-gradient(160deg,#dceeff,#7fb6f2)',
    cyberpunk: 'linear-gradient(140deg,#0b0220,#ff2a6d 60%,#05d9e8)',
    glassmorphism: 'linear-gradient(140deg,#9db4ff,#5a4fcf)',
    terminal: 'linear-gradient(160deg,#050505,#14532d)',
    bauhaus: 'linear-gradient(135deg,#e63946 34%,#f2c14e 34% 67%,#1d3557 67%)',
    newspaper: 'linear-gradient(160deg,#ffffff,#cfcfcf)',
    magazine: 'linear-gradient(140deg,#262626,#c9a227)',
    academic: 'linear-gradient(160deg,#14213d,#3a5ba0)',
    minimal: 'linear-gradient(160deg,#ffffff,#ededed)',
    elegant: 'linear-gradient(140deg,#f3ead8,#c9a227)',
    modern: 'linear-gradient(140deg,#5b7cfa,#8f6fff)',
    retro: 'linear-gradient(140deg,#f7b733,#fc4a1a)',
    nature: 'linear-gradient(160deg,#a8e063,#3f9142)',
    ocean: 'linear-gradient(160deg,#1c7293,#6dd5ed)',
    sunset: 'linear-gradient(160deg,#ff512f,#dd2476)',
    forest: 'linear-gradient(160deg,#0f3d3e,#71b280)',
    desert: 'linear-gradient(160deg,#e8d5b7,#b98a4a)',
    aurora: 'linear-gradient(140deg,#00c9ff,#92fe9d)',
    neon: 'linear-gradient(135deg,#12c2e9,#c471ed 55%,#f64f59)',
    pastel: 'linear-gradient(140deg,#fbc2eb,#a6c1ee)',
    monochrome: 'linear-gradient(140deg,#4a4a4a,#0a0a0a)',
    gradient: 'linear-gradient(135deg,#ff9a9e,#fecfef 50%,#a18cd1)',
    shadow: 'linear-gradient(160deg,#9aa5ad,#2c3e50)',
    border: 'linear-gradient(160deg,#f7f7f7,#d8d8d8)',
    card: 'linear-gradient(160deg,#e9e4dc,#ffffff)',
    timeline: 'linear-gradient(160deg,#eef1ee,#9fb8e8)',
    notion: 'linear-gradient(160deg,#ffffff,#efeee9)',
    github: 'linear-gradient(160deg,#ffffff,#dbe9f7)',
    medium: 'linear-gradient(160deg,#ffffff,#d7f0e0)'
  };

  var THEME_COLORS = {
    'bright-mode': '#ffd964', 'dark-mode': '#2b2b2b',
    candy: '#ff8fb1', mint: '#7ee0c3', purple: '#a06cd5', yellow: '#ffd400',
    'hot-red': '#ff3b30', 'forest-green': '#2e7d4f', 'ocean-blue': '#2196f3',
    'pink-blue': '#f7a8d8', 'neon-pink': '#ff2a9d', 'retro-orange': '#ff7a1a',
    blue: '#5b9bd5', pink: '#f48fb1', yellow2: '#ffe082'
  };

  var state = {
    templates: [],
    selectedTemplate: null,
    selectedTheme: null,
    labels: {},
    fileName: '',
    existingUrl: null,
    currentUrl: null
  };

  function el(id) { return document.getElementById(id); }

  function showView(name) {
    var views = ['select', 'publishing', 'result', 'error'];
    for (var i = 0; i < views.length; i++) {
      var v = el('view-' + views[i]);
      if (views[i] === name) {
        v.classList.remove('hidden');
        v.classList.add('enter');
      } else {
        v.classList.add('hidden');
        v.classList.remove('enter');
      }
    }
  }

  function buildTemplateCard(tpl) {
    var card = document.createElement('button');
    card.className = 'tpl-card';
    card.setAttribute('data-id', tpl.id);
    card.type = 'button';
    card.title = tpl.name;

    var bar = document.createElement('span');
    bar.className = 'tpl-bar';
    bar.style.background = PREVIEWS[tpl.id] || PREVIEWS.plain;

    var body = document.createElement('span');
    body.className = 'tpl-body';

    var name = document.createElement('span');
    name.className = 'tpl-name';
    name.textContent = tpl.name;
    body.appendChild(name);

    var check = document.createElement('span');
    check.className = 'tpl-check';
    check.textContent = '✓';

    card.appendChild(bar);
    card.appendChild(body);
    card.appendChild(check);
    card.addEventListener('click', function () { selectTemplate(tpl); });
    return card;
  }

  function renderTemplates() {
    var grid = el('tpl-grid');
    grid.innerHTML = '';
    for (var i = 0; i < state.templates.length; i++) {
      var card = buildTemplateCard(state.templates[i]);
      card.style.animationDelay = (i * 0.02) + 's';
      grid.appendChild(card);
    }
  }

  function selectTemplate(tpl) {
    state.selectedTemplate = tpl;
    state.selectedTheme = null;

    var cards = document.querySelectorAll('.tpl-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.toggle('selected', cards[i].getAttribute('data-id') === tpl.id);
    }

    var themeBlock = el('theme-block');
    var themeRow = el('theme-row');
    themeRow.innerHTML = '';

    if (tpl.themes && tpl.themes.length) {
      themeBlock.classList.remove('hidden');
      for (var j = 0; j < tpl.themes.length; j++) {
        themeRow.appendChild(buildThemeDot(tpl.themes[j]));
      }
    } else {
      themeBlock.classList.add('hidden');
    }
    updatePublishButton();
  }

  function buildThemeDot(theme) {
    var dot = document.createElement('button');
    dot.className = 'theme-dot';
    dot.type = 'button';
    dot.setAttribute('data-theme', theme);
    dot.title = theme;

    var swatch = document.createElement('span');
    swatch.className = 'theme-swatch';
    swatch.style.background = THEME_COLORS[theme] || '#9e9e9e';
    dot.appendChild(swatch);

    var label = document.createElement('span');
    label.className = 'theme-label';
    label.textContent = theme;
    dot.appendChild(label);

    dot.addEventListener('click', function () {
      state.selectedTheme = theme;
      var dots = document.querySelectorAll('.theme-dot');
      for (var k = 0; k < dots.length; k++) {
        dots[k].classList.toggle('selected', dots[k].getAttribute('data-theme') === theme);
      }
      updatePublishButton();
    });
    return dot;
  }

  function updatePublishButton() {
    var btn = el('publish-btn');
    var label = el('publish-label');
    var tpl = state.selectedTemplate;
    var ready = !!tpl && (!tpl.themes || !tpl.themes.length || !!state.selectedTheme);
    btn.disabled = !ready;
    label.textContent = state.existingUrl ? state.labels.updateShare : state.labels.publish;
  }

  function applyLabels(labels) {
    state.labels = labels;
    el('label-template').textContent = labels.templateLabel;
    el('label-template-hint').textContent = labels.templateHint;
    el('label-theme').textContent = labels.themeLabel;
    el('label-publishing').textContent = labels.publishing;
    el('label-link').textContent = labels.resultUrl;
    el('copy-label').textContent = labels.copy;
    el('open-btn').textContent = labels.open;
    el('back-btn').textContent = '← ' + labels.back;
    el('error-back-btn').textContent = '← ' + labels.back;
    el('error-title').textContent = labels.errorTitle;
    el('retry-btn').textContent = labels.retry;
    el('shared-badge').textContent = labels.alreadyShared;
  }

  function onInit(data) {
    state.templates = data.templates || state.templates;
    state.fileName = data.fileName;
    state.existingUrl = data.existingUrl;
    applyLabels(data.labels);

    el('file-name').textContent = data.fileName;
    el('file-name').title = data.fileName;
    el('word-count').textContent = data.wordCount + ' ' + data.labels.words;

    var modeBadge = el('mode-badge');
    modeBadge.textContent = data.hasToken ? data.labels.modeToken : data.labels.modeGuest;
    modeBadge.classList.toggle('is-token', data.hasToken);

    var sharedBadge = el('shared-badge');
    if (data.existingUrl) { sharedBadge.classList.remove('hidden'); }
    else { sharedBadge.classList.add('hidden'); }

    if (!state.templates.length) { return; }
    if (!el('tpl-grid').children.length) { renderTemplates(); }

    var def = data.defaultTemplate || 'plain';
    for (var i = 0; i < state.templates.length; i++) {
      if (state.templates[i].id === def) { selectTemplate(state.templates[i]); break; }
    }
    showView('select');
  }

  function onResult(data) {
    state.currentUrl = data.url;
    el('result-title').textContent = data.isUpdate ? state.labels.resultUpdated : state.labels.resultTitle;
    el('result-note').textContent = data.temporary ? state.labels.temporary : state.labels.permanent;
    el('result-note').classList.toggle('warn', data.temporary);

    var link = el('result-url');
    link.textContent = data.url;
    link.title = data.url;

    el('copy-label').textContent = data.autoCopied ? state.labels.copied : state.labels.copy;
    showView('result');
  }

  function onError(data) {
    el('error-msg').textContent = data.message;
    showView('error');
  }

  window.addEventListener('message', function (event) {
    var msg = event.data;
    if (msg.command === 'init') { onInit(msg.data); }
    else if (msg.command === 'publishing') {
      el('publishing-file').textContent = state.fileName;
      showView('publishing');
    }
    else if (msg.command === 'result') { onResult(msg.data); }
    else if (msg.command === 'error') { onError(msg.data); }
    else if (msg.command === 'copied') { el('copy-label').textContent = state.labels.copied; }
  });

  el('publish-btn').addEventListener('click', function () {
    if (!state.selectedTemplate) { return; }
    vscode.postMessage({
      command: 'publish',
      templateId: state.selectedTemplate.id,
      theme: state.selectedTheme || undefined
    });
  });

  el('copy-btn').addEventListener('click', function () {
    if (state.currentUrl) { vscode.postMessage({ command: 'copy', url: state.currentUrl }); }
  });

  el('open-btn').addEventListener('click', function () {
    if (state.currentUrl) { vscode.postMessage({ command: 'open', url: state.currentUrl }); }
  });

  el('result-url').addEventListener('click', function (e) {
    e.preventDefault();
    if (state.currentUrl) { vscode.postMessage({ command: 'open', url: state.currentUrl }); }
  });

  el('back-btn').addEventListener('click', function () { showView('select'); });
  el('error-back-btn').addEventListener('click', function () { showView('select'); });
  el('retry-btn').addEventListener('click', function () {
    if (!state.selectedTemplate) { showView('select'); return; }
    vscode.postMessage({
      command: 'publish',
      templateId: state.selectedTemplate.id,
      theme: state.selectedTheme || undefined
    });
  });

  vscode.postMessage({ command: 'ready' });
})();
`;
}
