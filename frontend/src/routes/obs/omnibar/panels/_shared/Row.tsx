import type { ReactNode } from 'react';

/** Standard row layout for a panel: optional tag pill on the left,
 *  flexible body on the right. Mirrors the v1 omnibar's Row primitive
 *  so styling carries over. */
export function PanelRow({
  tag,
  arrow,
  flash,
  centered,
  children,
}: {
  tag?: string;
  arrow?: boolean;
  flash?: boolean;
  centered?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="ob-row">
      {tag && <TagPill label={tag} arrow={arrow} flash={flash} />}
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
}: {
  label: string;
  arrow?: boolean;
  flash?: boolean;
}) {
  const cls =
    'ob-tag' +
    (arrow ? ' ob-tag--arrow' : '') +
    (flash ? ' ob-tag--flash' : '');
  return <span className={cls}>{label}</span>;
}
