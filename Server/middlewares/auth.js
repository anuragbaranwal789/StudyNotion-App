const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

//Authentication
exports.auth = async(req, res, next) => {
    try{
        //Extracting the token
        const token = req.cookies.token || req.body.token || req.header("Authorization").replace("Bearer ", "");
        //Returning the response if token is missing
        if(!token){
            return res.status(401).json({
                success: false,
                message: 'Token is missing'
            });
        }
        //Verifying the token
        try{
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            console.log(decode);
            req.user = decode;
        }
        catch(error){
            //Verification issue
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            })
        }
        next();
    }
    catch(error){
        return res.status(401).json({
            success: false,
            message: 'Something went wrong while validating the token'
        })
    }
}

//Student
exports.isStudent = async(req, res, next) => {
    try{
        if(req.user.accountType !== "Student"){
            return res.status(401).json({
                success: false,
                message: 'This is protected route for Students only'
            })
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: 'User role cannot be verified, Please try again'
        })
    }
}

//Instructor
exports.isInstructor = async(req, res, next) => {
    try{
        if(req.user.accountType !== "Instructor"){
            return res.status(401).json({
                success: false,
                message: 'This is protected route for Instructor only'
            })
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: 'User role cannot be verified, Please try again'
        })
    }
}

//Admin
exports.isAdmin = async(req, res, next) => {
    try{
        if(req.user.accountType !== "Admin"){
            return res.status(401).json({
                success: false,
                message: 'This is protected route for Admin only'
            })
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: 'User role cannot be verified, Please try again'
        })
    }
}