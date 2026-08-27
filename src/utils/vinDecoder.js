/**
 * OMNIBIZ AI — ISO 3779 VIN DECODER & NHTSA vPIC API CONNECTOR
 * 
 * 17-digit ISO 3779 / NHTSA 49 CFR Part 565 Checksum Verification (Mod 11),
 * WMI Country & Make Catalog, Model Year Resolver, and NHTSA vPIC Remote Fetch
 * with 3.5s Timeout and Deterministic Offline Heuristic Fallback.
 */

import { cacheLocalData, getCachedData } from './offlineSync.js';

export const TRANSLITERATION_MAP = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
  '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
};

export const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

export const WMI_CATALOG = {
  // United States
  '1FA': { make: 'Ford', country: 'United States', vehicleType: 'Passenger Car' },
  '1FB': { make: 'Ford', country: 'United States', vehicleType: 'Commercial Truck' },
  '1FC': { make: 'Ford', country: 'United States', vehicleType: 'Commercial Truck' },
  '1FD': { make: 'Ford', country: 'United States', vehicleType: 'Heavy Truck' },
  '1FM': { make: 'Ford', country: 'United States', vehicleType: 'SUV / MPV' },
  '1FT': { make: 'Ford', country: 'United States', vehicleType: 'Pickup Truck' },
  '1G1': { make: 'Chevrolet', country: 'United States', vehicleType: 'Passenger Car' },
  '1G2': { make: 'Pontiac', country: 'United States', vehicleType: 'Passenger Car' },
  '1GC': { make: 'Chevrolet', country: 'United States', vehicleType: 'Truck' },
  '1GT': { make: 'GMC', country: 'United States', vehicleType: 'Truck' },
  '1HD': { make: 'Harley-Davidson', country: 'United States', vehicleType: 'Motorcycle' },
  '1HG': { make: 'Honda', country: 'United States', vehicleType: 'Passenger Car' },
  '1J4': { make: 'Jeep', country: 'United States', vehicleType: 'SUV' },
  '1N4': { make: 'Nissan', country: 'United States', vehicleType: 'Passenger Car' },
  '4T1': { make: 'Toyota', country: 'United States', vehicleType: 'Passenger Car' },
  '5N1': { make: 'Nissan', country: 'United States', vehicleType: 'SUV / Truck' },
  '5NP': { make: 'Hyundai', country: 'United States', vehicleType: 'Passenger Car' },
  '5YJ': { make: 'Tesla', country: 'United States', vehicleType: 'Electric Passenger Car' },
  '7SA': { make: 'Tesla', country: 'United States', vehicleType: 'Electric SUV' },

  // Canada
  '2FM': { make: 'Ford', country: 'Canada', vehicleType: 'SUV / MPV' },
  '2G1': { make: 'Chevrolet', country: 'Canada', vehicleType: 'Passenger Car' },
  '2T1': { make: 'Toyota', country: 'Canada', vehicleType: 'Passenger Car' },
  '2T2': { make: 'Lexus', country: 'Canada', vehicleType: 'SUV' },

  // Mexico
  '3FA': { make: 'Ford', country: 'Mexico', vehicleType: 'Passenger Car' },
  '3GN': { make: 'Chevrolet', country: 'Mexico', vehicleType: 'SUV' },
  '3VW': { make: 'Volkswagen', country: 'Mexico', vehicleType: 'Passenger Car' },
  '3MZ': { make: 'Mazda', country: 'Mexico', vehicleType: 'Passenger Car' },

  // Japan
  'JHM': { make: 'Honda', country: 'Japan', vehicleType: 'Passenger Car' },
  'JTD': { make: 'Toyota', country: 'Japan', vehicleType: 'Passenger Car' },
  'JTE': { make: 'Toyota', country: 'Japan', vehicleType: 'SUV' },
  'JN1': { make: 'Nissan', country: 'Japan', vehicleType: 'Passenger Car' },
  'JM1': { make: 'Mazda', country: 'Japan', vehicleType: 'Passenger Car' },
  'JF1': { make: 'Subaru', country: 'Japan', vehicleType: 'Passenger Car' },

  // Korea
  'KL1': { make: 'GM Daewoo', country: 'South Korea', vehicleType: 'Passenger Car' },
  'KM8': { make: 'Hyundai', country: 'South Korea', vehicleType: 'SUV' },
  'KMH': { make: 'Hyundai', country: 'South Korea', vehicleType: 'Passenger Car' },
  'KNA': { make: 'Kia', country: 'South Korea', vehicleType: 'Passenger Car' },

  // Germany
  'WAU': { make: 'Audi', country: 'Germany', vehicleType: 'Passenger Car' },
  'WBA': { make: 'BMW', country: 'Germany', vehicleType: 'Passenger Car' },
  'WBS': { make: 'BMW M', country: 'Germany', vehicleType: 'High Performance' },
  'WDB': { make: 'Mercedes-Benz', country: 'Germany', vehicleType: 'Passenger Car' },
  'WDD': { make: 'Mercedes-Benz', country: 'Germany', vehicleType: 'Passenger Car' },
  'WVW': { make: 'Volkswagen', country: 'Germany', vehicleType: 'Passenger Car' },
  'WP0': { make: 'Porsche', country: 'Germany', vehicleType: 'Sports Car' }
};

