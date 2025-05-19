const multer = require('multer');
const path = require('path');

const tempDir = path.join(__dirname, '../', 'tmp');

console.log("****Temp Directory Path:", tempDir);
console.log("****__dirname:", __dirname);


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);  // saves the file in tmp
    },
    filename: (req, file, cb) => {
        const uniqueName = `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);  // saves the file with a unique name
    }
});

const upload = multer({ storage });

module.exports = upload;
// This middleware will handle file uploads using multer.
// It saves the uploaded files in the 'tmp' directory with a unique name based on the user ID and current timestamp.