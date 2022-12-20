import mongoose from 'mongoose'

/* PostingSchema corresponding to the postings collection in database. */
const PostingSchema = new mongoose.Schema({
    
    category: {
        /* The category of this posting */
    
        type: String,
        enum: ['Fly Fishing', 'Ski Touring'],
        required: [true, 'Please provide a category for this posting.'],
    },  
    title: {
        /* The name of this posting */

        type: String,
        required: [true, 'Please provide a name for this posting.'],
        maxlength: [40, 'Name cannot be more than 40 characters'],
    },
    description: {
        /* The description of this posting */

        type: String,
        required: [true, 'Please provide a description for this posting.'],
        maxlength: [128, 'description cannot be more than 128 characters'],
    },
    location: {
        /* The location of this posting */

        type: Array,
        required: [true, 'Please provide a location for this posting.'],
    },
    dates: {
        /* The available dates for this posting */

        type: Array,
        required: [true, 'Please provide a date range for this posting.'],
    },
    maxGroupSize: {
        /* The maximum group size for this posting */

        type: Number,
        required: [true, 'Please provide a maximum group size for this posting.'],
    },
    duration: {
        /* The duration of this posting in hours*/

        type: Number,
        required: [true, 'Please provide a duration in hours for this posting.'],
    },
    rate: {
        /* The rate of this posting */

        type: Number,
        required: [true, 'Please provide a rate for this posting.'],
    },
    unit: {
        /* The unit of this posting */

        type: String,
        enum: ['hour', 'day', 'flatDay', 'flatHour'],
        default: 'hour',
        required: [true, 'Please provide a unit for this posting.'],
    },
    guide: {
        /* The creators id of this posting */

        type: String,
        required: [true, "Please provide the creators id."],
        maxlength: [48, "Owner's id cannot be more than 48 characters"],
    },
    providedEquipment: {
        /* The equipment provided for this posting */

        type: Array,
        required: [true, 'Please provide the provided equipment for this posting.'],
    },
    requiredEquipment: {
        /* The equipment required for this posting */

        type: Array,
        required: [true, 'Please provide the required equipment for this posting.'],
    },
    // requiredCertifications: {
    //     /* The certifications required for this posting */

    //     type: Array,
    // },
    status: {
        /* The status of this posting */

        type: String,
        enum: ['open', 'closed', 'archived'],
        default: 'open',
    },
},
    { timestamps: true }
);

export default mongoose.models.Posting || mongoose.model('Posting', PostingSchema)