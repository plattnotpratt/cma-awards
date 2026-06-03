import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ErrorState from "../components/ErrorState";
import Loading from "../components/Loading";
import CategoryResults from "../components/browser/CategoryResults";
import HierarchyPanel from "../components/browser/HierarchyPanel";
import SearchResults from "../components/browser/SearchResults";
import { useAwards } from "../hooks/useAwards";
import { buildAwardsHierarchy } from "../utils/awardHierarchy";

const HERO_SLIDES = [
  {
    image: "/cma-slider-awardWinner-01.jpg",
    alt: "Awards celebration slide one",
  },
  {
    image: "/cma-slider-awardWinner-03.jpg",
    alt: "Awards celebration slide two",
  },
  {
    image: "/cma-slider-awardWinner-02-selfie.jpg",
    alt: "Awards celebration slide three",
  },
  {
    image: "/cma-slider-awardWinner-01.jpg",
    alt: "Awards celebration slide four",
  },
];

export default function AwardsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const activeProgramName = searchParams.get("program") ?? "";
  const activeDivisionName = searchParams.get("division") ?? "";
  const activeCategoryName = searchParams.get("category") ?? "";

  const { awards, status, error } = useAwards("?startedAtUtc=2025-11-03T12%3A00%3A00Z&pageSize=1000");
  const [selectorPanelHeight, setSelectorPanelHeight] = useState(null);
  const searchInputRef = useRef(null);
  const programPanelRef = useRef(null);
  const divisionPanelRef = useRef(null);
  const categoryPanelRef = useRef(null);
  const resultsRef = useRef(null);

  const hierarchy = useMemo(() => buildAwardsHierarchy(awards, q), [awards, q]);
  const hasSearchQuery = q.trim().length > 0;

  const activeProgram = useMemo(() => {
    if (!activeProgramName) return null;
    return hierarchy.find((program) => program.name === activeProgramName) ?? null;
  }, [hierarchy, activeProgramName]);

  const activeDivision = useMemo(() => {
    if (!activeDivisionName) return null;
    const divisions = activeProgram?.divisions ?? [];
    return divisions.find((division) => division.name === activeDivisionName) ?? null;
  }, [activeProgram, activeDivisionName]);

  const activeCategory = useMemo(() => {
    if (!activeCategoryName) return null;
    const categories = activeDivision?.categories ?? [];
    return categories.find((category) => category.name === activeCategoryName) ?? null;
  }, [activeDivision, activeCategoryName]);

  useLayoutEffect(() => {
    if (status !== "success") return;
    searchInputRef.current?.focus({ preventScroll: true });
  }, [status]);

  useLayoutEffect(() => {
    function updateHeight() {
      const programHeight = programPanelRef.current?.offsetHeight ?? 0;
      setSelectorPanelHeight(programHeight > 0 ? programHeight : null);
    }

    updateHeight();

    if (typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(() => updateHeight());

    if (programPanelRef.current) observer.observe(programPanelRef.current);

    return () => observer.disconnect();
  }, [q, hierarchy.length]);

  function updateParams(next) {
    const merged = new URLSearchParams(searchParams);

    Object.entries(next).forEach(([key, value]) => {
      if (value) merged.set(key, value);
      else merged.delete(key);
    });

    setSearchParams(merged);
  }

  function scrollToNextSection(ref) {
    if (!window.matchMedia("(max-width: 900px)").matches) return;

    requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (status === "loading") return <Loading label="Loading awards hierarchy..." />;
  if (status === "error") return <ErrorState error={error} />;

  return (
    <section className="browserPage">
      <div className="browserHero card">
        <div className="browserHero__image" aria-hidden="true">
          <div className="browserHero__slider">
            {HERO_SLIDES.map((slide, index) => (
              <div
                className="browserHero__slide"
                key={slide.alt}
                style={slide.image ? { backgroundImage: `url(${slide.image})` } : undefined}
              >
                {!slide.image ? <span>{`Hero Image ${index + 1}`}</span> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="browserHero__content">
          <div className="browserHero__searchWrap">
          <input
            id="awards-search"
            ref={searchInputRef}
            className="input browserHero__searchInput"
            value={q}
            onChange={(event) => {
              updateParams({ q: event.target.value, program: "", division: "", category: "" });
            }}
            placeholder="Search awards, winners, publishers, categories..."
            aria-label="Search awards"
          />
          {q ? (
            <button
              className="browserHero__clearSearch"
              type="button"
              aria-label="Clear search"
              onClick={() => {
                updateParams({ q: "", program: "", division: "", category: "" });
                searchInputRef.current?.focus({ preventScroll: true });
              }}
            >
              Clear
            </button>
          ) : null}
          </div>
        </div>
      </div>

      <div className="browserWorkspace browserWorkspace--stacked">
        {!hasSearchQuery ? (
          <div className="browserGrid browserGrid--selectors">
            <HierarchyPanel
              panelRef={programPanelRef}
              title="Programs"
              items={hierarchy}
              activeValue={activeProgram?.name ?? ""}
              emptyLabel="No programs matched your search."
              getCountLabel={(item) => `${item.awardCount} entries`}
              onSelect={(programName) => {
                updateParams({ program: programName, division: "", category: "" });
                scrollToNextSection(divisionPanelRef);
              }}
              compact
            />

            <HierarchyPanel
              panelRef={divisionPanelRef}
              title="Divisions"
              items={activeProgram?.divisions ?? []}
              activeValue={activeDivision?.name ?? ""}
              emptyLabel="Select a program to browse its divisions."
              getCountLabel={(item) => `${item.awardCount} entries`}
              onSelect={(divisionName) => {
                updateParams({ division: divisionName, category: "" });
                scrollToNextSection(categoryPanelRef);
              }}
              scrollable
              style={selectorPanelHeight ? { height: `${selectorPanelHeight}px` } : undefined}
            />

            <HierarchyPanel
              panelRef={categoryPanelRef}
              title="Categories"
              items={activeDivision?.categories ?? []}
              activeValue={activeCategory?.name ?? ""}
              emptyLabel="Select a division to browse its categories."
              getCountLabel={(item) => `${item.awardCount} listed`}
              onSelect={(categoryName) => {
                updateParams({ category: categoryName });
                scrollToNextSection(resultsRef);
              }}
              scrollable
              style={selectorPanelHeight ? { height: `${selectorPanelHeight}px` } : undefined}
            />
          </div>
        ) : null}

        {hasSearchQuery ? (
          <SearchResults hierarchy={hierarchy} query={q} resultsRef={resultsRef} />
        ) : activeCategory ? (
          <CategoryResults category={activeCategory} resultsRef={resultsRef} />
        ) : null}
      </div>
    </section>
  );
}
