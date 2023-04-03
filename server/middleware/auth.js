import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
    try{
        const token = req.headers.authorization.split(' ')[1];
        const tokenData = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = tokenData._id;
        next();
    }catch(error){
        console.log(error.message);
        res.status(400).json({message: 'Not Logged In!'})

    }
}
export default auth;
