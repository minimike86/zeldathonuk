import { useParams, Navigate } from 'react-router';
import { Widescreen } from './layouts/Widescreen';
import { Standard } from './layouts/Standard';
import { ThreeDs } from './layouts/ThreeDs';
import { DsTop } from './layouts/DsTop';
import { DsBoth } from './layouts/DsBoth';
import { FsaSplit } from './layouts/FsaSplit';

const REGISTRY: Record<string, () => JSX.Element> = {
  '16x9': Widescreen,
  '4x3': Standard,
  '3ds': ThreeDs,
  'ds-top': DsTop,
  'ds-both': DsBoth,
  'fsa-split': FsaSplit,
};

export function ObsLayoutRoute() {
  const { layout } = useParams<{ layout: string }>();
  const key = layout ?? '';
  const Component = REGISTRY[key];
  if (!Component) {
    return <Navigate to="/obs" replace />;
  }
  return <Component />;
}
