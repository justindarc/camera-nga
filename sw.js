importScripts('components/serviceworkerware/dist/sww.js');
importScripts('components/sww-raw-cache/dist/sww-raw-cache.js');
importScripts('js/services/settings.js');
importScripts('resources.js');

var worker = new ServiceWorkerWare();

var settingsService = new SettingsService(worker);

worker.use({
  onInstall: function() {
    return caches.open('offline').then((cache) => {
      var request = new Request('/index.html');
      return fetch(request).then((response) => {
        cache.put(request, response);
        return response;
      });
    });
  },

  onFetch: function(request, response) {
    for (var i = RESOURCES.length - 1; i >= 0; i--) {
      if (request.url.split('?')[0].split('#')[0].endsWith(RESOURCES[i])) {
        return request;
      }
    }

    return caches.open('offline').then((cache) => {
      var request = new Request('/index.html');
      return cache.match(request).then((response) => {
        return response;
      });
    });
  }
});

worker.use(new self.StaticCacher(RESOURCES));
worker.use(new self.SimpleOfflineCache());

worker.init();
