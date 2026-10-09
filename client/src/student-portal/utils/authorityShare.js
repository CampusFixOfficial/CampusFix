const clean = (value) => String(value || '').trim();
const imageSource = (image) => clean(typeof image === 'string' ? image : image?.url);

export function buildAuthorityWhatsAppMessage(item, { hostelWarden = false } = {}) {
  const team = clean(item?.department?.name || item?.classification?.predictedDepartment || 'CampusFix team');
  const structure = item?.problemLocation || {};
  const isHostel = /hostel|residence/i.test(`${clean(structure.areaBuilding)} ${clean(item?.location)}`);
  const isTechnical = team === 'Technical & Maintenance';
  const isHygiene = team === 'Housekeeping & Hygiene';
  const heading = isHostel && isTechnical
    ? 'CampusFix — Hostel Maintenance Complaint'
    : isHostel
      ? 'CampusFix — Hostel Complaint'
      : 'CampusFix — Campus Complaint';
  const locationPrimary = [clean(structure.block), clean(structure.areaBuilding)].filter(Boolean).join(' · ');
  const locationDetail = [clean(structure.floor), clean(structure.wing), clean(structure.specificArea)].filter(Boolean).join(', ');
  const location = [locationPrimary, locationDetail].filter(Boolean).join(' · ') || clean(item?.location);
  const issue = clean(item?.description || item?.title);
  const priority = clean(item?.priority || 'medium').toLowerCase();
  const priorityLabel = priority === 'medium' ? 'Normal' : priority.replace(/^./, (letter) => letter.toUpperCase());
  const action = isTechnical
    ? 'Please arrange for the concerned technical team to inspect and resolve the issue.'
    : isHygiene
      ? 'Please arrange for the concerned cleaning team to inspect and resolve the issue.'
      : 'Please arrange for the assigned team to inspect and follow up on the issue.';
  const opening = isHygiene
    ? 'A cleanliness issue has been reported and routed for follow-up.'
    : isTechnical
      ? 'A maintenance issue has been reported and routed for follow-up.'
      : 'A campus issue has been reported and routed for follow-up.';
  const caseId = clean(item?._id) ? `CF-${clean(item._id).toUpperCase()}` : '';
  const photoLinks = (Array.isArray(item?.images) ? item.images : []).map(imageSource).filter(Boolean);
  const lines = [
    heading,
    '',
    'Hello,',
    '',
    opening,
    '',
    ...(location ? ['Location:', location, ''] : []),
    ...(issue ? ['Issue:', issue, ''] : []),
    `Priority: ${priorityLabel}`,
    `Assigned Team: ${team}`,
    ...(clean(item?.status) ? [`Current Status: ${clean(item.status)}`] : []),
    ...(photoLinks.length ? ['', 'Photo evidence (open directly):', ...photoLinks.map((url, index) => `Photo ${index + 1}: ${url}`)] : []),
    '',
    action,
    ...(caseId ? ['', `Complaint ID: ${caseId}`] : []),
    '',
    'Please update CampusFix once the issue has been resolved.',
    '',
    'Regards,',
    hostelWarden ? 'CampusFix / Hostel Warden' : 'CampusFix / Authority',
  ];
  return lines.join('\n');
}
