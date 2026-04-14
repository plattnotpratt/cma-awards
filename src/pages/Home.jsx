import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section>
      <h1>Media Association Awards</h1>
      <p>Browse awards, nominees, winners, and yearly results.</p>
      <Link to="/awards">Go to awards</Link>
    </section>
  );
}
