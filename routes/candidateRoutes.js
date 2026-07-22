const express = require('express');
const router = express.Router();
const User = require('../models/user.js');
const Candidate = require('../models/candidate.js');    
const {jwtAuthMiddleware, generateToken} = require('../jwt.js');

const checkAdminRole = async (userId) => {
    try {
        const user = await User.findById(userId);
        return user ? user.role === 'admin' : false;
    } catch (err) {
        return false;
    }
}

// POST route to add a candidate
router.post('/', jwtAuthMiddleware, async (req, res) => {
    try {
        if(!(await checkAdminRole(req.user.id)))
            return res.status(403).json({message: 'user does not have admin role'});

        const data = req.body;
        const newCandidate = new Candidate(data);
        const response = await newCandidate.save();
        res.status(200).json({response: response});
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

// PUT route to update a candidate
router.put('/:candidateId', jwtAuthMiddleware, async (req, res) => {
    try {
        if(!(await checkAdminRole(req.user.id)))
            return res.status(403).json({message: 'user does not have admin role'});

        const candidateId = req.params.candidateId;
        const updateData = req.body;
        
        // Prevent altering vote count via update
        delete updateData.voteCount;
        delete updateData.votes;

        const updatedCandidate = await Candidate.findByIdAndUpdate(candidateId, updateData, {
            new: true,
            runValidators: true,
        });

        if (!updatedCandidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        res.status(200).json(updatedCandidate);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

// DELETE route to remove a candidate
router.delete('/:candidateId', jwtAuthMiddleware, async (req, res) => {
    try {
        if(!(await checkAdminRole(req.user.id)))
            return res.status(403).json({message: 'user does not have admin role'});

        const candidateId = req.params.candidateId;
        const response = await Candidate.findByIdAndDelete(candidateId);
        
        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        res.status(200).json({message: 'Candidate deleted successfully'});
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

// POST route for candidate login
router.post('/login', async(req, res) => {
    try {
        const {aadharCardNumber, password} = req.body;
        const candidate = await Candidate.findOne({aadharCardNumber});
        
        if(!candidate || !(await candidate.comparePassword(password))) {
            return res.status(401).json({error: 'Invalid credentials'});
        }   
    
        const payload = {
            id: candidate._id,
            role: 'candidate'
        }
        
        const token = generateToken(payload);
        res.status(200).json({message: 'Candidate login successful', token});
    } catch(err) {
        console.error(err);
        res.status(500).json({error: 'Internal server error'});
    }
});

// GET route for candidate profile
router.get('/profile', jwtAuthMiddleware, async(req, res) => {
    try {
        if(req.user.role !== 'candidate') {
            return res.status(403).json({message: 'Access restricted to candidates'});
        }
        const candidate = await Candidate.findById(req.user.id);
        res.status(200).json({candidate});
    } catch(err) {
        console.error(err);
        res.status(500).json({error: 'Internal server error'});
    }
});


// GET route to get all candidates (public/voter accessible)
router.get('/', async (req, res) => {
    try {
        const candidates = await Candidate.find({}, 'name party age _id');
        res.status(200).json(candidates);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

// Vote for a candidate
router.post('/vote/:candidateId', jwtAuthMiddleware, async (req, res) => {
    const candidateId = req.params.candidateId;
    const userId = req.user.id;

    try {
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Admin is not allowed to vote' });
        }
        if (user.isVoted) {
            return res.status(400).json({ message: 'You have already voted' });
        }

        candidate.votes.push({user: userId});
        candidate.voteCount++;
        await candidate.save();

        user.isVoted = true;
        await user.save();

        res.status(200).json({ message: 'Vote recorded successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

module.exports = router;
