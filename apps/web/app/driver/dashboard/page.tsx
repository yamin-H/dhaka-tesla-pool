'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { formatFare, formatDate, getRideStatusColor } from '@/lib/utils';
import { RideRequest, Pool, Vehicle } from '@/types';
import api from '@/lib/api';
import { useCallback } from 'react';

export default function DriverDashboard() {
    const router = useRouter();
    const { user, logout, loading } = useAuth();
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [availableRides, setAvailableRides] = useState<RideRequest[]>([]);
    const [activePools, setActivePools] = useState<Pool[]>([]);
    const [selectedRides, setSelectedRides] = useState<string[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [vehicleRes, availableRes, poolsRes] = await Promise.all([
                api.get('/vehicles/mine'),
                api.get('/pools/available'),
                api.get('/pools/my'),
            ]);
            setVehicle(vehicleRes.data.data);
            setAvailableRides(availableRes.data.data);
            setActivePools(
                poolsRes.data.data.filter((p: Pool) =>
                    ['MATCHED', 'DRIVER_ARRIVED', 'STARTED'].includes(p.status)
                )
            );
        } catch {
            // silent
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
            return;
        }
        if (!loading && user?.role !== 'DRIVER') {
            router.push('/passenger/dashboard');
            return;
        }
        fetchData();
    }, [user, loading, fetchData]);

    useEffect(() => {
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const toggleVehicleStatus = async () => {
        if (!vehicle) return;
        setFeedback(null);
        const newStatus = vehicle.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
        try {
            await api.patch('/vehicles/status', { status: newStatus });
            setFeedback({ type: 'success', text: `Vehicle is now ${newStatus}` });
            fetchData();
        } catch (error: any) {
            setFeedback({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update vehicle status.',
            });
        }
    };

    const toggleRideSelection = (rideId: string) => {
        setSelectedRides((prev) =>
            prev.includes(rideId)
                ? prev.filter((id) => id !== rideId)
                : [...prev, rideId]
        );
    };

    const acceptPool = async () => {
        if (selectedRides.length === 0) {
            setFeedback({ type: 'error', text: 'Select at least one ride to create a pool.' });
            return;
        }
        setFeedback(null);
        try {
            await api.post('/pools/create', { rideRequestIds: selectedRides });
            setFeedback({ type: 'success', text: 'Pool created and rides accepted successfully!' });
            setSelectedRides([]);
            fetchData();
        } catch (error: any) {
            setFeedback({
                type: 'error',
                text: error.response?.data?.message || 'Failed to create pool.',
            });
        }
    };

    const updatePoolStatus = async (poolId: string, action: 'arrived' | 'start' | 'complete') => {
        setFeedback(null);
        try {
            await api.patch(`/pools/${poolId}/${action}`);
            setFeedback({ type: 'success', text: `Ride marked as ${action} successfully.` });
            fetchData();
        } catch (error: any) {
            setFeedback({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update ride status.',
            });
        }
    };

    if (loading || loadingData) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold">🛺 Dhaka Tesla Pool</h1>
                    <p className="text-sm text-gray-500">Driver: {user?.name}</p>
                </div>
                <Button variant="outline" onClick={logout}>Logout</Button>
            </div>

            <div className="max-w-2xl mx-auto p-6 space-y-6">

                {/* Feedback Alert Banner */}
                {feedback && (
                    <div className={`p-4 text-sm rounded-md border ${feedback.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-red-50 border-red-200 text-red-600'
                        }`}>
                        {feedback.text}
                    </div>
                )}

                {/* Vehicle Status Card */}
                {vehicle ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>{vehicle.name}</CardTitle>
                            <CardDescription>Capacity: {vehicle.capacity} seats</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-between items-center">
                            <div className="space-y-1">
                                <p className="text-sm text-gray-600">
                                    Occupied: {vehicle.currentOccupiedSeats} / {vehicle.capacity}
                                </p>
                                <Badge
                                    className={
                                        vehicle.status === 'ONLINE'
                                            ? 'bg-green-100 text-green-800'
                                            : vehicle.status === 'IN_RIDE'
                                                ? 'bg-orange-100 text-orange-800'
                                                : 'bg-gray-100 text-gray-800'
                                    }
                                >
                                    {vehicle.status}
                                </Badge>
                            </div>
                            <Button
                                variant={vehicle.status === 'ONLINE' ? 'destructive' : 'default'}
                                onClick={toggleVehicleStatus}
                                disabled={vehicle.status === 'IN_RIDE'}
                            >
                                {vehicle.status === 'ONLINE' ? 'Go Offline' : 'Go Online'}
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="py-6 text-center">
                            <p className="text-gray-500 mb-4">No vehicle registered yet.</p>
                            <Button onClick={() => router.push('/driver/vehicle')}>
                                Register Vehicle
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Active Pools */}
                {activePools.length > 0 && (
                    <Card className="border-orange-200 bg-orange-50">
                        <CardHeader>
                            <CardTitle className="text-orange-800">Active Pools</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {activePools.map((pool) => (
                                <div key={pool.id} className="border bg-white rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-sm">Pool #{pool.id.slice(0, 8)}</span>
                                        <Badge className={getRideStatusColor(pool.status)}>{pool.status}</Badge>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Seats occupied: {pool.totalSeatsOccupied}
                                    </p>
                                    {pool.rideRequests?.map((ride) => (
                                        <div key={ride.id} className="text-sm text-gray-600 border-l-2 border-orange-300 pl-2">
                                            {ride.passenger?.name}: {ride.pickupLocation} → {ride.destination}
                                        </div>
                                    ))}
                                    <div className="flex gap-2">
                                        {pool.status === 'MATCHED' && (
                                            <Button size="sm" onClick={() => updatePoolStatus(pool.id, 'arrived')}>
                                                Mark Arrived
                                            </Button>
                                        )}
                                        {pool.status === 'DRIVER_ARRIVED' && (
                                            <Button size="sm" onClick={() => updatePoolStatus(pool.id, 'start')}>
                                                Start Ride
                                            </Button>
                                        )}
                                        {pool.status === 'STARTED' && (
                                            <Button size="sm" onClick={() => updatePoolStatus(pool.id, 'complete')}>
                                                Complete Ride
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Available Rides */}
                <Card>
                    <CardHeader>
                        <CardTitle>Available Rides</CardTitle>
                        <CardDescription>Select rides to pool together</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {availableRides.length === 0 ? (
                            <p className="text-sm text-gray-500">No available rides right now.</p>
                        ) : (
                            <>
                                {availableRides.map((ride) => (
                                    <div
                                        key={ride.id}
                                        onClick={() => toggleRideSelection(ride.id)}
                                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${selectedRides.includes(ride.id)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-sm">{ride.passenger?.name}</span>
                                            <span className="text-sm text-gray-500">{ride.seatsRequested} seat</span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {ride.pickupLocation} → {ride.destination}
                                        </p>
                                        <p className="text-sm text-green-700">{formatFare(ride.estimatedFare)}</p>
                                    </div>
                                ))}
                                {selectedRides.length > 0 && (
                                    <Button className="w-full" onClick={acceptPool}>
                                        Accept {selectedRides.length} Ride{selectedRides.length > 1 ? 's' : ''} as Pool
                                    </Button>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}