(function initAppShippingDashboardUI(global) {
  "use strict";

  function num(value, fallback) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
    return Number.isFinite(fallback) ? fallback : 0;
  }

  function prepareDashboardModel(metrics, options, deps) {
    const contextStage = options?.contextStage || "quick";
    const show3dPackImage = options?.show3dPackImage ?? true;

    const shippingModeLabel = typeof deps?.shippingModeLabel === "function"
      ? deps.shippingModeLabel
      : function (modeKey) {
        return modeKey === "sea_lcl" ? "Sea LCL" : "Rail";
      };

    const modeLabel = metrics?.shipping?.modeLabel || shippingModeLabel(metrics?.shipping?.transportMode || metrics?.shipping?.modeKey);

    const bridgeModel = typeof global?.AppShippingDomain?.buildShippingBridgeModel === "function"
      ? global.AppShippingDomain.buildShippingBridgeModel(metrics)
      : {
        unitsPerPo: Math.max(1, num(metrics?.shipping?.unitsPerOrder, 1)),
        shippingD2dPerUnit: Math.max(0, num(metrics?.shipping?.shippingPerUnit, 0)),
        customsPerUnit: Math.max(0, num(metrics?.customsUnit, 0)),
        orderFixedPerUnit: Math.max(0, num(metrics?.orderFixedPerUnit, 0)),
        importSurchargesPerUnit: Math.max(0, num(metrics?.customsUnit, 0)) + Math.max(0, num(metrics?.orderFixedPerUnit, 0)),
        shippingTo3plPerUnit: Math.max(0, num(metrics?.quickBlockShippingTo3plPerUnit, 0)),
        shippingD2dTotalPo: Math.max(0, num(metrics?.shipping?.shippingTotal, 0)),
        importSurchargesTotalPo: 0,
        shippingTo3plTotalPo: 0,
        rawEquationDiff: 0,
        roundedEquationDiffCents: 0,
        equationMatchesRaw: true,
        equationMatchesRounded: true,
        equationMatches: true,
      };

    if (bridgeModel.importSurchargesTotalPo === 0) {
      bridgeModel.importSurchargesTotalPo = bridgeModel.importSurchargesPerUnit * bridgeModel.unitsPerPo;
    }
    if (bridgeModel.shippingTo3plTotalPo === 0) {
      bridgeModel.shippingTo3plTotalPo = bridgeModel.shippingD2dTotalPo + bridgeModel.importSurchargesTotalPo;
    }

    return {
      contextStage,
      show3dPackImage,
      modeLabel,
      bridge: bridgeModel,
    };
  }

  function buildBridgeFormulaText(model, formatCurrency) {
    if (typeof formatCurrency !== "function") {
      return "";
    }
    return (
      formatCurrency(model.shippingTo3plPerUnit) +
      " = " +
      formatCurrency(model.shippingD2dPerUnit) +
      " + " +
      formatCurrency(model.customsPerUnit) +
      " + " +
      formatCurrency(model.orderFixedPerUnit)
    );
  }

  function buildBridgePoText(model, formatCurrency) {
    if (typeof formatCurrency !== "function") {
      return "";
    }
    return (
      formatCurrency(model.shippingD2dTotalPo) +
      " + " +
      formatCurrency(model.importSurchargesTotalPo) +
      " = " +
      formatCurrency(model.shippingTo3plTotalPo)
    );
  }

  global.AppShippingDashboardUI = Object.freeze({
    prepareDashboardModel,
    buildBridgeFormulaText,
    buildBridgePoText,
  });
})(window);
