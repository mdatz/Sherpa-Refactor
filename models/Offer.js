import mongoose from 'mongoose'

/* OfferSchema corresponding to the offers collection in database. */
const OfferSchema = new mongoose.Schema({
    
    requestId: {
        /* The id of the cooresponding request for the offer */
    
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Please provide the id of the request for this proposal.'],
    },
    dates: {
        /* The potential start dates for this offer */
        
        type: Date,
        required: [true, 'Please provide a date or range of dates for this proposal.'],
    },
    rate: {
        /* The rate for this offer */

        type: Number,
        required: [true, 'Please provide a rate for this proposal.'],
    },
    unit: {
        /* The unit of this posting */

        type: String,
        enum: ['hour', 'day', 'flatDay', 'flatHour'],
        default: 'hour',
        required: [true, 'Please provide a unit for this posting.'],
    },
    guide: {
        /* The id of the guide for this offer */

        type: String,
        required: [true, 'Please provide the guide for this proposal.'],
    },
    providedEquipment: {
        /* The equipment provided for this offer */

        type: Array,
        required: [true, 'Please provide the provided equipment for this posting.'],
    },
    requiredEquipment: {
        /* The equipment required for this offer */

        type: Array,
        required: [true, 'Please provide the required equipment for this posting.'],
    },
    status: {
        /* The status of this offer*/

        type: String,
        enum: ['pending', 'accepted', 'declined', 'reviewed'],
        default: 'pending',
    }
},
    { timestamps: true }
);

export default mongoose.models.Offer || mongoose.model('Offer', OfferSchema)