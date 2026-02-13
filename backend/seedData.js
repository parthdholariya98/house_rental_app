const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Property = require('./models/Property');
const Owner = require('./models/Owner');
const bcrypt = require('bcrypt');

dotenv.config();

// Connect DB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Seeding Data...');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    try {
        // 1. Create a Owner if not exists
        let owner = await Owner.findOne({ email: 'owner_vadodara@example.com' });

        if (!owner) {
            console.log('Creating Vadodara Owner...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456', salt);

            owner = await Owner.create({
                name: 'Vadodara Owner',
                email: 'owner_vadodara@example.com',
                password: hashedPassword,
                role: 'owner',
                phone: '9876543210',
                location: 'Vadodara',
                isVerified: true
            });
            console.log('Owner Created:', owner.email);
        } else {
            console.log('Owner already exists:', owner.email);
        }

        // 2. Create Properties in Vadodara
        const properties = [
            {
                title: 'Luxury Apartment in Alkapuri',
                description: 'A beautiful 3BHK apartment in the heart of Vadodara, Alkapuri. Fully furnished with modern amenities.',
                location: 'Vadodara',
                price: 25000,
                deposit: 50000,
                type: 'Apartment',
                bhk: 3,
                amenities: ['Wifi', 'Parking', 'Gym', 'AC', 'Security'],
                images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'],
                owner: owner._id,
                posterModel: 'Owner',
                isAvailable: true,
                isVerified: true,
                status: 'approved'
            },
            {
                title: 'Spacious Villa in Vasna-Bhayli',
                description: '4BHK spacious villa with a private garden in Vasna-Bhayli road. Peaceful locality.',
                location: 'Vadodara',
                price: 45000,
                deposit: 100000,
                type: 'Villa',
                bhk: 4,
                amenities: ['Garden', 'Parking', 'Club House', 'Swimming Pool'],
                images: ['https://images.unsplash.com/photo-1613490493576-2f5037657918', 'https://images.unsplash.com/photo-1613977257363-707ba9348227'],
                owner: owner._id,
                posterModel: 'Owner',
                isAvailable: true,
                isVerified: true,
                status: 'approved'
            },
            {
                title: 'Cozy House in Manjalpur',
                description: '2BHK independent house in Manjalpur. Close to schools and hospitals.',
                location: 'Vadodara',
                price: 15000,
                deposit: 30000,
                type: 'House',
                bhk: 2,
                amenities: ['Parking', 'Water Supply', 'Gas Pipeline'],
                images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994'],
                owner: owner._id,
                posterModel: 'Owner',
                isAvailable: true,
                isVerified: true,
                status: 'approved'
            },
            {
                title: 'Modern Tenament in Karelibaug',
                description: 'Newly renovated 1BHK tenament in Karelibaug area. Ideal for students or small families.',
                location: 'Vadodara',
                price: 8000,
                deposit: 16000,
                type: 'Tenament',
                bhk: 1,
                amenities: ['Water Supply', 'Near Market'],
                images: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be'],
                owner: owner._id,
                posterModel: 'Owner',
                isAvailable: true,
                isVerified: true,
                status: 'approved'
            },
            {
                title: 'Penthouse near Gotri',
                description: 'Luxurious penthouse with terrace garden near Gotri. Premium living experience.',
                location: 'Vadodara',
                price: 60000,
                deposit: 150000,
                type: 'Apartment',
                bhk: 4,
                amenities: ['Terrace Garden', 'Gym', 'Swimming Pool', 'Elevator', 'Security'],
                images: ['https://images.unsplash.com/photo-1512918760519-9cd11dbff4eb'],
                owner: owner._id,
                posterModel: 'Owner',
                isAvailable: true,
                isVerified: true,
                status: 'approved'
            }
        ];

        console.log('Clearing old properties...');
        await Property.deleteMany({});

        console.log('Seeding Properties...');
        for (const prop of properties) {
            const exists = await Property.findOne({ title: prop.title });
            if (!exists) {
                await Property.create(prop);
                console.log(`Added: ${prop.title}`);
            } else {
                exists.status = 'approved';
                exists.isVerified = true;
                await exists.save();
                console.log(`Updated to Approved: ${prop.title}`);
            }
        }

        console.log('Seeding Completed Successfully!');
        process.exit();
    } catch (error) {
        console.error('Seeding Error:', error);
        process.exit(1);
    }
};

seedData();
