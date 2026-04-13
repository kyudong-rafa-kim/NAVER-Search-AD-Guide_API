/* ============================================================
   NAVER 검색광고 API 가이드 — 공통 스크립트
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavDropdowns();
  initMobileNav();
  initCopyButtons();
  initTocHighlight();
  initSearch();
});

/* ---------- Navigation Dropdowns ---------- */
function initNavDropdowns() {
  // Mobile: click to toggle dropdown
  document.querySelectorAll('.nav-item').forEach(item => {
    const link = item.querySelector('.nav-link');
    if (!link || !item.querySelector('.dropdown')) return;

    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 680) {
        e.preventDefault();
        item.classList.toggle('open');
      }
    });
  });
}

/* ---------- Mobile Hamburger ---------- */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    menu.classList.toggle('open');
    const spans = toggle.querySelectorAll('span');
    if (menu.classList.contains('open')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav') && menu.classList.contains('open')) {
      menu.classList.remove('open');
    }
  });
}

/* ---------- Copy Buttons ---------- */
function initCopyButtons() {
  // Auto-wrap pre/code blocks with header + copy button if not already wrapped
  document.querySelectorAll('pre[class*="language-"]').forEach(pre => {
    if (pre.closest('.code-block-wrap')) return; // already wrapped

    const lang = (pre.className.match(/language-(\w+)/) || [])[1] || 'code';
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrap';

    const header = document.createElement('div');
    header.className = 'code-block-header';
    header.innerHTML = `<span class="lang-label">${lang === 'bash' ? 'bash / curl' : lang}</span>`;

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    header.appendChild(btn);

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);

    btn.addEventListener('click', () => copyCode(btn, pre));
  });

  // Also handle pre-existing copy-btn elements
  document.querySelectorAll('.copy-btn').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    const pre = btn.closest('.code-block-wrap')?.querySelector('pre');
    if (pre) btn.addEventListener('click', () => copyCode(btn, pre));
  });
}

function copyCode(btn, pre) {
  const text = pre.textContent || '';
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'Copy';
      btn.classList.remove('copied');
    }, 2000);
  }).catch(() => {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
  });
}

