const Course = require("../models/Course");
const Category = require("../models/Category");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const User = require("../models/User");
const {uploadImageToCloudinary} = require("../utils/imageUploader");
const CourseProgress = require("../models/CourseProgress");
const { convertSecondsToDuration } = require("../utils/secToDuration");

//Handler function for creating Courses
exports.createCourse = async(req, res) => {
    try{
        //Fetching the data
        let {courseName, courseDescription, whatYouWillLearn, price, tag, category, status, instructions} = req.body;
        //Getting the thumbnail
        const thumbnail = req.files.thumbnailImage;
        //Validating the thumbnail
        if (!thumbnail || !thumbnail.mimetype.startsWith('image/')) {
            return res.status(400).json({
              success: false,
              message: 'Invalid file type. Only image uploads are allowed',
            });
        }
        //Validating the course details
        if(!courseName || !courseDescription || !whatYouWillLearn || !price || !tag || !thumbnail || !category){
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        if (!status || status === undefined) {
			status = "Draft";
		}
        //Checking for the instructor
        const userId = req.user.id;
        const instructorDetails = await User.findById(userId, {accountType: "Instructor"});
        console.log("Instructor Details: ", instructorDetails);
        if(!instructorDetails){
            return res.status(404).json({
                success: false,
                message: 'The instructor details cannot be found'
            });
        }
        //Checking if the given Category is valid or not
        const categoryDetails = await Category.findById(category);
        if(!categoryDetails){
            return res.status(404).json({
                success: false,
                message: 'Category details cannot be found'
            });
        }
        //Uploading image to the cloudinary
        let thumbnailImage;
        try {
            thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);
            console.log('Thumbnail uploaded:', thumbnailImage);
            } 
            catch (error) {
            console.error('Cloudinary upload failed:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to upload thumbnail to Cloudinary',
                error: error.message,
            });
        }
        //Creating an entry for the new course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn: whatYouWillLearn,
            price,
            tag: tag,
			category: categoryDetails._id,
			thumbnail: thumbnailImage.secure_url,
			status: status,
			instructions: instructions})
            // .populate("instructor").exec();
        //Adding the new course to the user schema of Instructor
        await User.findByIdAndUpdate({_id: instructorDetails._id}, {$push: {courses: newCourse._id}}, {new: true});
        //Updating the new course to the Category schema
        await Category.findByIdAndUpdate({_id: category}, {$push: {courses: newCourse._id}}, {new: true});
        //Returning the response
        return res.status(200).json({
            success: true,
            message: 'Course created successfully',
            data: newCourse
        });
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create the course',
            error: error.message
        });
    }
}

//Handler function for editting Courses
exports.editCourse = async (req, res) => {
    try {
      const { courseId } = req.body
      const updates = req.body
      const course = await Course.findById(courseId)
  
      if (!course) {
        return res.status(404).json({ error: "Course not found" })
      }
  
      // If Thumbnail Image is found, update it
      if (req.files) {
        console.log("thumbnail update")
        const thumbnail = req.files.thumbnailImage
        const thumbnailImage = await uploadImageToCloudinary(
          thumbnail,
          process.env.FOLDER_NAME
        )
        course.thumbnail = thumbnailImage.secure_url
      }
  
      // Update only the fields that are present in the request body
      for (const key in updates) {
        if (updates.hasOwnProperty(key)) {
          if (key === "tag" || key === "instructions") {
            course[key] = JSON.parse(updates[key])
          } else {
            course[key] = updates[key]
          }
        }
      }
  
      await course.save()
  
      const updatedCourse = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()
  
      res.json({
        success: true,
        message: "Course updated successfully",
        data: updatedCourse,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
  }

//Handler function for getting all the courses
exports.showAllCourses = async(req, res) => {
    try{
        const allCourses = await Course.find({}, {courseName: true, price: true, thumbnail: true, instructor: true, ratingAndReviews: true, studentsEnrolled: true}).populate("instructor").exec();
        return res.status(200).json({
            success: true,
            message: 'Data for all the courses are fetched successfully',
            data: allCourses
        });
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch the course data',
            error: error.message
        });
    }
}

//Handler function to get the entire details of a Course
exports.getCourseDetails = async(req, res) => {
    try{
        //Getting the Course ID
        const {courseId} = req.body;
        //Fetching all the details of that course
        const courseDetails = await Course.find({_id: courseId}).populate({path: "instructor", populate:{path: "additionalDetails"}}).populate("category").populate("ratingAndReviews").populate({path: "courseContent", populate:{path: "subSection"}}).exec();
        //validating the data
        if(!courseDetails){
            return res.status(400).json({
                success: false,
                message: `The course with ID ${courseId} cannot be found`
            });
        }
        let totalDurationInSeconds = 0
        courseDetails.courseContent?.forEach((content) => {
        content.subSection?.forEach((subSection) => {
            const timeDurationInSeconds = parseInt(subSection.timeDuration)
            totalDurationInSeconds += timeDurationInSeconds
        })
        })
        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)
        //Returning the response
        return res.status(200).json({
            success: true,
            message: 'The details of the course is fetched succesfully',
            data: {courseDetails, totalDuration}
        });
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch the details of the course',
            error: error.message
        });
    }
}

