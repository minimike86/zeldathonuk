import type { ComponentType } from 'react';
import type { OmnibarFeed } from '../hooks/useOmnibarFeed';

/**
 * Self-registering panel descriptor. New panel = new file calling
 * registerPanel({...}). The omnibar reads from PANELS via panel id
 * (looked up in Lane.tsx). Unknown ids in the layout JSON are
 * silently skipped — the bar degrades gracefully when the backend
 * advertises a panel the client doesn't ship yet.
 *
 * `selectData` returns null to mean "this panel has nothing useful to
 * show right now" — the lane treats that as "skip me in rotation" so
 * an empty incentive list doesn't park the bar on a blank card.
 */
export interface PanelDescriptor<P = unknown> {
  id: string;
  component: ComponentType<PanelProps<P>>;
  selectData: (feed: OmnibarFeed) => P | null;
  /** Minimum on-screen time before the lane is allowed to advance. */
  minDurationMs: number;
  /** Optional gate — null/false hides the panel from rotation. */
  enabledWhen?: (feed: OmnibarFeed) => boolean;
  /** Rotation weighting (higher = picked more often). Default 1. */
  weight?: number;
}

export interface PanelProps<P = unknown> {
  data: P;
  onComplete?: () => void;
}

const REGISTRY = new Map<string, PanelDescriptor<unknown>>();

export function registerPanel<P>(desc: PanelDescriptor<P>): void {
  REGISTRY.set(desc.id, desc as PanelDescriptor<unknown>);
}

export function getPanel(id: string): PanelDescriptor<unknown> | undefined {
  return REGISTRY.get(id);
}

export function listPanels(): PanelDescriptor<unknown>[] {
  return Array.from(REGISTRY.values());
}
