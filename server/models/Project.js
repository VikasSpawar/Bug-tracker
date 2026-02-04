import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a project title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teamMembers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['admin', 'manager', 'developer', 'viewer'],
          default: 'developer',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isArchived: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
  },
  { timestamps: true }
);

// Ensure owner is always in teamMembers
projectSchema.pre('save', async function (next) {
  const ownerExists = this.teamMembers.some(
    (member) => member.user.toString() === this.owner.toString()
  );

  if (!ownerExists) {
    this.teamMembers.unshift({
      user: this.owner,
      role: 'admin',
      joinedAt: new Date(),
    });
  }

  next();
});

export default mongoose.model('Project', projectSchema);
