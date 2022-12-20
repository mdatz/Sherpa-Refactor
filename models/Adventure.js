import mongoose from 'mongoose'

/* Review SubSchema */
const reviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        required: [true, 'Please provide a rating for this review.'],
    },
    comment: {
        type: String,
    },
})

/* AdventureSchema corresponding to the adventures collection in database. */
const AdventureSchema = new mongoose.Schema({
    
    referenceId: {
        /* The id of the posting, or offer referenced by this adventure */
    
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Please provide the id of the posting - or - offer for this adventure.'],
    },
    referenceType: {
        /* The type (posting, or offer) referenced by this adventure */

        type: String,
        enum: ['posting', 'offer'],
        required: [true, 'Please provide the type of the posting - or - offer for this adventure.']
    },  
    startDate: {
        /* The start date for this adventure */

        type: Date,
        required: [true, 'Please provide a start date for this adventure.'],
        maxlength: [50, 'start date cannot be more than 50 characters'],
    },
    endDate: {
        /* The end date for this adventure */

        type: Date,
        required: [true, 'Please provide an end date for this adventure.'],
        maxlength: [50, 'end date cannot be more than 50 characters'],
    },
    guide: {
        /* The email of the guide for this adventure */

        type: String,
        required: [true, 'Please provide the id of the guide for this adventure.'],
    },
    user: {
        /* The email of the user for this adventure */

        type: String,
        required: [true, 'Please provide the id of the user for this adventure.'],
    },
    groupSize: {
        /* The group size for this adventure */

        type: Number,
        required: [true, 'Please provide a group size for this adventure.'],
    },
    price: {
        /* The price for this adventure */

        type: Number,
        required: [true, 'Please provide a price for this adventure.'],
    },
    status: {
        /* The status of this adventure */

        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending',
        required: [true, 'Please provide a status for this adventure.'],
    },
    stripeCheckoutSessionId: {
        /* The id of the stripe checkout for this adventure */

        type: String,
    },
    stripeCheckoutAmount: {
        /* The amount of the stripe checkout for this adventure */

        type: Number,
    },
    stripeCheckoutStatus: {
        /* The status of the stripe checkout for this adventure */

        type: String,
        enum: ['pending', 'success', 'canceled', 'failed'],
        default: 'pending'
    },
    stripeRefundId: {
        /* The id of the stripe refund for this adventure */

        type: String,
    },
    stripeRefundAmount: {
        /* The amount of the refund for this adventure */

        type: Number,
    },
    stripeRefundStatus: {
        /* The status of the refund for this adventure */

        type: String,
        enum: ['pending', 'success', 'canceled', 'failed'],
    },
    reviews: {
        /* The reviews for this adventure */

        type: [reviewSchema],
    },
},
    { timestamps: true }
);

export default mongoose.models.Adventure || mongoose.model('Adventure', AdventureSchema)