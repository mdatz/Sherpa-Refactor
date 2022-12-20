import mongoose from 'mongoose'

/* PostingSchema corresponding to the postings collection in database. */
const UserSchema = new mongoose.Schema({
    
    name: {
        /* The name/username for this user */
    
        type: String,
        required: [true, 'Please provide a name for this user.'],
        maxlength: [30, 'Email cannot be more than 30 characters'],
    },  
    email: {
        /* The email for this user */

        type: String,
        required: [true, 'Please provide an email for this user.'],
        maxlength: [40, 'Email cannot be more than 40 characters'],
        index: { unique: true },
    },
    password: {
        /* The hashed password for this user if using custom credentials provider */

        type: String,
        maxlength: [128, 'password cannot be more than 128 characters'],
    },
    image: {
        /* The profile image for this user */

        type: String,
    },
    certifications: {
        /* The certifications for this user */

        type: Array,
    },
    role: {
        /* The role for this user */

        type: String,
        enum: ['admin', 'user', 'sherpa'],
        default: 'user',
        required: [true, 'Please provide a role for this user.'],
    },
    createdAt: {
        /* The date and time this user was created */

        type: Date,
        default: Date.now,

    },
    updatedAt: {
        /* The date and time this user was last updated */

        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.User || mongoose.model('User', UserSchema)