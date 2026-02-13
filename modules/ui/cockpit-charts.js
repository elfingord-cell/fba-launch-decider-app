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

  function appendSvgText(svg, x, y, text, className = "", anchor = "middle") {
    const node = svgTag("text");
    node.setAttribute("x", String(x));
    node.setAttribute("y", String(y));
    node.setAttribute("text-anchor", anchor);
    if (className) {
      node.setAttribute("class", className);
    }
    node.textContent = text;
    svg.append(node);
    return node;
  }

  function extractCostSegments(payload, maxSegments = 4, targetTotal = Number.NaN) {
    const blocks = Array.isArray(payload?.waterfall?.blocks) ? payload.waterfall.blocks : [];
    const rows = blocks
      .map((entry) => ({
        label: entry?.label || "Kosten",
        value: Math.max(0, num(entry?.value, 0)),
      }))
      .filter((entry) => entry.value > 0)
      .sort((a, b) => b.value - a.value);

    const sourceRows = rows.length <= maxSegments
      ? rows
      : [
        ...rows.slice(0, maxSegments - 1),
        { label: "Sonstige", value: rows.slice(maxSegments - 1).reduce((sum, row) => sum + row.value, 0) },
      ];

    const sourceTotal = sourceRows.reduce((sum, row) => sum + row.value, 0);
    if (Number.isFinite(targetTotal) && targetTotal > 0 && sourceTotal > 0) {
      const scale = targetTotal / sourceTotal;
      return sourceRows.map((row) => ({
        ...row,
        value: row.value * scale,
      }));
    }
    return sourceRows;
  }

  function renderMiniWaterfallCard(payload, fmt) {
    const kpis = payload?.kpis ?? {};
    const waterfall = payload?.waterfall ?? {};
    const startValue = Number.isFinite(num(kpis.priceNet)) ? num(kpis.priceNet) : num(waterfall.startValue);
    const totalCostCanonical = Number.isFinite(num(kpis.totalCostPerUnit))
      ? num(kpis.totalCostPerUnit)
      : Number.NaN;
    const costs = extractCostSegments(payload, 4, totalCostCanonical);
    const derivedCostTotal = costs.reduce((sum, row) => sum + Math.max(0, num(row.value, 0)), 0);
    const effectiveCostTotal = Number.isFinite(totalCostCanonical) ? totalCostCanonical : derivedCostTotal;
    const endValueRaw = Number.isFinite(num(kpis.profitPerUnit))
      ? num(kpis.profitPerUnit)
      : startValue - effectiveCostTotal;
    const endValue = Number.isFinite(endValueRaw) ? endValueRaw : startValue - effectiveCostTotal;
    if (!Number.isFinite(startValue) || !Number.isFinite(endValue) || costs.length === 0) {
      return noDataCard("Waterfall", "Keine belastbaren Umsatz/Kostenwerte.");
    }

    const card = createNode("article", "cockpit-chart-card cockpit-mini-card cockpit-mini-waterfall-card");
    const head = createNode("header", "cockpit-chart-head");
    head.append(
      createNode("h6", "", "Waterfall (kompakt)"),
      createNode("small", "", "Netto-Umsatz -> Kosten/Unit -> Gewinn/Unit"),
    );
    card.append(head);

    const bars = [];
    bars.push({ label: "Umsatz", from: 0, to: startValue, kind: "start", raw: startValue });
    let running = startValue;
    costs.forEach((cost) => {
      const next = running - cost.value;
      bars.push({ label: cost.label, from: running, to: next, kind: "cost", raw: -cost.value });
      running = next;
    });
    bars.push({ label: "Gewinn", from: 0, to: endValue, kind: "end", raw: endValue });

    const allValues = bars.flatMap((entry) => [entry.from, entry.to]).filter((value) => Number.isFinite(value));
    const domainMin = Math.min(0, ...allValues);
    const domainMax = Math.max(...allValues, 0.0001);
    const span = Math.max(0.0001, domainMax - domainMin);
    const chartW = 520;
    const chartH = 190;
    const padL = 24;
    const padR = 10;
    const padT = 14;
    const padB = 44;
    const plotW = chartW - padL - padR;
    const plotH = chartH - padT - padB;
    const barWidth = Math.max(24, Math.min(54, plotW / (bars.length * 1.35)));
    const stepX = bars.length > 1 ? (plotW - barWidth) / (bars.length - 1) : 0;
    const y = (value) => padT + (1 - (value - domainMin) / span) * plotH;
    const yZero = y(0);

    const svg = svgTag("svg");
    svg.setAttribute("class", "cockpit-mini-waterfall-chart");
    svg.setAttribute("viewBox", `0 0 ${chartW} ${chartH}`);
    appendSvgLine(svg, padL, yZero, chartW - padR, yZero, "axis");

    bars.forEach((entry, index) => {
      const x = padL + index * stepX;
      const yFrom = y(entry.from);
      const yTo = y(entry.to);
      const top = Math.min(yFrom, yTo);
      const height = Math.max(2, Math.abs(yTo - yFrom));
      appendSvgRect(
        svg,
        x,
        top,
        barWidth,
        height,
        entry.kind === "start" ? "bar-start" : entry.kind === "end" ? "bar-end" : "bar-cost",
      );
      appendSvgText(
        svg,
        x + barWidth / 2,
        top - 4,
        `${entry.raw >= 0 ? "+" : ""}${Math.round(entry.raw * 100) / 100}`,
        "bar-value",
        "middle",
      );
      appendSvgText(svg, x + barWidth / 2, chartH - 20, entry.label, "bar-label", "middle");
    });

    card.append(svg);

    const refNote = createNode("p", "cockpit-mini-hint");
    const db1Text = Number.isFinite(num(kpis.db1Unit)) ? fmt.currency(num(kpis.db1Unit)) : "-";
    refNote.textContent = `Referenz: Kosten/Unit ${fmt.currency(effectiveCostTotal)} · Gewinn/Unit ${fmt.currency(endValue)} · DB1 (Decision-Bar) ${db1Text}`;
    card.append(refNote);
    return card;
  }

  function renderMiniPieCard(payload, fmt) {
    const kpis = payload?.kpis ?? {};
    const canonicalTotal = Number.isFinite(num(kpis.totalCostPerUnit)) ? num(kpis.totalCostPerUnit) : Number.NaN;
    const segments = extractCostSegments(payload, 5, canonicalTotal);
    const derivedTotal = segments.reduce((sum, entry) => sum + entry.value, 0);
    const total = Number.isFinite(canonicalTotal) ? canonicalTotal : derivedTotal;
    if (!(total > 0)) {
      return noDataCard("Kostenmix", "Keine Kostensegmente vorhanden.");
    }

    const card = createNode("article", "cockpit-chart-card cockpit-mini-card");
    const head = createNode("header", "cockpit-chart-head");
    head.append(
      createNode("h6", "", "Kostenmix (Pie)"),
      createNode("small", "", "Top-Treiber + Rest"),
    );
    card.append(head);

    const colors = ["#4c78a8", "#f28e2b", "#e15759", "#76b7b2", "#59a14f", "#edc949"];
    let cursor = 0;
    const gradientParts = segments.map((segment, index) => {
      const start = cursor;
      cursor += (segment.value / total) * 100;
      return `${colors[index % colors.length]} ${start}% ${cursor}%`;
    });

    const donutWrap = createNode("div", "cockpit-mini-donut-wrap");
    const donut = createNode("div", "cockpit-mini-donut");
    donut.style.background = `conic-gradient(${gradientParts.join(", ")})`;
    const center = createNode("div", "cockpit-mini-donut-center");
    center.innerHTML = `<strong>${fmt.currency(total)}</strong><small>Kosten/Unit</small>`;
    donut.append(center);
    donutWrap.append(donut);
    card.append(donutWrap);

    const legend = createNode("ul", "cockpit-mini-pie-legend");
    segments.forEach((segment, index) => {
      const share = (segment.value / total) * 100;
      const row = createNode("li", "cockpit-mini-pie-legend-row");
      const swatch = createNode("span", "cockpit-mini-swatch");
      swatch.style.background = colors[index % colors.length];
      const label = createNode("span", "", segment.label);
      const value = createNode("strong", "", `${fmt.percent(share)} · ${fmt.currency(segment.value)}`);
      row.append(swatch, label, value);
      legend.append(row);
    });
    card.append(legend);

    return card;
  }

  function renderMiniRiskCard(payload, fmt) {
    const rows = Array.isArray(payload?.risk?.rows) ? payload.risk.rows : [];
    if (rows.length === 0) {
      return noDataCard("Risiko", "Keine KPI-Risikowerte vorhanden.");
    }

    const card = createNode("article", "cockpit-chart-card cockpit-mini-card");
    const head = createNode("header", "cockpit-chart-head");
    head.append(
      createNode("h6", "", "Risiko-Ampel"),
      createNode("small", "", "3 KPI compact"),
    );
    card.append(head);

    const list = createNode("ul", "cockpit-mini-risk-list");
    rows.forEach((row) => {
      const value = num(row?.value, Number.NaN);
      const minValue = num(row?.minValue, Number.NaN);
      const targetValue = num(row?.targetValue, Number.NaN);
      if (!Number.isFinite(value) || !Number.isFinite(minValue) || !Number.isFinite(targetValue)) {
        return;
      }
      const tone = riskTone(value, minValue, targetValue);
      const item = createNode("li", `cockpit-mini-risk-row tone-${tone}`);
      const dot = createNode("span", "dot");
      const label = createNode("span", "label", row?.label || "KPI");
      const metric = createNode("strong", "", fmt.percent(value));
      item.append(dot, label, metric);
      list.append(item);
    });
    card.append(list);

    const overall = payload?.risk?.overall ?? {};
    const badge = createNode("p", `cockpit-risk-overall tone-${String(overall.color || "red")}`);
    badge.textContent = `Gesamt: ${labelForRiskColor(String(overall.color || "red"))}`;
    card.append(badge);

    return card;
  }

  function renderMiniSensitivityCard(payload, fmt) {
    const sensitivity = payload?.sensitivity ?? {};
    const base = num(sensitivity.base);
    const worst = num(sensitivity.worst);
    const best = num(sensitivity.best);
    if (!Number.isFinite(base) || !Number.isFinite(worst) || !Number.isFinite(best)) {
      return noDataCard("Sensitivity", "Keine Worst/Base/Best-Werte vorhanden.");
    }

    const card = createNode("article", "cockpit-chart-card cockpit-mini-card");
    const head = createNode("header", "cockpit-chart-head");
    head.append(
      createNode("h6", "", "Sensitivity (compact)"),
      createNode("small", "", "Gewinn / Monat"),
    );
    card.append(head);

    const domainMin = Math.min(worst, base, best, 0);
    const domainMax = Math.max(worst, base, best, 0.0001);
    const span = Math.max(0.0001, domainMax - domainMin);
    const toPct = (value) => clamp(((value - domainMin) / span) * 100, 0, 100);
    const lo = Math.min(toPct(worst), toPct(best));
    const hi = Math.max(toPct(worst), toPct(best));

    const track = createNode("div", "cockpit-mini-sensitivity-track");
    const range = createNode("div", "range");
    range.style.left = `${lo}%`;
    range.style.width = `${Math.max(2, hi - lo)}%`;
    const markerWorst = createNode("span", "marker worst");
    markerWorst.style.left = `${toPct(worst)}%`;
    const markerBase = createNode("span", "marker base");
    markerBase.style.left = `${toPct(base)}%`;
    const markerBest = createNode("span", "marker best");
    markerBest.style.left = `${toPct(best)}%`;
    track.append(range, markerWorst, markerBase, markerBest);
    card.append(track);

    const legend = createNode("ul", "cockpit-mini-sensitivity-legend");
    [
      { label: "Worst", value: worst, cls: "worst" },
      { label: "Base", value: base, cls: "base" },
      { label: "Best", value: best, cls: "best" },
    ].forEach((entry) => {
      const item = createNode("li", `cockpit-mini-sensitivity-item ${entry.cls}`);
      item.append(createNode("span", "", entry.label), createNode("strong", "", fmt.currency(entry.value)));
      legend.append(item);
    });
    card.append(legend);

    const explain = createNode("p", "cockpit-mini-hint");
    explain.textContent =
      "Abhängig von Stressannahmen: Preis -10%, TACoS +2pp, Absatz -10%. Worst kombiniert alle drei, Best ist die inverse Kombination.";
    card.append(explain);

    return card;
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
    const compact = Boolean(options.compact);
    if (compact) {
      container.append(
        renderMiniWaterfallCard(payload, fmt),
        renderMiniPieCard(payload, fmt),
        renderMiniRiskCard(payload, fmt),
        renderMiniSensitivityCard(payload, fmt),
      );
      return;
    }

    container.append(
      renderWaterfallCard(payload, fmt, false),
      renderRiskCard(payload, fmt, false),
      renderSensitivityCard(payload, fmt, false),
      renderParetoCard(payload, fmt, false),
    );
  }

  global.AppCockpitCharts = {
    render,
  };
})(window);
