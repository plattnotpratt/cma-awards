function safeDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pickRound(award) {
  const rounds = award?.roundSubmissions ?? [];
  if (!rounds.length) return null;

  const finalized = rounds
    .filter((round) => !!round.finalizedAtUtc)
    .sort((a, b) => new Date(b.finalizedAtUtc) - new Date(a.finalizedAtUtc))[0];

  if (finalized) return finalized;

  return rounds
    .slice()
    .sort((a, b) => new Date(b.updatedAtUtc) - new Date(a.updatedAtUtc))[0];
}

function fieldValue(fieldValues, alias) {
  const hit = fieldValues?.find((f) => f?.alias === alias);
  if (!hit) return null;

  if (hit.typeName === "ListFieldValue") return hit.selectedValue?.value ?? null;
  if (hit.typeName === "DateFieldValue") return hit.valueUtc ?? null;
  if (hit.typeName === "ApplicationNameFieldValue") return hit.firstValue ?? null;

  return hit.value ?? null;
}

function sanitizePlacement(label) {
  if (!label) return label;
  const cleaned = label.replace(/\bcomplete\b/gi, "").replace(/\s{2,}/g, " ").trim();
  return cleaned || null;
}

function sanitizeCategoryName(name) {
  if (!name) return null;
  const trimmed = String(name).trim();
  const idx = trimmed.indexOf(":");
  if (idx !== -1) {
    const rest = trimmed.slice(idx + 1).trim();
    if (rest) return rest;
  }
  return trimmed;
}

export function buildAwardViewModel(award, fallbackId) {
  if (!award) return null;

  const round = pickRound(award);
  const fv = round?.submissionFieldValues ?? [];
  const finalized = safeDate(round?.finalizedAtUtc);
  const workDate = safeDate(fieldValue(fv, "dateOfWork"));

  const publisher =
    fieldValue(fv, "Flask5publisherName") ??
    fieldValue(fv, "searchForAPublisher1") ??
    null;

  const entryTitle = fieldValue(fv, "titleOfEntry") ?? award.name ?? null;

  const placementRaw = round?.isWinner ? round?.winnerTypes?.[0] ?? "Winner" : "Not selected";
  const placement = sanitizePlacement(placementRaw) ?? (round?.isWinner ? "Winner" : "Not selected");
  const rawCategoryName = award.categoryName ?? null;
  const displayCategoryName = sanitizeCategoryName(rawCategoryName);

  const hero = {
    categoryName: displayCategoryName ?? rawCategoryName,
    categoryPath: award.categoryPath ?? null,
    year: finalized ? finalized.getFullYear() : null,
    entryTitle: entryTitle ?? award.name ?? "Award entry",
    organization: publisher ?? fieldValue(fv, "bylineCredits") ?? null,
    placement,
    isWinner: !!round?.isWinner,
  };

  return {
    id: award.id ?? fallbackId,
    name: award.name ?? "Award",
    description: award.description ?? null,
    categoryName: displayCategoryName ?? rawCategoryName,
    categoryPath: award.categoryPath ?? null,
    roundName: round?.roundName ?? null,
    status: round?.status ?? null,
    year: hero.year,
    finalizedAtUtc: round?.finalizedAtUtc ?? null,
    isWinner: hero.isWinner,
    winnerLabel: hero.placement,
    winnerTypes: round?.winnerTypes ?? [],
    avgScore: typeof round?.averageScore === "number" ? round.averageScore : null,
    totalScore:
      typeof round?.judgeScorecardInfos?.[0]?.totalScore === "number"
        ? round.judgeScorecardInfos[0].totalScore
        : null,
    entryTitle,
    publisher,
    publishingType: fieldValue(fv, "publishingType") ?? null,
    byline: fieldValue(fv, "bylineCredits") ?? null,
    submitterFirst: fieldValue(fv, "submitterFirstName") ?? null,
    submitterLast: fieldValue(fv, "submitterLastName") ?? null,
    submitterEmail: fieldValue(fv, "submittersEmailAddress") ?? award.email ?? null,
    workDate: workDate ? workDate.toISOString().slice(0, 10) : null,
    publicGalleryUrl: round?.publicGalleryUrl ?? null,
    publicUrlToSubmission: round?.publicUrlToSubmission ?? null,
    publicDownloadPdfAsApplicantUrl: award.publicDownloadPdfAsApplicantUrl ?? null,
    hero,
  };
}

export { safeDate, pickRound, fieldValue };
