import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ErrorState from "../components/ErrorState";
import Loading from "../components/Loading";
import CategoryResults from "../components/browser/CategoryResults";
import HierarchyPanel from "../components/browser/HierarchyPanel";
import { useAwards } from "../hooks/useAwards";
import { buildAwardsHierarchy } from "../utils/awardHierarchy";

export default function AwardsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const activeProgramName = searchParams.get("program") ?? "";
  const activeDivisionName = searchParams.get("division") ?? "";
  const activeCategoryName = searchParams.get("category") ?? "";

  const { awards, status, error } = useAwards("?startedAtUtc=2025-11-03T12%3A00%3A00Z&pageSize=1000");
  const [categoryPanelHeight, setCategoryPanelHeight] = useState(null);
  const programPanelRef = useRef(null);
  const divisionPanelRef = useRef(null);

  const hierarchy = useMemo(() => buildAwardsHierarchy(awards, q), [awards, q]);

  const activeProgram = useMemo(() => {
    return hierarchy.find((program) => program.name === activeProgramName) ?? hierarchy[0] ?? null;
  }, [hierarchy, activeProgramName]);

  const activeDivision = useMemo(() => {
    const divisions = activeProgram?.divisions ?? [];
    return divisions.find((division) => division.name === activeDivisionName) ?? divisions[0] ?? null;
  }, [activeProgram, activeDivisionName]);

  const activeCategory = useMemo(() => {
    const categories = activeDivision?.categories ?? [];
    return categories.find((category) => category.name === activeCategoryName) ?? categories[0] ?? null;
  }, [activeDivision, activeCategoryName]);

  useLayoutEffect(() => {
    function updateHeight() {
      const programHeight = programPanelRef.current?.offsetHeight ?? 0;
      const divisionHeight = divisionPanelRef.current?.offsetHeight ?? 0;
      const nextHeight = Math.max(programHeight, divisionHeight);
      setCategoryPanelHeight(nextHeight > 0 ? nextHeight : null);
    }

    updateHeight();

    if (typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(() => updateHeight());

    if (programPanelRef.current) observer.observe(programPanelRef.current);
    if (divisionPanelRef.current) observer.observe(divisionPanelRef.current);

    return () => observer.disconnect();
  }, [activeProgram, activeDivision, q, hierarchy.length]);

  function updateParams(next) {
    const merged = new URLSearchParams(searchParams);

    Object.entries(next).forEach(([key, value]) => {
      if (value) merged.set(key, value);
      else merged.delete(key);
    });

    setSearchParams(merged);
  }

  if (status === "loading") return <Loading label="Loading awards hierarchy..." />;
  if (status === "error") return <ErrorState error={error} />;

  return (
    <section className="browserPage">
      <div className="browserHero card">
        <div className="row browserHero__row">
          <div>
            <p className="browserHero__eyebrow">Awards Browser</p>
            <h1>Program to Category View</h1>
            <p className="muted">
              Sample frontend organization for awards grouped as program, division, and category with winners listed in placement order.
            </p>
          </div>

          <input
            className="input"
            value={q}
            onChange={(event) => {
              updateParams({ q: event.target.value, program: "", division: "", category: "" });
            }}
            placeholder="Search across all programs..."
            aria-label="Search awards"
          />
        </div>
      </div>

      <div className="browserWorkspace browserWorkspace--stacked">
        <div className="browserGrid browserGrid--selectors">
          <HierarchyPanel
            panelRef={programPanelRef}
            title="Programs"
            items={hierarchy}
            activeValue={activeProgram?.name ?? ""}
            emptyLabel="No programs matched your search."
            getCountLabel={(item) => `${item.awardCount} entries`}
            onSelect={(programName) => updateParams({ program: programName, division: "", category: "" })}
            compact
          />

          <HierarchyPanel
            panelRef={divisionPanelRef}
            title="Divisions"
            items={activeProgram?.divisions ?? []}
            activeValue={activeDivision?.name ?? ""}
            emptyLabel="Select a program to browse its divisions."
            getCountLabel={(item) => `${item.awardCount} entries`}
            onSelect={(divisionName) => updateParams({ division: divisionName, category: "" })}
            compact
          />

          <HierarchyPanel
            title="Categories"
            items={activeDivision?.categories ?? []}
            activeValue={activeCategory?.name ?? ""}
            emptyLabel="Select a division to browse its categories."
            getCountLabel={(item) => `${item.awardCount} listed`}
            onSelect={(categoryName) => updateParams({ category: categoryName })}
            scrollable
            style={categoryPanelHeight ? { height: `${categoryPanelHeight}px` } : undefined}
          />
        </div>

        <CategoryResults program={activeProgram} division={activeDivision} category={activeCategory} />
      </div>
    </section>
  );
}
