import mongoose from "mongoose";

const pollOptionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true,
    },
    votes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        votedAt: {
            type: Date,
            default: Date.now
        }
    }]
});

const pollSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
        index: true
    },
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    question: {
        type: String,
        required: [true, "Poll question is required"],
        trim: true,
        maxlength: 300
    },
    message: {
        type: String,
        trim: true,
        default: ""
    },
    options: {
        type: [pollOptionSchema],
        validate: {
            validator: function (v) {
                return v && v.length >= 2;
            },
            message: "A poll must have at least 2 options."
        }
    },
    isMultipleChoice: {
        type: Boolean,
        default: false
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    allowOther: {
        type: Boolean,
        default: false
    },
    maxVotesPerUser: {
        type: Number,
        default: 1
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ["Draft", "Live", "Closed"],
        default: "Live"
    }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual to aggregate votes
pollSchema.virtual("totalVotes").get(function () {
    return this.options.reduce((acc, opt) => acc + opt.votes.length, 0);
});

export default mongoose.model("Poll", pollSchema);
