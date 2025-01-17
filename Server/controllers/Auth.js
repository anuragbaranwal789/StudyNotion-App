const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile");
require("dotenv").config();

//Controller for sending OTP
exports.sendOTP = async (req, res) => {
    try{
        //Fetching email from request's body
        const {email} = req.body;
        //Checking if user already exists
        const checkUserPresent = await User.findOne({email});
        //If user already exists, then returning a response
        if(checkUserPresent){
            return res.status(401).json({
                success: false,
                message: "User is already registered"
            })
        }
        //Generating OTP
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });
        console.log("OTP Generated: ", otp);
        //Checking if the OTP is unique or not
        let result = await OTP.findOne({otp: otp});
        while(result){
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                // lowerCaseAlphabets: false,
                // specialChars: false
            });
            result = await OTP.findOne({otp: otp});
        }
        const otpPayload = {email, otp};
        //Creating an entry for OTP
        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);
        res.status(200).json({
            success: true,
            message: 'OTP Sent Successfully',
            otp
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
};

//Controller for Sign Up
exports.signUp = async(req, res) => {
    try{
        //Fetching data from user's body
        const {firstName, lastName, email, password, confirmPassword, accountType, contactNumber, otp} = req.body;
        //Validating the user
        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp){
            return res.status(403).json({
                success: false,
                message: 'All fields are required'
            })
        }
        //Matching both the passwords
        if(password != confirmPassword){
            return res.status(400).json ({
                success: false,
                message: 'Password and Confirm Password is not matching, Please try again'
            })
        }
        //Checking if user already exists
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success: false,
                message: 'User is already registered'
            })
        }
        //Finding the most recent OTP stored for the user
        const response = await OTP.find({email}).sort({createdAt:-1}).limit(1);
        console.log("Recent OTP Response: ",response);
        //Validating the OTP
        if(response.length === 0){
            //OTP is not found
            return res.status(400).json({
                success: false,
                message: 'OTP not found'
            })
        } else if(otp !== response[0].otp){
            //OTP is invalid
            return res.json(400).status({
                success: false,
                message: 'Invalid OTP'
            })
        }
        //Hashing the password
        const hashedPassword = await bcrypt.hash(password, 10);
        //Creating the User
		let approved = "";
		approved === "Instructor" ? (approved = false) : (approved = true);
        //Creating entry in DB
        const profileDetails = await Profile.create({gender: null, dateOfBirth: null, about: null, contactNumber: null});
        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password: hashedPassword,
            accountType: accountType,
			approved: approved,
            additionalDetails: profileDetails._id,
            image: 'https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}'
        })
        //Returning the response
        return res.status(200).json({
            success: true,
            message: 'User is registered succcessfully',
            user
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'User cannot be reistered, Please try again later'
        });
    }
}

//Controller for Login
exports.login = async(req, res) => {
    try{
        //Getting data from request's body
        const{email, password} = req.body;
        //Validating the data
        if(!email || !password){
            return res.status(400).json({
                success: false,
                message: 'All fields are required, Please try again'
            })
        }
        //Checking whether user exists or not
        const user = await User.findOne({email}).populate("additionalDetails");
        if(!user){
            return res.status(401).json({
                success: false,
                message: 'User is not registered, Please sign up first'
            })
        }
        //Generating JWT after the password is matched
        if(await bcrypt.compare(password, user.password)){
            const token = jwt.sign({email: user.email, id: user._id, accountType: user.accountType}, process.env.JWT_SECRET, {expiresIn: "2h"});
            // const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "2h"});
            user.token = token;
            user.password = undefined;
            //Creating cookie and sending response
            const options = {
                expires: new Date(Date.now() + 3*24*60*60*1000),
                httpOnly: true
            }
            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: 'User logged in successfully'
            });
        }
        else{
            return res.status(401).json({
                success: false,
                message: 'Password is incorrect'
            });
        }
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Login failed, Please try again later'
        });
    }
}

//Controller for Changing Password
exports.changePassword = async (req, res) => {
	try {
		//Getting User's data from req.user
		const userDetails = await User.findById(req.user.id);

		//Getting old password, new password, and confirm new password from req.body
		const { oldPassword, newPassword, confirmNewPassword } = req.body;

		//Validating the old password
		const isPasswordMatch = await bcrypt.compare(
			oldPassword,
			userDetails.password
		);
		if (!isPasswordMatch) {
			//If the old password does not match, return a 401 (Unauthorized) error
			return res.status(401).json({
                success: false,
                message: "The password is incorrect"
            });
		}

		//Matching and Confirming the new Password
		if (newPassword !== confirmNewPassword) {
			//If new password and confirm new password do not match, return a 400 (Bad Request) error
			return res.status(400).json({
				success: false,
				message: "The password and confirm password does not match"
			});
		}

		//Updating the Password
		const encryptedPassword = await bcrypt.hash(newPassword, 10);
		const updatedUserDetails = await User.findByIdAndUpdate(
			req.user.id,
			{ password: encryptedPassword },
			{ new: true }
		);

		//Send notification via mail
		try {
			const emailResponse = await mailSender(
				updatedUserDetails.email,
				passwordUpdated(
					updatedUserDetails.email,
					`Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
				)
			);
			console.log("Email sent successfully:", emailResponse.response);
		} catch (error) {
			//If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
			console.error("Error occurred while sending email:", error);
			return res.status(500).json({
				success: false,
				message: "Error occurred while sending email",
				error: error.message
			});
		}

		//Returning the success response
		return res.status(200).json({
            success: true,
            message: "Password updated successfully"
        });
	} 
    catch (error) {
		//If there's an error in updating the password, log the error and return a 500 (Internal Server Error) error
		console.error("Error occurred while updating password:", error);
		return res.status(500).json({
			success: false,
			message: "Error occurred while updating password",
			error: error.message
		});
	}
};