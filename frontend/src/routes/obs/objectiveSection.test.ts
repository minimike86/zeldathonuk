import { describe, it, expect } from 'vitest';
import { objectiveImageUrl, selectObjectiveSection } from './objectiveSection';

/* eslint-disable @typescript-eslint/no-explicit-any */
const obj = (over: Record<string, unknown> = {}): any => ({
  id: 1,
  name: 'O',
  image_url: '',
  linked_item_image_url: '',
  category: 'story',
  group: '',
  link_mode: 'single',
  order: 0,
  ...over,
});

describe('objectiveImageUrl', () => {
  it('prefers the objective image, falls back to the linked item image', () => {
    expect(objectiveImageUrl(obj({ image_url: '/own.png' }))).toBe('/own.png');
    expect(objectiveImageUrl(obj({ linked_item_image_url: '/item.png' }))).toBe('/item.png');
    expect(objectiveImageUrl(obj({ image_url: '/own.png', linked_item_image_url: '/item.png' }))).toBe('/own.png');
    expect(objectiveImageUrl(obj())).toBe('');
  });
});

describe('selectObjectiveSection', () => {
  it('returns null without an entry or game or objectives', () => {
    expect(selectObjectiveSection(null)).toBeNull();
    expect(selectObjectiveSection({ game: null } as any)).toBeNull();
    expect(selectObjectiveSection({ game: { objectives: [] } } as any)).toBeNull();
  });

  it('selects the section containing the next outstanding objective', () => {
    const entry: any = {
      game: {
        objectives: [
          obj({ id: 1, order: 0, group: 'Intro' }),
          obj({ id: 2, order: 1, group: 'Dungeon' }),
          obj({ id: 3, order: 2, group: 'Dungeon' }),
        ],
      },
      obtained_objective_ids: [1],
      skipped_objective_ids: [],
      objective_counts: {},
    };
    const section = selectObjectiveSection(entry)!;
    expect(section.sectionLabel).toBe('Dungeon');
    expect(section.rows).toHaveLength(2);
    expect(section.total).toBe(2);
  });

  it('handles tally objectives and a fully-complete run', () => {
    const entry: any = {
      game: {
        objectives: [
          obj({ id: 1, order: 0, group: 'D', link_mode: 'tally' }),
          obj({ id: 2, order: 1, group: 'D' }),
        ],
      },
      obtained_objective_ids: [2],
      skipped_objective_ids: [],
      objective_counts: { '1': 3 },
    };
    const section = selectObjectiveSection(entry)!;
    expect(section.sectionLabel).toBe('D');
    const tallyRow = section.rows.find((r) => r.objective.id === 1)!;
    expect(tallyRow.count).toBe(3);
    expect(tallyRow.done).toBe(true);
  });

  it('returns null when every objective is skipped', () => {
    const entry: any = {
      game: { objectives: [obj({ id: 1 })] },
      obtained_objective_ids: [],
      skipped_objective_ids: [1],
      objective_counts: {},
    };
    expect(selectObjectiveSection(entry)).toBeNull();
  });
});
