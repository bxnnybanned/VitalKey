import { useMemo, useState } from "react";
import {
  fetchKioskPatient,
  fetchLatestKioskHealthRecord,
  registerKioskPatient,
  saveKioskHealthRecord,
} from "./api/kioskApi";

const appIcon = "/app_icon.png";

const sensorProfiles = {
  temperature_c: {
    title: "Body Temperature",
    menuLabel: "Body Temp",
    icon: "TEMP",
    accent: "orange",
    instructions: [
      "Stand facing the sensor.",
      "Aim your forehead at the sensor.",
      "Hold still until capture completes.",
    ],
    read: async () => {
      await wait(1800);
      return { temperature_c: "36.8" };
    },
  },
  blood_pressure: {
    title: "Blood Pressure",
    menuLabel: "Blood Pressure",
    icon: "BP",
    accent: "red",
    instructions: [
      "Insert left arm into the cuff.",
      "Position cuff above elbow.",
      "Stay still while the cuff inflates.",
    ],
    read: async () => {
      await wait(2400);
      return { systolic_bp: "138", diastolic_bp: "92" };
    },
  },
  height_cm: {
    title: "Height Measurement",
    menuLabel: "Height",
    icon: "HT",
    accent: "blue",
    instructions: [
      "Step into the height position.",
      "Remove footwear.",
      "Stand straight and look forward.",
    ],
    read: async () => {
      await wait(1800);
      return { height_cm: "162" };
    },
  },
  weight_kg: {
    title: "Weight Measurement",
    menuLabel: "Weight",
    icon: "WT",
    accent: "gold",
    instructions: [
      "Step onto the weighing platform.",
      "Keep both feet flat.",
      "Wait for the reading to stabilize.",
    ],
    read: async () => {
      await wait(1800);
      return { weight_kg: "74.2" };
    },
  },
  oxygen_level: {
    title: "Oxygen and Heart Rate",
    menuLabel: "Oxygen Level",
    icon: "O2",
    accent: "teal",
    instructions: [
      "Place your finger on the sensor.",
      "Keep your hand steady.",
      "Wait until the reading finishes.",
    ],
    read: async () => {
      await wait(2200);
      return { oxygen_saturation: "98", heart_rate: "82" };
    },
  },
};

const measurementOrder = [
  "temperature_c",
  "blood_pressure",
  "height_cm",
  "weight_kg",
  "oxygen_level",
];

const initialMeasurements = {
  height_cm: "",
  weight_kg: "",
  temperature_c: "",
  systolic_bp: "",
  diastolic_bp: "",
  oxygen_saturation: "",
  heart_rate: "",
};

const initialRegistration = {
  first_name: "",
  last_name: "",
  birthday: "",
  sex: "",
  mobile_number: "",
  address: "",
};

const todayIsoDate = new Date().toISOString().split("T")[0];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatFullName(patient) {
  return patient?.full_name || [patient?.first_name, patient?.last_name].filter(Boolean).join(" ");
}

function calculateBmi(heightCm, weightKg) {
  const height = Number(heightCm);
  const weight = Number(weightKg);
  if (!height || !weight) {
    return null;
  }

  const bmi = weight / ((height / 100) * (height / 100));
  return Number.isFinite(bmi) ? bmi.toFixed(1) : null;
}

function riskSummary(measurements, bmi) {
  const temp = Number(measurements.temperature_c);
  const systolic = Number(measurements.systolic_bp);
  const oxygen = Number(measurements.oxygen_saturation);
  const bmiValue = Number(bmi);

  if ((temp && temp >= 38) || (systolic && systolic >= 140) || (oxygen && oxygen < 93)) {
    return {
      label: "Moderate Risk",
      note: "Consult a physician as soon as possible.",
    };
  }

  if (bmiValue && bmiValue >= 25) {
    return {
      label: "Monitor Needed",
      note: "Follow up on blood pressure and weight management.",
    };
  }

  return {
    label: "Normal Range",
    note: "Readings are within the usual kiosk monitoring range.",
  };
}

