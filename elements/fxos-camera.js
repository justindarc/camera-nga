(function(window) {
'use strict';

const CAMERA_IDS = navigator.mozCameras.getListOfCameras();

const MODE_TYPES = ['picture', 'video'];

const ORIENTATION_ANGLES = {
  'portrait-primary':    0,
  'landscape-primary':   90,
  'portrait-secondary':  180,
  'landscape-secondary': 270
};

var proto = Object.create(HTMLElement.prototype);

proto.getCamera = function() {
  if (this.camera) {
    return this.camera;
  }

  this.camera = navigator.mozCameras.getCamera(this.cameraId, this.configuration)
    .then((camera) => {
      copy(this.configuration, camera.configuration);

      return camera.camera;
    });

  return this.camera;
};

proto.configure = function(configuration) {
  copy(this.configuration, configuration);

  return this.getCamera().then((camera) => {
    copy(this.configuration, configuration);

    return camera.setConfiguration(this.configuration).then((configuration) => {
      copy(this.configuration, configuration);

      return this.configuration;
    });
  });
};

proto.start = function() {
  return this.getCamera().then((camera) => {
    this.els.video.mozSrcObject = camera;
  });
};

proto.stop = function() {
  this.els.video.mozSrcObject = null;

  if (!this.camera) {
    return Promise.resolve(null);
  }

  return this.getCamera()
    .then((camera) => {
      this.camera = null;

      return camera.release();
    });
};

proto.restart = function() {
  return this.stop().then(() => this.start());
};

proto.createdCallback = function() {
  var shadowRoot = this.createShadowRoot();
  shadowRoot.innerHTML =
`<style>
  #container {
    position: relative;
    width: 100%;
    height: 100%;
  }
</style>
<div id="container">
  <video id="video" autoplay></video>
</div>`;

  var $ = shadowRoot.querySelector.bind(shadowRoot);

  this.els = {
    container: $('#container'),
    video:     $('#video')
  };

  this.camera = null;
  this.configuration = {};
};

proto.attachedCallback = function() {
  this.start().then(() => {
    console.log('Startup time: %s',
      Date.now() - performance.timing.domLoading + 'ms');
  });
};

proto.detachedCallback = function() {
  this.stop();
};

proto.attributeChangedCallback = function(attr, oldVal, newVal) {
  switch (attr) {
    case 'camera-id':
      this.els.container.dataset.cameraId = newVal;
      this.restart();
      break;
    case 'mode':
      this.els.container.dataset.mode = newVal;
      this.configure({
        mode: MODE_TYPES.indexOf(newVal) !== -1 ? newVal : MODE_TYPES[0]
      });
      break;
  }
};

Object.defineProperty(proto, 'cameraId', {
  get: function() {
    var value = this.getAttribute('camera-id');

    return CAMERA_IDS.indexOf(value) !== -1 ? value : CAMERA_IDS[0];
  },

  set: function(value) {
    value = CAMERA_IDS.indexOf(value) !== -1 ? value : CAMERA_IDS[0];

    this.setAttribute('camera-id', value);
  }
});

Object.defineProperty(proto, 'mode', {
  get: function() {
    var value = this.getAttribute('mode');

    return MODE_TYPES.indexOf(value) !== -1 ? value : MODE_TYPES[0];
  },

  set: function(value) {
    value = MODE_TYPES.indexOf(value) !== -1 ? value : MODE_TYPES[0];

    this.setAttribute('mode', value);
  }
});

// ['camera-id'].forEach((prop) => {
//   Object.defineProperty(proto, prop, {
//     get: function() {
//       return this.getAttribute(prop);
//     },

//     set: function(value) {
//       this.setAttribute(prop, value || '');
//     }
//   });
// });

function copy(target, source) {
  for (var p in source) {
    target[p] = source[p];
  }
}

try {
  window.FxosCamera = document.registerElement('fxos-camera', {
    prototype: proto
  });
} catch (e) {
  if (e.name !== 'NotSupportedError') {
    throw e;
  }
}

})(window);
