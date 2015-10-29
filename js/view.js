/* exported View */
/* global SERVICE_WORKERS, bridge */

window.View = (function() {
'use strict';

var debug = 0 ? (...args) => console.log('[View]', ...args) : () => {};

if (!SERVICE_WORKERS) (function() {
  window.ROUTES = {
    '/api/settings': 'getSettings'
  };

  for (var path in window.ROUTES) {
    var method = window.ROUTES[path];
    window.ROUTES[path] = parseSimplePath(path);
    window.ROUTES[path].method = method;
  }
})();

function View() {
  this.client = bridge.client({
    service: 'camera-service',
    endpoint: window.parent,
    timeout: false
  });

  this.params = {};

  var parts = window.parent.location.href.split('?');
  parts.shift();

  var query = parts.join('?');
  query.split('&').forEach((param) => {
    var parts = param.split('=');
    this.params[parts[0]] = parts[1];
  });

  window.addEventListener('click', (evt) => {
    var link = evt.target.closest('a');
    if (link) {
      evt.preventDefault();
      this.client.method('navigate', link.getAttribute('href'));
    }
  });

  window.addEventListener('viewdestroy', () => this.destroy());

  document.addEventListener('DOMRetranslated', () => {
    this.title = document.title;
  });
}

View.prototype.once = function(el, name, callback) {
  el.addEventListener(name, function fn() {
    el.removeEventListener(name, fn);
    callback();
  });
};

View.prototype.destroy = function() {
  Object.getOwnPropertyNames(this).forEach(prop => this[prop] = null);

  debug('Destroyed');
};

View.prototype.render = function() {
  if (window.frameElement) {
    window.frameElement.dispatchEvent(new CustomEvent('rendered'));
  }

  debug('Rendered');
};

View.prototype.fetch = SERVICE_WORKERS ?
  function(url) {
    return window.fetch(encodeURI(url));
  } :
  function(url) {
    for (var path in window.ROUTES) {
      var route = window.ROUTES[path];
      var match = url.match(route.regexp);

      if (match) {
        return new Promise((resolve) => {
          setTimeout(() => {
            var args = [route.method].concat(match.splice(1));
            this.client.method.apply(this.client, args).then((result) => {
              resolve({
                blob: () => Promise.resolve(result),
                json: () => Promise.resolve(result)
              });
            });
          });
        });
      }
    }

    return Promise.reject();
  };

Object.defineProperty(View.prototype, 'title', {
  get: function() {
    return document.title;
  },

  set: function(value) {
    document.title = value;

    window.frameElement.dispatchEvent(new CustomEvent('titlechange', {
      detail: document.title
    }));
  }
});

View.extend = function(subclass) {
  subclass.prototype = Object.create(View.prototype, {
    constructor: {
      value: subclass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });

  // subclass.__proto__ = View;

  return subclass;
};

/**
 * Route parser from components/serviceworkerware/dist/sww.js
 */
function parseSimplePath(path) {
  // Check for named placeholder crowding
  if (/\:[a-zA-Z0-9]+\:[a-zA-Z0-9]+/g.test(path)) {
    throw new Error('Invalid usage of named placeholders');
  }

  // Check for mixed placeholder crowdings
  var mixedPlaceHolders =
    /(\*\:[a-zA-Z0-9]+)|(\:[a-zA-Z0-9]+\:[a-zA-Z0-9]+)|(\:[a-zA-Z0-9]+\*)/g;
  if (mixedPlaceHolders.test(path.replace(/\\\*/g,''))) {
    throw new Error('Invalid usage of named placeholders');
  }

  // Try parsing the string and converting special characters into regex
  try {
    // Parsing anonymous placeholders with simple backslash-escapes
    path = path.replace(/(.|^)[*]+/g, function(m,escape) {
      return escape==='\\' ? '\\*' : (escape+'(?:.*?)');
    });

    // Parsing named placeholders with backslash-escapes
    var tags = [];
    path = path.replace(/(.|^)\:([a-zA-Z0-9]+)/g, function (m, escape, tag) {
      if (escape === '\\') { return ':' + tag; }
      tags.push(tag);
      return escape + '(.+?)';
    });

    return { regexp: RegExp(path + '$'), tags: tags };
  }

  // Failed to parse final path as a RegExp
  catch (ex) {
    throw new Error('Invalid path specified');
  }
}

return View;

})();
