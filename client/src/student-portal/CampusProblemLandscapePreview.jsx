import { useState } from 'react';
import CampusProblemLandscape from './CampusProblemLandscape';
import { createDemoCampusLandscape } from './data/demoCampusLandscape';

export default function CampusProblemLandscapePreview() {
  const [demoData] = useState(() => createDemoCampusLandscape());
  return <CampusProblemLandscape demo demoData={demoData} />;
}
