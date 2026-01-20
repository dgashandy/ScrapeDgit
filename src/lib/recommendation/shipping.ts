// Indonesian city distance mapping for shipping estimation
// Values represent approximate distance score (lower = closer, cheaper shipping)

type CityDistanceMap = Record<string, Record<string, number>>;

// Major Indonesian cities with approximate relative distances
const CITY_DISTANCES: CityDistanceMap = {
    jakarta: {
        jakarta: 0,
        bogor: 60,
        depok: 30,
        tangerang: 25,
        bekasi: 20,
        bandung: 150,
        semarang: 450,
        surabaya: 800,
        malang: 850,
        yogyakarta: 520,
        solo: 550,
        medan: 1800,
        palembang: 450,
        makassar: 1400,
        denpasar: 1200,
        balikpapan: 1200,
        pontianak: 750,
        manado: 2500,
        padang: 900,
        pekanbaru: 1200,
    },
    surabaya: {
        jakarta: 800,
        surabaya: 0,
        malang: 90,
        semarang: 350,
        yogyakarta: 330,
        solo: 260,
        bandung: 700,
        denpasar: 400,
        makassar: 700,
        balikpapan: 500,
    },
    bandung: {
        jakarta: 150,
        bandung: 0,
        semarang: 340,
        surabaya: 700,
        yogyakarta: 420,
        bogor: 110,
    },
    yogyakarta: {
        jakarta: 520,
        yogyakarta: 0,
        solo: 65,
        semarang: 120,
        surabaya: 330,
        bandung: 420,
        malang: 350,
    },
    medan: {
        jakarta: 1800,
        medan: 0,
        padang: 800,
        pekanbaru: 450,
        palembang: 1500,
    },
};

// Normalize city name for lookup
function normalizeCity(city: string): string {
    return city
        .toLowerCase()
        .trim()
        .replace(/kota\s+/i, "")
        .replace(/kabupaten\s+/i, "")
        .replace(/provinsi\s+/i, "");
}

// Get distance between two cities
export function getCityDistance(fromCity: string, toCity: string): number {
    const from = normalizeCity(fromCity);
    const to = normalizeCity(toCity);

    // Same city
    if (from === to) return 0;

    // Check direct lookup
    if (CITY_DISTANCES[from]?.[to] !== undefined) {
        return CITY_DISTANCES[from][to];
    }
    if (CITY_DISTANCES[to]?.[from] !== undefined) {
        return CITY_DISTANCES[to][from];
    }

    // Default distance for unknown cities
    return 500;
}

// Estimate shipping fee based on distance
export function estimateShippingFee(
    fromCity: string,
    toCity: string,
    weight: number = 1 // default 1kg
): number {
    const distance = getCityDistance(fromCity, toCity);

    // Base shipping cost calculation
    // Approximate rates inspired by Indonesian courier services
    const baseCost = 10000; // Base cost in IDR
    const perKm = 15; // IDR per km
    const perKg = 2000; // Additional per kg

    const shippingCost = baseCost + distance * perKm + (weight - 1) * perKg;

    // Round to nearest 500
    return Math.round(shippingCost / 500) * 500;
}

// Get shipping tier for display
export function getShippingTier(fee: number): string {
    if (fee <= 15000) return "Murah";
    if (fee <= 30000) return "Sedang";
    if (fee <= 50000) return "Mahal";
    return "Sangat Mahal";
}

// Export city list for autocomplete
export function getAvailableCities(): string[] {
    const cities = new Set<string>();

    Object.keys(CITY_DISTANCES).forEach((city) => {
        cities.add(city.charAt(0).toUpperCase() + city.slice(1));
        Object.keys(CITY_DISTANCES[city]).forEach((subCity) => {
            cities.add(subCity.charAt(0).toUpperCase() + subCity.slice(1));
        });
    });

    return Array.from(cities).sort();
}
