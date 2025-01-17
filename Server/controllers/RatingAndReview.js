const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { default: mongoose } = require("mongoose");

//Handler function to create Rating
exports.createRating = async(req, res) => {
    try{
        //Getting the User's ID
        const userId = req.user.id;
        //Fetching data from the request's body
        const {rating, review, courseId} = req.body;
        console.log("courseId: ", courseId);
        console.log("userId: ", userId);
        //Checking if the User is enrolled or not
        const courseDetails = await Course.findOne({_id: courseId, studentsEnrolled: {$in: [userId]}});
        console.log("courseDetails: ", courseDetails)
        if(!courseDetails){
            return res.status(404).json({
                success: false,
                message: 'The student is not enrolled in the course'
            });
        }
        //Checking if the User already reviewed the Course
        const alreadyReviewed = await RatingAndReview.findOne({user: userId, course: courseId});
        if(alreadyReviewed){
            return res.status(404).json({
                success: false,
                message: 'The course is already reviewed by the user'
            });
        }
        //Creating the Rating and Review
        const ratingReview = await RatingAndReview.create({rating, review, course: courseId, user: userId});
        //Updating the Course with this Rating and Review
        const updatedCourseDetails = await Course.findByIdAndUpdate({_id: courseId}, {$push: {ratingAndReviews: ratingReview._id}}, {new: true});
        console.log(updatedCourseDetails);
        //Returning the response
        return res.status(200).json({
            success: true,
            message: 'The Rating and Review is created successfully',
            ratingReview
        });
    }
    catch(error){
        console.log(error)
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

//Handler function to get Average Rating
exports.getAverageRating = async(req, res) => {
    try{
        //Getting the Course ID
        const courseId = req.body.courseId;
        //Calculating the Average Rating
        const result = await RatingAndReview.aggregate([{$match: {course: mongoose.Types.ObjectId(courseId)}}, {$group: {_id: null, averageRating: {$avg: "rating"}}}]);
        if(result.length > 0){
            return res.status(200).json({
                success: true,
                averageRating: result[0].averageRating 
            });
        }
        //Returning the response if no rating or reviews exists
        return res.status(200).json({
            success: true,
            message: 'No rating and review is given til now, thus the average ratibg is 0',
            averageRating: 0
        });
    }
    catch(error){
        console.log(error)
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

//Handler functions to get all the Ratings and Reviews
exports.getAllRating = async(req, res) => {
    try{
        const allReviews = await RatingAndReview.find({}).sort({rating: "desc"}).populate({path: "user", select: "firstName lastName email image"}).populate({path: "course", select: "courseName"}).exec();
        //Returning the response
        return res.status(200).json({
            success: true,
            message: 'All the Ratings and Reviews are fetched successfully',
            data: allReviews
        });
    }
    catch(error){
        console.log(error)
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}