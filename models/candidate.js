const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const candidateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    party: {
        type: String,
        required: true
    },
    age:{
        type: Number,
        required:true
    },
    email:{
        type: String,
    },
    votes:[
        {
            user:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required:true
            },
            votedAt:{
                type: Date,
                default: Date.now
            }

        }
    ],
    voteCount:{
        type: Number,
        default: 0
    },
    aadharCardNumber: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

candidateSchema.pre('save', async function() {
    const candidate = this;
    if(!candidate.isModified('password')){ return; }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(candidate.password, salt);
    candidate.password = hashedPassword;
});

candidateSchema.methods.comparePassword = async function(candidatePassword){
    try{
        return await bcrypt.compare(candidatePassword, this.password);
    }catch(err){
        throw new Error(err);
    }
}


const Candidate = mongoose.model('Candidate', candidateSchema);    
module.exports = Candidate;