function getBmiIndicator(bmi) {
  const bmiValue = Number(bmi);

  if (!bmiValue) {
    return "";
  }
  if (bmiValue < 18.5) {
    return "Underweight";
  }
  if (bmiValue < 25) {
    return "Normal";
  }
  if (bmiValue < 30) {
    return "Overweight";
  }
  return "Obese";
}

function getMeasureStatus(measureKey, measurements, bmi) {
  if (measureKey === "blood_pressure") {
    return measurements.systolic_bp !== "" && measurements.diastolic_bp !== "";
  }
  if (measureKey === "oxygen_level") {
    return measurements.oxygen_saturation !== "" && measurements.heart_rate !== "";
  }
  return measureKey === "bmi" ? Boolean(bmi) : measurements[measureKey] !== "";
}

function doneCount(measurements, bmi) {
  return measurementOrder.filter((key) => getMeasureStatus(key, measurements, bmi)).length;
}

function MeasurementIcon({ type, className = "" }) {
  if (type === "TEMP") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <rect x="26" y="10" width="12" height="30" rx="6" fill="none" stroke="currentColor" strokeWidth="4" />
        <circle cx="32" cy="48" r="10" fill="none" stroke="currentColor" strokeWidth="4" />
        <line x1="32" y1="22" x2="32" y2="46" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "BP") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <path d="M32 12c8 10 16 18 16 28a16 16 0 1 1-32 0c0-10 8-18 16-28Z" fill="currentColor" />
      </svg>
    );
  }

  if (type === "HT") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <path d="M18 10v44M18 16h10M18 26h8M18 36h10M18 46h8" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M40 14l10 10M50 14 40 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "WT") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <path d="M18 18h28l8 30H10l8-30Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
        <path d="M24 18a8 8 0 0 1 16 0" fill="none" stroke="currentColor" strokeWidth="4" />
        <path d="M32 26l6 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "O2") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <path d="M22 20c0-5 4-9 10-9s10 4 10 9v8" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <rect x="18" y="28" width="28" height="20" rx="10" fill="none" stroke="currentColor" strokeWidth="4" />
        <circle cx="50" cy="26" r="6" fill="none" stroke="currentColor" strokeWidth="4" />
      </svg>
    );
  }

  if (type === "HR") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <path d="M32 50 14 32a10 10 0 0 1 14-14l4 4 4-4a10 10 0 0 1 14 14Z" fill="currentColor" />
      </svg>
    );
  }

  if (type === "BMI") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <path d="M14 50V18M28 50V26M42 50V12M50 50H10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  return null;
}

function KioskUiIcon({ type, className = "" }) {
  if (type === "DOC") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <rect x="18" y="12" width="28" height="40" rx="8" fill="none" stroke="currentColor" strokeWidth="4" />
        <line x1="24" y1="24" x2="40" y2="24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="24" y1="34" x2="40" y2="34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="24" y1="44" x2="34" y2="44" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "ID") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <rect x="10" y="16" width="44" height="32" rx="8" fill="none" stroke="currentColor" strokeWidth="4" />
        <circle cx="24" cy="32" r="6" fill="none" stroke="currentColor" strokeWidth="4" />
        <line x1="36" y1="28" x2="46" y2="28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="36" y1="36" x2="46" y2="36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "USERPLUS") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <circle cx="24" cy="22" r="10" fill="none" stroke="currentColor" strokeWidth="4" />
        <path d="M10 50c2-9 10-14 18-14s16 5 18 14" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="50" y1="18" x2="50" y2="34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="42" y1="26" x2="58" y2="26" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "USER") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <circle cx="32" cy="22" r="10" fill="none" stroke="currentColor" strokeWidth="4" />
        <path d="M14 52c3-10 11-16 18-16s15 6 18 16" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "CALENDAR") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <rect x="12" y="16" width="40" height="34" rx="8" fill="none" stroke="currentColor" strokeWidth="4" />
        <line x1="12" y1="26" x2="52" y2="26" stroke="currentColor" strokeWidth="4" />
        <line x1="22" y1="10" x2="22" y2="20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="42" y1="10" x2="42" y2="20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "SEX") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <circle cx="26" cy="30" r="10" fill="none" stroke="currentColor" strokeWidth="4" />
        <line x1="33" y1="22" x2="48" y2="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="41" y1="10" x2="48" y2="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="48" y1="17" x2="48" y2="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "ADDRESS") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <path d="M32 54s14-13 14-24a14 14 0 1 0-28 0c0 11 14 24 14 24Z" fill="none" stroke="currentColor" strokeWidth="4" />
        <circle cx="32" cy="30" r="5" fill="none" stroke="currentColor" strokeWidth="4" />
      </svg>
    );
  }

  if (type === "PHONE") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <rect x="22" y="10" width="20" height="44" rx="8" fill="none" stroke="currentColor" strokeWidth="4" />
        <circle cx="32" cy="44" r="2.5" fill="currentColor" />
      </svg>
    );
  }

  return null;
}

