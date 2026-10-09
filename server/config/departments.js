const DEFAULT_DEPARTMENTS = [
  {
    name: 'Technical & Maintenance',
    description: 'Repairs, electrical, plumbing, infrastructure and campus maintenance.',
    keywords: ['fan', 'light', 'tubelight', 'switch', 'socket', 'electrical', 'wiring', 'power', 'short circuit', 'plumbing', 'tap', 'leak', 'leaking', 'water pipe', 'pipe', 'door', 'window', 'lock', 'broken', 'repair', 'not working', 'projector', 'ac', 'air conditioner', 'cooler', 'heater', 'geyser', 'streetlight', 'road', 'pothole', 'lift', 'elevator'],
    slaHours: 24,
  },
  {
    name: 'Housekeeping & Hygiene',
    description: 'Cleanliness, sanitation, waste, washrooms and pest concerns.',
    keywords: ['dirty', 'unclean', 'cleaning', 'washroom', 'toilet', 'bathroom', 'garbage', 'trash', 'waste', 'dustbin', 'smell', 'stink', 'sweeping', 'mopping', 'hygiene', 'sanitation', 'pest', 'cockroach', 'rat', 'insect', 'mosquito', 'drain', 'clogged', 'stain', 'filthy'],
    slaHours: 24,
  },
  {
    name: 'Mess / Food Services',
    description: 'Mess meals, food quality, dining service and drinking-water service.',
    keywords: ['food', 'meal', 'mess', 'breakfast', 'lunch', 'dinner', 'menu', 'canteen', 'cafeteria', 'kitchen', 'spoiled', 'stale', 'undercooked', 'food quality', 'drinking water'],
    slaHours: 24,
  },
  {
    name: 'Hostel Administration',
    description: 'Hostel room allocation, resident services, facilities and administration.',
    keywords: ['room allotment', 'room allocation', 'hostel allotment', 'hostel office', 'hostel administration', 'hostel fee', 'hostel fees', 'room change', 'warden', 'residence permit', 'laundry', 'hostel rules'],
    slaHours: 48,
  },
  {
    name: 'Discipline, Safety & Wellbeing',
    description: 'Safety, harassment, anti-ragging, wellbeing and conduct concerns.',
    keywords: ['bully', 'bullying', 'harass', 'harassment', 'ragging', 'threat', 'unsafe', 'safety', 'abuse', 'fight', 'violence', 'intimidation', 'misconduct', 'misbehavior', 'drunk', 'drugs', 'smoking', 'eve teasing', 'stalking', 'discrimination', 'self harm', 'wellbeing'],
    slaHours: 6,
    isSensitive: true,
  },
];

module.exports = { DEFAULT_DEPARTMENTS };
