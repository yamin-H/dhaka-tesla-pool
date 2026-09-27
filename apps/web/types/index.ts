export type Role = 'PASSENGER' | 'DRIVER';

export type VehicleStatus = 'ONLINE' | 'OFFLINE' | 'IN_RIDE';

export type RideStatus =
  | 'REQUESTED'
  | 'MATCHED'
  | 'DRIVER_ARRIVED'
  | 'STARTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PoolStatus =
  | 'MATCHED'
  | 'DRIVER_ARRIVED'
  | 'STARTED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface Vehicle {
  id: string;
  driverId: string;
  name: string;
  capacity: number;
  currentOccupiedSeats: number;
  status: VehicleStatus;
  createdAt?: string;
}

export interface RideRequest {
  id: string;
  passengerId: string;
  poolId: string | null;
  pickupLocation: string;
  destination: string;
  seatsRequested: number;
  status: RideStatus;
  estimatedFare: number;
  finalFare: number | null;
  createdAt: string;
  updatedAt: string;
  passenger?: User;
}

export interface PoolMember {
  id: string;
  poolId: string;
  passengerId: string;
  rideId: string;
  fare: number;
  joinedAt: string;
}

export interface Pool {
  id: string;
  vehicleId: string;
  driverId: string;
  status: PoolStatus;
  totalSeatsOccupied: number;
  createdAt: string;
  updatedAt: string;
  rideRequests?: RideRequest[];
  poolMembers?: PoolMember[];
  vehicle?: Vehicle;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface FareEstimate {
  pickup: string;
  destination: string;
  distanceKm: number;
  baseFare: number;
  distanceCharge: number;
  poolDiscount: number;
  totalFare: number;
  totalFareBDT: number;
  isPooled: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}