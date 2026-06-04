import { useParams, Navigate } from 'react-router';
import type { LayoutKey } from '@/lib/obsApi';
import { PresetLayout } from './layouts/PresetLayout';

const VALID: ReadonlySet<string> = new Set<LayoutKey>([
  '16x9',
  '4x3',
  '3ds',
  'ds-top',
  'ds-both',
  'fsa-split',
]);

export function ObsLayoutRoute() {
  const { layout } = useParams<{ layout: string }>();
  const key = layout ?? '';
  if (!VALID.has(key)) {
    return <Navigate to="/obs" replace />;
  }
  // The capture alignment guide is a global flag toggled from /control/layouts
  // and polled inside PresetLayout, so there's nothing route-specific here.
  return <PresetLayout layoutType={key as LayoutKey} />;
}
