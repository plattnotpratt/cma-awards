import { useCallback, useEffect, useState } from "react";
import { getAwards } from "../api/awards";

export function useAwards(params = "") {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;

    async function run() {
      setStatus("loading");
      setError(null);
      try {
        const data = await getAwards(params);
        if (!alive) return;
        setItems(Array.isArray(data) ? data : data?.items ?? []);
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
  }, [params, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { awards: items, status, error, reload };
}
