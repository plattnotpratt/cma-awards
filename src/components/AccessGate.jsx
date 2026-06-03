import { useEffect, useState } from "react";
import { getAccessStatus, getAccessToken, saveAccessToken, verifyAccessPassword } from "../api/access";

export default function AccessGate({ children }) {
  const [status, setStatus] = useState(() => (getAccessToken() ? "unlocked" : "checking"));
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unlocked") return undefined;

    let alive = true;

    async function checkAccess() {
      try {
        const data = await getAccessStatus();
        if (!alive) return;

        if (!data.enabled || getAccessToken()) {
          setStatus("unlocked");
          return;
        }

        setStatus("locked");
      } catch {
        if (!alive) return;
        setStatus("locked");
        setError("Unable to verify site access. Please try again.");
      }
    }

    checkAccess();

    return () => {
      alive = false;
    };
  }, [status]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const data = await verifyAccessPassword(password);

      if (data.token && data.expiresAt) {
        saveAccessToken(data.token, data.expiresAt);
      }

      setStatus("unlocked");
      setPassword("");
    } catch (err) {
      setError(err.message || "Invalid password");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "unlocked") return children;

  return (
    <>
      <div className="accessGate__backdrop" aria-hidden="true">
        {children}
      </div>
      <div className="accessGate" role="dialog" aria-modal="true" aria-labelledby="accessGate-title">
        <form className="accessGate__panel card" onSubmit={handleSubmit}>
          <h1 id="accessGate-title">Site Under Review</h1>
          <p>
            This site is under review, please provide a password or come back at a later time to view the awards.
          </p>
          <label className="accessGate__label" htmlFor="access-password">
            Password
          </label>
          <input
            id="access-password"
            className="input accessGate__input"
            type="password"
            value={password}
            autoComplete="current-password"
            autoFocus
            disabled={status === "checking" || submitting}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? <p className="accessGate__error">{error}</p> : null}
          <button className="accessGate__button" type="submit" disabled={status === "checking" || submitting || !password}>
            {submitting ? "Checking..." : "Enter Site"}
          </button>
        </form>
      </div>
    </>
  );
}
