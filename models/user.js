const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    email: {
        type: String,
      
    },
    mobile:{
        type: String,
        
    },
    address:{
        type: String,
        required:true
    },
    aadharCardNumber:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        enum:['voter','admin'],
        default:'voter'
    },
    isVoted:{
        type:Boolean,
        default:false
    }

})

userSchema.pre('save', async function() {
    const user = this;
    if(!user.isModified('password')){ return; }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);
    user.password = hashedPassword;
});

userSchema.methods.comparePassword=async function(candidatePassword){
    try{
        return await bcrypt.compare(candidatePassword,this.password);
    }catch(err){
        throw new Error(err);
    }
}


const User = mongoose.model('User', userSchema);    
module.exports = User;