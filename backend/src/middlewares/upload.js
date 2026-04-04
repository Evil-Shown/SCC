import multer from "multer";
import path from "path";

// 💡 වෙනස: DiskStorage වෙනුවට MemoryStorage භාවිතා කිරීම.
// මෙවිට file.buffer හරහා කෙලින්ම Python වෙත යැවිය හැක.
const storage = multer.memoryStorage();

// File filter (ඔබගේ පැරණි කේතයමයි)
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
    "application/json"
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  },
  fileFilter: fileFilter
});

export default upload;