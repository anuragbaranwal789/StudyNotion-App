const Section = require("../models/Section");
const Course = require("../models/Course");

//Handler function for creating the Section
exports.createSection = async(req, res) => {
    try{
        //Fetching the data
        const {sectionName, courseId} = req.body;
        //Validating the data
        if(!sectionName || !courseId){
            return res.status(400).json({
                success: false,
                message: 'Properties are missing'
            });
        }
        //Creating the Section
        const newSection = await Section.create({sectionName});
        //Updating the Course with Section's ObjectID
        const updatedCourse = await Course.findByIdAndUpdate(courseId, {$push: {courseContent: newSection._id}}, {new: true}).populate({path: "courseContent", populate: {path: "subSection"}}).exec();
        //Returning the response
        return res.status(200).json({
            success: true,
            message: 'Section is created successfully',
            updatedCourse
        });
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: 'Failed to create the section',
            error: error.message
        });
    }
}

//Handler function for updating the Section
exports.updateSection = async(req, res) => {
    try{
        //Fetching the data
        const {sectionName, sectionId, courseId} = req.body;
        //Validating the data
        if(!sectionName || !sectionId){
            return res.status(400).json({
                success: false,
                message: 'Properties are missing'
            });
        }
        //Updating the data
        const section = await Section.findByIdAndUpdate(sectionId, {sectionName}, {new: true});
        //Updating the Course
        const course = await Course.findById(courseId).populate({path: "courseContent", populate: {path: "subSection",},}).exec()
        console.log(course)
        //Returning the response
        return res.status(200).json({
            success: true,
            data: course,
            message: 'Section is updated successfully'
        });
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: 'Failed to update the section',
            error: error.message
        });
    }
}

//Handler for deleting the Section
exports.deleteSection = async(req, res) => {
    try{
        //Getting the ID (assuming that we are sending the ID in params)
        const {sectionId, courseId} = req.body;
        await Course.findByIdAndUpdate(courseId, {$pull: {courseContent: sectionId,},})
        const section = await Section.findById(sectionId)
        console.log(sectionId, courseId)
        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found",
            })
        }
        //Deleting the associated subsections
        // await SubSection.deleteMany({ _id: { $in: section.subSection } })
        await Section.findByIdAndDelete(sectionId)
        //Finding the updated course and returning it
        const course = await Course.findById(courseId).populate({path: "courseContent",populate: {path: "subSection",},}).exec()
        //Returning the response
        return res.status(200).json({
            success: true,
            data: course,
            message: 'Section is deleted successfully'
        });
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: 'Failed to delete the section',
            error: error.message
        });
    }
}
