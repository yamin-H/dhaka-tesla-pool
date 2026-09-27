export const formatFare = (paisa: number): string => {
    return `৳${(paisa / 100).toFixed(2)}`;
};

export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-BD', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
};

export const getRideStatusColor = (status: string): string => {
    switch (status) {
        case 'REQUESTED':
            return 'bg-yellow-100 text-yellow-800';
        case 'MATCHED':
            return 'bg-blue-100 text-blue-800';
        case 'DRIVER_ARRIVED':
            return 'bg-purple-100 text-purple-800';
        case 'STARTED':
            return 'bg-orange-100 text-orange-800';
        case 'COMPLETED':
            return 'bg-green-100 text-green-800';
        case 'CANCELLED':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};