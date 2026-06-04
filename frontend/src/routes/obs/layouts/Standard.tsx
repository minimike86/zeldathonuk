import { PresetLayout } from './PresetLayout';

/** 4:3 standard layout — now the generic preset-driven renderer. Kept as a
 *  named export for the layout registries. */
export function Standard() {
  return <PresetLayout layoutType="4x3" />;
}
