const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
        reuired: true
    },
    otp: {
        type: String,
        reuired: true
    },
    course: {
        type: Date,
        default: Date.now(),
        expires: 5*60
    }
});

//Defining a function to send mails
async function sendVderificationEmal(email, otp)
{
    try{
        const mailResponse = await mailSender(email, "Verification mail from StudyNotion", emailTemplate(otp));
        console.log("Email sent successfully: ", mailResponse);
    }
    catch(error){
        console.log("Error occured while sending mails: ",error);
        throw error;
    }
}

//Defining a post-save hook to send mail after the document has been saved
OTPSchema.pre("save", async function(next) {
    console.log("New document saved to database");
    //Only send an email when a new document is created
    if(this.isNew){
        await sendVderificationEmal(this.email, this.otp);
    }
    next();
})

const OTP = mongoose.model("OTP", OTPSchema);

module.exports = OTP;