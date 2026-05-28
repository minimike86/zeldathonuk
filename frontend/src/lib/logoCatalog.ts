// List of logo files in `public/assets/img/brand/logo/`. The theme
// editor's "Logo URL" pickers offer these as a dropdown so the
// operator doesn't have to type the path by hand.
//
// To refresh after dropping new files into the folder, run:
//   ls public/assets/img/brand/logo
// and edit this array. (Vite's public/ assets are served as-is and
// not visible to `import.meta.glob`, so this catalog is the source
// of truth for the UI.)

export interface LogoOption {
  /** Pretty label shown in the dropdown. */
  label: string;
  /** Web-served URL — drop this into a theme's logo_url / logo_small_url. */
  url: string;
}

const FOLDER = '/assets/img/brand/logo/';

const FILES: string[] = [
  'Zeldathon-2026-Sheikah.svg',
  'Zeldathon-2026-StainedGlass.svg',
  'Zeldathon-2026-White.svg',
  'Zeldathon-Logo-2026-Bloodmoon.svg',
  'Zeldathon-Logo-2026-ClassicGold.svg',
  'Zeldathon-Logo-2026-ClassicRed.svg',
  'Zeldathon-Logo-2026-Gold-Flash.svg',
  'Zeldathon-Logo-2026-MasterSword.svg',
  'Zeldathon-Logo-WW-white.svg',
  'Zeldathon-Logo-WW.svg',
  'Zeldathon-Logo-WW.png',
  'Zeldathon-Logo-svg_gold1.fw.png',
  'Zeldathon-Logo-svg_white.fw.png',
  'Zeldathon-Logo.png',
  'Zeldathon-Logo_2019.png',
  'logo.svg',
  'zeldathonuk_brand_logo2.png',
];

export const LOGO_CATALOG: LogoOption[] = FILES
  .slice()
  .sort((a, b) => a.localeCompare(b))
  .map((file) => ({
    label: prettyLabel(file),
    url: `${FOLDER}${file}`,
  }));

function prettyLabel(file: string): string {
  return file
    .replace(/\.(svg|png|jpg|jpeg|webp|gif)$/i, '')
    .replace(/[._-]+/g, ' ')
    .trim();
}
