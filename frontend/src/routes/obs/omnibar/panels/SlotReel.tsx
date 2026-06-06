/**
 * Per-digit slot-reel display for the donation total.
 *
 * Each integer + decimal place has its own vertical reel containing
 * the glyphs 0..9 stacked top-to-bottom. The current reel position
 * is computed from the RAW tweened value (a real number, not the
 * formatted string), so a digit smoothly rolls between adjacent
 * positions instead of snapping. For value=125.3 at the tens reel
 * (place=10): `(125.3 / 10) % 10 = 2.53` → the strip sits at
 * `translateY(-2.53em)` showing "2" with 53% of "3" peeking below.
 *
 * Leading zeros above the highest meaningful digit are hidden (with
 * a kept layout slot so the row width is stable). The thousands
 * separator slides into view at value ≥ 1000 (and similarly higher).
 */

// Eight integer reels — covers every total up to £99,999,999, which
// gives plenty of headroom over the optimistic Zeldathon ceiling.
// Hidden leading zeros are masked (visibility: hidden) so the row
// width doesn't dance as the total crosses an order of magnitude.
const INTEGER_PLACES = [10000000, 1000000, 100000, 10000, 1000, 100, 10, 1];
const DECIMAL_PLACES = [0.1, 0.01];

// Thousands separators live BEFORE these places — i.e. before the
// hundreds digit of each 3-digit comma group, and only when the
// corresponding higher-magnitude reel has a non-zero digit. Listed
// here as a Set so the lookup in the render loop stays O(1).
const SEPARATOR_BEFORE_PLACES = new Set([100, 100000]);

export function SlotReel({ value }: { value: number }) {
  // Round-and-floor at the reel-level: each cell wants the smooth
  // fractional position in (place / 10) space. Clamp to a sane
  // non-negative range — a donation total going negative is impossible
  // but a transient race with backend math shouldn't crash the bar.
  const v = Math.max(0, Number.isFinite(value) ? value : 0);

  // Skip leading-zero cells entirely so the slot reel sizes to its
  // value. Walk left-to-right and only start rendering once the
  // first meaningful digit (or the ones place) appears. Anything
  // before that is dropped from the DOM — no layout slot, no gap
  // between the £ symbol and the figure for a small total.
  //
  // Trade-off: when the value crosses an order of magnitude (e.g.
  // £9.99 → £10.00, £999.99 → £1,000.00) a new cell appears and the
  // text shifts left. That's the cost of sizing to the value; the
  // alternative was the awkward whitespace gap on small totals.
  let visibleStarted = false;
  return (
    <span className="ob-slot-reel" aria-label={v.toFixed(2)}>
      {INTEGER_PLACES.map((place) => {
        const intPart = Math.floor(v / place);
        const showThisCell = intPart >= 1 || place === 1;
        if (!visibleStarted && !showThisCell) return null;
        visibleStarted = true;
        // Separator appears before each "hundreds" position of a
        // thousands group (100, 100,000, …) — but only when the
        // higher group has a non-zero digit. `place * 10` is the
        // first reel of that higher group; if value reaches it, the
        // comma is meaningful.
        const showSepBefore =
          SEPARATOR_BEFORE_PLACES.has(place) &&
          Math.floor(v / (place * 10)) >= 1;
        return (
          <span key={place} className="ob-slot-cell">
            {showSepBefore && <span className="ob-slot-sep">,</span>}
            <DigitReel place={place} value={v} />
          </span>
        );
        // visibleStarted resolves left-to-right so the .map order
        // (highest place first) matters — see INTEGER_PLACES above.
      })}
      <span className="ob-slot-sep">.</span>
      {DECIMAL_PLACES.map((place) => (
        <DigitReel key={place} place={place} value={v} />
      ))}
    </span>
  );
}

function DigitReel({
  place,
  value,
}: {
  place: number;
  value: number;
}) {
  // INTEGER positioning. We previously used the fractional position
  // `((value / place) % 10 + 10) % 10` directly as translateY, which
  // does smoothly interpolate between digits — but it also leaves
  // the reel stuck at e.g. `-2.53em` when the tween settles, so the
  // resting display reads as "2-and-a-bit" instead of a clean digit.
  //
  // Use `Math.floor` so the reel always lands on an integer slot at
  // rest, and rely on a CSS `transition: transform` on the strip to
  // produce the visible roll when a digit changes during a tween.
  // The tweened value crosses integer boundaries multiple times per
  // donation, and each crossing kicks off a fresh transition — the
  // succession of those transitions reads as a rolling reel.
  const pos = Math.floor(((value / place) % 10 + 10) % 10);
  return (
    <span className="ob-slot-digit">
      <span
        className="ob-slot-reel-strip"
        style={{ transform: `translateY(-${pos}em)` }}
      >
        {DIGITS.map((d) => (
          <span key={d} className="ob-slot-glyph">{d}</span>
        ))}
      </span>
    </span>
  );
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
