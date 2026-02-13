(function initAppTooltipsUI(global) {
  "use strict";

  const SHIPPING_TOOLTIP_OVERRIDES = Object.freeze({
    "shipping.shipment_cbm":
      "Sendungsvolumen (CBM) = physische Kartons x Umkarton-CBM. Dieser Wert steuert bei Rail den variablen Vor- und Nachlauf.",
    "shipping.chargeable_cbm":
      "Abrechnungsvolumen (W/M-CBM) = max(Sendungsvolumen, Sendungsgewicht/1000). Dieser Wert steuert nur den variablen Hauptlauf.",
    "shipping.total_po": "Shipping D2D gesamt pro PO (ohne Zoll und ohne Order-Fix).",
    "shipping.per_unit": "Shipping D2D pro Unit (ohne Zoll und ohne Order-Fix).",
  });

  function shippingBasisHintLine() {
    return "Vorlauf/Nachlauf (Rail) nutzt Sendungsvolumen. Hauptlauf variabel nutzt Abrechnungsvolumen (W/M).";
  }

  function shippingBasisHintTitle() {
    return (
      "Sendungsvolumen = physische Kartons x Umkarton-CBM (echtes Volumen der Sendung). " +
      "Abrechnungsvolumen (W/M) = max(Sendungsvolumen, Sendungsgewicht/1000) und wird als Preisbasis fuer den variablen Hauptlauf genutzt."
    );
  }

  function shippingDownshiftHint(candidateUnits, finalUnits) {
    return (
      "Auto von " +
      String(candidateUnits) +
      " auf " +
      String(finalUnits) +
      " reduziert: Fuer den Kandidatenwert ist kein exaktes ganzzahliges Raster (nx x ny x nz) im zulaessigen Umkarton moeglich."
    );
  }

  function mergeShippingTooltipOverrides(baseMap) {
    const source = baseMap && typeof baseMap === "object" ? baseMap : {};
    return Object.assign({}, source, SHIPPING_TOOLTIP_OVERRIDES);
  }

  global.AppTooltipsUI = Object.freeze({
    SHIPPING_TOOLTIP_OVERRIDES,
    shippingBasisHintLine,
    shippingBasisHintTitle,
    shippingDownshiftHint,
    mergeShippingTooltipOverrides,
  });
})(window);
