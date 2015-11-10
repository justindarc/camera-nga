(function(window) {
'use strict';

const CAMERA_IDS  = navigator.mozCameras.getListOfCameras();
const MODE_TYPES  = ['picture', 'video'];
const SCALE_TYPES = ['aspect-fill', 'aspect-fit'];

var proto = Object.create(HTMLElement.prototype);

proto.getCamera = function() {
  if (this.camera) {
    return this.camera;
  }

  var config = {
    mode: this.config.mode
  };

  this.camera = navigator.mozCameras.getCamera(this.cameraId, config)
    .then((camera) => {
      copy(this.config, camera.configuration);

      this.config.sensorAngle = camera.camera.sensorAngle;

      return camera.camera;
    })
    .catch((error) => {
      return navigator.mozCameras.getCamera(this.cameraId)
        .then((camera) => {
          copy(this.config, camera.configuration);

          this.config.sensorAngle = camera.camera.sensorAngle;

          return camera.camera;
        });
    });

  return this.camera;
};

proto.configure = function(config = {}) {
  var lastWorkingConfig = copy({}, this.config);

  copy(this.config, config);

  return this.getCamera()
    .then((camera) => {
      copy(this.config, config);

      return camera.setConfiguration(this.config)
        .then(config => copy(this.config, config))
        .catch(error => copy(this.config, lastWorkingConfig));
    })
    .then(() => this.updateVideoDimensions());
};

proto.updateVideoDimensions = function() {
  var deltaAngle = this.config.sensorAngle - this.config.orientationAngle;

  var viewfinderWidth  = this.config.viewfinderSize.width;
  var viewfinderHeight = this.config.viewfinderSize.height;

  var videoStyle = this.els.video.style;

  if (deltaAngle % 180) {
    videoStyle.top    = ((viewfinderHeight - viewfinderWidth) / 2) + 'px';
    videoStyle.left   = ((viewfinderWidth - viewfinderHeight) / 2) + 'px';
    videoStyle.width  = viewfinderHeight + 'px';
    videoStyle.height = viewfinderWidth  + 'px';
  }

  else {

  }

  videoStyle.transform = 'rotate(' + deltaAngle + 'deg)';
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
  return this.stop()
    .then(() => this.configure())
    .then(() => this.start());
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

  this.config = {
    mode:  this.mode,
    scale: this.scale
  };

  this.onResize = () => {
    this.width  = this.els.container.offsetWidth;
    this.height = this.els.container.offsetHeight;

    var viewfinderSize = {
      width:  Math.ceil(this.width  * devicePixelRatio),
      height: Math.ceil(this.height * devicePixelRatio)
    };

    var orientationAngle = screen.orientation.angle;
    var rotation         = -orientationAngle;

    this.configure({
      viewfinderSize:   viewfinderSize,
      orientationAngle: orientationAngle,
      rotation:         rotation
    });
  };
};

proto.attachedCallback = function() {
  window.addEventListener('resize', this.onResize);
  this.onResize();

  this.start().then(() => {
    console.log('Startup time: %s',
      Date.now() - performance.timing.domLoading + 'ms');
  });
};

proto.detachedCallback = function() {
  window.removeEventListener('resize', this.onResize);

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
    case 'scale':
      this.els.container.dataset.scale = newVal;
      this.configure({
        scale: SCALE_TYPES.indexOf(newVal) !== -1 ? newVal : SCALE_TYPES[0]
      });
      break;
  }
};

defineEnumProperty(proto, 'cameraId', CAMERA_IDS);
defineEnumProperty(proto, 'mode',     MODE_TYPES);
defineEnumProperty(proto, 'scale',    SCALE_TYPES);

function defineEnumProperty(object, property, values) {
  var attribute = propertyToAttribute(property);

  Object.defineProperty(object, property, {
    get: function() {
      var value = this.getAttribute(attribute);

      return values.indexOf(value) !== -1 ? value : values[0];
    },

    set: function(value) {
      value = values.indexOf(value) !== -1 ? value : values[0];

      this.setAttribute(attribute, value);
    }
  });
}

function propertyToAttribute(property) {
  return property.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function copy(target, source) {
  for (var p in source) {
    target[p] = source[p];
  }

  return target;
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
