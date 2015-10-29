importScripts('components/bridge/client.js');

var client = bridge.client('camera-service', new BroadcastChannel('camera-service'));

function SettingsService(worker) {
  var stopAfter = ServiceWorkerWare.decorators.stopAfter;

  worker.get('/api/settings', stopAfter((request) => {
    return new Promise((resolve) => {
      client.method('getSettings').then((artists) => {
        resolve(new Response(JSON.stringify(artists), {
          headers: { 'Content-Type': 'application/json' }
        }));
      });
    });
  }));
}
