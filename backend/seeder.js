const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected for Seeding'))
    .catch((err) => console.log(err));

const seedAdmin = async () => {
    try {
        const bcrypt = require('bcrypt');

        // Delete existing admin to ensure fresh credentials
        await Admin.deleteOne({ email: 'admin@gmail.com' });
        console.log('Deleted existing admin if any');

        // Manually hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        await Admin.collection.insertOne({
            name: 'Admin',
            email: 'admin@gmail.com',
            password: hashedPassword,
            role: 'admin',
            avatar: 'https://res.cloudinary.com/dfvffsv0c/image/upload/v1735125586/house_rental_platform/default-avatar_vqc6xj.png',
            createdAt: new Date(),
            __v: 0
        });

        console.log('Admin User Created Successfully via direct insert!');
        console.log('Email: admin@gmail.com');
        console.log('Password: admin123');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedAdmin();
