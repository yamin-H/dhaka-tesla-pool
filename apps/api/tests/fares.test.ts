import { calculateEstimatedFare, getFareBreakdown } from '../src/modules/fares/fares.services.js';

describe('Fare Calculation', () => {
    test('Nusrat: Banani to Mohakhali solo fare', () => {
        const fare = calculateEstimatedFare('Banani', 'Mohakhali', false);
        expect(fare).toBe(2850);
    });

    test('Nusrat: Banani to Mohakhali pooled fare', () => {
        const fare = calculateEstimatedFare('Banani', 'Mohakhali', true);
        expect(fare).toBe(1850);
    });

    test('Rafiq: Banani to Gulshan solo fare', () => {
        const fare = calculateEstimatedFare('Banani', 'Gulshan', false);
        expect(fare).toBe(2950);
    });

    test('Rafiq: Banani to Gulshan pooled fare', () => {
        const fare = calculateEstimatedFare('Banani', 'Gulshan', true);
        expect(fare).toBe(1950);
    });

    test('pooled fare is always less than solo fare', () => {
        const solo = calculateEstimatedFare('Banani', 'Mohakhali', false);
        const pooled = calculateEstimatedFare('Banani', 'Mohakhali', true);
        expect(pooled).toBeLessThan(solo);
    });

    test('fare breakdown has correct structure', () => {
        const breakdown = getFareBreakdown('Banani', 'Mohakhali', false);
        expect(breakdown).toHaveProperty('distanceKm');
        expect(breakdown).toHaveProperty('baseFare');
        expect(breakdown).toHaveProperty('distanceCharge');
        expect(breakdown).toHaveProperty('poolDiscount');
        expect(breakdown).toHaveProperty('totalFare');
        expect(breakdown).toHaveProperty('totalFareBDT');
    });

    test('minimum fare is 1000 paisa', () => {
        const fare = calculateEstimatedFare('Banani', 'Mohakhali', true);
        expect(fare).toBeGreaterThanOrEqual(1000);
    });

    test('throws error for invalid zone', () => {
        expect(() => calculateEstimatedFare('InvalidZone', 'Mohakhali', false)).toThrow();
    });
});