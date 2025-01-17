const cloudinary = require("cloudinary").v2; 

exports.cloudinaryConnect = () => {
	try {
		cloudinary.config({
			//!    ########   Configuring the Cloudinary to Upload MEDIA ########
			cloud_name: process.env.CLOUD_NAME,
			api_key: process.env.API_KEY,
			api_secret: process.env.API_SECRET,
			timeout: 120000
		});
		console.log('Cloudinary configured with timeout:', cloudinary.config());
	}
	catch (error) {
		console.log(error);
	}
};