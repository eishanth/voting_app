const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const followUpSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [
    {
      text: { type: String, required: true },
      followUp: {
        type: mongoose.Schema.Types.Mixed, // recursive
        default: null,
      },
    },
  ],
});

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  votes: {
    type: Number,
    default: 0,
  },
  voters: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      votedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  followUp: {
    type: followUpSchema,
    default: null,
  },
});

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["multiple-choice", "single-choice", "text", "rating", "yes-no"],
    default: "single-choice",
  },
  question: {
    type: String,
    required: true,
    trim: true,
  },
  options: [optionSchema],
  required: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    trim: true,
  },
});

const pollSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questions: [questionSchema],
    isPublic: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    shareableUrl: {
      type: String,
      unique: true,
      default: () => uuidv4(),
    },
    inviteToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    allowMultipleResponses: {
      type: Boolean,
      default: false,
    },
    totalResponses: {
      type: Number,
      default: 0,
    },
    settings: {
      showResults: {
        type: String,
        enum: ["always", "after-vote", "never"],
        default: "after-vote",
      },
      collectEmail: {
        type: Boolean,
        default: false,
      },
      endDate: {
        type: Date,
      },
      showUserDetails: {
        type: Boolean,
        default: false,
      },
    },
    responses: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        answers: [
          {
            questionId: mongoose.Schema.Types.ObjectId,
            answer: mongoose.Schema.Types.Mixed,
          },
        ],
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        ipAddress: String,
      },
    ],
    password: {
      type: String,
      trim: true,
      minlength: 1,
      required: function () {
        return this.isPublic === false;
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for better performance
pollSchema.index({ creator: 1, createdAt: -1 });
pollSchema.index({ isPublic: 1, isActive: 1, createdAt: -1 });
pollSchema.index({ shareableUrl: 1 });

module.exports = mongoose.model("Poll", pollSchema);
