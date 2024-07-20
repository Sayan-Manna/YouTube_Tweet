import multer from "multer";
// we'll be using diskstorage as memorystorage is risky and might cause problems
// This function creates a storage engine for multer that allows you to control where and how the files are stored.
const storage = multer.diskStorage({
    // A function that specifies the folder where the uploaded files should be stored.
    destination: function (req, file, cb) {
        // callback function
        cb(null, "./public/temp"); // depends on your file structure
    },
    // function that specifies the name of the file that will be saved.
    filename: function (req, file, cb) {
        //// Generates a unique suffix using the current timestamp and a random number.
        // const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        console.log("file: ", file);
        // cb(null, file.fieldname + "-" + uniqueSuffix);
        // Calls the callback with null as the first argument (indicating no error) and the original name of the file (file.originalname) as the filename. This means the uploaded file will be saved with its original name.
        cb(null, file.originalname);
    },
});
// multer is called with an options object. The object has one property, storage, set to the storage variable you defined.
// This tells multer to use the provided storage configuration for handling file uploads.
// This instance (upload) can now be used as middleware to handle file uploads in your routes.
export const upload = multer({ storage: storage });
