export default function Loading({ label = "Loading..." }) {
  return (
    <div className="card">
      <div className="spinner" aria-hidden="true" />
      <div>{label}</div>
    </div>
  );
}
