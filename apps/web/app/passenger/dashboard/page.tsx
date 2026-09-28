'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { formatFare, formatDate, getRideStatusColor } from '@/lib/utils';
import { RideRequest, FareEstimate } from '@/types';
import api from '@/lib/api';
import { useCallback } from 'react';

const ZONES = [
  'Banani', 'Gulshan', 'Mohakhali', 'Dhanmondi',
  'Mirpur', 'Uttara', 'Farmgate', 'Bashundhara',
];

const rideSchema = z.object({
  pickupLocation: z.string().min(1, 'Pickup is required'),
  destination: z.string().min(1, 'Destination is required'),
  seatsRequested: z.number().int().min(1).max(3),
});

type RideInput = z.infer<typeof rideSchema>;

export default function PassengerDashboard() {
    const router = useRouter();
    const { user, logout, loading } = useAuth();
    const [rides, setRides] = useState<RideRequest[]>([]);
    const [fareEstimate, setFareEstimate] = useState<FareEstimate | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [loadingRides, setLoadingRides] = useState(true);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const form = useForm<RideInput>({
        resolver: zodResolver(rideSchema),
        defaultValues: { pickupLocation: '', destination: '', seatsRequested: 1 },
    });

    const fetchRides = useCallback(async () => {
        try {
            const res = await api.get('/rides/my');
            setRides(res.data.data);
            const active = res.data.data.find((r: RideRequest) => ['REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED', 'COMPLETED'].includes(r.status));
            if (active) {
                const statusMessages: Record<string, string> = {
                    REQUESTED: '🔍 Searching for a driver...',
                    MATCHED: '🛺 Driver accepted your ride!',
                    DRIVER_ARRIVED: '📍 Your driver has arrived!',
                    STARTED: '🚀 Your ride is in progress!',
                    COMPLETED: '✅ Ride completed! Thank you for riding with us.'
                }

                setFeedback({
                    type: "success",
                    text : statusMessages[active.status]
                })
            }
            else {
                setFeedback(null)
            }
        } catch {
            // silent
        } finally {
            setLoadingRides(false);
        }
    }, []);

    const fetchFareEstimate = async (pickup: string, destination: string) => {
        if (!pickup || !destination) return;
        try {
            const res = await api.get(`/fares/estimate?pickup=${pickup}&destination=${destination}`);
            setFareEstimate(res.data.data);
        } catch {
            setFareEstimate(null);
        }
    };

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.push('/login')
            return
        }

        if (user?.role !== 'PASSENGER') {
            router.push('/driver/dashboard');
            return
        }

        fetchRides();

    }, [loading, user, fetchRides]);

    useEffect(() => {
        const interval = setInterval(fetchRides, 5000);
        return () => clearInterval(interval);
    }, [fetchRides]);

    const onSubmit = async (data: RideInput) => {
        setSubmitting(true);
        setFeedback(null);
        try {
            await api.post('/rides/request', data);
            setFeedback({ type: 'success', text: 'Ride requested successfully! Searching for drivers...' });
            form.reset({ pickupLocation: '', destination: '', seatsRequested: 1 });
            setFareEstimate(null);
            fetchRides();
        } catch (error: any) {
            setFeedback({
                type: 'error',
                text: error.response?.data?.message || 'Something went wrong requesting the ride.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const cancelRide = async (rideId: string) => {
        setFeedback(null);
        try {
            await api.patch(`/rides/${rideId}/cancel`);
            setFeedback({ type: 'success', text: 'Ride cancelled successfully.' });
            fetchRides();
        } catch (error: any) {
            setFeedback({
                type: 'error',
                text: error.response?.data?.message || 'Failed to cancel the ride.',
            });
        }
    };

    const activeRide = rides.find((r) =>
        ['REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED'].includes(r.status)
    );

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold">🛺 Dhaka Tesla Pool</h1>
                    <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
                </div>
                <Button variant="outline" onClick={logout}>Logout</Button>
            </div>

            <div className="max-w-2xl mx-auto p-6 space-y-6">

                {/* Feedback Notification */}
                {feedback && (
                    <div className={`p-4 text-sm rounded-md border ${
                        feedback.type === 'success' 
                            ? 'bg-green-50 border-green-200 text-green-700' 
                            : 'bg-red-50 border-red-200 text-red-600'
                    }`}>
                        {feedback.text}
                    </div>
                )}

                {/* Active Ride Status */}
                {activeRide && (
                    <Card className="border-blue-200 bg-blue-50">
                        <CardHeader>
                            <CardTitle className="text-blue-800">Active Ride</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{activeRide.pickupLocation} → {activeRide.destination}</span>
                                <Badge className={getRideStatusColor(activeRide.status)}>{activeRide.status}</Badge>
                            </div>
                            <p className="text-sm text-gray-600">Estimated fare: {formatFare(activeRide.estimatedFare)}</p>
                            {['REQUESTED', 'MATCHED'].includes(activeRide.status) && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => cancelRide(activeRide.id)}
                                >
                                    Cancel Ride
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Request Ride Form */}
                {!activeRide && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Request a Ride</CardTitle>
                            <CardDescription>Share a Tesla, split the fare</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="pickupLocation">Pickup Location</Label>
                                    <select
                                        id="pickupLocation"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                        value={form.watch('pickupLocation')}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            form.setValue('pickupLocation', val, { shouldValidate: true });
                                            fetchFareEstimate(val, form.getValues('destination'));
                                        }}
                                    >
                                        <option value="">Select pickup</option>
                                        {ZONES.map((zone) => (
                                            <option key={zone} value={zone}>{zone}</option>
                                        ))}
                                    </select>
                                    {form.formState.errors.pickupLocation && (
                                        <p className="text-xs text-red-500">
                                            {form.formState.errors.pickupLocation.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="destination">Destination</Label>
                                    <select
                                        id="destination"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                        value={form.watch('destination')}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            form.setValue('destination', val, { shouldValidate: true });
                                            fetchFareEstimate(form.getValues('pickupLocation'), val);
                                        }}
                                    >
                                        <option value="">Select destination</option>
                                        {ZONES.map((zone) => (
                                            <option key={zone} value={zone}>{zone}</option>
                                        ))}
                                    </select>
                                    {form.formState.errors.destination && (
                                        <p className="text-xs text-red-500">
                                            {form.formState.errors.destination.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="seatsRequested">Seats</Label>
                                    <select
                                        id="seatsRequested"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                        {...form.register('seatsRequested', { valueAsNumber: true })}
                                    >
                                        <option value={1}>1 Seat</option>
                                        <option value={2}>2 Seats</option>
                                        <option value={3}>3 Seats</option>
                                    </select>
                                </div>

                                {/* Fare Estimate */}
                                {fareEstimate && (
                                    <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                                        <p className="font-medium">Fare Estimate</p>
                                        <p className="text-gray-600">Distance: {fareEstimate.distanceKm} km</p>
                                        <p className="text-gray-600">Base fare: {formatFare(fareEstimate.baseFare)}</p>
                                        <p className="text-gray-600">Distance charge: {formatFare(fareEstimate.distanceCharge)}</p>
                                        <p className="font-semibold text-green-700">Total: {formatFare(fareEstimate.totalFare)}</p>
                                    </div>
                                )}

                                <Button type="submit" className="w-full" disabled={submitting}>
                                    {submitting ? 'Requesting...' : 'Request Ride'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Ride History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ride History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingRides ? (
                            <p className="text-sm text-gray-500">Loading...</p>
                        ) : rides.length === 0 ? (
                            <p className="text-sm text-gray-500">No rides yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {rides.map((ride) => (
                                    <div key={ride.id} className="border rounded-lg p-3 space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-sm">
                                                {ride.pickupLocation} → {ride.destination}
                                            </span>
                                            <Badge className={getRideStatusColor(ride.status)}>
                                                {ride.status}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-gray-500">{formatDate(ride.createdAt)}</p>
                                        <p className="text-sm">
                                            {ride.finalFare
                                                ? `Final fare: ${formatFare(ride.finalFare)}`
                                                : `Estimated: ${formatFare(ride.estimatedFare)}`}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}