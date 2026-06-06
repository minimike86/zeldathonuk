import type { CSSProperties, ReactNode } from 'react';

/** Standard row layout for a panel: optional tag pill on the left,
 *  flexible body on the right. Mirrors the v1 omnibar's Row primitive
 *  so styling carries over.
 *
 *  `tagStyle` lets callers (currently CelebrationBanner) override the
 *  pill's colour scheme per-render — used to let an individual
 *  celebration trigger ship its own tag colour via the payload. */
export function PanelRow({
  tag,
  arrow,
  flash,
  centered,
  tagStyle,
  children,
}: {
  tag?: string;
  arrow?: boolean;
  flash?: boolean;
  centered?: boolean;
  tagStyle?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className="ob-row">
      {tag && <TagPill label={tag} arrow={arrow} flash={flash} style={tagStyle} />}
      <div className={`ob-row-body${centered ? ' ob-row-body--center' : ''}`}>
        {children}
      </div>
    </div>
  );
}

function TagPill({
  label,
  arrow,
  flash,
  style,
}: {
  label: string;
  arrow?: boolean;
  flash?: boolean;
  style?: CSSProperties;
}) {
  const cls =
    'ob-tag' +
    (arrow ? ' ob-tag--arrow' : '') +
    (flash ? ' ob-tag--flash' : '');
  return <span className={cls} style={style}>{label}</span>;
}
