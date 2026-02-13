const Property = require('../models/Property');
// Ensure models are registered for populate
require('../models/Owner');
require('../models/Broker');
require('../models/Admin');

// @desc    Get all properties with filtering
// @route   GET /api/properties
// @access  Public
const getProperties = async (req, res) => {
    try {
        const { city, type, bhk, minPrice, maxPrice, postedBy } = req.query;

        let query = { status: 'approved' }; // Default to only showing approved properties

        // If user is logged in as owner/broker/admin, they might want to see their own pending ones
        // But for public view, only approved.
        // Let's refine this: if it's a specific request for "my properties", query varies.
        // But here it's the general listing.
        if (city) {
            query.location = { $regex: city, $options: 'i' };
        }

        // Filter by Type
        if (type) {
            query.type = type;
        }

        // Filter by BHK
        if (bhk && !isNaN(Number(bhk))) {
            query.bhk = Number(bhk);
        }

        // Filter by Price Range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice && !isNaN(Number(minPrice))) query.price.$gte = Number(minPrice);
            if (maxPrice && !isNaN(Number(maxPrice))) query.price.$lte = Number(maxPrice);
        }

        // Filter by Posted By (Role)
        // This is tricky because we need to filter by the populated field's role or the posterModel.
        // Since we added posterModel to schema, we can filter directly!
        if (postedBy) {
            // postedBy should be 'Owner' or 'Broker'
            // Map frontend terms if necessary. 
            // "Owner" -> "Owner" in our system mostly.
            // "Broker" -> "Broker"

            let model = postedBy;
            if (postedBy.toLowerCase() === 'owner') model = 'Owner';
            else if (postedBy.toLowerCase() === 'broker') model = 'Broker';

            query.posterModel = model;
        }

        // Fetch properties
        const properties = await Property.find(query)
            .populate('owner', 'name email role phone avatar')
            .sort({ createdAt: -1 });

        res.json(properties);
    } catch (error) {
        console.error("Error in getProperties:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single property
// @route   GET /api/properties/:id
// @access  Public
const getPropertyById = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id).populate('owner', 'name email role phone avatar');
        if (property) {
            res.json(property);
        } else {
            res.status(404).json({ message: 'Property not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a property
// @route   POST /api/properties
// @access  Private (Owner, Broker, Admin)
const createProperty = async (req, res) => {
    try {
        console.log('--- Create Property Request ---');
        console.log('User:', req.user ? `${req.user._id} (${req.user.role})` : 'No User');
        console.log('Body:', req.body);
        console.log('Files:', req.files ? req.files.length : 'No files');

        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const { title, description, location, price, deposit, type, bhk, amenities } = req.body;

        // Get image URLs from Cloudinary upload (req.files)
        const images = req.files ? req.files.map(file => file.path) : [];

        // Determine poster model based on user role
        let posterModel = 'Owner';
        if (req.user.role === 'broker') posterModel = 'Broker';
        if (req.user.role === 'admin') posterModel = 'Admin';

        // Parse amenities if it comes as a JSON string (form-data limitation)
        let parsedAmenities = [];
        if (amenities) {
            try {
                // If it's already an array, use it. If string, parse it.
                parsedAmenities = Array.isArray(amenities) ? amenities : JSON.parse(amenities);
            } catch (e) {
                // If parse fails, assume it's a single comma-separated string or just push the string
                parsedAmenities = typeof amenities === 'string' ? amenities.split(',').map(s => s.trim()) : [];
            }
        }

        // For Owners, deposit is always 0 (Direct dealing)
        const finalDeposit = req.user.role === 'owner' ? 0 : Number(deposit || 0);

        const property = new Property({
            title,
            description,
            location,
            price: Number(price),
            deposit: finalDeposit,
            type,
            bhk: Number(bhk),
            amenities: parsedAmenities,
            images,
            owner: req.user._id,
            posterModel
        });

        const createdProperty = await property.save();
        console.log('Property created successfully:', createdProperty._id);
        res.status(201).json(createdProperty);
    } catch (error) {
        console.error('Error in createProperty:', error);

        // Distinguish between validation errors and server errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: 'Validation Error', errors: messages });
        }

        res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
};

// @desc    Delete a property
// @route   DELETE /api/properties/:id
// @access  Private (Owner, Admin, Broker)
const deleteProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (property) {
            // Check ownership
            if (req.user.role === 'admin' || property.owner.toString() === req.user._id.toString()) {
                await property.deleteOne();
                res.json({ message: 'Property removed' });
            } else {
                res.status(401).json({ message: 'Not authorized to delete this property' });
            }
        } else {
            res.status(404).json({ message: 'Property not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const verifyProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        property.isVerified = true;
        property.status = 'approved';
        await property.save();

        res.json({ message: 'Property verified and published', property });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUnverifiedProperties = async (req, res) => {
    try {
        const properties = await Property.find({ status: 'pending' })
            .populate('owner', 'name email role')
            .sort({ createdAt: -1 });
        res.json(properties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMyProperties = async (req, res) => {
    try {
        const properties = await Property.find({ owner: req.user._id })
            .populate('owner', 'name email role')
            .sort({ createdAt: -1 });
        res.json(properties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProperties,
    getPropertyById,
    createProperty,
    deleteProperty,
    verifyProperty,
    getUnverifiedProperties,
    getMyProperties
};
