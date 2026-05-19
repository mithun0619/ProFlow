const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email address',
      ],
    },
    password: {
      type: String,
      required: function() { return !this.inviteToken; },
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'member'],
      default: 'member',
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Please associate this user with a company workspace'],
      index: true,
    },
    avatarColor: {
      type: String,
      default: () => {
        const colors = [
          '#4F46E5', // Indigo
          '#7C3AED', // Violet
          '#EC4899', // Pink
          '#EF4444', // Red
          '#F59E0B', // Amber
          '#10B981', // Emerald
          '#06B6D4', // Cyan
          '#3B82F6', // Blue
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      },
    },
    inviteToken: {
      type: String,
      select: false,
    },
    inviteExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
