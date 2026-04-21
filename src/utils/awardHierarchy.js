import { buildAwardViewModel } from "./awardViewModel";

const PROGRAM_NAMES = {
  58: "CMA Media Awards",
};

function cleanCategoryLabel(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "Uncategorized";

  return raw.replace(/^[A-Z]{1,4}\d+[a-z]?:\s*/i, "").replace(/\s{2,}/g, " ").trim();
}

function splitCategoryPath(categoryPath) {
  const raw = String(categoryPath ?? "").trim();
  if (!raw) return [];

  const separators = [" > ", "|", " / ", ">", "/", "::", "»"];

  for (const separator of separators) {
    const parts = raw.split(separator).map((part) => part.trim()).filter(Boolean);
    if (parts.length > 1) return parts;
  }

  return [raw];
}

function normalizePlacement(label, isWinner) {
  const text = String(label ?? "").trim();
  const normalized = text.toLowerCase();

  if (normalized.includes("first") || normalized.includes("1st") || normalized === "winner" || isWinner) {
    return { type: "first_place", rank: 1, label: text || "First Place" };
  }
  if (normalized.includes("second") || normalized.includes("2nd")) {
    return { type: "second_place", rank: 2, label: text || "Second Place" };
  }
  if (normalized.includes("third") || normalized.includes("3rd")) {
    return { type: "third_place", rank: 3, label: text || "Third Place" };
  }
  if (normalized.includes("honorable")) {
    return { type: "honorable_mention", rank: 4, label: text || "Honorable Mention" };
  }

  return { type: "other", rank: 5, label: text || "Listed Entry" };
}

function parseLocalHierarchy(award) {
  const pathParts = splitCategoryPath(award.categoryPath);
  const division = cleanCategoryLabel(pathParts[0] ?? "General");
  const category = cleanCategoryLabel(pathParts.at(-1) ?? award.categoryName ?? "Uncategorized");
  const program = PROGRAM_NAMES[award.programId] ?? "Program";

  return { program, division, category };
}

function parseViewModelHierarchy(viewModel) {
  const pathParts = splitCategoryPath(viewModel.categoryPath);
  const category = cleanCategoryLabel(viewModel.categoryName ?? pathParts.at(-1) ?? "Uncategorized");

  if (pathParts.length >= 3) {
    return {
      program: cleanCategoryLabel(pathParts[0]),
      division: cleanCategoryLabel(pathParts.slice(1, -1).join(" / ")),
      category,
    };
  }

  if (pathParts.length === 2) {
    return {
      program: "Program",
      division: cleanCategoryLabel(pathParts[0]),
      category,
    };
  }

  return {
    program: "Program",
    division: "General",
    category,
  };
}

function summarizeAward(award) {
  if (award?.placement && award?.categoryPath) {
    const { program, division, category } = parseLocalHierarchy(award);
    const placement = normalizePlacement(award.placement, false);

    if (placement.type === "other") {
      return null;
    }

    return {
      id: award.id,
      entryTitle: award.name ?? "Untitled award",
      publisher: null,
      categoryPath: award.categoryPath,
      program,
      division,
      category,
      placementLabel: placement.label,
      placementType: placement.type,
      placementRank: placement.rank,
    };
  }

  const viewModel = buildAwardViewModel(award, award?.id);
  if (!viewModel) return null;

  const { program, division, category } = parseViewModelHierarchy(viewModel);
  const placement = normalizePlacement(viewModel.winnerLabel, viewModel.isWinner);

  if (placement.type === "other") {
    return null;
  }

  return {
    id: viewModel.id,
    entryTitle: viewModel.entryTitle ?? viewModel.name,
    publisher: viewModel.publisher,
    categoryPath: viewModel.categoryPath,
    program,
    division,
    category,
    placementLabel: placement.label,
    placementType: placement.type,
    placementRank: placement.rank,
  };
}

export function buildAwardsHierarchy(awards, query) {
  const needle = query.trim().toLowerCase();
  const items = awards
    .map(summarizeAward)
    .filter(Boolean)
    .filter((award) => {
      if (!needle) return true;
      const haystack = [award.entryTitle, award.publisher, award.program, award.division, award.category, award.placementLabel]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });

  const programs = new Map();

  items.forEach((award) => {
    if (!programs.has(award.program)) {
      programs.set(award.program, { name: award.program, divisions: new Map(), awardCount: 0 });
    }

    const program = programs.get(award.program);
    program.awardCount += 1;

    if (!program.divisions.has(award.division)) {
      program.divisions.set(award.division, { name: award.division, categories: new Map(), awardCount: 0 });
    }

    const division = program.divisions.get(award.division);
    division.awardCount += 1;

    if (!division.categories.has(award.category)) {
      division.categories.set(award.category, { name: award.category, awards: [], awardCount: 0 });
    }

    const category = division.categories.get(award.category);
    category.awardCount += 1;
    category.awards.push(award);
  });

  return Array.from(programs.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((program) => ({
      ...program,
      divisions: Array.from(program.divisions.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((division) => ({
          ...division,
          categories: Array.from(division.categories.values())
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((category) => ({
              ...category,
              awards: category.awards.sort((a, b) => {
                if (a.placementRank !== b.placementRank) return a.placementRank - b.placementRank;
                return a.entryTitle.localeCompare(b.entryTitle);
              }),
            })),
        })),
    }));
}
