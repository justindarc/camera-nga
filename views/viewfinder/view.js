/* global View */
'use strict';

var ViewfinderView = View.extend(function ViewfinderView() {
  View.call(this); // super();

  this.camera = document.getElementById('camera');

  this.update();
});

ViewfinderView.prototype.update = function() {
  // this.getSettings().then((settings) => {
  //   this.settings = settings;
  //   this.render();
  // });

  this.render();
};

ViewfinderView.prototype.destroy = function() {
  this.client.destroy();

  View.prototype.destroy.call(this); // super(); // Always call *last*
};

ViewfinderView.prototype.render = function() {
  View.prototype.render.call(this); // super();
};

ViewfinderView.prototype.getSettings = function() {
  return this.fetch('/api/settings')
    .then(response => response.json());
};

window.view = new ViewfinderView();
