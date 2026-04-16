import mongoose from "mongoose";

export const ResourceTypes = {
  LECTURE_HALL: "LECTURE_HALL",
  LAB: "LAB"
};

const resourceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, "Resource name is required"],
      trim: true,
      maxlength: 120
    },
    resourceType: {
      type: String,
      enum: Object.values(ResourceTypes),
      required: true,
      index: true
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ""
    },
    metadata: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

resourceSchema.index({ user: 1, resourceType: 1, name: 1 }, { unique: true });

const Resource = mongoose.model("Resource", resourceSchema);

export default Resource;
