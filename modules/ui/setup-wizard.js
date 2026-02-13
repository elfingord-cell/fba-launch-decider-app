(function initAppSetupWizardUI(global) {
  "use strict";

  const FIELD_LABEL_BY_PATH = Object.freeze({
    "basic.priceGross": "Verkaufspreis brutto",
    "basic.category": "Kategorie",
    "basic.demandValue": "Absatzannahme",
    "basic.demandBasis": "Absatz-Basis",
    "basic.netWeightG": "Produktgewicht netto",
    "basic.packLengthCm": "Verpackung Laenge",
    "basic.packWidthCm": "Verpackung Breite",
    "basic.packHeightCm": "Verpackung Hoehe",
    "basic.unitsPerOrder": "Units pro Order",
    "basic.transportMode": "Transportmodus",
    "basic.exwUnit": "EXW pro Einheit",
    "basic.marketplace": "Marketplace",
    "basic.listingPackage": "Listing-Service",
    "basic.launchCompetition": "Nischenwettbewerb",
    "basic.launchBudgetTotal": "Launch-Budget gesamt",
  });

  function defaultIsFilled(value) {
    if (typeof value === "number") {
      return Number.isFinite(value) && value > 0;
    }
    if (typeof value === "string") {
      return value.trim().length > 0;
    }
    return Boolean(value);
  }

  function nonNegativeIsFilled(value) {
    return Number.isFinite(Number(value)) && Number(value) >= 0;
  }

  function createDefaultSteps() {
    return [
      {
        id: "market_absatz",
        title: "1 Markt/Absatz",
        required: [
          { path: "basic.priceGross" },
          { path: "basic.category" },
          { path: "basic.demandValue" },
          { path: "basic.demandBasis" },
        ],
        nextHint: "Preis, Kategorie und Absatz als Basis setzen.",
      },
      {
        id: "produkt_masse",
        title: "2 Produktmasse/Gewicht",
        required: [
          { path: "basic.netWeightG" },
          { path: "basic.packLengthCm" },
          { path: "basic.packWidthCm" },
          { path: "basic.packHeightCm" },
        ],
        nextHint: "Masse und Gewicht vollstaendig machen fuer Shipping/FBA.",
      },
      {
        id: "shipping_karton",
        title: "3 Shipping/Kartonisierung",
        required: [
          { path: "basic.unitsPerOrder" },
          { path: "basic.transportMode" },
        ],
        nextHint: "PO-Menge und Transportmodus bestaetigen.",
      },
      {
        id: "amazon_launch",
        title: "4 Amazon/Launch",
        required: [
          { path: "basic.exwUnit" },
          { path: "basic.marketplace" },
          { path: "basic.listingPackage" },
          { path: "basic.launchCompetition" },
          { path: "basic.launchBudgetTotal", isFilled: nonNegativeIsFilled },
        ],
        nextHint: "EXW, Marketplace und Launch-Annahmen setzen.",
      },
      {
        id: "ergebnischeck",
        title: "5 Ergebnischeck",
        required: [],
        completionRule: function completionRule(context) {
          return Number.isFinite(Number(context?.metrics?.totalCostPerUnit));
        },
        nextHint: "QuickCheck und Validation-Workflow auf Plausibilitaet pruefen.",
      },
    ];
  }

  function evaluateWizardSteps(steps, context) {
    const safeSteps = Array.isArray(steps) ? steps : [];
    const getByPath = typeof context?.getByPath === "function" ? context.getByPath : function () { return undefined; };
    const product = context?.product ?? {};

    return safeSteps.map(function mapStep(step) {
      const required = Array.isArray(step.required) ? step.required : [];
      const missing = [];
      let completeCount = 0;

      required.forEach(function eachRequired(item) {
        const path = item?.path;
        if (!path) {
          return;
        }
        const value = getByPath(product, path);
        const isFilled = typeof item?.isFilled === "function" ? item.isFilled(value, product, context) : defaultIsFilled(value);
        if (isFilled) {
          completeCount += 1;
        } else {
          missing.push({
            path,
            label: FIELD_LABEL_BY_PATH[path] || path,
          });
        }
      });

      const requiredCount = required.length;
      const requiredComplete = requiredCount === 0 ? true : missing.length === 0;
      const completionRulePassed = typeof step?.completionRule === "function" ? Boolean(step.completionRule(context)) : true;
      const complete = requiredComplete && completionRulePassed;

      return {
        id: step.id,
        title: step.title,
        nextHint: step.nextHint || "",
        requiredCount,
        completeCount,
        complete,
        missing,
        firstMissingPath: missing[0]?.path || null,
      };
    });
  }

  function inferActiveStepId(stepStates, currentActiveStepId) {
    if (!Array.isArray(stepStates) || stepStates.length === 0) {
      return null;
    }
    const current = stepStates.find(function findStep(step) {
      return step.id === currentActiveStepId;
    });
    if (current && !current.complete) {
      return current.id;
    }
    const firstIncomplete = stepStates.find(function findIncomplete(step) {
      return !step.complete;
    });
    return (firstIncomplete || stepStates[0]).id;
  }

  function buildNextHint(stepStates, activeStepId) {
    if (!Array.isArray(stepStates) || stepStates.length === 0) {
      return "";
    }
    const active = stepStates.find(function findStep(step) {
      return step.id === activeStepId;
    }) || stepStates[0];
    if (!active) {
      return "";
    }
    if (active.complete) {
      return "Schritt vollstaendig. Nimm den naechsten offenen Schritt oder pruefe die Ergebnisse.";
    }
    if (active.firstMissingPath) {
      const label = FIELD_LABEL_BY_PATH[active.firstMissingPath] || active.firstMissingPath;
      return "Naechster sinnvoller Input: " + label + ".";
    }
    return active.nextHint || "";
  }

  function renderWizard(container, payload) {
    if (!(container instanceof HTMLElement)) {
      return;
    }
    const stepStates = Array.isArray(payload?.stepStates) ? payload.stepStates : [];
    const activeStepId = payload?.activeStepId || null;
    const onActivateStep = typeof payload?.onActivateStep === "function" ? payload.onActivateStep : function () {};
    const onJumpPath = typeof payload?.onJumpPath === "function" ? payload.onJumpPath : function () {};

    container.innerHTML = "";

    stepStates.forEach(function renderStep(step) {
      const card = document.createElement("article");
      card.className = "setup-wizard-step";
      card.classList.add(step.complete ? "is-complete" : "is-incomplete");
      if (step.id === activeStepId) {
        card.classList.add("is-active");
      }

      const head = document.createElement("div");
      head.className = "setup-wizard-step-head";
      const title = document.createElement("p");
      title.className = "setup-wizard-step-title";
      title.textContent = step.title || "Schritt";
      const status = document.createElement("span");
      status.className = "setup-wizard-step-status " + (step.complete ? "complete" : "incomplete");
      status.textContent = step.complete ? "vollstaendig" : "offen";
      head.append(title, status);

      const meta = document.createElement("p");
      meta.className = "setup-wizard-step-meta";
      if (step.requiredCount > 0) {
        meta.textContent = String(step.completeCount) + "/" + String(step.requiredCount) + " Pflichtfelder";
      } else {
        meta.textContent = "Ergebnisstatus";
      }

      const actions = document.createElement("div");
      actions.className = "setup-wizard-step-actions";

      const activateBtn = document.createElement("button");
      activateBtn.type = "button";
      activateBtn.className = "setup-wizard-step-btn";
      activateBtn.textContent = step.id === activeStepId ? "Aktiver Schritt" : "Schritt aktivieren";
      activateBtn.disabled = step.id === activeStepId;
      activateBtn.addEventListener("click", function () {
        onActivateStep(step.id);
      });
      actions.appendChild(activateBtn);

      const jumpBtn = document.createElement("button");
      jumpBtn.type = "button";
      jumpBtn.className = "setup-wizard-step-btn is-primary";
      if (step.firstMissingPath) {
        const missingLabel = FIELD_LABEL_BY_PATH[step.firstMissingPath] || step.firstMissingPath;
        jumpBtn.textContent = "Zum Feld: " + missingLabel;
        jumpBtn.addEventListener("click", function () {
          onJumpPath(step.firstMissingPath, step.id);
        });
      } else {
        jumpBtn.textContent = "Schritt pruefen";
        jumpBtn.addEventListener("click", function () {
          onActivateStep(step.id);
        });
      }
      actions.appendChild(jumpBtn);

      card.append(head, meta, actions);
      container.appendChild(card);
    });
  }

  global.AppSetupWizardUI = Object.freeze({
    FIELD_LABEL_BY_PATH,
    createDefaultSteps,
    evaluateWizardSteps,
    inferActiveStepId,
    buildNextHint,
    renderWizard,
  });
})(window);
