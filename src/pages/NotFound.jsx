import { Link, useRouteError } from "react-router-dom";

export default function NotFound() {
  const err = useRouteError();
  return (
    <section>
      <h1>Page not found</h1>
      {err ? <pre className="code">{String(err?.statusText ?? err?.message ?? err)}</pre> : null}
      <Link to="/">Go home</Link>
    </section>
  );
}
