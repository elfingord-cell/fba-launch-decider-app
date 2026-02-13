(function initAppShippingDomain(global) {
  "use strict";

  function num(value, fallback) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
    return Number.isFinite(fallback) ? fallback : 0;
  }

  function roundInt(value, digits) {
    const safeDigits = Math.max(0, Number.isFinite(digits) ? digits : 0);
    const factor = 10 ** safeDigits;
    return Math.round(num(value, 0) * factor) / factor;
  }

  function toCurrencyCents(value) {
    return roundInt(num(value, 0) * 100, 0);
  }

  function buildShippingBridgeModel(metrics) {
    const shipping = metrics?.shipping ?? {};
    const unitsPerPo = Math.max(1, num(shipping.unitsPerOrder, 1));

    const shippingD2dPerUnit = Math.max(0, num(shipping.shippingPerUnit, 0));
    const customsPerUnit = Math.max(0, num(metrics?.customsUnit, 0));
    const orderFixedPerUnit = Math.max(0, num(metrics?.orderFixedPerUnit, 0));
    const importSurchargesPerUnit = customsPerUnit + orderFixedPerUnit;

    const shippingTo3plPerUnit = Math.max(
      0,
      num(metrics?.quickBlockShippingTo3plPerUnit, shippingD2dPerUnit + importSurchargesPerUnit),
    );

    const shippingD2dTotalPo = Math.max(0, num(shipping.shippingTotal, shippingD2dPerUnit * unitsPerPo));
    const importSurchargesTotalPo = importSurchargesPerUnit * unitsPerPo;
    const shippingTo3plTotalPo = shippingD2dTotalPo + importSurchargesTotalPo;

    const rawExpectedPerUnit = shippingD2dPerUnit + customsPerUnit + orderFixedPerUnit;
    const rawEquationDiff = Math.abs(rawExpectedPerUnit - shippingTo3plPerUnit);

    const roundedEquationDiffCents = Math.abs(
      (toCurrencyCents(shippingD2dPerUnit) + toCurrencyCents(customsPerUnit) + toCurrencyCents(orderFixedPerUnit)) -
      toCurrencyCents(shippingTo3plPerUnit),
    );

    const equationMatchesRaw = rawEquationDiff <= 0.0005;
    const equationMatchesRounded = roundedEquationDiffCents === 0;

    return {
      unitsPerPo,
      shippingD2dPerUnit,
      customsPerUnit,
      orderFixedPerUnit,
      importSurchargesPerUnit,
      shippingTo3plPerUnit,
      shippingD2dTotalPo,
      importSurchargesTotalPo,
      shippingTo3plTotalPo,
      rawEquationDiff,
      roundedEquationDiffCents,
      equationMatchesRaw,
      equationMatchesRounded,
      equationMatches: equationMatchesRaw && equationMatchesRounded,
    };
  }

  global.AppShippingDomain = Object.freeze({
    buildShippingBridgeModel,
  });
})(window);
