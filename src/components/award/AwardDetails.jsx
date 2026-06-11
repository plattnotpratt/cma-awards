import { useState } from "react";
import { Link } from "react-router-dom";
import "./AwardDetails.css";

export default function AwardDetails({ award }) {
  const [shareStatus, setShareStatus] = useState("");

  if (!award) return null;

  const shareUrl = typeof window === "undefined" ? "" : `${window.location.origin}${window.location.pathname}`;

  async function copyShareLink() {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus("Link copied. Paste it into your social post.");
        return true;
      } catch {
        // Fall through to the textarea copy path for older Safari/iOS contexts.
      }
    }

    const textArea = document.createElement("textarea");
    textArea.value = shareUrl;
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

      setShareStatus("Link copied. Paste it into your social post.");
      return true;
    } catch {
      setShareStatus("Copy is not available in this browser. Copy the page URL from the address bar.");
      return false;
    } finally {
      textArea.remove();
    }
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
      <div className="awardShareLinks" aria-label="Share this award">
        <button className="awardShareLinks__item" type="button" onClick={copyShareLink}>
          Copy Link
        </button>
        <Link className="awardShareLinks__item" to="/awards">
          Awards List
        </Link>
      </div>
      {shareStatus ? <p className="awardShareLinks__status">{shareStatus}</p> : null}
    </section>
  );
}
