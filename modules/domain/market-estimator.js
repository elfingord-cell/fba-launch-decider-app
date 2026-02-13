(function initAppMarketEstimator(global) {
  "use strict";

  const KEYWORD_KEYS = ["k1", "k2", "k3"];
  const TARGET_POSITIONS = new Set(["1_3", "4_10", "11_20", "21_40"]);
  const UNIT_TYPES = new Set(["piece", "capsule", "ml_100", "gram_100", "meter2", "other"]);
  const INPUT_VIEWS = new Set(["quick", "pro"]);
  const LISTING_SCENARIOS = new Set(["new_listing", "existing_listing"]);
  const MARKET_MODES = new Set(["market_first"]);

  function num(value, fallback) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
    return Number.isFinite(fallback) ? fallback : 0;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(num(value, min), min), max);
  }

  function round(value, digits) {
    const factor = 10 ** Math.max(0, num(digits, 0));
    return Math.round(num(value, 0) * factor) / factor;
  }

  function cleanString(value, fallback = "") {
    if (typeof value !== "string") {
      return fallback;
    }
    return value.trim();
  }

  function nullableNumber(value, min = 0, max = 100) {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return clamp(parsed, min, max);
  }

  function sanitizeNumberList(rawValue) {
    const values = Array.isArray(rawValue)
      ? rawValue
      : typeof rawValue === "string"
        ? rawValue.split(/[,\n;]+/g)
        : [];
    return values
      .map((entry) => Number(entry))
      .filter((entry) => Number.isFinite(entry) && entry > 0)
      .map((entry) => round(entry, 4));
  }

  function defaultKeywordState(keywordKey) {
    return {
      enabled: keywordKey === "k1",
      label: "",
      searchVolume: 0,
      p25UnitGross: 0,
      p50UnitGross: 0,
      p75UnitGross: 0,
      p90UnitGross: 0,
      priceSamplesUnitGross: [],
      useManualQuartiles: false,
      medianReviewsTop10: 0,
      top3SalesSharePct: 0,
      tamCompetitorUnits: 0,
      amazonRetailTop10: false,
    };
  }

  function hasManualQuartiles(keyword) {
    if (!keyword || typeof keyword !== "object") {
      return false;
    }
    return (
      num(keyword.p25UnitGross, 0) > 0 &&
      num(keyword.p50UnitGross, 0) > 0 &&
      num(keyword.p75UnitGross, 0) > 0
    );
  }

  function sanitizeKeyword(rawKeyword, keywordKey) {
    const source = rawKeyword && typeof rawKeyword === "object" ? rawKeyword : {};
    const base = defaultKeywordState(keywordKey);
    const samples = sanitizeNumberList(source.priceSamplesUnitGross);
    const manualQuartilesPresent =
      num(source.p25UnitGross, 0) > 0 &&
      num(source.p50UnitGross, 0) > 0 &&
      num(source.p75UnitGross, 0) > 0;
    return {
      enabled: keywordKey === "k1" ? true : Boolean(source.enabled),
      label: cleanString(source.label, ""),
      searchVolume: Math.max(0, round(num(source.searchVolume, base.searchVolume), 0)),
      p25UnitGross: Math.max(0, round(num(source.p25UnitGross, base.p25UnitGross), 4)),
      p50UnitGross: Math.max(0, round(num(source.p50UnitGross, base.p50UnitGross), 4)),
      p75UnitGross: Math.max(0, round(num(source.p75UnitGross, base.p75UnitGross), 4)),
      p90UnitGross: Math.max(0, round(num(source.p90UnitGross, base.p90UnitGross), 4)),
      priceSamplesUnitGross: samples,
      useManualQuartiles:
        source.useManualQuartiles === undefined ? manualQuartilesPresent : Boolean(source.useManualQuartiles),
      medianReviewsTop10: Math.max(0, round(num(source.medianReviewsTop10, base.medianReviewsTop10), 0)),
      top3SalesSharePct: clamp(num(source.top3SalesSharePct, base.top3SalesSharePct), 0, 100),
      tamCompetitorUnits: Math.max(0, round(num(source.tamCompetitorUnits, base.tamCompetitorUnits), 2)),
      amazonRetailTop10: Boolean(source.amazonRetailTop10),
    };
  }

  function quantileLinear(sortedValues, q) {
    const n = sortedValues.length;
    if (n === 0) {
      return 0;
    }
    const position = (n - 1) * clamp(q, 0, 1);
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.ceil(position);
    if (lowerIndex === upperIndex) {
      return sortedValues[lowerIndex];
    }
    const ratio = position - lowerIndex;
    return sortedValues[lowerIndex] + (sortedValues[upperIndex] - sortedValues[lowerIndex]) * ratio;
  }

  function quartilesFromSamples(samples) {
    const normalized = sanitizeNumberList(samples).sort((a, b) => a - b);
    if (normalized.length === 0) {
      return {
        p25: 0,
        p50: 0,
        p75: 0,
        p90: 0,
        sampleCount: 0,
        isValid: false,
      };
    }
    const p25 = round(quantileLinear(normalized, 0.25), 4);
    const p50 = round(quantileLinear(normalized, 0.5), 4);
    const p75 = round(quantileLinear(normalized, 0.75), 4);
    const p90 = round(quantileLinear(normalized, 0.9), 4);
    return {
      p25,
      p50,
      p75,
      p90,
      sampleCount: normalized.length,
      isValid: p25 > 0 && p50 > 0 && p75 > 0,
    };
  }

  function resolveKeywordAnchor(keyword, inputView) {
    const manual = {
      p25: Math.max(0, round(num(keyword?.p25UnitGross, 0), 4)),
      p50: Math.max(0, round(num(keyword?.p50UnitGross, 0), 4)),
      p75: Math.max(0, round(num(keyword?.p75UnitGross, 0), 4)),
      p90: Math.max(0, round(num(keyword?.p90UnitGross, 0), 4)),
    };
    const manualValid = hasManualQuartiles(keyword);
    const samples = quartilesFromSamples(keyword?.priceSamplesUnitGross);
    const preferManual = Boolean(keyword?.useManualQuartiles) || inputView === "pro";

    if (preferManual && manualValid) {
      return {
        p25: manual.p25,
        p50: manual.p50,
        p75: manual.p75,
        p90: manual.p90,
        source: "manual",
        sampleCount: samples.sampleCount,
        manualValid,
      };
    }
    if (samples.isValid) {
      return {
        p25: samples.p25,
        p50: samples.p50,
        p75: samples.p75,
        p90: samples.p90 > 0 ? samples.p90 : manual.p90,
        source: "samples",
        sampleCount: samples.sampleCount,
        manualValid,
      };
    }
    if (manualValid) {
      return {
        p25: manual.p25,
        p50: manual.p50,
        p75: manual.p75,
        p90: manual.p90,
        source: "manual_fallback",
        sampleCount: samples.sampleCount,
        manualValid,
      };
    }
    return {
      p25: 0,
      p50: 0,
      p75: 0,
      p90: 0,
      source: "none",
      sampleCount: samples.sampleCount,
      manualValid,
    };
  }

  function sanitizeInput(rawInput) {
    const source = rawInput && typeof rawInput === "object" ? rawInput : {};
    const rawKeywords = source.keywords && typeof source.keywords === "object" ? source.keywords : {};

    const keywords = {};
    KEYWORD_KEYS.forEach((key) => {
      keywords[key] = sanitizeKeyword(rawKeywords[key], key);
    });
    keywords.k1.enabled = true;

    const hasAnyManualQuartiles = KEYWORD_KEYS.some((key) => hasManualQuartiles(keywords[key]));
    const inputView = INPUT_VIEWS.has(source.inputView)
      ? source.inputView
      : hasAnyManualQuartiles
        ? "pro"
        : "quick";
    const targetPosition = TARGET_POSITIONS.has(source.targetPosition90d) ? source.targetPosition90d : "11_20";
    const unitType = UNIT_TYPES.has(source.unitType) ? source.unitType : "piece";
    const listingScenario = LISTING_SCENARIOS.has(source.listingScenario) ? source.listingScenario : "new_listing";
    const mode = MARKET_MODES.has(source.mode) ? source.mode : "market_first";

    const listingSignals = source.listingSignals && typeof source.listingSignals === "object" ? source.listingSignals : {};
    const allowances = source.allowances && typeof source.allowances === "object" ? source.allowances : {};
    const expectedReviews90d =
      source.expectedReviews90d !== undefined ? source.expectedReviews90d : source.ownReviews30d;

    return {
      mode,
      inputView,
      unitType,
      unitsPerPack: Math.max(1, round(num(source.unitsPerPack, 1), 0)),
      differentiationScore: clamp(round(num(source.differentiationScore, 0), 0), 0, 3),
      ppcBudgetClass: clamp(round(num(source.ppcBudgetClass, 1), 0), 0, 2),
      listingScenario,
      expectedReviews90d: Math.max(0, round(num(expectedReviews90d, 0), 0)),
      existingListingReviews: Math.max(0, round(num(source.existingListingReviews, 0), 0)),
      targetPosition90d: targetPosition,
      listingSignals: {
        bestImage: Boolean(listingSignals.bestImage),
        imageSetInfographic: Boolean(listingSignals.imageSetInfographic),
        aPlus: Boolean(listingSignals.aPlus),
        uspCopy: Boolean(listingSignals.uspCopy),
      },
      economicsCheckEnabled: Boolean(source.economicsCheckEnabled),
      allowances: {
        returnsPct: nullableNumber(allowances.returnsPct, 0, 100),
        ppcPct: nullableNumber(allowances.ppcPct, 0, 100),
        overheadPct: nullableNumber(allowances.overheadPct, 0, 100),
        targetMarginPct: nullableNumber(allowances.targetMarginPct, 0, 100),
      },
      keywords,
      lastAppliedAt: source.lastAppliedAt ? String(source.lastAppliedAt) : null,
    };
  }

  function sanitizeContext(rawContext) {
    const source = rawContext && typeof rawContext === "object" ? rawContext : {};
    return {
      landedUnit: Math.max(0, num(source.landedUnit, 0)),
      fbaFeeUnit: Math.max(0, num(source.fbaFeeUnit, 0)),
      referralPct: clamp(num(source.referralPct, 0), 0, 100),
      defaultReturnsPct: clamp(num(source.defaultReturnsPct, 0), 0, 100),
      defaultPpcPct: clamp(num(source.defaultPpcPct, 0), 0, 100),
      defaultOverheadPct: clamp(num(source.defaultOverheadPct, 0), 0, 100),
      defaultTargetMarginPct: clamp(num(source.defaultTargetMarginPct, 0), 0, 100),
    };
  }

  function competitivenessClass(primaryKeyword, dispersion) {
    const medianReviews = num(primaryKeyword?.medianReviewsTop10, 0);
    const top3Share = num(primaryKeyword?.top3SalesSharePct, 0);

    if (medianReviews <= 300 && top3Share < 50 && dispersion >= 0.25) {
      return "A";
    }
    if (medianReviews >= 1000 || top3Share >= 65 || dispersion <= 0.15) {
      return "C";
    }
    return "B";
  }

  function baseShareByClass(competitiveness) {
    if (competitiveness === "A") {
      return 2.0;
    }
    if (competitiveness === "C") {
      return 0.5;
    }
    return 1.0;
  }

  function ctrByTargetPosition(positionKey) {
    if (positionKey === "1_3") {
      return 12;
    }
    if (positionKey === "4_10") {
      return 6;
    }
    if (positionKey === "21_40") {
      return 0.8;
    }
    return 2;
  }

  function cvrByListingStrength(strength) {
    if (strength === "strong") {
      return 12;
    }
    if (strength === "normal") {
      return 9;
    }
    return 6;
  }

  function dedupWeightByRank(rankIndex) {
    if (rankIndex <= 0) {
      return 1.0;
    }
    if (rankIndex <= 2) {
      return 0.6;
    }
    return 0.3;
  }

  function clampPrice(value, minValue, maxValue) {
    if (!Number.isFinite(value) || !Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
      return Number.NaN;
    }
    if (maxValue < minValue) {
      return minValue;
    }
    return Math.min(Math.max(value, minValue), maxValue);
  }

  function compute(rawInput, rawContext) {
    const input = sanitizeInput(rawInput);
    const context = sanitizeContext(rawContext);
    const flags = new Set();

    const keywordAnchors = {};
    KEYWORD_KEYS.forEach((key) => {
      keywordAnchors[key] = resolveKeywordAnchor(input.keywords[key], input.inputView);
    });

    const primaryKeyword = input.keywords.k1;
    const primaryAnchor = keywordAnchors.k1;
    const p25Unit = num(primaryAnchor.p25, 0);
    const p50Unit = num(primaryAnchor.p50, 0);
    const p75Unit = num(primaryAnchor.p75, 0);
    const p90Unit = num(primaryAnchor.p90, 0);
    const unitsPerPack = Math.max(1, num(input.unitsPerPack, 1));

    const hasPrimaryData = p25Unit > 0 && p50Unit > 0 && p75Unit > 0;
    if (!hasPrimaryData) {
      flags.add("INSUFFICIENT_PRIMARY_DATA");
    }

    const p25Pack = p25Unit * unitsPerPack;
    const p50Pack = p50Unit * unitsPerPack;
    const p75Pack = p75Unit * unitsPerPack;
    const p90Pack = p90Unit * unitsPerPack;

    const dispersion = hasPrimaryData && p50Unit > 0 ? (p75Unit - p25Unit) / p50Unit : Number.NaN;
    const competitiveness = competitivenessClass(primaryKeyword, Number.isFinite(dispersion) ? dispersion : 0.2);

    const capFromP90 = input.differentiationScore >= 2 && p90Unit > 0;
    const highPriceCap = capFromP90 ? p90Pack : p75Pack;
    if (!(highPriceCap > 0)) {
      flags.add("INSUFFICIENT_PRIMARY_DATA");
    }

    let basisPrice = Number.NaN;
    if (competitiveness === "A") {
      basisPrice = p50Pack * 0.98;
    } else if (competitiveness === "C") {
      basisPrice = p25Pack * 0.97;
    } else {
      basisPrice = p25Pack * 0.99;
    }

    if (!(basisPrice > 0)) {
      flags.add("INSUFFICIENT_PRIMARY_DATA");
    }

    const marketMin = p25Pack > 0 ? p25Pack * 0.97 : Number.NaN;
    const marketMax = highPriceCap;
    if (!(marketMin > 0)) {
      flags.add("INSUFFICIENT_PRIMARY_DATA");
    }
    const startPrice = clampPrice(basisPrice, marketMin, marketMax);
    const minPrice = marketMin;
    const maxPrice = marketMax;

    const effectiveOwnReviews = input.listingScenario === "existing_listing"
      ? input.existingListingReviews
      : input.expectedReviews90d;
    const reviewGapRaw = num(primaryKeyword.medianReviewsTop10, 0) / (Math.max(0, num(effectiveOwnReviews, 0)) + 1);
    const reviewGap = reviewGapRaw > 0 ? reviewGapRaw : 0;
    const reviewFactor = reviewGap > 0 ? Math.min(1, 1 / Math.sqrt(reviewGap)) : 1;

    const priceAnchor = p50Pack;
    const priceIndex = priceAnchor > 0 && Number.isFinite(startPrice) ? startPrice / priceAnchor : 1;
    let priceFactor = 1;
    if (priceIndex <= 0.98) {
      priceFactor = 1.1;
    } else if (priceIndex > 1.02) {
      priceFactor = 0.85;
    }

    const diffFactorMap = [0.85, 1.0, 1.1, 1.2];
    const ppcFactorMap = [0.85, 1.0, 1.15];
    const diffFactor = diffFactorMap[input.differentiationScore] ?? 1;
    const ppcFactor = ppcFactorMap[input.ppcBudgetClass] ?? 1;

    const baseSharePct = baseShareByClass(competitiveness);
    const uncappedSharePct = baseSharePct * reviewFactor * priceFactor * diffFactor * ppcFactor;
    const sharePct = Math.min(5, uncappedSharePct);
    const capApplied = uncappedSharePct > 5;
    const shareRatio = sharePct / 100;

    const competitorTamRaw = num(primaryKeyword.tamCompetitorUnits, 0);
    const competitorTamAdjusted = competitorTamRaw > 0 ? competitorTamRaw * 0.75 : Number.NaN;
    const unitsCompetitorMethod =
      Number.isFinite(competitorTamAdjusted) && competitorTamAdjusted > 0
        ? competitorTamAdjusted * shareRatio
        : Number.NaN;

    const listingStrengthScore =
      (input.listingSignals.bestImage ? 1 : 0) +
      (input.listingSignals.imageSetInfographic ? 1 : 0) +
      (input.listingSignals.aPlus ? 1 : 0) +
      (input.listingSignals.uspCopy ? 1 : 0) +
      (priceIndex <= 1 ? 1 : 0);

    const listingStrength =
      listingStrengthScore >= 4
        ? "strong"
        : listingStrengthScore === 3
          ? "normal"
          : "weak";
    const ctrPct = ctrByTargetPosition(input.targetPosition90d);
    const cvrPct = cvrByListingStrength(listingStrength);

    const activeKeywords = KEYWORD_KEYS
      .map((key) => ({ key, ...input.keywords[key] }))
      .filter((keyword) => keyword.enabled && keyword.searchVolume > 0)
      .sort((a, b) => num(b.searchVolume, 0) - num(a.searchVolume, 0));

    let tamKeywordWeightedRaw = 0;
    const keywordRows = activeKeywords.map((keyword, index) => {
      const purchasesRaw = num(keyword.searchVolume, 0) * (ctrPct / 100) * (cvrPct / 100);
      const dedupWeight = dedupWeightByRank(index);
      const purchasesWeighted = purchasesRaw * dedupWeight;
      tamKeywordWeightedRaw += purchasesWeighted;
      return {
        key: keyword.key,
        label: keyword.label,
        searchVolume: keyword.searchVolume,
        purchasesRaw,
        dedupWeight,
        purchasesWeighted,
      };
    });

    const tamKeywordsAdjusted = tamKeywordWeightedRaw > 0 ? tamKeywordWeightedRaw * 0.8 : Number.NaN;
    const unitsKeywordMethod =
      Number.isFinite(tamKeywordsAdjusted) && tamKeywordsAdjusted > 0
        ? tamKeywordsAdjusted * shareRatio
        : Number.NaN;

    const hasCompetitorUnits = Number.isFinite(unitsCompetitorMethod) && unitsCompetitorMethod > 0;
    const hasKeywordUnits = Number.isFinite(unitsKeywordMethod) && unitsKeywordMethod > 0;

    let finalUnits = Number.NaN;
    if (hasCompetitorUnits && hasKeywordUnits) {
      finalUnits = Math.min(unitsCompetitorMethod, unitsKeywordMethod);
    } else if (hasCompetitorUnits) {
      finalUnits = unitsCompetitorMethod;
    } else if (hasKeywordUnits) {
      finalUnits = unitsKeywordMethod;
    } else {
      flags.add("INSUFFICIENT_TAM_DATA");
    }

    if (Number.isFinite(dispersion) && dispersion <= 0.15 && num(primaryKeyword.medianReviewsTop10, 0) >= 1000) {
      flags.add("COMMODITY_DOMINANCE");
    }

    const hasAmazonRetailPressure = KEYWORD_KEYS.some((key) => {
      const keyword = input.keywords[key];
      return keyword.enabled && keyword.amazonRetailTop10;
    });
    if (hasAmazonRetailPressure) {
      flags.add("AMAZON_RETAIL_PRESSURE");
    }

    const returnsPct =
      input.allowances.returnsPct === null
        ? context.defaultReturnsPct
        : input.allowances.returnsPct;
    const ppcPct =
      input.allowances.ppcPct === null
        ? context.defaultPpcPct
        : input.allowances.ppcPct;
    const overheadPct =
      input.allowances.overheadPct === null
        ? context.defaultOverheadPct
        : input.allowances.overheadPct;
    const totalPct = context.referralPct + returnsPct + ppcPct + overheadPct;
    const denominator = 1 - totalPct / 100;
    const costBasePerPack = context.landedUnit + context.fbaFeeUnit;
    const breakEvenPrice = denominator > 0 ? costBasePerPack / denominator : Number.POSITIVE_INFINITY;
    const economicsEnabled = Boolean(input.economicsCheckEnabled);
    const economicsBelowBreakEven =
      economicsEnabled &&
      Number.isFinite(startPrice) &&
      Number.isFinite(breakEvenPrice) &&
      startPrice > 0 &&
      breakEvenPrice > 0 &&
      startPrice < breakEvenPrice;

    if (economicsEnabled) {
      if (!(denominator > 0)) {
        flags.add("ECONOMICS_INVALID_DENOMINATOR");
      } else if (economicsBelowBreakEven) {
        flags.add("ECONOMICS_WARNING_BELOW_BREAK_EVEN");
      }
    }

    return {
      input,
      context,
      keywordAnchors,
      primaryKeyword: {
        p25Unit,
        p50Unit,
        p75Unit,
        p90Unit,
        p25Pack,
        p50Pack,
        p75Pack,
        p90Pack,
        source: primaryAnchor.source,
        sampleCount: primaryAnchor.sampleCount,
        medianReviewsTop10: num(primaryKeyword.medianReviewsTop10, 0),
        top3SalesSharePct: num(primaryKeyword.top3SalesSharePct, 0),
        dispersion,
      },
      competitiveness,
      allowances: {
        referralPct: context.referralPct,
        returnsPct,
        ppcPct,
        overheadPct,
        targetMarginPct: context.defaultTargetMarginPct,
        totalPct,
      },
      price: {
        basisPrice,
        mvpPrice: breakEvenPrice,
        marketMin,
        highPriceCap,
        priceAnchorP50Pack: priceAnchor,
        startPrice,
        minPrice,
        maxPrice,
        capSource: capFromP90 ? "p90" : "p75",
      },
      share: {
        baseSharePct,
        reviewGap,
        reviewFactor,
        effectiveOwnReviews,
        priceIndex,
        priceFactor,
        diffFactor,
        ppcFactor,
        uncappedSharePct,
        capApplied,
        sharePct,
      },
      keywordMethod: {
        ctrPct,
        cvrPct,
        listingStrength,
        listingStrengthScore,
        keywordRows,
        tamKeywordsRaw: tamKeywordWeightedRaw,
        tamKeywordsAdjusted,
      },
      competitorMethod: {
        tamCompetitorRaw: competitorTamRaw,
        tamCompetitorAdjusted: competitorTamAdjusted,
      },
      demand: {
        unitsCompetitorMethod,
        unitsKeywordMethod,
        finalUnits,
      },
      market: {
        competitiveness,
        startPrice,
        marketMin,
        marketMax,
        basisPrice,
        capSource: capFromP90 ? "p90" : "p75",
        dispersion,
        sharePct,
        finalUnits,
      },
      economics: {
        enabled: economicsEnabled,
        costBasePerPack,
        referralPct: context.referralPct,
        returnsPct,
        ppcPct,
        overheadPct,
        totalPct,
        denominator,
        breakEvenPrice,
        isBelowBreakEven: economicsBelowBreakEven,
      },
      explain: {
        mode: input.mode,
        inputView: input.inputView,
        primaryAnchorSource: primaryAnchor.source,
      },
      flags: [...flags],
    };
  }

  global.AppMarketEstimator = Object.freeze({
    sanitizeInput,
    sanitizeContext,
    compute,
  });
})(window);
