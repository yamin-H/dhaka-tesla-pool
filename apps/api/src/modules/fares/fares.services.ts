import { getDistanceKm, getAvailableZones } from "./zones.js"

const BASE_FARE = 2000;        // 20 BDT in paisa
const RATE_PER_KM = 500;       // 5 BDT per km in paisa
const POOL_DISCOUNT = 1000;    // 10 BDT discount in paisa

export const calculateEstimatedFare = (pickup: string, destination: string, isPooled: boolean = false): number => {
    const distanceKm = getDistanceKm(pickup, destination);
    const distanceCharge = Math.round(distanceKm * RATE_PER_KM);
    const discount = isPooled ? POOL_DISCOUNT : 0;
    const fare = BASE_FARE + distanceCharge - discount;

    return Math.max(fare, 1000); 
};

export const getFareBreakdown = (pickup: string, destination: string, isPooled: boolean = false) => {
    const distanceKm = getDistanceKm(pickup, destination);
    const distanceCharge = Math.round(distanceKm * RATE_PER_KM);
    const discount = isPooled ? POOL_DISCOUNT : 0;
    const totalFare = Math.max(BASE_FARE + distanceCharge - discount, 1000);

    return {
        pickup,
        destination,
        distanceKm,
        baseFare: BASE_FARE,
        distanceCharge,
        poolDiscount: discount,
        totalFare,
        totalFareBDT: totalFare / 100,
        isPooled,
    };
};

export const getZones = () => getAvailableZones();