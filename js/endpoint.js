/* global bridge */
'use strict';

var service = bridge.service('camera-service')
  .method('getSettings', getSettings)

  .listen()
  .listen(new BroadcastChannel('camera-service'));

function getSettings() {
  return Promise.resolve({});
}
