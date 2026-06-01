/**
 * Compact "game chip" — a small cover-art thumbnail beside the game
 * title in a bordered card. Replaces the bare `ob-text-strong` title
 * text used by the game-state panels (current-game, next-objective,
 * objective-checklist) so the game identity reads as one tidy unit
 * instead of a long strip of plain text eating lane width.
 *
 * Visual language borrows from the pre-stream panel's
 * `.ob-upcoming-card` (cover art + lane-tinted card); the `.ob-game-chip*`
 * rules in omnibar.css are the slimmer sibling of those. Falls back to a
 * "?" placeholder tile when the game has no box art.
 *
 * The "The Legend of Zelda:" series prefix is demoted to a small eyebrow
 * line above the title rather than dropped, so the chip uses its spare
 * vertical room to show the full distinguishing game name (e.g. "A Link
 * to the Past") without truncating it.
 */

/** Split a title into its "The Legend of Zelda" series prefix + the
 *  remaining game name. Case-insensitive; tolerates the separator used
 *  on the few dash-style entries (e.g. "… – Oracle of Ages"). Titles
 *  without the prefix — the colon-less NES original, or non-Zelda
 *  games — return `series: null` and render as a single centred line. */
function splitGameTitle(title: string): { series: string | null; name: string } {
  const m = title.match(/^(the legend of zelda)\s*[:–-]\s*(.+)$/i);
  if (m && m[2].trim()) {
    return { series: m[1], name: m[2].trim() };
  }
  return { series: null, name: title };
}

export function GameChip({
  title,
  boxArtUrl,
}: {
  title: string;
  boxArtUrl?: string;
}) {
  const { series, name } = splitGameTitle(title);
  return (
    <span className="ob-game-chip">
      {boxArtUrl ? (
        <span className="ob-game-chip-art" aria-hidden>
          <img src={boxArtUrl} alt="" />
        </span>
      ) : (
        <span
          className="ob-game-chip-art ob-game-chip-art--placeholder"
          aria-hidden
        >
          ?
        </span>
      )}
      <span className="ob-game-chip-body" title={title}>
        {series && <span className="ob-game-chip-series">{series}</span>}
        <span className="ob-game-chip-title">{name}</span>
      </span>
    </span>
  );
}
