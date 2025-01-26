import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      set: (value) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.startDate;
        },
        message: 'Due date must be after the start date.',
      },
    },
    projectBudget: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'in progress', 'completed', 'overdue'],
      default: 'pending',
    },
    progress: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields
  }
);

// Pre-save middleware to check and set 'overdue' status
projectSchema.pre('save', function (next) {
  if (this.dueDate < new Date() && this.status !== 'completed') {
    this.status = 'overdue';
  }
  next();
});

const Project = mongoose.model('Project', projectSchema);
export default Project;
