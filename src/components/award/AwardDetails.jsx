import { useState } from "react";
import { Link } from "react-router-dom";
import "./AwardDetails.css";

export default function AwardDetails({ award }) {
  const [shareStatus, setShareStatus] = useState("");

  if (!award) return null;

  const shareUrl = typeof window === "undefined" ? "" : `${window.location.origin}${window.location.pathname}`;
  const shareTitle = [award.entryTitle, award.winnerLabel].filter(Boolean).join(" - ") || "CMA Award Winner";
  const shareSummary = [award.entryTitle, award.winnerLabel, award.categoryName, award.year]
    .filter(Boolean)
    .join(" | ");
  const shareText = `${shareSummary}\n${shareUrl}`;

  async function copyShareText() {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        setShareStatus("Award details copied. Paste them into your post.");
        return true;
      } catch {
        // Fall through to the textarea copy path for older Safari/iOS contexts.
      }
    }

    const textArea = document.createElement("textarea");
    textArea.value = shareText;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.append(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);

    try {
      const copied = document.execCommand("copy");
      if (!copied) throw new Error("Copy command failed");

      setShareStatus("Award details copied. Paste them into your post.");
      return true;
    } catch {
      setShareStatus("Sharing is not available in this browser. Copy the page URL from Safari's address bar.");
      return false;
    } finally {
      textArea.remove();
    }
  }

  async function handleNativeShare() {
    const shareData = { title: shareTitle, text: shareSummary, url: shareUrl };

    if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
      try {
        await navigator.share(shareData);
        setShareStatus("Share sheet opened.");
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({ url: shareUrl });
        setShareStatus("Share sheet opened.");
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }

    await copyShareText();
  }

  return (
    <section className="awardNotes">
      <div className="awardGalleryCta">
        {award.publicGalleryUrl ? (
          <a className="awardGalleryCta__button" href={award.publicGalleryUrl} target="_blank" rel="noreferrer">
            View Gallery
          </a>
        ) : (
          <span className="awardGalleryCta__empty">Gallery unavailable</span>
        )}
      </div>
      <div>
      </div>
      <div className="awardShareLinks" aria-label="Share this award">
        <button className="awardShareLinks__item" type="button" onClick={handleNativeShare}>
          Share
        </button>
        <Link className="awardShareLinks__item" to="/awards">
          Awards List
        </Link>
      </div>
      {shareStatus ? <p className="awardShareLinks__status">{shareStatus}</p> : null}
    </section>
  );
}
