const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'jwt_secret_key_123_abc', {
    expiresIn: '30d',
  });
};

// Generate a unique 6-digit company code (e.g. COM-X8A42D)
const generateCompanyCode = async () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let isUnique = false;
  let code = '';

  while (!isUnique) {
    code = 'COM-';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const existing = await Company.findOne({ companyCode: code });
    if (!existing) {
      isUnique = true;
    }
  }
  return code;
};

// @desc    Register a new company workspace & admin user
// @route   POST /api/auth/register-workspace
// @access  Public
const registerWorkspace = async (req, res, next) => {
  try {
    const { companyName, companyEmail, adminName, adminEmail, adminPassword } = req.body;

    if (!companyName || !companyEmail || !adminName || !adminEmail || !adminPassword) {
      res.status(400);
      throw new Error('Please fill in all fields');
    }

    // Check if user exists anywhere with this email
    const userExists = await User.findOne({ email: adminEmail.toLowerCase() });
    if (userExists) {
      res.status(400);
      throw new Error('An account with this email address already exists');
    }

    // Generate unique company code
    const companyCode = await generateCompanyCode();

    // Create Company
    const company = await Company.create({
      name: companyName,
      email: companyEmail,
      companyCode,
    });

    // Create User (Admin)
    const adminUser = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      companyId: company._id,
    });

    // Link Company creator
    company.createdBy = adminUser._id;
    await company.save();

    res.status(201).json({
      _id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      companyId: adminUser.companyId,
      avatarColor: adminUser.avatarColor,
      company: {
        name: company.name,
        companyCode: company.companyCode,
        email: company.email,
      },
      token: generateToken(adminUser._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token (Workspace Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { companyCode, email, password } = req.body;

    if (!companyCode || !email || !password) {
      res.status(400);
      throw new Error('Please fill in all fields');
    }

    // Find Company by code
    const company = await Company.findOne({ companyCode: companyCode.trim().toUpperCase() });
    if (!company) {
      res.status(401);
      throw new Error('Invalid Company Code');
    }

    // Find user by email and companyId (include password because select: false is on in Schema)
    const user = await User.findOne({
      email: email.toLowerCase(),
      companyId: company._id,
    }).select('+password');

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password for this company workspace');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      avatarColor: user.avatarColor,
      company: {
        name: company.name,
        companyCode: company.companyCode,
        email: company.email,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user profile & company details
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('companyId');
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId?._id,
        avatarColor: user.avatarColor,
        company: user.companyId ? {
          name: user.companyId.name,
          companyCode: user.companyId.companyCode,
          email: user.companyId.email,
        } : null,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update logged in user profile (name, password)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.name = req.body.name || user.name;

    if (req.body.password) {
      if (req.body.password.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters long');
      }
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    const company = await Company.findById(updatedUser.companyId);

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      companyId: updatedUser.companyId,
      avatarColor: updatedUser.avatarColor,
      company: company ? {
        name: company.name,
        companyCode: company.companyCode,
        email: company.email,
      } : null,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users in the same company
// @route   GET /api/auth/users
// @access  Private
const getCompanyUsers = async (req, res, next) => {
  try {
    const users = await User.find({ companyId: req.user.companyId })
      .select('-password')
      .sort({ name: 1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Invite/Create a new user (Manager/Member)
// @route   POST /api/auth/invite
// @access  Private (Admin only)
const inviteUser = async (req, res, next) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      res.status(400);
      throw new Error('Please fill in all fields');
    }

    if (!['manager', 'member'].includes(role)) {
      res.status(400);
      throw new Error('Invalid role specified. Only manager or member are permitted.');
    }

    // Check if email already registered
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      res.status(400);
      throw new Error('User with this email address already exists');
    }

    // Generate secure activation token and expiration
    const inviteToken = crypto.randomBytes(20).toString('hex');
    const inviteExpires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days expiration

    // Create new user scoped under same companyId
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      role,
      companyId: req.user.companyId,
      inviteToken,
      inviteExpires,
    });

    const company = await Company.findById(req.user.companyId);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteLink = `${clientUrl}/accept-invite?token=${inviteToken}`;

    // Setup Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER || 'ethereal.user',
        pass: process.env.SMTP_PASS || 'ethereal.pass',
      },
    });

    // HTML Email template
    const mailOptions = {
      from: `"${company.name} Workspace" <no-reply@proflow.com>`,
      to: email.toLowerCase(),
      subject: `Workspace Invitation: Join ${company.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h2 style="color: #6366f1; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; margin-bottom: 20px;">Join ${company.name} on ProFlow</h2>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">You have been invited by the Admin to join their secure company workspace on ProFlow as a <strong>${role.toUpperCase()}</strong>.</p>
          <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 25px;">Click the button below to accept the invitation and configure your private password to get started:</p>
          <div style="margin: 25px 0;">
            <a href="${inviteLink}" style="background: linear-gradient(to right, #4f46e5, #6366f1); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: bold; display: inline-block;">Accept Invitation & Set Password</a>
          </div>
          <p style="color: #64748b; font-size: 12px; font-style: italic; margin-top: 25px;">This secure invitation link will expire in 7 days.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 11px; line-height: 1.5;">If you did not expect this workspace invite, you can safely ignore this email.</p>
        </div>
      `,
    };

    // Send email (silently fallback if SMTP fails to prevent local crashing)
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Invite email successfully sent to ${email}`);
    } catch (mailError) {
      console.log('Nodemailer SMTP email sending bypassed/failed (using console logging fallback).');
    }

    // ALWAYS print the link to the backend console so that local developers can copy-paste and test the flow instantly!
    console.log('\n=========================================');
    console.log(`✉️  [MOCK EMAIL INVITE] Link for ${name} (${email}):`);
    console.log(inviteLink);
    console.log('=========================================\n');

    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      companyId: newUser.companyId,
      avatarColor: newUser.avatarColor,
      inviteLink,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove/Delete a user
// @route   DELETE /api/auth/users/:id
// @access  Private (Admin only)
const removeUser = async (req, res, next) => {
  try {
    const userToRemove = await User.findById(req.params.id);

    if (!userToRemove) {
      res.status(404);
      throw new Error('User not found');
    }

    // Check company scope matches
    if (userToRemove.companyId.toString() !== req.user.companyId.toString()) {
      res.status(403);
      throw new Error('Not authorized to remove this user from company workspace');
    }

    // Cannot remove self
    if (userToRemove._id.toString() === req.user.id.toString()) {
      res.status(400);
      throw new Error('Cannot remove yourself from the company workspace');
    }

    // Reassign tasks or delete? We can leave them unassigned in database or pull them out.
    // For safety, let's keep tasks but make them unassigned.
    const Task = require('../models/Task');
    await Task.updateMany({ assignedTo: userToRemove._id }, { $unset: { assignedTo: 1 } });

    // Pull from project members list
    const Project = require('../models/Project');
    await Project.updateMany(
      { companyId: req.user.companyId },
      { $pull: { members: userToRemove._id } }
    );

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User removed from workspace successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify invitation token
// @route   POST /api/auth/verify-invite-token
// @access  Public
const verifyInviteToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400);
      throw new Error('Verification token is required');
    }

    const user = await User.findOne({
      inviteToken: token,
      inviteExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Invitation link has expired or is invalid');
    }

    const company = await Company.findById(user.companyId);

    res.json({
      name: user.name,
      email: user.email,
      role: user.role,
      company: company ? {
        name: company.name,
        companyCode: company.companyCode,
      } : null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept invitation and configure password
// @route   POST /api/auth/accept-invite
// @access  Public
const acceptInvite = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400);
      throw new Error('Token and password are required');
    }

    if (password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters long');
    }

    const user = await User.findOne({
      inviteToken: token,
      inviteExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      res.status(400);
      throw new Error('Invitation link has expired or is invalid');
    }

    const company = await Company.findById(user.companyId);

    // Set the password (pre-save hook will automatically hash it)
    user.password = password;
    
    // Clear invitation tokens
    user.inviteToken = undefined;
    user.inviteExpires = undefined;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      avatarColor: user.avatarColor,
      company: company ? {
        name: company.name,
        companyCode: company.companyCode,
        email: company.email,
      } : null,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerWorkspace,
  loginUser,
  getMe,
  updateProfile,
  getCompanyUsers,
  inviteUser,
  removeUser,
  verifyInviteToken,
  acceptInvite,
};
