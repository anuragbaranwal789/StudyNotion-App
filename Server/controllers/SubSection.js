const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
require("dotenv").config();

//Handler function for creating the SubSection
exports.createSubSection = async(req, res) => {
    try{
        //Fetching the data
        const {sectionId, title, description} = req.body;
        //Extracting the video file
        const video = req.files.video;
        //Validating the data
        if(!sectionId || !title || !description || !video){
            return res.status(404).json({
                success: false,
                message: 'Properties are missing'
            });
        }
        //Checking if file exists
        const fs = require('fs');
        if (!fs.existsSync(video.tempFilePath)) {
        return res.status(400).json({
            success: false,
            message: 'Video file not found or invalid',
        });
        }
        console.log(video);
        //Uploading the video file to Cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
        console.log(uploadDetails);
        //Creating the SubSection
        const subSectionDetails = await SubSection.create({title: title, timeDuration: `${uploadDetails.duration}`, description: description, videoUrl: uploadDetails.secure_url});
        //Updating the Section with SubSection ObjectID
        const updatedSection = await Section.findByIdAndUpdate({_id: sectionId}, {$push: {subSection: subSectionDetails._id}}, {new: true}).populate("subSection");
        //Returning the response
        return res.status(200).json({
            success: true,
            message: 'SubSection is created successfully',
            data: updatedSection
        });
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: 'Failed to create the subsection',
            error: error.message
        });
    }
}

//Handler function for updating the SubSection
exports.updateSubSection = async(req, res) => {
    try{
        //Fetching the data
        const {title, description, subSectionId, sectionId} = req.body;
        //Validating the data
        // if(!title || !subSectionId){
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Properties are missing'
        //     });
        // }
        const subSection = await SubSection.findById(subSectionId);
        //Validating the SubSection
        if(!subSection){
            return res.status(404).json({
              success: false,
              message: "SubSection cannot be found",
            });
        }
        if(title !== undefined){
            subSection.title = title;
        }
      
        if(description !== undefined){
            subSection.description = description;
        }
        if (req.files && req.files.video !== undefined) {
            const video = req.files.video;
            const uploadDetails = await uploadImageToCloudinary(video,process.env.FOLDER_NAME);
            subSection.videoUrl = uploadDetails.secure_url;
            subSection.timeDuration = `${uploadDetails.duration}`;
        }
        await subSection.save()
        //Finding updated Section and returning it
        const updatedSection = await Section.findById(sectionId).populate("subSection")
        console.log("updated section", updatedSection)
        //Returning the response
        return res.status(200).json({
            success: true,
            data: updatedSection,
            message: 'SubSection is updated successfully'
        });
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: 'Failed to update the subsection',
            error: error.message
        });
    }
}

//Handler for deleting the SubSection
exports.deleteSubSection = async(req, res) => {
    try{
        //Getting the ID (assuming that we are sending the ID in params)
        const {subSectionId, sectionId} = req.body;
        //Removing the SubSection to be deleted from Section
        await Section.findByIdAndUpdate({_id: sectionId}, {$pull: {subSection: subSectionId}});
        //Deleting the SubSection
        const subSection = await SubSection.findByIdAndDelete({_id: subSectionId});
        if (!subSection) {
            return res.status(404).json({
                success: false,
                message: "SubSection cannot be found"
            })
        }
        //Finding the updated Section and returning it
        const updatedSection = await Section.findById(sectionId).populate("subSection")
        //Returning the response
        return res.status(200).json({
            success: true,
            data: updatedSection,
            message: 'SubSection is deleted successfully'
        });
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: 'Failed to delete the subsection',
            error: error.message
        });
    }
}