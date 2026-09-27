export const ZONES: Record<string, { lat: number; lng: number }> = {
    Banani: { lat: 23.7937, lng: 90.4066 },
    Gulshan: { lat: 23.7806, lng: 90.4193 },
    Mohakhali: { lat: 23.7799, lng: 90.4006 },
    Dhanmondi: { lat: 23.7461, lng: 90.3742 },
    Mirpur: { lat: 23.8223, lng: 90.3654 },
    Uttara: { lat: 23.8759, lng: 90.3795 },
    Farmgate: { lat: 23.7592, lng: 90.3906 },
    Bashundhara: { lat: 23.8141, lng: 90.4244 },
};

export const getDistanceKm = (pickup: string, destination: string): number => {
    const from = ZONES[pickup];
    const to = ZONES[destination];

    if (!from || !to) {
        throw new Error(`Invalid zone: ${pickup} or ${destination}`);
    }

    // Haversine formula
    const R = 6371;
    const dLat = ((to.lat - from.lat) * Math.PI) / 180;
    const dLng = ((to.lng - from.lng) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((from.lat * Math.PI) / 180) *
        Math.cos((to.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10;
};

export const getAvailableZones = (): string[] => {
    return Object.keys(ZONES);
};