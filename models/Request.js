import mongoose from 'mongoose'

/* RequestSchema corresponding to the requests collection in database. */
const RequestSchema = new mongoose.Schema({
    
    category: {
        /* The category of this request */
    
        type: String,
        enum: ['Fly Fishing', 'Ski Touring'],
        required: [true, 'Please provide a category for this request.'],
    },  
    title: {
        /* The name of this request */

        type: String,
        required: [true, 'Please provide a name for this request.'],
        maxlength: [128, 'Name cannot be more than 40 characters'],
    },
    description: {
        /* The description of this request */

        type: String,
        required: [true, 'Please provide a description for this request.'],
        maxlength: [256, 'description cannot be more than 128 characters'],
    },
    location: {
        /* The location of this request */

        type: Array,
        required: [true, 'Please provide a location for this request.'],
    },
    dates: {
        /* The available dates for this request */

        type: Array,
        required: [true, 'Please provide a date range for this request.'],
    },
    duration: {
        /* The duration of this request in hours*/

        type: Number,
        required: [true, 'Please provide a duration in hours for this request.'],
    },
    unit: {
        /* The unit of this request */

        type: String,
        enum: ['hour', 'day'],
        default: 'hour',
        required: [true, 'Please provide a unit for this request.'],
    },
    groupSize: {
        /* The group size for this request */

        type: Number,
        required: [true, 'Please provide a maximum group size for this request.'],
    },
    user: {
        /* The user id for the creator of this request */

        type: String,
        required: [true, 'Please provide a user for this request.'],
    },
    status: {
        /* The status of this request */

        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending',
    }
},
    { timestamps: true }
);

export default mongoose.models.Request || mongoose.model('Request', RequestSchema)