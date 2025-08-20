export const uploadFiles = async (req, res) => {
    // Handle file uploads
    console.log(req.file.mimetype); //Will return something like: image/jpeg
    console.log(req.file.originalname); //Will return something like: image.jpeg

    res.status(200).json({ message: "File uploaded successfully!" });
};
