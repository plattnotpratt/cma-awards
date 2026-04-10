import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import Loading from "../components/Loading";
import ErrorState from "../components/ErrorState";
import AwardHero from "../components/award/AwardHero";
import AwardDetails from "../components/award/AwardDetails";
import { useAward } from "../hooks/useAward";
import { buildAwardViewModel } from "../utils/awardViewModel";

export default function AwardDetail() {
  const { awardId } = useParams();
  const { award, status, error } = useAward(awardId);

  const viewModel = useMemo(() => buildAwardViewModel(award, awardId), [award, awardId]);

  if (status === "loading") return <Loading label="Preparing presentation..." />;
  if (status === "error") return <ErrorState error={error} />;

  if (!viewModel) {
    return (
      <section className="awardNotes">
        <p>Not found.</p>
        <Link to="/awards">Back to awards</Link>
      </section>
    );
  }

  return (
    <div className="awardDetailPage">
      <AwardHero hero={viewModel.hero} />
      <AwardDetails award={viewModel} />
    </div>
  );
}
