(function initAppCockpitCharts(global) {
  "use strict";

  function num(value, fallback = Number.NaN) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, minValue, maxValue) {
    return Math.min(Math.max(value, minValue), maxValue);
  }

  function clearNode(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function createNode(tagName, className = "", textContent = "") {
    const node = document.createElement(tagName);
    if (className) {
      node.className = className;
    }
    if (textContent) {
      node.textContent = textContent;
    }
    return node;
  }

  function svgTag(name) {
    return document.createElementNS("http://www.w3.org/2000/svg", name);
  }

  function formatters(options = {}) {
    const locale = typeof options.locale === "string" ? options.locale : "de-DE";
    const currency = typeof options.currency === "string" ? options.currency : "EUR";
    const currencyFmt = typeof options.formatCurrency === "function"
      ? options.formatCurrency
      : (value) => new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(num(value, 0));
    const numberFmt = typeof options.formatNumber === "function"
      ? options.formatNumber
      : (value) => new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
      }).format(num(value, 0));
    const percentFmt = typeof options.formatPercent === "function"
      ? options.formatPercent
      : (value) => `${new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(num(value, 0))}%`;
    return {
      currency: currencyFmt,
      number: numberFmt,
      percent: percentFmt,
    };
  }

  function noDataCard(title, reason) {
    const card = createNode("article", "cockpit-chart-card");
    const head = createNode("header", "cockpit-chart-head");
    head.append(
      createNode("h6", "", title),
      createNode("small", "", "Nicht genug Daten"),
    );
    card.append(head, createNode("p", "hint", reason));
    return card;
  }

  function createWaterfallStep(label, value, remaining, maxAbs, fmt, tone) {
    const row = createNode("li", `cockpit-waterfall-step ${tone}`);
    const head = createNode("div", "cockpit-waterfall-step-head");
    head.append(
      createNode("span", "", label),
      createNode("strong", "", `${value >= 0 ? "+" : "-"}${fmt.currency(Math.abs(value))}`),
    );
    const barWrap = createNode("div", "cockpit-waterfall-step-bar-wrap");
    const bar = createNode("div", "cockpit-waterfall-step-bar");
    const widthPct = maxAbs > 0 ? clamp((Math.abs(value) / maxAbs) * 100, 0, 100) : 0;
    bar.style.width = `${widthPct}%`;
    barWrap.append(bar);
    const foot = createNode("small", "", `Zwischenstand: ${fmt.currency(remaining)}`);
    row.append(head, barWrap, foot);
    return row;
  }

  function renderWaterfallCard(payload, fmt, compact = false) {
    const waterfall = payload?.waterfall ?? {};
    const startValue = num(waterfall.startValue);
    const endValue = num(waterfall.endValue);
    const blocks = Array.isArray(waterfall.blocks) ? waterfall.blocks : [];
    if (!Number.isFinite(startValue) || !Number.isFinite(endValue) || blocks.length === 0) {
      return noDataCard("Unit-Economics-Waterfall", "Preis- oder Kostenblockdaten fehlen.");
    }

    const card = createNode("article", "cockpit-chart-card cockpit-waterfall-card");
    const head = createNode("header", "cockpit-chart-head");
    head.append(
      createNode("h6", "", "Unit-Economics-Waterfall"),
      createNode("small", "", compact ? "EUR/Unit" : "Netto-Preis minus Kostenblöcke"),
    );
    card.append(head);

    const list = createNode("ol", "cockpit-waterfall-list");
    const maxAbs = Math.max(
      Math.abs(startValue),
      Math.abs(endValue),
      ...blocks.map((entry) => Math.abs(num(entry?.value, 0))),
      0.01,
    );

    let running = startValue;
    list.append(createWaterfallStep("Netto-Preis", startValue, running, maxAbs, fmt, "is-start"));

    blocks.forEach((entry) => {
      const blockValue = num(entry?.value, 0);
      running -= blockValue;
      list.append(createWaterfallStep(entry?.label || "Kostenblock", -blockValue, running, maxAbs, fmt, "is-cost"));
    });

    list.append(createWaterfallStep("Gewinn pro Unit", endValue, endValue, maxAbs, fmt, endValue >= 0 ? "is-profit" : "is-loss"));
    card.append(list);

    const reconciliationDelta = num(waterfall.reconciliationDelta, 0);
    const rec = createNode("p", "cockpit-waterfall-reconciliation");
    if (Math.abs(reconciliationDelta) > 0.02) {
      rec.classList.add("warn");
      rec.textContent = `Reconciliation-Hinweis: ${fmt.currency(reconciliationDelta)} Differenz durch Rundung/Modellgrenzen.`;
    } else {
      rec.textContent = "Reconciliation: konsistent innerhalb der Toleranz (<= 0,02 EUR).";
    }
    card.append(rec);

    return card;
  }

  function riskTone(value, minValue, targetValue) {
    if (!Number.isFinite(value)) {
      return "danger";
    }
    if (value < minValue) {
      return "danger";
    }
    if (value < targetValue) {
      return "warn";
    }
    return "ok";
  }

  function labelForRiskColor(color) {
    if (color === "green") {
      return "GRUEN";
    }
    if (color === "orange") {
      return "ORANGE";
    }
    return "ROT";
  }

  function renderRiskRow(row, fmt) {
    const value = num(row?.value);
    const minValue = num(row?.minValue);
    const targetValue = num(row?.targetValue);
    if (!Number.isFinite(value) || !Number.isFinite(minValue) || !Number.isFinite(targetValue)) {
      return null;
    }

    const rowNode = createNode("li", "cockpit-risk-row");
    const tone = riskTone(value, minValue, targetValue);
    rowNode.classList.add(`tone-${tone}`);

    const head = createNode("div", "cockpit-risk-row-head");
    head.append(
      createNode("span", "", row?.label || "KPI"),
      createNode("strong", "", fmt.percent(value)),
    );

    const track = createNode("div", "cockpit-risk-track");
    const domainMin = Math.min(0, minValue, value);
    const domainMax = Math.max(targetValue * 1.15, value, minValue + 0.0001);
    const span = Math.max(0.0001, domainMax - domainMin);
    const toPct = (entry) => clamp(((entry - domainMin) / span) * 100, 0, 100);

    const zoneDanger = createNode("div", "zone danger");
    zoneDanger.style.width = `${toPct(minValue)}%`;
    const zoneWarn = createNode("div", "zone warn");
    zoneWarn.style.width = `${Math.max(0, toPct(targetValue) - toPct(minValue))}%`;
    const zoneOk = createNode("div", "zone ok");
    zoneOk.style.width = `${Math.max(0, 100 - toPct(targetValue))}%`;
    track.append(zoneDanger, zoneWarn, zoneOk);

    const marker = createNode("span", "cockpit-risk-marker");
    marker.style.left = `${toPct(value)}%`;
    track.append(marker);

    const foot = createNode("small", "", `Min ${fmt.percent(minValue)} | Target ${fmt.percent(targetValue)}`);
    rowNode.append(head, track, foot);
    return rowNode;
  }

  function renderRiskCard(payload, fmt, compact = false) {
    const risk = payload?.risk ?? {};
    const rows = Array.isArray(risk.rows) ? risk.rows : [];
    if (rows.length === 0) {
      return noDataCard("Ampel-Risiko-Matrix", "Schwellwerte oder KPI-Daten fehlen.");
    }

    const card = createNode("article", "cockpit-chart-card cockpit-risk-card");
    const head = createNode("header", "cockpit-chart-head");
    head.append(
      createNode("h6", "", "Ampel-Risiko-Matrix"),
      createNode("small", "", compact ? "3 KPI vs Schwellwerte" : "Min/Target-Zonen je KPI"),
    );
    card.append(head);

    const list = createNode("ul", "cockpit-risk-list");
    rows.forEach((row) => {
      const rowNode = renderRiskRow(row, fmt);
      if (rowNode) {
        list.append(rowNode);
      }
    });
    if (!list.firstChild) {
      return noDataCard("Ampel-Risiko-Matrix", "KPI-Reihen nicht renderbar.");
    }
    card.append(list);

    const overall = risk.overall ?? {};
    const badge = createNode("p", "cockpit-risk-overall");
    const color = String(overall.color || "red");
    badge.classList.add(`tone-${color}`);
    badge.textContent = `Gesamt: ${labelForRiskColor(color)}${Number.isFinite(num(overall.score)) ? ` (Score ${num(overall.score, 0)}/6)` : ""}`;
    card.append(badge);

    return card;
  }

  function appendSvgLine(svg, x1, y1, x2, y2, className = "") {
    const line = svgTag("line");
    line.setAttribute("x1", String(x1));
    line.setAttribute("y1", String(y1));
    line.setAttribute("x2", String(x2));
    line.setAttribute("y2", String(y2));
    if (className) {
      line.setAttribute("class", className);
    }
    svg.append(line);
    return line;
  }

  function appendSvgRect(svg, x, y, width, height, className = "") {
    const rect = svgTag("rect");
    rect.setAttribute("x", String(x));
    rect.setAttribute("y", String(y));
    rect.setAttribute("width", String(Math.max(0, width)));
    rect.setAttribute("height", String(Math.max(0, height)));
    if (className) {
      rect.setAttribute("class", className);
    }
    svg.append(rect);
    return rect;
  }

  function appendSvgCircle(svg, cx, cy, radius, className = "") {
    const circle = svgTag("circle");
    circle.setAttribute("cx", String(cx));
    circle.setAttribute("cy", String(cy));
    circle.setAttribute("r", String(radius));
    if (className) {
      circle.setAttribute("class", className);
    }
    svg.append(circle);
    return circle;
  }

  function renderSensitivityCard(payload, fmt, compact = false) {
    const sensitivity = payload?.sensitivity ?? {};
    const base = num(sensitivity.base);
    const worst = num(sensitivity.worst);
    const best = num(sensitivity.best);
    const stresses = Array.isArray(sensitivity.stresses) ? sensitivity.stresses : [];

    const points = [base, worst, best, ...stresses.map((entry) => num(entry?.value))].filter((value) => Number.isFinite(value));
    if (points.length < 3 || !Number.isFinite(base) || !Number.isFinite(worst) || !Number.isFinite(best)) {
      return noDataCard("Sensitivity-Envelope", "Sensitivitätsdaten fehlen oder sind unvollständig.");
    }

    const card = createNode("article", "cockpit-chart-card cockpit-sensitivity-card");
    const head = createNode("header", "cockpit-chart-head");
    head.append(
      createNode("h6", "", "Sensitivity-Envelope"),
      createNode("small", "", compact ? "Gewinn/Monat" : "Worst bis Best mit Stressmarkern"),
    );
    card.append(head);

    const domainMin = Math.min(...points, 0);
    const domainMax = Math.max(...points, 0.0001);
    const span = Math.max(0.0001, domainMax - domainMin);
    const toX = (value) => 20 + ((value - domainMin) / span) * 480;

    const svg = svgTag("svg");
    svg.setAttribute("class", "cockpit-sensitivity-chart");
    svg.setAttribute("viewBox", "0 0 520 95");

    appendSvgLine(svg, 20, 50, 500, 50, "axis");
    if (domainMin < 0 && domainMax > 0) {
      appendSvgLine(svg, toX(0), 18, toX(0), 80, "zero");
    }

    appendSvgRect(svg, toX(Math.min(worst, best)), 38, Math.abs(toX(best) - toX(worst)), 24, "envelope");

    appendSvgCircle(svg, toX(base), 50, 4, "base");
    stresses.forEach((entry) => {
      const value = num(entry?.value);
      if (!Number.isFinite(value)) {
        return;
      }
      appendSvgCircle(svg, toX(value), 50, 3, `stress ${entry?.key || "stress"}`);
    });
    appendSvgCircle(svg, toX(worst), 50, 4, "bound worst");
    appendSvgCircle(svg, toX(best), 50, 4, "bound best");
    card.append(svg);

    const legend = createNode("ul", "cockpit-sensitivity-legend");
    const addLegend = (label, value, cls) => {
      const item = createNode("li", `cockpit-sensitivity-legend-item ${cls}`);
      item.append(createNode("span", "", label), createNode("strong", "", fmt.currency(value)));
      legend.append(item);
    };
    addLegend("Worst", worst, "worst");
    addLegend("Base", base, "base");
    addLegend("Best", best, "best");
    stresses.forEach((entry) => {
      const value = num(entry?.value);
      if (!Number.isFinite(value)) {
        return;
      }
      addLegend(entry?.label || "Stress", value, entry?.key || "stress");
    });
    card.append(legend);

    const warning = createNode("p", "cockpit-sensitivity-warning");
    if (worst <= 0) {
      warning.classList.add("warn");
      warning.textContent = "Warnung: Worst-Case faellt auf <= 0 EUR/Monat.";
    } else {
      warning.textContent = "Worst-Case bleibt ueber 0 EUR/Monat.";
    }
    card.append(warning);

    return card;
  }

  function renderParetoCard(payload, fmt, compact = false) {
    const pareto = payload?.pareto ?? {};
    const rows = Array.isArray(pareto.rows) ? pareto.rows : [];
    if (rows.length === 0) {
      return noDataCard("Top-Treiber-Pareto", "Keine belastbaren Kostenimpact-Daten verfuegbar.");
    }

    const card = createNode("article", "cockpit-chart-card cockpit-pareto-card");
    const head = createNode("header", "cockpit-chart-head");
    head.append(
      createNode("h6", "", "Top-Treiber-Pareto"),
      createNode("small", "", compact ? `Top ${rows.length}` : "Impact und kumulierter Anteil"),
    );
    card.append(head);

    const maxImpact = Math.max(...rows.map((row) => Math.abs(num(row?.impactMonthly, 0))), 0.01);
    const list = createNode("ol", "cockpit-pareto-list");
    rows.forEach((row) => {
      const impact = num(row?.impactMonthly, 0);
      const sharePct = num(row?.sharePct, 0);
      const cumulativePct = num(row?.cumulativePct, 0);

      const item = createNode("li", "cockpit-pareto-row");
      const rowHead = createNode("div", "cockpit-pareto-row-head");
      rowHead.append(
        createNode("span", "", row?.label || "Treiber"),
        createNode("strong", "", fmt.currency(impact)),
      );

      const barWrap = createNode("div", "cockpit-pareto-bar-wrap");
      const bar = createNode("div", "cockpit-pareto-bar");
      const widthPct = clamp((Math.abs(impact) / maxImpact) * 100, 0, 100);
      bar.style.width = `${widthPct}%`;
      barWrap.append(bar);

      const meta = createNode("small", "", `Anteil ${fmt.percent(sharePct)} | kumuliert ${fmt.percent(cumulativePct)}`);
      item.append(rowHead, barWrap, meta);
      list.append(item);
    });
    card.append(list);

    return card;
  }

  function render(container, payload, options = {}) {
    if (!(container instanceof HTMLElement)) {
      return;
    }
    clearNode(container);

    const fmt = formatters(options);
    const stage = payload?.stage === "quick" ? "quick" : "validation";
    const compact = stage === "quick";

    container.append(
      renderWaterfallCard(payload, fmt, compact),
      renderRiskCard(payload, fmt, compact),
      renderSensitivityCard(payload, fmt, compact),
      renderParetoCard(payload, fmt, compact),
    );
  }

  global.AppCockpitCharts = {
    render,
  };
})(window);
