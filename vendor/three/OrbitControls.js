/*! Local placeholder for Three.js OrbitControls (0.160.0 compatible shape). */
(function initLocalOrbitControlsPlaceholder(global) {
  "use strict";
  if (!global || !global.THREE) {
    return;
  }
  if (typeof global.THREE.OrbitControls === "function") {
    return;
  }
  global.THREE.OrbitControls = function OrbitControls() {
    this.enableDamping = false;
    this.enablePan = false;
    this.dampingFactor = 0;
    this.minDistance = 0;
    this.maxDistance = 0;
    this.target = {
      set() {},
    };
  };
  global.THREE.OrbitControls.prototype.update = function update() {};
  global.THREE.OrbitControls.prototype.dispose = function dispose() {};
})(window);
