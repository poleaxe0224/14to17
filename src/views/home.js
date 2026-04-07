/**
 * Home view — career exploration entry point.
 *
 * Shows an optional interest quiz, 4 interest-based category cards,
 * popular career picks, and a subtle "Advanced Tools" section at the bottom.
 */

import { t, getLocale } from '../i18n/i18n.js';
import { CAREER_MAPPINGS } from '../engine/mappings.js';

const INTEREST_GROUPS = [
  { key: 'build', icon: '\u{1F6E0}' },
  { key: 'help',  icon: '\u{1F91D}' },
  { key: 'analyze', icon: '\u{1F4CA}' },
  { key: 'create', icon: '\u{1F3A8}' },
];

/** Quiz question definitions — each answer maps to interest tags */
const QUIZ_QUESTIONS = [
  { key: 'q1', a: ['build', 'analyze'], b: ['help'] },
  { key: 'q2', a: ['build'],            b: ['create'] },
  { key: 'q3', a: ['analyze'],          b: ['create'] },
  { key: 'q4', a: ['analyze'],          b: ['help', 'create'] },
];

/** Hand-picked popular careers (diverse across interest groups) */
const POPULAR_SOC = ['15-1252', '29-1141', '17-2141', '27-1024', '13-2051', '47-2111'];

function renderInterestCards() {
  return INTEREST_GROUPS.map((g) => {
    const count = CAREER_MAPPINGS.filter((c) => c.interests.includes(g.key)).length;
    return `
      <a href="#/search?interest=${g.key}" class="interest-card interest-card--${g.key}" aria-label="${t('interests.' + g.key)}">
        <span class="interest-card__icon" aria-hidden="true">${g.icon}</span>
        <h3 class="interest-card__title">${t('interests.' + g.key)}</h3>
        <p class="interest-card__desc">${t('interests.' + g.key + '_desc')}</p>
        <span class="interest-card__count">${t('home.career_count').replace('{count}', count)}</span>
      </a>
    `;
  }).join('');
}

function renderPopularCareers() {
  const isZh = getLocale() === 'zh-TW';
  return POPULAR_SOC
    .map((soc) => CAREER_MAPPINGS.find((c) => c.soc === soc))
    .filter(Boolean)
    .map((c) => `
      <a href="#/profile/${c.soc}" class="popular-card" data-category="${c.category}">
        <span class="popular-card__icon" aria-hidden="true">${c.icon}</span>
        <span class="popular-card__name">${isZh ? c.careerZh : c.career}</span>
      </a>
    `).join('');
}

function renderQuizStart() {
  return `
    <section class="home-onboarding" id="quiz-section">
      <p class="onboarding-cta">${t('quiz.title')}</p>
      <p class="onboarding-desc muted">${t('quiz.subtitle')}</p>
      <div id="quiz-start-wrap" style="display:flex; gap:var(--space-md); justify-content:center; margin-top:var(--space-md); flex-wrap:wrap;">
        <button type="button" id="quiz-start-btn">${t('quiz.start')}</button>
      </div>
      <div id="quiz-body" class="hidden"></div>
    </section>
  `;
}

export function render() {
  return `
    <section class="hero">
      <h1 data-i18n="home.title">${t('home.title')}</h1>
      <p data-i18n="home.subtitle">${t('home.subtitle')}</p>
    </section>

    ${renderQuizStart()}

    <section class="home-interests">
      <h2 data-i18n="home.explore_by_interest">${t('home.explore_by_interest')}</h2>
      <div class="interest-grid">
        ${renderInterestCards()}
      </div>
    </section>

    <section class="home-popular">
      <h2 data-i18n="home.popular_careers">${t('home.popular_careers')}</h2>
      <div class="popular-grid">
        ${renderPopularCareers()}
      </div>
    </section>

    <section class="home-tools">
      <h2 data-i18n="home.tools_section">${t('home.tools_section')}</h2>
      <div class="tools-grid">
        <a href="#/calculator" class="tool-card">
          <h3>${t('home.tools_calculator')}</h3>
          <p class="muted">${t('home.tools_calculator_desc')}</p>
        </a>
        <a href="#/compare" class="tool-card">
          <h3>${t('home.tools_compare')}</h3>
          <p class="muted">${t('home.tools_compare_desc')}</p>
        </a>
      </div>
    </section>
  `;
}

export function afterRender() {
  const startBtn = document.getElementById('quiz-start-btn');
  const startWrap = document.getElementById('quiz-start-wrap');
  const quizBody = document.getElementById('quiz-body');
  if (!startBtn || !quizBody) return;

  startBtn.addEventListener('click', () => {
    startWrap.classList.add('hidden');
    quizBody.classList.remove('hidden');
    runQuiz(quizBody);
  });
}

function runQuiz(container) {
  let step = 0;
  const answers = []; // collect interest tags

  function renderStep() {
    if (step >= QUIZ_QUESTIONS.length) {
      showResults();
      return;
    }

    const q = QUIZ_QUESTIONS[step];
    const dots = QUIZ_QUESTIONS.map((_, i) => {
      const cls = i < step ? 'quiz-dot quiz-dot--done' : i === step ? 'quiz-dot quiz-dot--active' : 'quiz-dot';
      return `<span class="${cls}"></span>`;
    }).join('');

    container.innerHTML = `
      <div class="quiz-container">
        <div class="quiz-progress">${dots}</div>
        <p class="quiz-question">${t('quiz.' + q.key)}</p>
        <div class="quiz-options">
          <button type="button" class="quiz-option" data-choice="a">${t('quiz.' + q.key + '_a')}</button>
          <button type="button" class="quiz-option" data-choice="b">${t('quiz.' + q.key + '_b')}</button>
        </div>
      </div>
    `;

    container.querySelectorAll('.quiz-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const choice = btn.dataset.choice;
        const tags = choice === 'a' ? q.a : q.b;
        answers.push(...tags);
        step++;
        renderStep();
      });
    });
  }

  function showResults() {
    // Tally interest tags
    const counts = {};
    for (const tag of answers) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
    // Sort by frequency, take top 2
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topInterests = sorted.slice(0, 2).map(([key]) => key);

    const chips = topInterests.map((key) => {
      const group = INTEREST_GROUPS.find((g) => g.key === key);
      return `<a href="#/search?interest=${key}" class="chip chip--active">${group ? group.icon + ' ' : ''}${t('interests.' + key)}</a>`;
    }).join('');

    container.innerHTML = `
      <div class="quiz-container">
        <div class="quiz-result">
          <p class="quiz-question">${t('quiz.result_prefix')}</p>
          <div class="quiz-result-interests">${chips}</div>
          <button type="button" id="quiz-retake" class="outline secondary" style="margin-top:var(--space-md);">${t('quiz.retake')}</button>
        </div>
      </div>
    `;

    document.getElementById('quiz-retake').addEventListener('click', () => {
      step = 0;
      answers.length = 0;
      renderStep();
    });
  }

  renderStep();
}
