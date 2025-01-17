const cloudinary = require('cloudinary').v2;

exports.uploadImageToCloudinary = async(file, folder, height, quality, retries = 5) => {
    const fs = require('fs');
    if (!fs.existsSync(file.tempFilePath)) {
        throw new Error('File temp path does not exist');
    }
    const options = {folder};
    if(height){
        options.height = height;
    }
    if(quality){
        options.quality = quality;
    }
    options.resource_type = "auto";
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`Attempting upload (Attempt ${attempt}/${retries})...`);
            return await cloudinary.uploader.upload(file.tempFilePath, options);
        } 
        catch (error) {
        console.error(`Cloudinary upload failed (Attempt ${attempt}/${retries}):`, {
            message: error.message || 'No message',
            http_code: error.http_code || 'No code',
            name: error.name || 'No name',
            details: error,
        });
        if (attempt === retries) {
            throw new Error('All retry attempts failed: ' + (error.message || 'Unknown error'));
        }
        await delay(2000); // Wait 2 seconds before retrying
        }
    }
}