export const YEAR_MAP = {
  A: 2010, B: 2011, C: 2012, D: 2013, E: 2014,
  F: 2015, G: 2016, H: 2017, J: 2018, K: 2019,
  L: 2020, M: 2021, N: 2022, P: 2023, R: 2024,
  S: 2025, T: 2026, V: 2027, W: 2028, X: 2029, Y: 2030
};

/**
 * Validates 17-digit ISO 3779 VIN checksum using modulo 11 algorithm.
 * 
 * @param {string} vin 
 * @returns {{ valid: boolean, checkDigit?: string, expectedCheckDigit?: string, reason: string }}
 */
export function validateVinChecksum(vin) {
  if (typeof vin !== 'string') {
    return { valid: false, reason: 'VIN must be a string' };
  }
  const cleanVin = vin.toUpperCase().trim();
  if (cleanVin.length !== 17) {
    return { valid: false, reason: 'VIN must be exactly 17 characters' };
  }
  if (/[IOQ]/.test(cleanVin)) {
    return { valid: false, reason: 'VIN cannot contain forbidden letters I, O, or Q' };
  }

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const char = cleanVin[i];
    const val = TRANSLITERATION_MAP[char];
    if (val === undefined) {
      return { valid: false, reason: `Invalid character '${char}' at index ${i}` };
    }
    sum += val * WEIGHTS[i];
  }

  const remainder = sum % 11;
  const expectedCheckDigit = remainder === 10 ? 'X' : String(remainder);
  const actualCheckDigit = cleanVin[8];

  const isValid = expectedCheckDigit === actualCheckDigit;
  return {
    valid: isValid,
    checkDigit: actualCheckDigit,
    expectedCheckDigit,
    reason: isValid ? 'Checksum verified' : `Check digit mismatch: expected ${expectedCheckDigit}, got ${actualCheckDigit}`
  };
}

export const validateChecksum = validateVinChecksum;

/**
 * Deterministic local-first heuristic decoder.
 * 
 * @param {string} vin 
 * @returns {Object} Decoded vehicle profile
 */
