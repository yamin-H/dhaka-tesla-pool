import { prisma } from '../src/config/prisma.js';
import bcrypt from 'bcryptjs';


async function main() {
    console.log('Seeding database...');

  // Clean existing data
    await prisma.poolMember.deleteMany();
    await prisma.pool.deleteMany();
    await prisma.rideRequest.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Jashim (Driver)
    const jashim = await prisma.user.create({
        data: {
            name: 'Jashim Uddin',
            email: 'jashim@example.com',
            password: hashedPassword,
            role: 'DRIVER',
        },
    });

  // Create Bullet (Jashim's Vehicle)
    await prisma.vehicle.create({
        data: {
            driverId: jashim.id,
            name: 'Bullet',
            capacity: 3,
            status: 'ONLINE',
        },
    });

  // Create Nusrat (Passenger)
    await prisma.user.create({
        data: {
            name: 'Nusrat Jahan',
            email: 'nusrat@example.com',
            password: hashedPassword,
            role: 'PASSENGER',
        },
    });

  // Create Rafiq (Passenger)
    await prisma.user.create({
        data: {
            name: 'Rafiq Islam',
            email: 'rafiq@example.com',
            password: hashedPassword,
            role: 'PASSENGER',
        },
    });

  // Create Shirin (Passenger)
    await prisma.user.create({
        data: {
            name: 'Shirin Akter',
            email: 'shirin@example.com',
            password: hashedPassword,
            role: 'PASSENGER',
        },
    });

    console.log('Seeding complete.');
    console.log('Demo credentials (all passwords: password123):');
    console.log('  Driver:     jashim@example.com');
    console.log('  Passenger:  nusrat@example.com');
    console.log('  Passenger:  rafiq@example.com');
    console.log('  Passenger:  shirin@example.com');
};

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });