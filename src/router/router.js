/**
 * Hash-based SPA router for GitHub Pages compatibility.
 *
 * Routes use the format: #/path or #/path/:param
 * Example: addRoute('/detail/:soc', detailView.render)
 */

const routes = [];
let notFoundHandler = null;
let outlet = null;

/**
 * Register a route.
 * @param {string} pattern — e.g. '/' or '/detail/:soc'
 * @param {(params: Record<string, string>) => string | HTMLElement | Promise<string | HTMLElement>} handler
 */
export function addRoute(pattern, handler) {
  const paramNames = [];
  const regexStr = pattern.replace(/:(\w+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  routes.push({
    pattern,
    regex: new RegExp(`^${regexStr}$`),
    paramNames,
    handler,
  });
}

export function setNotFound(handler) {
  notFoundHandler = handler;
}

function parsePath() {
  const hash = window.location.hash.replace('#', '') || '/';
  return hash;
}

function matchRoute(path) {
  for (const route of routes) {
    const match = path.match(route.regex);
    if (match) {
      const params = {};
      route.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1]);
      });
      return { handler: route.handler, params };
    }
  }
  return { handler: notFoundHandler, params: {} };
}

async function render() {
  const path = parsePath();
  const { handler, params } = matchRoute(path);

  if (!handler || !outlet) return;

  const content = await handler(params);

  if (typeof content === 'string') {
    outlet.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    outlet.replaceChildren(content);
  }

  // Notify i18n and other listeners to update the new DOM
  document.dispatchEvent(new CustomEvent('route-changed', { detail: { path, params } }));

  // Update active nav link
  document.querySelectorAll('header nav a[href^="#"]').forEach((link) => {
    const linkPath = link.getAttribute('href').replace('#', '') || '/';
    link.classList.toggle('active', linkPath === path);
  });
}

/**
 * Programmatic navigation.
 */
export function navigate(path) {
  window.location.hash = `#${path}`;
}

/**
 * Initialize the router.
 * @param {string} outletId — id of the element to render views into
 */
export function initRouter(outletId = 'app') {
  outlet = document.getElementById(outletId);
  window.addEventListener('hashchange', render);
  render();
}
