(function initPackaging3D(global) {
  "use strict";

  if (!global || global.Packaging3D) {
    return;
  }

  const MODULE_VERSION = "1.0.0";
  const LOCAL_THREE_PATH = "vendor/three/three.min.js";
  const LOCAL_ORBIT_PATH = "vendor/three/OrbitControls.js";
  const DEFAULT_RENDER_LIMIT = 250;
  const HANDLE_REGISTRY = new Map();

  const dependencyState = {
    promise: null,
    status: "idle",
    error: null,
  };

  function num(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function roundInt(value, fallback) {
    return Math.round(num(value, fallback));
  }

  function formatDim(value) {
    const safe = Math.max(0, num(value, 0));
    return safe.toFixed(1).replace(/\\.0$/, "");
  }

  function toPositiveDims(input, minimum) {
    if (!Array.isArray(input) || input.length !== 3) {
      return null;
    }
    const dims = [
      Math.max(minimum, num(input[0], NaN)),
      Math.max(minimum, num(input[1], NaN)),
      Math.max(minimum, num(input[2], NaN)),
    ];
    if (!dims.every((dim) => Number.isFinite(dim) && dim > 0)) {
      return null;
    }
    return dims;
  }

  function buildOrientations(dims, allowSixOrientations) {
    const [l, w, h] = dims;
    const variants = allowSixOrientations === false
      ? [[l, w, h]]
      : [
        [l, w, h],
        [l, h, w],
        [w, l, h],
        [w, h, l],
        [h, l, w],
        [h, w, l],
      ];
    const dedupe = new Set();
    const unique = [];
    variants.forEach((item) => {
      const key = item.map((value) => value.toFixed(6)).join("|");
      if (dedupe.has(key)) {
        return;
      }
      dedupe.add(key);
      unique.push(item);
    });
    return unique;
  }

  function footprintScore(candidate) {
    return candidate.nx * candidate.ny;
  }

  function compactnessScore(candidate) {
    const axisSpread = Math.max(candidate.nx, candidate.ny, candidate.nz) - Math.min(candidate.nx, candidate.ny, candidate.nz);
    return -axisSpread;
  }

  function compareCandidates(left, right) {
    if (right.capacityUnits !== left.capacityUnits) {
      return right.capacityUnits - left.capacityUnits;
    }
    if (footprintScore(right) !== footprintScore(left)) {
      return footprintScore(right) - footprintScore(left);
    }
    if (compactnessScore(right) !== compactnessScore(left)) {
      return compactnessScore(right) - compactnessScore(left);
    }
    const leftLongest = Math.max(left.orientationCm[0], left.orientationCm[1], left.orientationCm[2]);
    const rightLongest = Math.max(right.orientationCm[0], right.orientationCm[1], right.orientationCm[2]);
    return leftLongest - rightLongest;
  }

  function computeLayout(input) {
    const unitDimsCm = toPositiveDims(input?.unitDimsCm, 0.0001);
    const cartonDimsCm = toPositiveDims(input?.cartonDimsCm, 0.0001);
    const targetUnits = Math.max(1, roundInt(input?.targetUnits, 1));
    const outerBufferCm = Math.max(0, num(input?.outerBufferCm, 0));
    const allowSixOrientations = input?.allowSixOrientations !== false;
    const renderLimit = Math.max(1, roundInt(input?.renderLimit, DEFAULT_RENDER_LIMIT));

    if (!unitDimsCm || !cartonDimsCm) {
      return {
        available: false,
        reasonCode: "invalid_input",
        orientationCm: null,
        nx: 0,
        ny: 0,
        nz: 0,
        placedUnits: 0,
        capacityUnits: 0,
        clippedUnits: 0,
        freeAreaTopPct: 100,
        freeVolumeCbm: 0,
        freeVolumeLiters: 0,
        evaluatedOrientationCount: 0,
      };
    }

    const orientations = buildOrientations(unitDimsCm, allowSixOrientations);
    const candidates = orientations.map((orientationCm) => {
      const nx = Math.max(0, Math.floor((cartonDimsCm[0] - outerBufferCm) / Math.max(0.000001, orientationCm[0])));
      const ny = Math.max(0, Math.floor((cartonDimsCm[1] - outerBufferCm) / Math.max(0.000001, orientationCm[1])));
      const nz = Math.max(0, Math.floor((cartonDimsCm[2] - outerBufferCm) / Math.max(0.000001, orientationCm[2])));
      const capacityUnits = nx * ny * nz;
      return {
        orientationCm,
        nx,
        ny,
        nz,
        capacityUnits,
      };
    });

    const best = [...candidates].sort(compareCandidates)[0];
    if (!best || best.capacityUnits <= 0) {
      return {
        available: false,
        reasonCode: "no_fit",
        orientationCm: null,
        nx: 0,
        ny: 0,
        nz: 0,
        placedUnits: 0,
        capacityUnits: 0,
        clippedUnits: 0,
        freeAreaTopPct: 100,
        freeVolumeCbm: 0,
        freeVolumeLiters: 0,
        evaluatedOrientationCount: orientations.length,
      };
    }

    const placedUnits = Math.max(0, Math.min(targetUnits, best.capacityUnits));
    const clippedUnits = Math.max(0, placedUnits - renderLimit);
    const topSlots = Math.max(1, best.nx * best.ny);
    const topPlaced = Math.min(topSlots, placedUnits);
    const freeAreaTopPct = clamp(((topSlots - topPlaced) / topSlots) * 100, 0, 100);

    const unitVolumeCbm = (unitDimsCm[0] * unitDimsCm[1] * unitDimsCm[2]) / 1_000_000;
    const cartonVolumeCbm = (cartonDimsCm[0] * cartonDimsCm[1] * cartonDimsCm[2]) / 1_000_000;
    const freeVolumeCbm = Math.max(0, cartonVolumeCbm - placedUnits * unitVolumeCbm);

    return {
      available: true,
      reasonCode: clippedUnits > 0 ? "clipped_render" : "ok",
      orientationCm: best.orientationCm,
      nx: best.nx,
      ny: best.ny,
      nz: best.nz,
      placedUnits,
      capacityUnits: best.capacityUnits,
      clippedUnits,
      freeAreaTopPct,
      freeVolumeCbm,
      freeVolumeLiters: freeVolumeCbm * 1000,
      evaluatedOrientationCount: orientations.length,
    };
  }

  function buildViewModel(input) {
    const layout = computeLayout(input);
    return {
      layout,
      mode: "maximal",
      renderLimit: Math.max(1, roundInt(input?.renderLimit, DEFAULT_RENDER_LIMIT)),
      unitDimsCm: toPositiveDims(input?.unitDimsCm, 0.0001) ?? [0.1, 0.1, 0.1],
      cartonDimsCm: toPositiveDims(input?.cartonDimsCm, 0.0001) ?? [0.1, 0.1, 0.1],
      targetUnits: Math.max(1, roundInt(input?.targetUnits, 1)),
      outerBufferCm: Math.max(0, num(input?.outerBufferCm, 0)),
      allowSixOrientations: input?.allowSixOrientations !== false,
    };
  }

  function loadScriptOnce(src, marker) {
    return new Promise((resolve, reject) => {
      const selector = `script[data-packaging3d-script="${marker}"]`;
      const existing = document.querySelector(selector);
      if (existing) {
        if (existing.dataset.loaded === "true") {
          resolve();
          return;
        }
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error(`Script load failed: ${src}`)), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.packaging3dScript = marker;
      script.addEventListener(
        "load",
        () => {
          script.dataset.loaded = "true";
          resolve();
        },
        { once: true },
      );
      script.addEventListener("error", () => reject(new Error(`Script load failed: ${src}`)), { once: true });
      document.head.appendChild(script);
    });
  }

  function ensureDependencies() {
    if (global.THREE && global.THREE.OrbitControls) {
      dependencyState.status = "ready";
      dependencyState.error = null;
      return Promise.resolve({ available: true, status: dependencyState.status });
    }
    if (dependencyState.promise) {
      return dependencyState.promise;
    }

    dependencyState.status = "loading";
    dependencyState.promise = (async () => {
      try {
        await loadScriptOnce(LOCAL_THREE_PATH, "three_local");
        await loadScriptOnce(LOCAL_ORBIT_PATH, "orbit_local");
        if (!(global.THREE && global.THREE.OrbitControls)) {
          throw new Error("Local Three.js dependencies not available.");
        }
        dependencyState.status = "ready";
        dependencyState.error = null;
        return { available: true, status: dependencyState.status };
      } catch (error) {
        dependencyState.status = "failed";
        dependencyState.error = error;
        return { available: false, status: dependencyState.status, error };
      }
    })();

    return dependencyState.promise;
  }

  function rotatePoint(point, yaw, pitch) {
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosX = Math.cos(pitch);
    const sinX = Math.sin(pitch);

    const x1 = point.x * cosY - point.z * sinY;
    const z1 = point.x * sinY + point.z * cosY;
    const y1 = point.y;

    return {
      x: x1,
      y: y1 * cosX - z1 * sinX,
      z: y1 * sinX + z1 * cosX,
    };
  }

  function projectPoint(point, camera) {
    const zSafe = camera.distance + point.z;
    const perspective = camera.distance / Math.max(0.05, zSafe);
    return {
      x: camera.cx + point.x * camera.scale * perspective,
      y: camera.cy - point.y * camera.scale * perspective,
      z: point.z,
    };
  }

  function drawFace(ctx, projected, indices, fillStyle, strokeStyle) {
    ctx.beginPath();
    ctx.moveTo(projected[indices[0]].x, projected[indices[0]].y);
    for (let i = 1; i < indices.length; i += 1) {
      ctx.lineTo(projected[indices[i]].x, projected[indices[i]].y);
    }
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }

  function cuboidVertices(box) {
    const { minX, minY, minZ, maxX, maxY, maxZ } = box;
    return [
      { x: minX, y: minY, z: minZ },
      { x: maxX, y: minY, z: minZ },
      { x: maxX, y: minY, z: maxZ },
      { x: minX, y: minY, z: maxZ },
      { x: minX, y: maxY, z: minZ },
      { x: maxX, y: maxY, z: minZ },
      { x: maxX, y: maxY, z: maxZ },
      { x: minX, y: maxY, z: maxZ },
    ];
  }

  function drawCuboid(ctx, camera, box, palette, yaw, pitch) {
    const vertices = cuboidVertices(box);
    const rotated = vertices.map((vertex) => rotatePoint(vertex, yaw, pitch));
    const projected = rotated.map((vertex) => projectPoint(vertex, camera));

    drawFace(ctx, projected, [4, 5, 6, 7], palette.top, palette.stroke);
    drawFace(ctx, projected, [1, 2, 6, 5], palette.right, palette.stroke);
    drawFace(ctx, projected, [3, 2, 6, 7], palette.front, palette.stroke);
  }

  function drawWireframeCuboid(ctx, camera, box, yaw, pitch, stroke) {
    const vertices = cuboidVertices(box);
    const rotated = vertices.map((vertex) => rotatePoint(vertex, yaw, pitch));
    const projected = rotated.map((vertex) => projectPoint(vertex, camera));
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ];
    ctx.beginPath();
    edges.forEach((edge) => {
      ctx.moveTo(projected[edge[0]].x, projected[edge[0]].y);
      ctx.lineTo(projected[edge[1]].x, projected[edge[1]].y);
    });
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }

  function project3d(point, camera, yaw, pitch) {
    return projectPoint(rotatePoint(point, yaw, pitch), camera);
  }

  function drawDimensionLabel(ctx, width, height, start2d, end2d, label, options) {
    const color = options?.color || "rgba(24, 62, 50, 0.92)";
    const offsetPx = num(options?.offsetPx, 14);
    const labelOffsetPx = num(options?.labelOffsetPx, 9);
    const dx = end2d.x - start2d.x;
    const dy = end2d.y - start2d.y;
    const len = Math.hypot(dx, dy);
    if (!Number.isFinite(len) || len < 8) {
      return;
    }
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;
    const s = { x: start2d.x + nx * offsetPx, y: start2d.y + ny * offsetPx };
    const e = { x: end2d.x + nx * offsetPx, y: end2d.y + ny * offsetPx };

    ctx.lineWidth = 1.1;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(start2d.x, start2d.y);
    ctx.lineTo(s.x, s.y);
    ctx.moveTo(end2d.x, end2d.y);
    ctx.lineTo(e.x, e.y);
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(e.x, e.y);
    ctx.stroke();

    const tick = 4;
    ctx.beginPath();
    ctx.moveTo(s.x - nx * tick, s.y - ny * tick);
    ctx.lineTo(s.x + nx * tick, s.y + ny * tick);
    ctx.moveTo(e.x - nx * tick, e.y - ny * tick);
    ctx.lineTo(e.x + nx * tick, e.y + ny * tick);
    ctx.stroke();

    const mid = {
      x: (s.x + e.x) / 2 + nx * labelOffsetPx,
      y: (s.y + e.y) / 2 + ny * labelOffsetPx,
    };
    ctx.font = "600 11px Manrope, sans-serif";
    const textWidth = Math.max(18, ctx.measureText(label).width);
    const boxW = textWidth + 10;
    const boxH = 16;
    const boxX = clamp(mid.x - boxW / 2, 3, Math.max(3, width - boxW - 3));
    const boxY = clamp(mid.y - boxH / 2, 3, Math.max(3, height - boxH - 3));
    ctx.fillStyle = "rgba(248, 252, 251, 0.95)";
    ctx.strokeStyle = "rgba(41, 90, 74, 0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(boxX, boxY, boxW, boxH);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(18, 55, 43, 0.95)";
    ctx.textBaseline = "middle";
    ctx.fillText(label, boxX + 5, boxY + boxH / 2);
  }

  function drawDimensionAnnotations(ctx, camera, scene, yaw, pitch, width, height) {
    const carton = scene.cartonBox;
    const c = scene.cartonDimsCm;
    drawDimensionLabel(
      ctx,
      width,
      height,
      project3d({ x: carton.minX, y: carton.minY, z: carton.maxZ }, camera, yaw, pitch),
      project3d({ x: carton.maxX, y: carton.minY, z: carton.maxZ }, camera, yaw, pitch),
      `Umkarton L ${formatDim(c[0])} cm`,
      { offsetPx: 14, labelOffsetPx: 9 },
    );
    drawDimensionLabel(
      ctx,
      width,
      height,
      project3d({ x: carton.maxX, y: carton.minY, z: carton.minZ }, camera, yaw, pitch),
      project3d({ x: carton.maxX, y: carton.minY, z: carton.maxZ }, camera, yaw, pitch),
      `Umkarton B ${formatDim(c[1])} cm`,
      { offsetPx: -14, labelOffsetPx: 8 },
    );
    drawDimensionLabel(
      ctx,
      width,
      height,
      project3d({ x: carton.maxX, y: carton.minY, z: carton.maxZ }, camera, yaw, pitch),
      project3d({ x: carton.maxX, y: carton.maxY, z: carton.maxZ }, camera, yaw, pitch),
      `Umkarton H ${formatDim(c[2])} cm`,
      { offsetPx: 18, labelOffsetPx: 10 },
    );

    const highlight = scene.highlightBox;
    if (!highlight) {
      return;
    }
    const p = scene.productDimsCm;
    drawDimensionLabel(
      ctx,
      width,
      height,
      project3d({ x: highlight.minX, y: highlight.maxY, z: highlight.maxZ }, camera, yaw, pitch),
      project3d({ x: highlight.maxX, y: highlight.maxY, z: highlight.maxZ }, camera, yaw, pitch),
      `Produkt L ${formatDim(p[0])} cm`,
      { offsetPx: -12, labelOffsetPx: 8, color: "rgba(16, 73, 55, 0.95)" },
    );
    drawDimensionLabel(
      ctx,
      width,
      height,
      project3d({ x: highlight.maxX, y: highlight.maxY, z: highlight.minZ }, camera, yaw, pitch),
      project3d({ x: highlight.maxX, y: highlight.maxY, z: highlight.maxZ }, camera, yaw, pitch),
      `Produkt B ${formatDim(p[1])} cm`,
      { offsetPx: 12, labelOffsetPx: 8, color: "rgba(16, 73, 55, 0.95)" },
    );
    drawDimensionLabel(
      ctx,
      width,
      height,
      project3d({ x: highlight.maxX, y: highlight.minY, z: highlight.maxZ }, camera, yaw, pitch),
      project3d({ x: highlight.maxX, y: highlight.maxY, z: highlight.maxZ }, camera, yaw, pitch),
      `Produkt H ${formatDim(p[2])} cm`,
      { offsetPx: 14, labelOffsetPx: 8, color: "rgba(16, 73, 55, 0.95)" },
    );
  }

  function buildSceneModel(viewModel) {
    const layout = viewModel.layout;
    const renderLimit = viewModel.renderLimit;
    const placedUnits = Math.max(0, roundInt(layout.placedUnits, 0));
    const renderedUnits = Math.min(placedUnits, renderLimit);

    const cartonDimsCm = viewModel.cartonDimsCm;
    const orientationCm = Array.isArray(layout.orientationCm) && layout.orientationCm.length === 3
      ? layout.orientationCm
      : viewModel.unitDimsCm;

    const longestCartonAxis = Math.max(cartonDimsCm[0], cartonDimsCm[1], cartonDimsCm[2]);
    const worldScale = 2.2 / Math.max(1, longestCartonAxis);

    const carton = {
      x: cartonDimsCm[0] * worldScale,
      y: cartonDimsCm[2] * worldScale,
      z: cartonDimsCm[1] * worldScale,
    };
    const unit = {
      x: orientationCm[0] * worldScale,
      y: orientationCm[2] * worldScale,
      z: orientationCm[1] * worldScale,
    };

    const boxes = [];
    let index = 0;
    const startX = -carton.x / 2 + unit.x / 2;
    const startY = -carton.y / 2 + unit.y / 2;
    const startZ = -carton.z / 2 + unit.z / 2;
    for (let layer = 0; layer < layout.nz && index < renderedUnits; layer += 1) {
      for (let row = 0; row < layout.ny && index < renderedUnits; row += 1) {
        for (let col = 0; col < layout.nx && index < renderedUnits; col += 1) {
          const cx = startX + col * unit.x;
          const cy = startY + layer * unit.y;
          const cz = startZ + row * unit.z;
          boxes.push({
            minX: cx - unit.x / 2,
            maxX: cx + unit.x / 2,
            minY: cy - unit.y / 2,
            maxY: cy + unit.y / 2,
            minZ: cz - unit.z / 2,
            maxZ: cz + unit.z / 2,
            orderKey: cx + cy + cz,
            highlight: index === 0,
          });
          index += 1;
        }
      }
    }

    boxes.sort((left, right) => left.orderKey - right.orderKey);

    const highlightBox = boxes.find((box) => box.highlight) || null;

    return {
      cartonBox: {
        minX: -carton.x / 2,
        maxX: carton.x / 2,
        minY: -carton.y / 2,
        maxY: carton.y / 2,
        minZ: -carton.z / 2,
        maxZ: carton.z / 2,
      },
      boxes,
      highlightBox,
      renderedUnits,
      totalUnits: placedUnits,
      maxWorldAxis: Math.max(carton.x, carton.y, carton.z),
      cartonDimsCm: cartonDimsCm.slice(),
      productDimsCm: orientationCm.slice(),
    };
  }

  function mount(hostElement, viewModel, options) {
    if (!(hostElement instanceof HTMLElement)) {
      throw new Error("Packaging3D.mount requires a valid host element.");
    }

    const normalizedViewModel = viewModel && viewModel.layout ? viewModel : buildViewModel(viewModel);
    const layout = normalizedViewModel.layout;
    if (!layout || !layout.available) {
      throw new Error("Packaging3D.mount requires an available layout.");
    }

    const scopeKey = String(options?.scopeKey || "default");
    unmountAll(scopeKey);

    hostElement.innerHTML = "";
    const canvas = document.createElement("canvas");
    canvas.className = "packaging3d-canvas";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    hostElement.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context unavailable.");
    }

    const scene = buildSceneModel(normalizedViewModel);
    const interaction = {
      yaw: -0.72,
      pitch: 0.56,
      zoom: 0.84,
      dragging: false,
      lastX: 0,
      lastY: 0,
    };

    const paletteDefault = {
      top: "rgba(130, 197, 173, 0.88)",
      right: "rgba(95, 162, 138, 0.88)",
      front: "rgba(118, 182, 160, 0.9)",
      stroke: "rgba(30, 80, 64, 0.62)",
    };
    const paletteHighlight = {
      top: "rgba(59, 153, 120, 0.96)",
      right: "rgba(41, 118, 93, 0.96)",
      front: "rgba(53, 136, 107, 0.97)",
      stroke: "rgba(15, 55, 42, 0.9)",
    };

    let rafId = 0;
    let disposed = false;
    let resizeObserver = null;
    let pixelRatio = 1;

    const resize = () => {
      const width = Math.max(280, roundInt(hostElement.clientWidth, 320));
      const height = Math.max(220, roundInt(hostElement.clientHeight, 260));
      pixelRatio = Math.min(global.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * pixelRatio));
      canvas.height = Math.max(1, Math.floor(height * pixelRatio));
    };

    const draw = () => {
      if (disposed) {
        return;
      }
      const width = Math.max(1, canvas.width / Math.max(1, pixelRatio));
      const height = Math.max(1, canvas.height / Math.max(1, pixelRatio));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const camera = {
        cx: width / 2,
        cy: height / 2,
        distance: Math.max(3.6, scene.maxWorldAxis * 4.8),
        scale: Math.max(80, Math.min(width, height) * 0.34) * interaction.zoom,
      };

      drawCuboid(
        ctx,
        camera,
        scene.cartonBox,
        {
          top: "rgba(198, 235, 221, 0.12)",
          right: "rgba(174, 223, 205, 0.1)",
          front: "rgba(183, 229, 211, 0.11)",
          stroke: "rgba(64, 116, 97, 0.36)",
        },
        interaction.yaw,
        interaction.pitch,
      );
      scene.boxes.forEach((box) => {
        drawCuboid(
          ctx,
          camera,
          box,
          box.highlight ? paletteHighlight : paletteDefault,
          interaction.yaw,
          interaction.pitch,
        );
      });
      drawWireframeCuboid(ctx, camera, scene.cartonBox, interaction.yaw, interaction.pitch, "rgba(24, 71, 57, 0.78)");
      drawDimensionAnnotations(ctx, camera, scene, interaction.yaw, interaction.pitch, width, height);

      rafId = global.requestAnimationFrame(draw);
    };

    const onPointerDown = (event) => {
      interaction.dragging = true;
      interaction.lastX = event.clientX;
      interaction.lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event) => {
      if (!interaction.dragging) {
        return;
      }
      const dx = event.clientX - interaction.lastX;
      const dy = event.clientY - interaction.lastY;
      interaction.lastX = event.clientX;
      interaction.lastY = event.clientY;
      interaction.yaw += dx * 0.01;
      interaction.pitch = clamp(interaction.pitch + dy * 0.008, -1.2, 1.2);
    };

    const onPointerUp = (event) => {
      interaction.dragging = false;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    const onWheel = (event) => {
      event.preventDefault();
      const nextZoom = interaction.zoom * (1 - event.deltaY * 0.0012);
      interaction.zoom = clamp(nextZoom, 0.22, 2.4);
    };

    resize();
    draw();

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    global.addEventListener("resize", resize);

    if (typeof global.ResizeObserver !== "undefined") {
      resizeObserver = new global.ResizeObserver(() => resize());
      resizeObserver.observe(hostElement);
    }

    const handle = {
      scopeKey,
      hostElement,
      renderedUnits: scene.renderedUnits,
      totalUnits: scene.totalUnits,
      dependencyStatus: "loading",
      cleanup() {
        if (disposed) {
          return;
        }
        disposed = true;
        if (rafId) {
          global.cancelAnimationFrame(rafId);
        }
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointerleave", onPointerUp);
        canvas.removeEventListener("wheel", onWheel);
        global.removeEventListener("resize", resize);
        if (resizeObserver) {
          resizeObserver.disconnect();
          resizeObserver = null;
        }
        if (hostElement.contains(canvas)) {
          hostElement.removeChild(canvas);
        }
      },
    };

    ensureDependencies().then((result) => {
      handle.dependencyStatus = result?.available ? "ready" : "fallback";
    });

    if (!HANDLE_REGISTRY.has(scopeKey)) {
      HANDLE_REGISTRY.set(scopeKey, new Set());
    }
    HANDLE_REGISTRY.get(scopeKey).add(handle);

    return handle;
  }

  function unmount(handle) {
    if (!handle || typeof handle.cleanup !== "function") {
      return;
    }
    const scopeKey = handle.scopeKey;
    handle.cleanup();
    if (scopeKey && HANDLE_REGISTRY.has(scopeKey)) {
      HANDLE_REGISTRY.get(scopeKey).delete(handle);
      if (HANDLE_REGISTRY.get(scopeKey).size === 0) {
        HANDLE_REGISTRY.delete(scopeKey);
      }
    }
  }

  function unmountAll(scopeKey) {
    if (typeof scopeKey === "string") {
      const handles = HANDLE_REGISTRY.get(scopeKey);
      if (!handles) {
        return;
      }
      [...handles].forEach((handle) => unmount(handle));
      return;
    }
    [...HANDLE_REGISTRY.keys()].forEach((key) => {
      unmountAll(key);
    });
  }

  global.Packaging3D = {
    version: MODULE_VERSION,
    /**
     * Computes carton packing layout using deterministic orientation/raster logic.
     */
    computeLayout,
    /**
     * Builds a renderer-ready view model while preserving raw compute metadata.
     */
    buildViewModel,
    /**
     * Mounts a local 3D-like canvas renderer into the host element.
     */
    mount,
    /**
     * Unmounts a previously mounted render handle.
     */
    unmount,
    /**
     * Unmounts all mounted handles in a scope, or all scopes when omitted.
     */
    unmountAll,
  };
})(window);
