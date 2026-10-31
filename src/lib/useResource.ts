import { useCallback, useEffect, useState } from "react";
import { useSession } from "./session";
export function useResource<T>(path: string | null) {
  const { request, profile } = useSession();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    let active = true;
    setData(null);
    setError(null);
    setLoading(Boolean(path));
    if (!path) return;
    void request<T>(path)
      .then((value) => {
        if (active) setData(value);
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : "Unable to load data");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path, request, profile?.id, version]);
  return { data, loading, error, reload, setData };
}
