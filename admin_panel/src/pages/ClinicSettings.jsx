import { useEffect, useState } from "react";

import {
  getClinicSettings,
  updateClinicSetting,
} from "../api/clinicSettingsApi";

const formatTimeForInput = (timeValue) => {
  if (!timeValue) return "";
  return timeValue.slice(0, 5);
};

export default function ClinicSettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getClinicSettings();
      setSettings(
        data.map((item) => ({
          ...item,
          open_time: formatTimeForInput(item.open_time),
          close_time: formatTimeForInput(item.close_time),
        })),
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load clinic settings.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (id, field, value) => {
    setSettings((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const handleSave = async (setting) => {
    try {
      setSavingId(setting.id);
      setError("");
      setSuccess("");

      await updateClinicSetting(setting.id, {
        is_open: setting.is_open,
        open_time:
          setting.is_open && setting.open_time
            ? `${setting.open_time}:00`
            : null,
        close_time:
          setting.is_open && setting.close_time
            ? `${setting.close_time}:00`
            : null,
        slot_interval_minutes: Number(setting.slot_interval_minutes),
      });

      setSuccess(`${setting.day_of_week} clinic schedule updated successfully.`);
      await fetchSettings();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to update clinic setting.",
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="admin-page">
      <section className="admin-header">
        <h1 className="admin-title">Clinic Settings</h1>
        <p className="admin-subtitle">
          Configure clinic availability, operating hours, and slot intervals
          that control appointment booking across the platform.
        </p>
      </section>

      {error && <div className="admin-alert-error">{error}</div>}
      {success && <div className="admin-alert-success">{success}</div>}

      <section className="admin-card-strong">
        {loading ? (
          <p className="text-sm text-slate-500">Loading clinic settings...</p>
        ) : settings.length === 0 ? (
          <div className="admin-empty">
            No clinic settings found in the database.
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {settings.map((setting) => (
              <article key={setting.id} className="admin-card">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="admin-card-title">{setting.day_of_week}</h2>
                    <p className="admin-card-subtitle">
                      Configure availability and appointment slot interval.
                    </p>
                  </div>

                  <label className="admin-badge bg-slate-100 text-slate-700">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={setting.is_open}
                      onChange={(e) =>
                        handleChange(setting.id, "is_open", e.target.checked)
                      }
                    />
                    Open
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">
                      Opening Time
                    </label>
                    <input
                      type="time"
                      value={setting.open_time || ""}
                      disabled={!setting.is_open}
                      onChange={(e) =>
                        handleChange(setting.id, "open_time", e.target.value)
                      }
                      className="admin-input disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">
                      Closing Time
                    </label>
                    <input
                      type="time"
                      value={setting.close_time || ""}
                      disabled={!setting.is_open}
                      onChange={(e) =>
                        handleChange(setting.id, "close_time", e.target.value)
                      }
                      className="admin-input disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">
                      Slot Interval
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={setting.slot_interval_minutes}
                      onChange={(e) =>
                        handleChange(
                          setting.id,
                          "slot_interval_minutes",
                          e.target.value,
                        )
                      }
                      className="admin-input"
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSave(setting)}
                    disabled={savingId === setting.id}
                    className="admin-button"
                  >
                    {savingId === setting.id ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