export function decodeVinLocal(vin) {
  if (typeof vin !== 'string') {
    return { success: false, error: 'Invalid input' };
  }
  const cleanVin = vin.toUpperCase().trim();
  const checkResult = validateVinChecksum(cleanVin);
  if (!checkResult.valid) {
    return {
      success: false,
      error: checkResult.reason,
      vin: cleanVin
    };
  }

  const wmi = cleanVin.substring(0, 3);
  const vds = cleanVin.substring(3, 8);
  const yearChar = cleanVin[9];
  const plantCode = cleanVin[10];
  const serial = cleanVin.substring(11, 17);

  const info = WMI_CATALOG[wmi] || {
    make: 'Generic / OEM',
    country: cleanVin[0] === '1' || cleanVin[0] === '4' || cleanVin[0] === '5' ? 'United States' :
             cleanVin[0] === '2' ? 'Canada' :
             cleanVin[0] === '3' ? 'Mexico' :
             cleanVin[0] === 'J' ? 'Japan' :
             cleanVin[0] === 'K' ? 'South Korea' :
             cleanVin[0] === 'W' ? 'Germany' : 'North America',
    vehicleType: 'Passenger Car'
  };

  const modelYear = YEAR_MAP[yearChar] || 2024;

  return {
    success: true,
    source: 'local_heuristic',
    vin: cleanVin,
    wmi,
    vds,
    checkDigit: checkResult.checkDigit,
    modelYear,
    plantCode,
    serialNumber: serial,
    make: info.make,
    model: 'Standard Series',
    trim: 'Base / Standard',
    bodyClass: info.vehicleType,
    driveType: 'Front-Wheel Drive (FWD)',
    engineDisplacement: '2.0L I4 DOHC',
    engineCylinders: 4,
    fuelType: 'Gasoline',
    country: info.country,
    vehicleType: info.vehicleType,
    gvwr: 'Class 1D: 5,001 - 6,000 lb',
    laborEstimatorProfile: {
      baseLaborRate: 145.0,
      standardDiagnosticHours: 1.5,
      shopSuppliesRate: 0.05
    }
  };
}

export const decode = decodeVinLocal;

/**
 * Async VIN Decoder with NHTSA vPIC API fetch, 3.5s timeout, and offline fallback.
 * 
 * @param {string} vin 
 * @param {{ useApi?: boolean, timeoutMs?: number }} options
 * @returns {Promise<Object>}
 */
export async function decodeVin(vin, { useApi = true, timeoutMs = 3500 } = {}) {
  const localResult = decodeVinLocal(vin);
  if (!localResult.success) {
    return localResult;
  }

  const cleanVin = localResult.vin;
  const cacheKey = `vin_${cleanVin}`;

  // Check local cache first
  const cached = getCachedData(cacheKey);
  if (cached) {
    return { ...cached, source: 'cached' };
  }

  if (!useApi || typeof fetch === 'undefined') {
    return localResult;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${cleanVin}?format=json`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (!response.ok) {
      return localResult;
    }

    const data = await response.json();
    const result = data?.Results?.[0];

    if (!result) {
      return localResult;
    }

    const remoteProfile = {
      success: true,
      source: 'nhtsa_vpic',
      vin: cleanVin,
      wmi: localResult.wmi,
      vds: localResult.vds,
      checkDigit: localResult.checkDigit,
      modelYear: parseInt(result.ModelYear, 10) || localResult.modelYear,
      make: result.Make || localResult.make,
      model: result.Model || localResult.model,
      trim: result.Trim || result.Series || localResult.trim,
      bodyClass: result.BodyClass || localResult.bodyClass,
      driveType: result.DriveType || localResult.driveType,
      engineDisplacement: result.DisplacementL ? `${result.DisplacementL}L` : localResult.engineDisplacement,
      engineCylinders: parseInt(result.EngineCylinders, 10) || localResult.engineCylinders,
      fuelType: result.FuelTypePrimary || localResult.fuelType,
      plantCountry: result.PlantCountry || localResult.country,
      country: result.PlantCountry || localResult.country,
      vehicleType: result.VehicleType || localResult.vehicleType,
      gvwr: result.GVWR || localResult.gvwr,
      plantCode: result.PlantCity || localResult.plantCode,
      serialNumber: localResult.serialNumber,
      laborEstimatorProfile: {
        baseLaborRate: 145.0,
        standardDiagnosticHours: 1.5,
        shopSuppliesRate: 0.05
      }
    };

    cacheLocalData(cacheKey, remoteProfile);
    return remoteProfile;
  } catch {
    // Network error, CORS, timeout, or offline: graceful fallback
    return localResult;
  }
}

export default {
  validateVinChecksum,
  validateChecksum,
  decodeVinLocal,
  decode,
  decodeVin,
  WMI_CATALOG,
  YEAR_MAP
};
