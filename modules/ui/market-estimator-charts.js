(function initAppMarketEstimatorCharts(global) {
  "use strict";

  const KEYWORD_KEYS = ["k1", "k2", "k3"];

  function num(value, fallback = Number.NaN) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
    return fallback;
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
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

  function clearNode(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function toFiniteValues(values) {
    return safeArray(values).map((value) => Number(value)).filter((value) => Number.isFinite(value));
  }

  function clamp(value, minValue, maxValue) {
    return Math.min(Math.max(value, minValue), maxValue);
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
    const decimalFmt = typeof options.formatDecimal === "function"
      ? options.formatDecimal
      : (value) => new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
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
      decimal: decimalFmt,
      percent: percentFmt,
    };
  }

  function createNoDataCard(title, message) {
    const card = createNode("article", "market-estimator-chart-card");
    const head = createNode("div", "market-estimator-chart-head");
    head.append(createNode("h6", "", title));
    card.append(head);
    const empty = createNode("p", "hint", message);
    card.append(empty);
    return card;
  }

  function svgTag(name) {
    return document.createElementNS("http://www.w3.org/2000/svg", name);
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

  function appendLegendItem(container, toneClass, label, value) {
    const item = createNode("li", "market-estimator-chart-legend-item");
    const swatch = createNode("span", `market-estimator-chart-swatch ${toneClass}`);
    const text = createNode("span", "market-estimator-chart-legend-label", label);
    const metric = createNode("strong", "", value);
    item.append(swatch, text, metric);
    container.append(item);
  }

  function renderPricePositionCard(result, fmt) {
    const price = result?.price ?? {};
    const marketMin = num(price.marketMin);
    const cap = num(price.highPriceCap);
    const basis = num(price.basisPrice);
    const start = num(price.startPrice);
    const p50 = num(price.priceAnchorP50Pack, num(result?.primaryKeyword?.p50Pack));

    if (!(marketMin > 0) || !(cap > 0) || !Number.isFinite(start)) {
      return createNoDataCard(
        "Preisposition im Marktkorridor",
        "Nicht genug Primärdaten für einen belastbaren Preis-Korridor.",
      );
    }

    const finitePoints = toFiniteValues([marketMin, cap, basis, start, p50]).filter((value) => value > 0);
    const rawMin = Math.min(...finitePoints);
    const rawMax = Math.max(...finitePoints);
    const domainMin = Math.max(0, Math.min(rawMin * 0.85, marketMin * 0.85));
    const domainMax = Math.max(rawMax * 1.08, cap * 1.05);
    const span = Math.max(0.0001, domainMax - domainMin);
    const scale = (value) => 18 + ((value - domainMin) / span) * 484;

    const card = createNode("article", "market-estimator-chart-card");
    const head = createNode("div", "market-estimator-chart-head");
    head.append(
      createNode("h6", "", "Preisposition im Marktkorridor"),
      createNode("small", "", "Markt-Min bis Cap mit Startpreis-Marker"),
    );
    card.append(head);

    const svg = svgTag("svg");
    svg.setAttribute("class", "market-estimator-bullet");
    svg.setAttribute("viewBox", "0 0 520 86");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Preisposition im Marktkorridor");

    appendSvgRect(svg, 18, 30, 484, 16, "track");
    appendSvgRect(svg, scale(domainMin), 30, Math.max(0, scale(marketMin) - scale(domainMin)), 16, "zone-low");
    appendSvgRect(svg, scale(marketMin), 30, Math.max(0, scale(cap) - scale(marketMin)), 16, "zone-market");

    const nearCapStart = Math.max(marketMin, cap * 0.95);
    appendSvgRect(svg, scale(nearCapStart), 30, Math.max(0, scale(cap) - scale(nearCapStart)), 16, "zone-near-cap");

    const markers = [
      { label: "Markt-Min", value: marketMin, className: "marker-min", radius: 2.2 },
      { label: "P50", value: p50, className: "marker-p50", radius: 2.2 },
      { label: "Basis", value: basis, className: "marker-basis", radius: 2.2 },
      { label: "Start", value: start, className: "marker-start", radius: 3.2 },
      { label: "Cap", value: cap, className: "marker-cap", radius: 2.2 },
    ].filter((marker) => Number.isFinite(marker.value) && marker.value > 0);

    markers.forEach((marker) => {
      const x = scale(marker.value);
      appendSvgLine(svg, x, 24, x, 52, marker.className);
      appendSvgCircle(svg, x, 38, marker.radius, marker.className);
    });
    card.append(svg);

    const legend = createNode("ul", "market-estimator-chart-legend");
    appendLegendItem(legend, "swatch-min", "Markt-Min", fmt.currency(marketMin));
    appendLegendItem(legend, "swatch-p50", "P50", Number.isFinite(p50) && p50 > 0 ? fmt.currency(p50) : "-");
    appendLegendItem(legend, "swatch-basis", "Basis", Number.isFinite(basis) && basis > 0 ? fmt.currency(basis) : "-");
    appendLegendItem(legend, "swatch-start", "Start", fmt.currency(start));
    appendLegendItem(legend, "swatch-cap", "Cap", fmt.currency(cap));
    card.append(legend);

    let positionLabel = "Im Korridor";
    let positionTone = "good";
    if (start < marketMin) {
      positionLabel = "Unter Markt-Min (sehr aggressiv)";
      positionTone = "warn";
    } else if (start >= cap * 0.95) {
      positionLabel = "Nahe Cap (Sichtbarkeitsrisiko)";
      positionTone = "danger";
    } else if (Number.isFinite(p50) && p50 > 0 && start <= p50 * 0.98) {
      positionLabel = "Unter P50 (aggressiv)";
      positionTone = "warn";
    }

    const badge = createNode("p", "market-estimator-chart-badge");
    badge.classList.add(`tone-${positionTone}`);
    badge.textContent = positionLabel;
    card.append(badge);

    return card;
  }

  function createShareRow(label, factorText, value, maxValue, isFinal = false) {
    const row = createNode("li", `market-estimator-share-row${isFinal ? " is-final" : ""}`);
    const head = createNode("div", "market-estimator-share-row-head");
    head.append(
      createNode("span", "", label),
      createNode("small", "", factorText),
    );
    const barWrap = createNode("div", "market-estimator-share-bar-wrap");
    const bar = createNode("div", "market-estimator-share-bar");
    const widthPct = maxValue > 0 ? clamp((num(value, 0) / maxValue) * 100, 0, 100) : 0;
    bar.style.width = `${widthPct}%`;
    barWrap.append(bar);
    const metric = createNode("strong", "", `${num(value, 0).toFixed(2)}%`);
    row.append(head, barWrap, metric);
    return row;
  }

  function renderShareCard(result) {
    const share = result?.share ?? {};
    const baseSharePct = num(share.baseSharePct, 0);
    const reviewFactor = num(share.reviewFactor, Number.NaN);
    const priceFactor = num(share.priceFactor, Number.NaN);
    const diffFactor = num(share.diffFactor, Number.NaN);
    const ppcFactor = num(share.ppcFactor, Number.NaN);
    const sharePct = num(share.sharePct, Number.NaN);
    const uncappedSharePct = num(share.uncappedSharePct, Number.NaN);
    const capApplied = Boolean(share.capApplied);

    if (!(baseSharePct > 0) || !Number.isFinite(sharePct)) {
      return createNoDataCard(
        "Share-Treiber",
        "Share konnte nicht berechnet werden. Prüfe Primärdaten und Core-Parameter.",
      );
    }

    const afterReview = baseSharePct * (Number.isFinite(reviewFactor) ? reviewFactor : 1);
    const afterPrice = afterReview * (Number.isFinite(priceFactor) ? priceFactor : 1);
    const afterDiff = afterPrice * (Number.isFinite(diffFactor) ? diffFactor : 1);
    const afterPpc = afterDiff * (Number.isFinite(ppcFactor) ? ppcFactor : 1);
    const uncapped = Number.isFinite(uncappedSharePct) ? uncappedSharePct : afterPpc;
    const maxValue = Math.max(1, uncapped, sharePct, 5);

    const card = createNode("article", "market-estimator-chart-card");
    const head = createNode("div", "market-estimator-chart-head");
    head.append(
      createNode("h6", "", "Share-Treiber"),
      createNode("small", "", "Multiplikative Wirkung der Faktoren auf Base-Share"),
    );
    card.append(head);

    const rows = createNode("ul", "market-estimator-share-list");
    rows.append(
      createShareRow("Base-Share", "A/B/C", baseSharePct, maxValue),
      createShareRow("Nach Review", `x ${Number.isFinite(reviewFactor) ? reviewFactor.toFixed(2) : "-"}`, afterReview, maxValue),
      createShareRow("Nach Preis", `x ${Number.isFinite(priceFactor) ? priceFactor.toFixed(2) : "-"}`, afterPrice, maxValue),
      createShareRow("Nach Differenzierung", `x ${Number.isFinite(diffFactor) ? diffFactor.toFixed(2) : "-"}`, afterDiff, maxValue),
      createShareRow("Nach PPC", `x ${Number.isFinite(ppcFactor) ? ppcFactor.toFixed(2) : "-"}`, afterPpc, maxValue),
      createShareRow("Endwert (gecappt)", capApplied ? "Cap 5%" : "kein Cap", sharePct, maxValue, true),
    );
    card.append(rows);

    const footer = createNode("div", "market-estimator-share-footer");
    footer.append(
      createNode("small", "", `Uncapped: ${Number.isFinite(uncapped) ? `${uncapped.toFixed(2)}%` : "-"}`),
      createNode("small", "", `Final: ${sharePct.toFixed(2)}%`),
    );
    if (capApplied) {
      const badge = createNode("span", "market-estimator-chart-chip tone-warn", "Share-Cap aktiv");
      footer.append(badge);
    }
    card.append(footer);

    return card;
  }

  function createFlowStep(label, value, maxValue, formatter) {
    const step = createNode("li", "market-estimator-flow-step");
    const head = createNode("div", "market-estimator-flow-head");
    head.append(
      createNode("span", "", label),
      createNode("strong", "", Number.isFinite(value) ? formatter(value) : "-"),
    );
    const barWrap = createNode("div", "market-estimator-flow-bar-wrap");
    const bar = createNode("div", "market-estimator-flow-bar");
    const widthPct = Number.isFinite(value) && maxValue > 0 ? clamp((value / maxValue) * 100, 0, 100) : 0;
    bar.style.width = `${widthPct}%`;
    barWrap.append(bar);
    step.append(head, barWrap);
    return step;
  }

  function renderMethodFlow(title, subtitle, steps, formatter) {
    const panel = createNode("article", "market-estimator-flow-panel");
    const head = createNode("header", "market-estimator-flow-panel-head");
    head.append(createNode("strong", "", title), createNode("small", "", subtitle));
    panel.append(head);

    const validStepValues = steps.map((step) => num(step.value)).filter((value) => Number.isFinite(value) && value > 0);
    if (validStepValues.length === 0) {
      panel.append(createNode("p", "hint", "Keine belastbaren Daten für diesen Pfad."));
      return panel;
    }
    const maxValue = Math.max(...validStepValues);
    const list = createNode("ol", "market-estimator-flow-list");
    steps.forEach((step) => {
      list.append(createFlowStep(step.label, num(step.value), maxValue, formatter));
    });
    panel.append(list);
    return panel;
  }

  function renderTamPathCard(result, fmt) {
    const competitor = result?.competitorMethod ?? {};
    const keywordMethod = result?.keywordMethod ?? {};
    const demand = result?.demand ?? {};
    const share = result?.share ?? {};

    const unitsCompetitor = num(demand.unitsCompetitorMethod);
    const unitsKeyword = num(demand.unitsKeywordMethod);
    const finalUnits = num(demand.finalUnits);

    const hasCompetitorPath = Number.isFinite(num(competitor.tamCompetitorRaw)) || Number.isFinite(unitsCompetitor);
    const hasKeywordPath = Number.isFinite(num(keywordMethod.tamKeywordsRaw)) || Number.isFinite(unitsKeyword);
    if (!hasCompetitorPath && !hasKeywordPath) {
      return createNoDataCard(
        "TAM-Pfad-Vergleich",
        "Weder Competitor- noch Keyword-TAM sind belastbar verfügbar.",
      );
    }

    const card = createNode("article", "market-estimator-chart-card");
    const head = createNode("div", "market-estimator-chart-head");
    head.append(
      createNode("h6", "", "TAM-Pfad-Vergleich"),
      createNode("small", "", "Dual-Flow mit konservativen Haircuts"),
    );
    card.append(head);

    const flowGrid = createNode("div", "market-estimator-flow-grid");

    const competitorSteps = [
      { label: "TAM raw", value: num(competitor.tamCompetitorRaw) },
      { label: "TAM nach Haircut (x0,75)", value: num(competitor.tamCompetitorAdjusted) },
      { label: `Units nach Share (${num(share.sharePct, 0).toFixed(2)}%)`, value: unitsCompetitor },
    ];
    flowGrid.append(
      renderMethodFlow("Pfad A: Competitor", "Skala innerhalb des Pfads", competitorSteps, fmt.number),
    );

    const keywordRows = safeArray(keywordMethod.keywordRows);
    const searchVolumeSum = keywordRows.reduce((sum, row) => sum + Math.max(0, num(row?.searchVolume, 0)), 0);
    const keywordSteps = [
      { label: "Suchvolumen aktiv", value: searchVolumeSum },
      { label: "TAM Käufe roh (CTR/CVR + Dedup)", value: num(keywordMethod.tamKeywordsRaw) },
      { label: "TAM nach Haircut (x0,8)", value: num(keywordMethod.tamKeywordsAdjusted) },
      { label: `Units nach Share (${num(share.sharePct, 0).toFixed(2)}%)`, value: unitsKeyword },
    ];
    flowGrid.append(
      renderMethodFlow("Pfad B: Keywords", "Skala innerhalb des Pfads", keywordSteps, fmt.number),
    );
    card.append(flowGrid);

    const final = createNode("div", "market-estimator-final-units");
    const left = createNode("div", "market-estimator-final-units-value");
    left.append(
      createNode("span", "", "Final Forecast (min)"),
      createNode("strong", "", Number.isFinite(finalUnits) ? `${fmt.number(finalUnits)} / Monat` : "-"),
    );
    final.append(left);

    let limiter = "Kein limitierender Pfad";
    if (Number.isFinite(unitsCompetitor) && Number.isFinite(unitsKeyword)) {
      limiter = unitsCompetitor <= unitsKeyword ? "Limitierer: Competitor-Methode" : "Limitierer: Keyword-Methode";
    } else if (Number.isFinite(unitsCompetitor)) {
      limiter = "Nur Competitor-Methode verfügbar";
    } else if (Number.isFinite(unitsKeyword)) {
      limiter = "Nur Keyword-Methode verfügbar";
    } else {
      limiter = "Keine belastbare Units-Schätzung";
    }
    final.append(createNode("small", "", limiter));
    card.append(final);

    return card;
  }

  function renderKeywordBoxplotRow(keywordKey, keywordState, anchor, fmt) {
    const samples = safeArray(keywordState?.priceSamplesUnitGross)
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);
    const sampleMin = samples.length > 0 ? Math.min(...samples) : Number.NaN;
    const sampleMax = samples.length > 0 ? Math.max(...samples) : Number.NaN;
    const p25 = num(anchor?.p25);
    const p50 = num(anchor?.p50);
    const p75 = num(anchor?.p75);
    const p90 = num(anchor?.p90);

    if (!(p25 > 0) || !(p50 > 0) || !(p75 > 0)) {
      return null;
    }

    let domainMin = Number.isFinite(sampleMin) ? sampleMin : p25;
    let domainMax = Number.isFinite(sampleMax)
      ? sampleMax
      : (p90 > 0 ? p90 : p75);
    if (!(domainMax > domainMin)) {
      domainMin = p25 * 0.9;
      domainMax = p75 * 1.1;
    }
    const span = Math.max(0.0001, domainMax - domainMin);
    const scale = (value) => 14 + ((value - domainMin) / span) * 320;

    const row = createNode("div", "market-estimator-boxplot-row");
    const rowHead = createNode("div", "market-estimator-boxplot-head");
    const name = keywordState?.label ? `${keywordKey.toUpperCase()} - ${keywordState.label}` : keywordKey.toUpperCase();
    const source = String(anchor?.source || "none");
    rowHead.append(
      createNode("strong", "", name),
      createNode("small", "", `Quelle: ${source} · Samples: ${num(anchor?.sampleCount, 0)}`),
    );
    row.append(rowHead);

    const svg = svgTag("svg");
    svg.setAttribute("class", "market-estimator-boxplot");
    svg.setAttribute("viewBox", "0 0 350 40");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", `Preisverteilung ${name}`);

    appendSvgLine(svg, scale(domainMin), 20, scale(domainMax), 20, "range");
    appendSvgRect(svg, scale(p25), 13, Math.max(2, scale(p75) - scale(p25)), 14, "iqr");
    appendSvgLine(svg, scale(p50), 11, scale(p50), 29, "median");
    appendSvgLine(svg, scale(domainMin), 16, scale(domainMin), 24, "tick");
    appendSvgLine(svg, scale(domainMax), 16, scale(domainMax), 24, "tick");
    if (Number.isFinite(sampleMin)) {
      appendSvgCircle(svg, scale(sampleMin), 20, 1.8, "sample");
    }
    if (Number.isFinite(sampleMax)) {
      appendSvgCircle(svg, scale(sampleMax), 20, 1.8, "sample");
    }
    if (p90 > 0) {
      appendSvgLine(svg, scale(p90), 12, scale(p90), 28, "p90");
    }
    row.append(svg);

    const meta = createNode("small", "market-estimator-boxplot-meta");
    const p90Text = p90 > 0 ? ` | P90 ${fmt.currency(p90)}` : "";
    meta.textContent = `P25 ${fmt.currency(p25)} | P50 ${fmt.currency(p50)} | P75 ${fmt.currency(p75)}${p90Text}`;
    row.append(meta);

    return row;
  }

  function renderKeywordDistributionCard(result, fmt) {
    const keywords = result?.input?.keywords ?? {};
    const anchors = result?.keywordAnchors ?? {};
    const activeKeywordKeys = KEYWORD_KEYS.filter((key) => {
      const keyword = keywords[key];
      return keyword && (key === "k1" || Boolean(keyword.enabled));
    });

    const card = createNode("article", "market-estimator-chart-card");
    const head = createNode("div", "market-estimator-chart-head");
    head.append(
      createNode("h6", "", "Keyword-Preisverteilung"),
      createNode("small", "", "Mini-Boxplots je aktivem Keyword"),
    );
    card.append(head);

    const list = createNode("div", "market-estimator-boxplot-list");
    let rowCount = 0;
    activeKeywordKeys.forEach((keywordKey) => {
      const row = renderKeywordBoxplotRow(keywordKey, keywords[keywordKey], anchors[keywordKey], fmt);
      if (row) {
        rowCount += 1;
        list.append(row);
      }
    });

    if (rowCount === 0) {
      card.append(createNode("p", "hint", "Keine belastbaren Quartile für aktive Keywords vorhanden."));
      return card;
    }

    card.append(list);
    return card;
  }

  function render(container, result, options = {}) {
    if (!container || !(container instanceof HTMLElement)) {
      return;
    }
    clearNode(container);
    const fmt = formatters(options);

    const cards = [
      renderPricePositionCard(result, fmt),
      renderShareCard(result),
      renderTamPathCard(result, fmt),
      renderKeywordDistributionCard(result, fmt),
    ];
    cards.forEach((card) => container.append(card));
  }

  global.AppMarketEstimatorCharts = Object.freeze({
    render,
  });
})(window);