//Handler function for getting full course details
exports.getFullCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.body
        const userId = req.user.id
        const courseDetails = await Course.findOne({
            _id: courseId,
        })
            .populate({
            path: "instructor",
            populate: {
                path: "additionalDetails",
            },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
            path: "courseContent",
            populate: {
                path: "subSection",
            },
            })
            .exec()
    
        let courseProgressCount = await CourseProgress.findOne({
            courseID: courseId,
            userId: userId,
        })
    
        console.log("courseProgressCount : ", courseProgressCount)
    
        if (!courseDetails) {
            return res.status(400).json({
            success: false,
            message: `Could not find course with id: ${courseId}`,
            })
        }
    
        // if (courseDetails.status === "Draft") {
        //   return res.status(403).json({
        //     success: false,
        //     message: `Accessing a draft course is forbidden`,
        //   });
        // }
    
        let totalDurationInSeconds = 0
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
            const timeDurationInSeconds = parseInt(subSection.timeDuration)
            totalDurationInSeconds += timeDurationInSeconds
            })
        })
    
        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)
    
        return res.status(200).json({
            success: true,
            data: {
            courseDetails,
            totalDuration,
            completedVideos: courseProgressCount?.completedVideos
                ? courseProgressCount?.completedVideos
                : [],
            },
        })
        } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
        }
    }
    
// Handler function to get a list of Course for a given Instructor
exports.getInstructorCourses = async (req, res) => {
    try {
    // Get the instructor ID from the authenticated user or request body
    const instructorId = req.user.id
    // Find all courses belonging to the instructor
    const instructorCourses = await Course.find({
        instructor: instructorId,
    }).sort({ createdAt: -1 })
    // Return the instructor's courses
    res.status(200).json({
        success: true,
        data: instructorCourses,
    })
    } catch (error) {
    console.error(error)
    res.status(500).json({
        success: false,
        message: "Failed to retrieve instructor courses",
        error: error.message,
    })
    }
}

    // Delete the Course
    exports.deleteCourse = async (req, res) => {
        try {
        const { courseId } = req.body
        // Find the course
        const course = await Course.findById(courseId)
        if (!course) {
            return res.status(404).json({ message: "Course not found" })
        }
        // Unenroll students from the course
        const studentsEnrolled = course.studentsEnrolled
        for (const studentId of studentsEnrolled) {
            await User.findByIdAndUpdate(studentId, {
            $pull: { courses: courseId },
            })
        }
        // Delete sections and sub-sections
        const courseSections = course.courseContent
        for (const sectionId of courseSections) {
            // Delete sub-sections of the section
            const section = await Section.findById(sectionId)
            if (section) {
            const subSections = section.subSection
            for (const subSectionId of subSections) {
                await SubSection.findByIdAndDelete(subSectionId)
            }
            }
    
            // Delete the section
            await Section.findByIdAndDelete(sectionId)
        }
    
        // Delete the course
        await Course.findByIdAndDelete(courseId)
    
        return res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        })
        } catch (error) {
        console.error(error)
            return res.status(500).json({
                success: false,
                message: "Server error",
                error: error.message,
            })
        }
    }
  