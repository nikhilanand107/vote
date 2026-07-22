const jwt= require('jsonwebtoken');
const jwtAuthMiddleware = (req,res,next)=>{
    const authorizationHeader = req.headers['authorization'];
    if(!authorizationHeader){
        return res.status(401).json({error:'Authorization header missing'});
    }
    const token = authorizationHeader.split(' ')[1];
    if(!token){
        return res.status(401).json({error:'Token missing'});
    }
    try{
        const decoded = jwt.verify(token, process.env.jwt_secret || process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }catch(err){
        console.error(err);
        return res.status(401).json({error:'Invalid token'});
    }
}
const generateToken = (payload)=>{
    return jwt.sign(payload, process.env.jwt_secret || process.env.JWT_SECRET, {expiresIn:'1h'});
}

module.exports = {jwtAuthMiddleware,generateToken};