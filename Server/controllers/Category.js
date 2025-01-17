const Category = require("../models/Category");

function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}
//Handler function for creating Category
exports.createCategory = async(req, res) => {
    try{
        //Fetching the data
        const {name, description} = req.body;
        //Validating the data
        if(!name || ! description){
            return res.status(400).json({
                success: false,
                message: 'All categories are required'
            });
        }
        //Creating entry in DB
        const categoryDeatils = await Category.create({name: name, description: description});
        console.log(categoryDeatils);
        //Returning the response
        return res.status(200).json({
            success: true,
            message: 'Category created succesfully'
        });
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

//Handler function for getting all the Category
exports.showAllCategories = async(req, res) => {
    try{
        const showAllCategories = await Category.find({}, {name: true, description: true});
        return res.status(200).json({
            success: true,
            message: 'All categories are returned successfully',
            showAllCategories
        });
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

//Handler function to get Category Page details
exports.categoryPageDetails = async(req, res) => {
    try{
        //Getiing the Category ID
        const {categoryId} = req.body;
        //Getting courses of the specified Category
        const selectedCategory = await Category.findById(categoryId).populate({path: "courses", match: { status: "Published" }, populate: "ratingAndReviews"}).exec();
        console.log("SELECTED COURSE", selectedCategory)
        //Validating the Courses
        if(!selectedCategory){
            return res.status(404).json({
                success: false,
                message: 'The selected Category cannot be found'
            });
        }
        //Handling the case when there are no courses
        if (selectedCategory.courses.length === 0) {
            console.log("No courses found for the selected category.")
            return res.status(404).json({
                success: false,
                message: "No courses found for the selected category.",
            })
        }
        //Getting Courses of other Categories
        const categoriesExceptSelected = await Category.find({_id: { $ne: categoryId }})
        let differentCategory = await Category.findOne(categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]._id).populate({path: "courses", match: { status: "Published" }}).exec()
        //Getting the Top Selling Courses
        const allCategories = await Category.find().populate({path: "courses", match: { status: "Published" }}).exec()
        const allCourses = allCategories.flatMap((category) => category.courses)
        const mostSellingCourses = allCourses.sort((a, b) => b.sold - a.sold).slice(0, 10)
        //Returning the response
        return res.status(200).json({
            success: true,
            data: {
                selectedCategory,
                differentCategory,
                mostSellingCourses
            }
        });
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}