export default function ErrorState({ error }) {
  return (
    <div className="card">
      <h2>Something went wrong</h2>
      <pre className="code">{String(error?.message ?? error)}</pre>
    </div>
  );
}
