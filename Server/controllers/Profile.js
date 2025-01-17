const Profile = require("../models/Profile");
const CourseProgress = require("../models/CourseProgress");
const Course = require("../models/Course");
const User = require("../models/User");
const {uploadImageToCloudinary} = require("../utils/imageUploader");
const mongoose = require("mongoose");
const { convertSecondsToDuration } = require("../utils/secToDuration");

//Handler function to update Profile details to the existing null Profile we created during signup
exports.updateProfile = async(req, res) => {
    try{
        console.log("Hit");
        //Fetching the data
        const {firstName = "", lastName = "", dateOfBirth = "", about = "", contactNumber = "", gender = ""} = req.body;
        //Getting the UserID
        const id = req.user.id;
        //Validating the data
        // if(!contactNumber || !gender){
        //     return res.status(400).json({
        //         success: false,
        //         message: 'All fields are required'
        //     });
        // }
        //Finding the existing null profile
        console.log(id);
        const userDetails = await User.findById(id);
        const profileId = userDetails.additionalDetails;
        const profileDetails = await Profile.findById(profileId);
        const user = await User.findByIdAndUpdate(id, {firstName, lastName})
        await user.save();
        console.log(user);
        //Updating the profile
        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.about = about;
        profileDetails.gender = gender;
        profileDetails.contactNumber = contactNumber;
        await profileDetails.save();
        console.log(profileDetails);
        //Returning the response
        return res.status(200).json({
            success: true,
            message: 'Profile is updated successfully',
            profileDetails
        });
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: 'Failed to update the profile',
            error: error.message
        });
    }
}

//Handler function to delete the Account
exports.deleteAccount = async(req, res) => {
    try{
        //Getting the User's ID
        const id = req.user.id;
        console.log(id)
        //Validating the data
        const userDetails = User.findById({_id: id});
        if(!userDetails){
            return res.status(200).json({
                success: true,
                message: 'User not found'
            });
        }
        //Deleting the user's Profile first
        await Profile.findByIdAndDelete({_id: userDetails.additionalDetails});
        //Deleting the User
        await User.findByIdAndDelete({_id: id});
        //Returning the response
        return res.status(200).json({
            success: true,
            message: 'The user is deleted successfully'
        });
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: 'Failed to delete the user',
            error: error.message
        });
    }
}

//Handler function to get all the users
exports.getAllUserDetails = async(req, res) => {
    try{
        //Getting the User's ID
        const id = req.user.id;
        //Getting all the user's details
        const userDetails = await User.findById(id).populate("additionalDetails").exec();
        console.log(userDetails);
        //Returning the response
        return res.status(200).json({
            success: true,
            message: 'The user deatils are fetched successfully',
            data: userDetails
        });
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch the user details',
            error: error.message
        });
    }
}

//Handler function to update User's pfp
exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      console.log(displayPicture)
      const userId = req.user.id
      const image = await uploadImageToCloudinary(displayPicture, process.env.FOLDER_NAME, 1000, 1000)
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate({ _id: userId },{ image: image.secure_url },{ new: true })
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile
      })
    }
    catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      })
    }
};

//Handler function to get User's enrolled Courses
exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id
    let userDetails = await User.findOne({
      _id: userId,
    })
      .populate({
        path: "courses",
        populate: {
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        },
      })
      .exec()
    userDetails = userDetails.toObject()
    var SubsectionLength = 0
    for (var i = 0; i < userDetails.courses.length; i++) {
      let totalDurationInSeconds = 0
      SubsectionLength = 0
      for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
        totalDurationInSeconds += userDetails.courses[i].courseContent[
          j
        ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
        userDetails.courses[i].totalDuration = convertSecondsToDuration(
          totalDurationInSeconds
        )
        SubsectionLength +=
          userDetails.courses[i].courseContent[j].subSection.length
      }
      let courseProgressCount = await CourseProgress.findOne({
        courseID: userDetails.courses[i]._id,
        userId: userId,
      })
      courseProgressCount = courseProgressCount?.completedVideos.length
      if (SubsectionLength === 0) {
        userDetails.courses[i].progressPercentage = 100
      } else {
        // To make it up to 2 decimal point
        const multiplier = Math.pow(10, 2)
        userDetails.courses[i].progressPercentage =
          Math.round(
            (courseProgressCount / SubsectionLength) * 100 * multiplier
          ) / multiplier
      }
    }

    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find user with id: ${userDetails}`,
      })
    }
    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

//Handler function to get Instructor's Dashboard
exports.instructorDashboard = async (req, res) => {
  try {
    const courseDetails = await Course.find({ instructor: req.user.id })

    const courseData = courseDetails.map((course) => {
      const totalStudentsEnrolled = course.studentsEnrolled.length
      const totalAmountGenerated = totalStudentsEnrolled * course.price

      // Create a new object with the additional fields
      const courseDataWithStats = {
        _id: course._id,
        courseName: course.courseName,
        courseDescription: course.courseDescription,
        // Include other course properties as needed
        totalStudentsEnrolled,
        totalAmountGenerated,
      }

      return courseDataWithStats
    })

    res.status(200).json({ courses: courseData })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server Error" })
  }
}