function VitalKeyLogo({ size = "hero" }) {
  return (
    <img src={appIcon} alt="VitalKey logo" className={`vk-logo vk-logo-${size}`} />
  );
}

function KioskTopbar({ title, patientName }) {
  return (
    <div className="kiosk-topbar">
      <div className="kiosk-topbar-brand">
        <VitalKeyLogo size="mini" />
        <span>{title}</span>
      </div>
      {patientName ? <span>{patientName}</span> : null}
    </div>
  );
}

function WelcomeScreen({ onStart }) {
  return (
    <section className="kiosk-screen">
      <div className="kiosk-frame kiosk-welcome">
        <div className="kiosk-split">
          <div className="kiosk-brand">
            <VitalKeyLogo size="hero" />
            <h1>VitalKey Kiosk</h1>
            <p>Health monitoring station</p>
          </div>
          <div className="kiosk-start-area">
            <span className="kiosk-mini-label">Tap to Begin</span>
            <button type="button" className="kiosk-primary-button kiosk-start-button" onClick={onStart}>
              Start
            </button>
            <div className="kiosk-online-dot">System Ready</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ConsentScreen({ termsAccepted, biometricAccepted, onToggle, onContinue }) {
  return (
    <section className="kiosk-screen">
      <div className="kiosk-frame">
        <KioskTopbar title="Terms and Conditions" />
        <div className="kiosk-content">
          <div className="kiosk-side-copy">
            <div className="kiosk-icon-block">
              <KioskUiIcon type="DOC" className="kiosk-ui-icon-svg" />
            </div>
            <h2>Please Read Carefully</h2>
            <p>Consent is required before you continue.</p>
          </div>
          <div className="kiosk-panel-card">
            <div className="kiosk-terms-box">
              <p>1. Data Collection and Privacy</p>
              <p>2. Consent</p>
              <p>3. Purpose of Use</p>
              <p>4. Accuracy Disclaimer</p>
            </div>
            <label className="kiosk-check-row">
              <input type="checkbox" checked={termsAccepted} onChange={() => onToggle("terms")} />
              <span>I agree to the terms and privacy policy.</span>
            </label>
            <label className="kiosk-check-row">
              <input
                type="checkbox"
                checked={biometricAccepted}
                onChange={() => onToggle("biometric")}
              />
              <span>I consent to biometric data collection.</span>
            </label>
            <button
              type="button"
              className="kiosk-primary-button"
              disabled={!termsAccepted || !biometricAccepted}
              onClick={onContinue}
            >
              I Agree and Continue
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function IdentifyScreen({
  selectedMode,
  onSelectMode,
  patientCode,
  onPatientCodeChange,
  onLookup,
  lookupLoading,
  lookupError,
  registration,
  onRegistrationChange,
  onRegisterNewPatient,
  registrationLoading,
  registrationError,
}) {
  return (
    <section className="kiosk-screen">
      <div className="kiosk-frame">
        <KioskTopbar title="Patient Registration" />
        <div className="kiosk-content kiosk-content-single">
          <div className="kiosk-panel-card kiosk-wide-card">
            <h2 className="kiosk-section-title">Choose Patient Type</h2>
            <div className="kiosk-mode-grid">
              <button
                type="button"
                className={`kiosk-mode-card ${selectedMode === "existing" ? "kiosk-mode-card-active" : ""}`}
                onClick={() => onSelectMode("existing")}
              >
                <div className="kiosk-mode-card-icon">
                  <KioskUiIcon type="ID" className="kiosk-ui-icon-svg" />
                </div>
                <strong>I have a Patient ID</strong>
                <span>Continue with your existing health record.</span>
              </button>
              <button
                type="button"
                className={`kiosk-mode-card ${selectedMode === "new" ? "kiosk-mode-card-active" : ""}`}
                onClick={() => onSelectMode("new")}
              >
                <div className="kiosk-mode-card-icon kiosk-mode-card-icon-mint">
                  <KioskUiIcon type="USERPLUS" className="kiosk-ui-icon-svg" />
                </div>
                <strong>New Patient</strong>
                <span>Walk-in registration without creating an account.</span>
              </button>
            </div>

            {selectedMode === "existing" ? (
              <div className="kiosk-form-stack">
                <label className="kiosk-input-shell">
                  <span className="kiosk-input-icon">
                    <KioskUiIcon type="ID" className="kiosk-ui-icon-svg" />
                  </span>
                  <input
                    type="text"
                    value={patientCode}
                    onChange={(event) => onPatientCodeChange(event.target.value)}
                    className="kiosk-input"
                    placeholder="Enter Patient ID"
                  />
                </label>
                <button
                  type="button"
                  className="kiosk-primary-button"
                  onClick={onLookup}
                  disabled={lookupLoading}
                >
                  {lookupLoading ? "Checking..." : "Continue"}
                </button>
                {lookupError ? <div className="kiosk-error">{lookupError}</div> : null}
              </div>
            ) : (
              <div className="kiosk-form-grid">
                <label className="kiosk-input-shell">
                  <span className="kiosk-input-icon">
                    <KioskUiIcon type="USER" className="kiosk-ui-icon-svg" />
                  </span>
                  <input
                    type="text"
                    value={registration.first_name}
                    onChange={(event) => onRegistrationChange("first_name", event.target.value)}
                    className="kiosk-input"
                    placeholder="First Name"
                  />
                </label>
                <label className="kiosk-input-shell">
                  <span className="kiosk-input-icon">
                    <KioskUiIcon type="USER" className="kiosk-ui-icon-svg" />
                  </span>
                  <input
                    type="text"
                    value={registration.last_name}
                    onChange={(event) => onRegistrationChange("last_name", event.target.value)}
                    className="kiosk-input"
                    placeholder="Last Name"
                  />
                </label>
                <label className="kiosk-input-shell">
                  <span className="kiosk-input-icon">
                    <KioskUiIcon type="CALENDAR" className="kiosk-ui-icon-svg" />
                  </span>
                  <input
                    type="date"
                    value={registration.birthday}
                    onChange={(event) => onRegistrationChange("birthday", event.target.value)}
                    max={todayIsoDate}
                    className="kiosk-input"
                  />
                </label>
                <label className="kiosk-input-shell">
                  <span className="kiosk-input-icon">
                    <KioskUiIcon type="SEX" className="kiosk-ui-icon-svg" />
                  </span>
                  <select
                    value={registration.sex}
                    onChange={(event) => onRegistrationChange("sex", event.target.value)}
                    className="kiosk-input"
                  >
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </label>
                <label className="kiosk-input-shell kiosk-input-span">
                  <span className="kiosk-input-icon">
                    <KioskUiIcon type="ADDRESS" className="kiosk-ui-icon-svg" />
                  </span>
                  <input
                    type="text"
                    value={registration.address}
                    onChange={(event) => onRegistrationChange("address", event.target.value)}
                    className="kiosk-input kiosk-input-span"
                    placeholder="Address / City"
                  />
                </label>
                <label className="kiosk-input-shell kiosk-input-span">
                  <span className="kiosk-input-icon">
                    <KioskUiIcon type="PHONE" className="kiosk-ui-icon-svg" />
                  </span>
                  <input
                    type="text"
                    value={registration.mobile_number}
                    onChange={(event) => onRegistrationChange("mobile_number", event.target.value)}
                    className="kiosk-input kiosk-input-span"
                    placeholder="Contact Number (for kiosk record)"
                  />
                </label>
                <button
                  type="button"
                  className="kiosk-primary-button kiosk-input-span"
                  onClick={onRegisterNewPatient}
                  disabled={registrationLoading}
                >
                  {registrationLoading ? "Registering..." : "Submit and Start"}
                </button>
                {registrationError ? (
                  <div className="kiosk-error kiosk-input-span">{registrationError}</div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function AssessmentHub({ patient, measurements, latestRecord, onOpenMeasure, onOpenSummary }) {
  const bmi = calculateBmi(measurements.height_cm, measurements.weight_kg);
  const completed = doneCount(measurements, bmi);

  const cards = measurementOrder.map((key) => {
    const config = sensorProfiles[key];
    return {
      key,
      label: config.menuLabel,
      icon: config.icon,
      value: getMeasureStatus(key, measurements, bmi) ? "Done" : "Tap",
      done: getMeasureStatus(key, measurements, bmi),
    };
  });

  return (
    <section className="kiosk-screen">
      <div className="kiosk-frame">
        <KioskTopbar title="Health Assessment" patientName={formatFullName(patient)} />
        <div className="kiosk-hub">
          <div className="kiosk-hub-header">
            <div>
              <h2>Select a Measurement</h2>
              <p>Tap a measurement. The kiosk will read from the connected sensor flow.</p>
            </div>
            <div className="kiosk-progress-pill">{completed}/5</div>
          </div>

          <div className="kiosk-hub-grid">
            {cards.map((card) => (
              <button
                key={card.key}
                type="button"
                className={`kiosk-measure-card ${card.done ? "kiosk-measure-card-done" : ""}`}
                onClick={() => onOpenMeasure(card.key)}
              >
                <div className="kiosk-measure-icon-badge">
                  <MeasurementIcon type={card.icon} className="kiosk-measure-icon-svg" />
                </div>
                <strong>{card.label}</strong>
                <span>{card.value}</span>
              </button>
            ))}
          </div>

          {latestRecord ? (
            <div className="kiosk-inline-note">Latest saved record found for this patient.</div>
          ) : null}

          <div className="kiosk-actions kiosk-actions-right">
            <button
              type="button"
              className="kiosk-primary-button"
              onClick={onOpenSummary}
              disabled={completed === 0}
            >
              Health Summary
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function MeasurementScreen({ measureKey, measurements, scanState, onStartScan, onBack }) {
  const config = sensorProfiles[measureKey];
  const accentClass = `kiosk-measure-layout-${config.accent}`;

  let readingLabel = "Waiting for sensor";
  let readingValue = "Not captured";

  if (measureKey === "blood_pressure") {
    readingLabel = "Blood Pressure";
    readingValue =
      measurements.systolic_bp && measurements.diastolic_bp
        ? `${measurements.systolic_bp}/${measurements.diastolic_bp} mmHg`
        : "Not captured";
  } else if (measureKey === "oxygen_level") {
    readingLabel = "SpO2 / Heart Rate";
    readingValue =
      measurements.oxygen_saturation && measurements.heart_rate
        ? `${measurements.oxygen_saturation}% / ${measurements.heart_rate} bpm`
        : "Not captured";
  } else {
    const unitMap = {
      temperature_c: "C",
      height_cm: "cm",
      weight_kg: "kg",
    };
    readingLabel = config.title;
    readingValue = measurements[measureKey]
      ? `${measurements[measureKey]} ${unitMap[measureKey] || ""}`.trim()
      : "Not captured";
  }

  let statusText = "Ready to start";
  if (scanState.status === "scanning") {
    statusText = "Scanning in progress...";
  } else if (scanState.status === "done") {
    statusText = "Reading captured";
  }

  return (
    <section className="kiosk-screen">
      <div className={`kiosk-frame kiosk-measure-layout ${accentClass}`}>
        <div className="kiosk-topbar kiosk-topbar-measure">
          <div className="kiosk-topbar-brand">
            <VitalKeyLogo size="mini" />
            <span>{config.title}</span>
          </div>
          <button type="button" className="kiosk-back-button" onClick={onBack}>
            Back
          </button>
        </div>
        <div className="kiosk-measure-grid">
          <div className="kiosk-measure-side">
            <div className="kiosk-measure-icon">
              <MeasurementIcon type={config.icon} className="kiosk-measure-icon-symbol-svg" />
              <span>{config.menuLabel}</span>
            </div>
            <h2>{config.title}</h2>
            <div className="kiosk-reading-block">
              <span>{readingLabel}</span>
              <div className="kiosk-live-reading">{readingValue}</div>
              <small>{statusText}</small>
            </div>
            <button
              type="button"
              className="kiosk-primary-button kiosk-confirm-button"
              onClick={onStartScan}
              disabled={scanState.status === "scanning"}
            >
              {scanState.status === "scanning" ? "Scanning..." : "Start Scan"}
            </button>
            <button type="button" className="kiosk-secondary-button kiosk-confirm-button" onClick={onBack}>
              Confirm and Back to Menu
            </button>
          </div>

          <div className="kiosk-instruction-list">
            {config.instructions.map((instruction, index) => (
              <div key={instruction} className="kiosk-instruction-card">
                <span>{index + 1}</span>
                <div>
                  <strong>{instruction}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryScreen({ patient, measurements, onBack, onSave, saving, saveError }) {
  const bmi = calculateBmi(measurements.height_cm, measurements.weight_kg);
  const risk = riskSummary(measurements, bmi);
  const bmiIndicator = getBmiIndicator(bmi);

  const summaryTiles = [
    { label: "Temperature", value: measurements.temperature_c || "-", unit: "C", icon: "TEMP" },
    {
      label: "Blood Pressure",
      value:
        measurements.systolic_bp && measurements.diastolic_bp
          ? `${measurements.systolic_bp}/${measurements.diastolic_bp}`
          : "-",
      unit: "mmHg",
      icon: "BP",
    },
    { label: "Height", value: measurements.height_cm || "-", unit: "cm", icon: "HT" },
    { label: "Weight", value: measurements.weight_kg || "-", unit: "kg", icon: "WT" },
    { label: "BMI", value: bmi || "-", unit: "", icon: "BMI", note: bmiIndicator },
    { label: "SpO2", value: measurements.oxygen_saturation || "-", unit: "%", icon: "O2" },
    { label: "Heart Rate", value: measurements.heart_rate || "-", unit: "bpm", icon: "HR" },
  ];

  return (
    <section className="kiosk-screen">
      <div className="kiosk-frame">
        <KioskTopbar title="Health Summary Report" patientName={formatFullName(patient)} />

        <div className="kiosk-summary-grid">
          <div className="kiosk-risk-card">
            <strong>{risk.label}</strong>
            <span>{risk.note}</span>
          </div>
          <div className="kiosk-note-card">
            <strong>Note</strong>
            <span>
              Review the readings before ending the kiosk session. Medical
              decisions remain under healthcare professionals.
            </span>
          </div>
        </div>

        <div className="kiosk-summary-tiles">
          {summaryTiles.map((tile) => (
            <div key={tile.label} className="kiosk-summary-tile">
              <div className="kiosk-summary-tile-icon">
                <MeasurementIcon type={tile.icon} className="kiosk-summary-icon-svg" />
              </div>
              <span>{tile.label}</span>
              <strong>
                {tile.value} {tile.unit}
              </strong>
              {tile.note ? <small className="kiosk-summary-tile-note">{tile.note}</small> : null}
            </div>
          ))}
        </div>

        {saveError ? <div className="kiosk-error kiosk-summary-error">{saveError}</div> : null}

        <div className="kiosk-actions kiosk-actions-right">
          <button type="button" className="kiosk-secondary-button" onClick={onBack}>
            Back to Menu
          </button>
          <button type="button" className="kiosk-primary-button" onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Finish Session"}
          </button>
        </div>
      </div>
    </section>
  );
}

function CompleteScreen({ patient, onRestart }) {
  return (
    <section className="kiosk-screen">
      <div className="kiosk-frame kiosk-complete">
        <VitalKeyLogo size="large" />
        <h1>Session Complete</h1>
        <p>{formatFullName(patient)} has been saved successfully.</p>
        <button type="button" className="kiosk-primary-button" onClick={onRestart}>
          Back to Welcome
        </button>
      </div>
    </section>
  );
}

export default function App() {
  const [step, setStep] = useState("welcome");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [biometricAccepted, setBiometricAccepted] = useState(false);
  const [selectedMode, setSelectedMode] = useState("existing");
  const [patientCode, setPatientCode] = useState("");
  const [patient, setPatient] = useState(null);
  const [latestRecord, setLatestRecord] = useState(null);
  const [measurements, setMeasurements] = useState(initialMeasurements);
  const [registration, setRegistration] = useState(initialRegistration);
  const [activeMeasure, setActiveMeasure] = useState("temperature_c");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [registrationError, setRegistrationError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [scanState, setScanState] = useState({ status: "idle" });

  const patientBmi = useMemo(
    () => calculateBmi(measurements.height_cm, measurements.weight_kg),
    [measurements.height_cm, measurements.weight_kg],
  );

  const handleConsentToggle = (type) => {
    if (type === "terms") {
      setTermsAccepted((current) => !current);
      return;
    }
    setBiometricAccepted((current) => !current);
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setLookupError("");
    setRegistrationError("");
  };

  const handleRegistrationChange = (key, value) => {
    setRegistration((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleLookup = async () => {
    if (!patientCode.trim()) {
      setLookupError("Enter a valid Patient ID.");
      return;
    }

    try {
      setLookupLoading(true);
      setLookupError("");
      const patientData = await fetchKioskPatient(patientCode.trim());
      setPatient(patientData);

      try {
        const latest = await fetchLatestKioskHealthRecord(patientCode.trim());
        setLatestRecord(latest);
      } catch {
        setLatestRecord(null);
      }

      setStep("menu");
    } catch (error) {
      setLookupError(error.response?.data?.detail || "Patient not found.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleRegisterNewPatient = async () => {
    const payload = {
      first_name: registration.first_name.trim(),
      last_name: registration.last_name.trim(),
      birthday: registration.birthday,
      sex: registration.sex,
      mobile_number: registration.mobile_number.trim(),
      address: registration.address.trim() || null,
    };

    if (
      !payload.first_name ||
      !payload.last_name ||
      !payload.birthday ||
      !payload.sex ||
      !payload.mobile_number
    ) {
      setRegistrationError("Complete the required patient details first.");
      return;
    }

    if (payload.birthday > todayIsoDate) {
      setRegistrationError("Birthday cannot be later than today.");
      return;
    }

    try {
      setRegistrationLoading(true);
      setRegistrationError("");
      const patientData = await registerKioskPatient(payload);
      setPatient(patientData);
      setPatientCode(patientData.patient_id);
      try {
        const latest = await fetchLatestKioskHealthRecord(patientData.patient_id);
        setLatestRecord(latest);
      } catch {
        setLatestRecord(null);
      }
      setStep("menu");
    } catch (error) {
      setRegistrationError(
        error.response?.data?.detail || "Failed to register new patient.",
      );
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handleStartScan = async () => {
    const profile = sensorProfiles[activeMeasure];
    if (!profile) {
      return;
    }

    try {
      setScanState({ status: "scanning" });
      const result = await profile.read();
      setMeasurements((current) => ({
        ...current,
        ...result,
      }));
      setScanState({ status: "done" });
    } catch {
      setScanState({ status: "idle" });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError("");

      const payload = {
        patient_code: patient.patient_id,
        height_cm: measurements.height_cm === "" ? null : Number(measurements.height_cm),
        weight_kg: measurements.weight_kg === "" ? null : Number(measurements.weight_kg),
        temperature_c:
          measurements.temperature_c === "" ? null : Number(measurements.temperature_c),
        systolic_bp:
          measurements.systolic_bp === "" ? null : Number(measurements.systolic_bp),
        diastolic_bp:
          measurements.diastolic_bp === "" ? null : Number(measurements.diastolic_bp),
        oxygen_saturation:
          measurements.oxygen_saturation === ""
            ? null
            : Number(measurements.oxygen_saturation),
        heart_rate: measurements.heart_rate === "" ? null : Number(measurements.heart_rate),
      };

      await saveKioskHealthRecord(payload);
      setStep("complete");
    } catch (error) {
      setSaveError(error.response?.data?.detail || "Failed to save health record.");
    } finally {
      setSaving(false);
    }
  };

  const handleRestart = () => {
    setStep("welcome");
    setTermsAccepted(false);
    setBiometricAccepted(false);
    setSelectedMode("existing");
    setPatientCode("");
    setPatient(null);
    setLatestRecord(null);
    setMeasurements(initialMeasurements);
    setRegistration(initialRegistration);
    setActiveMeasure("temperature_c");
    setLookupError("");
    setRegistrationError("");
    setSaveError("");
    setScanState({ status: "idle" });
  };

  if (step === "welcome") {
    return <WelcomeScreen onStart={() => setStep("consent")} />;
  }

  if (step === "consent") {
    return (
      <ConsentScreen
        termsAccepted={termsAccepted}
        biometricAccepted={biometricAccepted}
        onToggle={handleConsentToggle}
        onContinue={() => setStep("identify")}
      />
    );
  }

  if (step === "identify") {
    return (
      <IdentifyScreen
        selectedMode={selectedMode}
        onSelectMode={handleModeSelect}
        patientCode={patientCode}
        onPatientCodeChange={setPatientCode}
        onLookup={handleLookup}
        lookupLoading={lookupLoading}
        lookupError={lookupError}
        registration={registration}
        onRegistrationChange={handleRegistrationChange}
        onRegisterNewPatient={handleRegisterNewPatient}
        registrationLoading={registrationLoading}
        registrationError={registrationError}
      />
    );
  }

  if (step === "menu" && patient) {
    return (
      <AssessmentHub
        patient={patient}
        measurements={measurements}
        latestRecord={latestRecord}
        onOpenMeasure={(key) => {
          setActiveMeasure(key);
          setScanState({ status: "idle" });
          setStep("measure");
        }}
        onOpenSummary={() => setStep("summary")}
      />
    );
  }

  if (step === "measure" && patient) {
    return (
      <MeasurementScreen
        measureKey={activeMeasure}
        measurements={measurements}
        scanState={scanState}
        onStartScan={handleStartScan}
        onBack={() => setStep("menu")}
      />
    );
  }

  if (step === "summary" && patient) {
    return (
      <SummaryScreen
        patient={patient}
        measurements={measurements}
        bmi={patientBmi}
        onBack={() => setStep("menu")}
        onSave={handleSave}
        saving={saving}
        saveError={saveError}
      />
    );
  }

  if (step === "complete" && patient) {
    return <CompleteScreen patient={patient} onRestart={handleRestart} />;
  }

  return null;
}
