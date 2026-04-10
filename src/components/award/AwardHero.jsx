import CategoryMarquee from "./CategoryMarquee";
import RecipientSpotlight from "./RecipientSpotlight";
import AwardRibbon from "./AwardRibbon";
import WinnerTicker from "./WinnerTicker";
import "./AwardHero.css";

export default function AwardHero({ hero }) {
  if (!hero) return null;

  const secondaryLine = hero.organization ?? hero.categoryPath ?? null;

  return (
    <section className="awardHero">
      <div className="awardHero__backdrop" aria-hidden="true">
        <div className="awardHero__beam awardHero__beam--left" />
        <div className="awardHero__beam awardHero__beam--right" />
        <div className="awardHero__sparkles" />
      </div>

      <div className="awardHero__content">
        <CategoryMarquee category={hero.categoryName} year={hero.year} path={hero.categoryPath} />
        <RecipientSpotlight title={hero.entryTitle} organization={secondaryLine} />
        <AwardRibbon label={hero.placement} isWinner={hero.isWinner} />
      </div>

      <WinnerTicker text={hero.placement} year={hero.year} />
    </section>
  );
}
