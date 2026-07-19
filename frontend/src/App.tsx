import { useState } from "react";
import "./App.css";

type SendStatus =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "failed"; error: string };

const emptyForm = {
  name: "",
  age: "",
  sex: "",
  number: "",
  history: "",
  diagnosis: "",
  medicine: "",
};

function App() {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState<SendStatus>({ kind: "idle" });

  function updateField<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "sending" });

    try {
      const res = await fetch("/api/send-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, number: form.number }),
      });
      const data = await res.json();

      if (res.ok && data.status === "sent") {
        setStatus({ kind: "sent" });
        setForm(emptyForm);
      } else {
        setStatus({ kind: "failed", error: data.error ?? "Failed to send message." });
      }
    } catch {
      setStatus({ kind: "failed", error: "Could not reach the server." });
    }
  }

  return (
    <div className="page">
      <h1>Patient Intake</h1>
      <p className="subtitle">
        Save a patient visit and they'll get a WhatsApp message asking for a Google review.
      </p>

      <form onSubmit={handleSubmit} className="form">
        <label>
          Name
          <input
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
        </label>

        <div className="row">
          <label>
            Age
            <input
              type="number"
              min={0}
              value={form.age}
              onChange={(e) => updateField("age", e.target.value)}
            />
          </label>

          <label>
            Sex
            <select value={form.sex} onChange={(e) => updateField("sex", e.target.value)}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>

        <label>
          WhatsApp Number
          <input
            required
            placeholder="03011234567"
            value={form.number}
            onChange={(e) => updateField("number", e.target.value)}
          />
        </label>

        <label>
          History
          <textarea
            rows={2}
            value={form.history}
            onChange={(e) => updateField("history", e.target.value)}
          />
        </label>

        <label>
          Diagnosis
          <textarea
            rows={2}
            value={form.diagnosis}
            onChange={(e) => updateField("diagnosis", e.target.value)}
          />
        </label>

        <label>
          Medicine
          <textarea
            rows={2}
            value={form.medicine}
            onChange={(e) => updateField("medicine", e.target.value)}
          />
        </label>

        <button type="submit" disabled={status.kind === "sending"}>
          {status.kind === "sending" ? "Sending…" : "Save & Send Review Request"}
        </button>

        {status.kind === "sent" && <p className="status success">Review request sent ✅</p>}
        {status.kind === "failed" && <p className="status error">{status.error}</p>}
      </form>
    </div>
  );
}

export default App;