/* ---------- Site Search ---------- */
function initSearch() {
  const input = document.getElementById('siteSearch');
  const panel = document.getElementById('searchResults');
  if (!input || !panel) return;

  /* --- language detection --- */
  const langAttr = document.documentElement.lang || 'ko';
  const lang = langAttr.startsWith('zh') ? 'zh'
             : langAttr.startsWith('en') ? 'en'
             : 'ko';

  /* --- page sets per language --- */
  const PAGE_SETS = {
    ko: [
      { url: 'powerlink-understanding.html',  tag: '파워링크',    title: '파워링크 이해하기' },
      { url: 'powerlink-api.html',            tag: '파워링크',    title: 'API로 세팅 및 운영하기' },
      { url: 'shopping-understanding.html',   tag: '쇼핑검색광고', title: '쇼핑검색광고 이해하기' },
      { url: 'shopping-api.html',             tag: '쇼핑검색광고', title: 'API로 세팅 및 운영하기' },
    ],
    en: [
      { url: 'powerlink-understanding-en.html',  tag: 'Powerlink',           title: 'Powerlink Overview' },
      { url: 'powerlink-api-en.html',            tag: 'Powerlink',           title: 'API Setup & Operations' },
      { url: 'shopping-understanding-en.html',   tag: 'Shopping Search Ads', title: 'Shopping Search Ads Overview' },
      { url: 'shopping-api-en.html',             tag: 'Shopping Search Ads', title: 'API Setup & Operations' },
    ],
    zh: [
      { url: 'powerlink-understanding-zh.html',  tag: 'Powerlink',  title: 'Powerlink概念介绍' },
      { url: 'powerlink-api-zh.html',            tag: 'Powerlink',  title: 'API设置与运营' },
      { url: 'shopping-understanding-zh.html',   tag: '购物搜索广告', title: '购物搜索广告概念介绍' },
      { url: 'shopping-api-zh.html',             tag: '购物搜索广告', title: 'API设置与运营' },
    ],
  };

  /* --- localised UI strings --- */
  const I18N = {
    ko: {
      loading:     '검색 중…',
      noResults:   q => `"${esc(q)}"에 대한 결과가 없습니다.`,
      header:      (n, q) => `<strong>${n}개</strong> 결과 · "<em>${esc(q)}</em>"`,
      fetchFailed: '⚠️ 검색 기능은 로컬 서버(예: VS Code Live Server)에서 실행해야 합니다.',
    },
    en: {
      loading:     'Searching…',
      noResults:   q => `No results found for "${esc(q)}".`,
      header:      (n, q) => `<strong>${n} result${n !== 1 ? 's' : ''}</strong> · "<em>${esc(q)}</em>"`,
      fetchFailed: '⚠️ Search requires a local server (e.g., VS Code Live Server).',
    },
    zh: {
      loading:     '搜索中…',
      noResults:   q => `未找到"${esc(q)}"的相关结果。`,
      header:      (n, q) => `<strong>${n}个结果</strong> · "<em>${esc(q)}</em>"`,
      fetchFailed: '⚠️ 搜索功能需要通过本地服务器（如 VS Code Live Server）运行。',
    },
  };

  const PAGES = PAGE_SETS[lang];
  const T     = I18N[lang];

  let indexCache   = null;
  let indexPromise = null;

  async function buildIndex() {
    if (indexCache)   return indexCache;
    if (indexPromise) return indexPromise;

    indexPromise = (async () => {
      const entries = [];

      await Promise.all(PAGES.map(async page => {
        try {
          const res = await fetch(page.url);
          if (!res.ok) throw new Error('fetch failed');
          const doc  = new DOMParser().parseFromString(await res.text(), 'text/html');
          const main = doc.querySelector('.main-content');
          if (!main) return;

          // Page-level entry
          const h1Clone  = doc.querySelector('.page-header h1')?.cloneNode(true);
          h1Clone?.querySelector('.badge')?.remove();
          const pageTitle = h1Clone?.textContent.trim() || page.title;
          const pageDesc  = doc.querySelector('.page-header p')?.textContent.trim() || '';
          entries.push({ url: page.url, tag: page.tag, title: pageTitle, text: pageDesc });

          // One entry per heading
          main.querySelectorAll('h2, h3').forEach(h => {
            const clone = h.cloneNode(true);
            clone.querySelector('.section-num')?.remove();
            const title = clone.textContent.trim();
            if (!title) return;

            const id = h.id
              || h.closest('.subsection[id]')?.id
              || h.closest('.section[id]')?.id
              || '';

            // Collect sibling text (stop at next heading or subsection div)
            const parts = [];
            let el = h.nextElementSibling;
            while (el && parts.join('').length < 400) {
              const t = el.tagName;
              if (t === 'H2' || t === 'H3') break;
              if (t === 'DIV' && (el.classList.contains('subsection') || el.classList.contains('section'))) break;
              const txt = el.textContent.replace(/\s+/g, ' ').trim();
              if (txt) parts.push(txt);
              el = el.nextElementSibling;
            }

            entries.push({
              url:  page.url + (id ? '#' + id : ''),
              tag:  page.tag,
              title,
              text: parts.join(' ').slice(0, 400),
            });
          });

        } catch (_) {
          entries.push({ url: page.url, tag: page.tag, title: page.title, text: '', _fetchFailed: true });
        }
      }));

      indexCache = entries;
      return entries;
    })();

    return indexPromise;
  }

  /* --- event wiring --- */
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (!q) { panel.innerHTML = ''; return; }
    if (q.length < 2) return;
    panel.innerHTML = `<div class="srp-inner"><p class="srp-status">${T.loading}</p></div>`;
    timer = setTimeout(() => runSearch(q), 260);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { input.value = ''; panel.innerHTML = ''; }
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.hero-search') && !e.target.closest('.search-results-panel')) {
      panel.innerHTML = '';
    }
  });

  /* --- search --- */
  async function runSearch(query) {
    const entries = await buildIndex();

    if (entries.every(e => e._fetchFailed)) {
      panel.innerHTML = `<div class="srp-inner"><p class="srp-status">${T.fetchFailed}</p></div>`;
      return;
    }

    const q = query.toLowerCase();
    const results = entries
      .map(e => {
        const tm = e.title.toLowerCase().includes(q);
        const sm = e.text.toLowerCase().includes(q);
        if (!tm && !sm) return null;
        return { ...e, _score: (tm ? 3 : 0) + (sm ? 1 : 0) };
      })
      .filter(Boolean)
      .sort((a, b) => b._score - a._score)
      .slice(0, 12);

    renderResults(query, results);
  }

  /* --- render --- */
  function renderResults(query, results) {
    if (!results.length) {
      panel.innerHTML = `<div class="srp-inner"><p class="srp-status">${T.noResults(query)}</p></div>`;
      return;
    }

    const items = results.map(r => {
      const raw     = r.text ? r.text.slice(0, 160) + (r.text.length > 160 ? '…' : '') : '';
      const snippet = raw ? `<span class="srp-snippet">${hlEsc(raw, query)}</span>` : '';
      return `<a href="${r.url}" class="srp-item">
        <span class="srp-tag">${esc(r.tag)}</span>
        <span class="srp-title">${hlEsc(r.title, query)}</span>
        ${snippet}
      </a>`;
    }).join('');

    panel.innerHTML = `<div class="srp-inner">
      <div class="srp-header">${T.header(results.length, query)}</div>
      <div class="srp-list">${items}</div>
    </div>`;
  }

  /* --- helpers --- */
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function hlEsc(text, query) {
    const re    = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = String(text).split(re);
    return parts.map((p, i) => i % 2 === 1 ? `<mark>${esc(p)}</mark>` : esc(p)).join('');
  }
}

/* ---------- TOC Highlight on Scroll ---------- */
function initTocHighlight() {
  const tocLinks = document.querySelectorAll('.toc a[href^="#"]');
  if (!tocLinks.length) return;

  const sections = Array.from(tocLinks).map(a => {
    const id = a.getAttribute('href').slice(1);
    return { link: a, el: document.getElementById(id) };
  }).filter(x => x.el);

  const NAV_H = 80;

  function onScroll() {
    let current = null;
    sections.forEach(({ el }) => {
      if (el.getBoundingClientRect().top <= NAV_H + 10) current = el.id;
    });
    tocLinks.forEach(a => a.classList.remove('active'));
    if (current) {
      const active = document.querySelector(`.toc a[href="#${current}"]`);
      if (active) active.classList.add('active');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
