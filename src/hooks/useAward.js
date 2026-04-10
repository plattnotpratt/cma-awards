import { useCallback, useEffect, useState } from "react";
import { getAwardById } from "../api/awards";

export function useAward(awardId) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!awardId) return;

    let alive = true;

    async function run() {
      setStatus("loading");
      setError(null);
      try {
        const res = await getAwardById(awardId);
        if (!alive) return;
        setData(res);
        setStatus("success");
      } catch (err) {
        if (!alive) return;
        setError(err);
        setStatus("error");
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [awardId, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { award: data, status, error, reload };
}
