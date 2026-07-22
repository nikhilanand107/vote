const express = require('express');
const router = express.Router();
const User = require('../models/user.js');
const Candidate = require('../models/candidate.js');    
const {jwtAuthMiddleware,generateToken} = require('../jwt.js');

 router.post('/signup',async(req,res)=>{
    try{
        const data = req.body;
        const user = new User(data);
        await user.save();
        const payload = {
            id: user._id,
            role: user.role
        }
        console.log(JSON.stringify(payload));
        const token = generateToken(payload);
        console.log("Generated token:", token);
        res.status(201).json({message:'User created successfully',user});
    }catch(err){
        console.error(err);
        res.status(500).json({error:'Internal server error'});
    }
});

router.post('/login',async(req,res)=>{
    try{
        const {aadharCardNumber,password} = req.body;
        const user = await User.findOne({aadharCardNumber});
        if(!user||!(await user.comparePassword(password))){
            return res.status(401).json({error:'Invalid credentials'});
        }   
    
    const payload = {
        id: user._id,
        role: user.role
    }
    const token = generateToken(payload);
    res.status(200).json({message:'Login successful',token});
}
catch(err){
    console.error(err);
    res.status(500).json({error:'Internal server error'});
}
});

router.get('/profile',jwtAuthMiddleware,async(req,res)=>{
    try{
       const userData =req.user;
       const userId= userData.id;
       const user = await User.findById(userId);
       res.status(200).json({user});
    }
    catch(err){
        console.error(err);
        res.status(500).json({error:'Internal server error'});
    }
});

router.put('/profile/password',jwtAuthMiddleware,async(req,res)=>{
    try{
        const userId = req.user.id;
        const {oldPassword,newPassword} = req.body;
        const user = await User.findById(userId);
        if(!(await user.comparePassword(oldPassword))){
            return res.status(401).json({error:'Invalid credentials'});
        }
        user.password = newPassword;
        await user.save();
        res.status(200).json({message:'Password updated successfully'});
    } catch(err){
        console.error(err);
        res.status(500).json({error:'Internal server error'});
    }})
    module.exports = router;