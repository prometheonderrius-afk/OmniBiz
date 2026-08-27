/**
 * OmniBiz AI — Vertical Helpers & Category Mapping Contract
 */

export const getThemePresetForCategory = (cat) => {
  const c = (cat || '').toLowerCase();
  if (c.includes('plumbing') || c.includes('auto') || c.includes('handyman') || c.includes('roofing') || c.includes('electrical')) return 'rugged_services';
  if (c.includes('fashion') || c.includes('boutique') || c.includes('retail')) return 'rose_boutique';
  if (c.includes('restaurants') || c.includes('cafes') || c.includes('food')) return 'warm_cafe';
  if (c.includes('wellness') || c.includes('spa') || c.includes('gym') || c.includes('salon')) return 'ocean_wellness';
  if (c.includes('gas station') || c.includes('professional') || c.includes('legal') || c.includes('financial')) return 'navy_corporate';
  if (c.includes('tech') || c.includes('saas')) return 'cyber_saas';
  return 'rugged_services';
};

export const getVerticalKey = (cat) => {
  const c = (cat || '').toLowerCase();
  if (c.includes('plumbing') || c.includes('hvac') || c.includes('electrical')) return 'plumbing_hvac';
  if (c.includes('auto') || c.includes('towing') || c.includes('repair')) return 'auto_repair';
  if (c.includes('roofing') || c.includes('solar') || c.includes('construction') || c.includes('handyman')) return 'roofing_construction';
  if (c.includes('restaurant') || c.includes('cafe') || c.includes('food')) return 'restaurant_food';
  if (c.includes('retail') || c.includes('boutique') || c.includes('wellness') || c.includes('salon')) return 'retail_wellness';
  return 'plumbing_hvac';
};

export const VERTICAL_META = {
  plumbing_hvac: {
    key: 'plumbing_hvac',
    name: 'Plumbing, HVAC & Electrical',
    suiteLabel: 'Plumbing & HVAC Suite',
    badge: 'UPC/NEC Pro',
    description: 'Code compliance, truck stock distributor dispatch, milestone quoting, and emergency triage matrix.'
  },
  auto_repair: {
    key: 'auto_repair',
    name: 'Auto Repair, Maintenance & Towing',
    suiteLabel: 'Auto Repair & Towing',
    badge: 'VIN / NHTSA',
    description: 'Live NHTSA VIN decoder, 24-point visual DVI inspections, Mitchell labor rate matrix, and tow dispatch.'
  },
  roofing_construction: {
    key: 'roofing_construction',
    name: 'Roofing, Solar & Construction',
    suiteLabel: 'Roofing & Solar Suite',
    badge: 'Pitch / GAF',
    description: 'Satellite roof pitch & solar sizing calculator, storm hail outreach, GAF warranty filing, and change-orders.'
  },
  restaurant_food: {
    key: 'restaurant_food',
    name: 'Restaurants, Cafes & Food Trucks',
    suiteLabel: 'Restaurant & Bar Suite',
    badge: 'HACCP / Floor',
    description: 'Live 2D table floor plan & food truck queue, wholesale price variance alerts, FDA/HACCP logs, and BEO catering.'
  },
  retail_wellness: {
    key: 'retail_wellness',
    name: 'Retail, Boutique & Wellness',
    suiteLabel: 'Retail & Wellness Suite',
    badge: 'VIP / Restock',
    description: 'Smart inventory reorder matrix & PO auto-gen, practitioner appointment calendar, and client VIP retention CRM.'
  }
};
