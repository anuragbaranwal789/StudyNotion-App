const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

//Token for resetting the password
exports.resetPasswordToken  = async(req, res) => {
    try{
        //Getting email from request's body
        const email = req.body.email;
        //Validating the email
        const user = await User.findOne({email: email});
        if(!user){
            return res.json({
                success: false,
                message: 'Your message is not registered with us'
            });
        }
        //Generating the token
        const token = crypto.randomBytes(20).toString("hex");
        //Updating user by adding token and expiration time
        const updatedDetails = await User.findOneAndUpdate({email: email}, {token: token, resetPasswordExpires: Date.now() + 3600000}, {new: true});
        //Creating the URL
        const url = `http://localhost:3000/update-password/${token}`
        //Sending mail that contains the URL
        await mailSender(email, "Password Reset Link", `Password Reset Link: ${url}`);
        //Returning the response
        return res.json({
            success: true,
            message: 'Email sent successfully, Please check your mail and change your password'
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while mailing the password reset link'
        });
    }
}

//Resetting the password
exports.resetPassword = async(req, res) => {
    try{
        //Fetching the data
        const {password, confirmPassword, token} = req.body;
        //Validating the password
        if(password !== confirmPassword){
            return res.json({
                success: false,
                message: 'Password and Confirm Password is not matching, Please try again'
            });
        }
        //Getting User's details from DB using token
        const userDetails = await User.findOne({token: token});
        if(!userDetails){
            return res.json({
                success: false,
                message: 'Invalid token'
            });
        }
        //Token expiration check
        if(!(userDetails.resetPasswordExpires > Date.now())){
            return res.json({
                success: false,
                message: 'Token expired, Please regenarate your token'
            });
        }
        //Hashing the password
        const hashedPassword = await bcrypt.hash(password, 10);
        //Updating the new password
        await User.findOneAndUpdate({token: token}, {password: hashedPassword}, {new: true});
        //Returning the response
        return res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    }   
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while resetting the password'
        });
    }
}