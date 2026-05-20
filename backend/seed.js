const mongoose = require('mongoose');
const Company = require('./models/Company');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Notification = require('./models/Notification');

require('dotenv').config();
const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/project-manager';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB successfully!');

    // Clear existing data to avoid duplication and overlap
    console.log('Clearing existing data...');
    await Company.deleteMany({});
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Notification.deleteMany({});
    console.log('Existing collections cleared.');

    // 1. Create Company Workspace
    console.log('Creating Company Workspace...');
    const company = new Company({
      name: 'Bharat Tech Solutions',
      email: 'info@bharattech.in',
      companyCode: 'COM-BHARAT', // Custom easy-to-remember workspace code!
    });
    await company.save();
    console.log(`Company Workspace created: ${company.name} [Code: ${company.companyCode}]`);

    const commonPassword = 'Password@123'; // Pass raw text so Mongoose pre-save hook handles hashing cleanly!

    // 2. Define and create 15 Teammates with Indian Names and varied roles
    console.log('Creating 15 Workspace Users...');
    const usersData = [
      { name: 'Aarav Sharma', email: 'aarav@bharattech.in', role: 'admin', avatarColor: '#ef4444' }, // 1
      { name: 'Priya Patel', email: 'priya@bharattech.in', role: 'manager', avatarColor: '#f59e0b' }, // 2
      { name: 'Kabir Singh', email: 'kabir@bharattech.in', role: 'manager', avatarColor: '#10b981' }, // 3
      { name: 'Ananya Iyer', email: 'ananya@bharattech.in', role: 'manager', avatarColor: '#3b82f6' }, // 4
      { name: 'Rohan Verma', email: 'rohan@bharattech.in', role: 'member', avatarColor: '#6366f1' },  // 5
      { name: 'Diya Nair', email: 'diya@bharattech.in', role: 'member', avatarColor: '#ec4899' },     // 6
      { name: 'Arjun Mehta', email: 'arjun@bharattech.in', role: 'member', avatarColor: '#14b8a6' },   // 7
      { name: 'Sneha Reddy', email: 'sneha@bharattech.in', role: 'member', avatarColor: '#8b5cf6' },   // 8
      { name: 'Vihaan Rao', email: 'vihaan@bharattech.in', role: 'member', avatarColor: '#a855f7' },   // 9
      { name: 'Ishaan Gupta', email: 'ishaan@bharattech.in', role: 'member', avatarColor: '#f43f5e' }, // 10
      { name: 'Zara Khan', email: 'zara@bharattech.in', role: 'member', avatarColor: '#10b981' },     // 11
      { name: 'Dev Joshi', email: 'dev@bharattech.in', role: 'member', avatarColor: '#06b6d4' },       // 12
      { name: 'Riya Sen', email: 'riya@bharattech.in', role: 'member', avatarColor: '#ec4899' },       // 13
      { name: 'Aditya Prasad', email: 'aditya@bharattech.in', role: 'member', avatarColor: '#3b82f6' }, // 14
      { name: 'Meera Pillai', email: 'meera@bharattech.in', role: 'member', avatarColor: '#f59e0b' },  // 15
    ];

    const users = [];
    for (const u of usersData) {
      const user = new User({
        name: u.name,
        email: u.email,
        password: commonPassword,
        role: u.role,
        companyId: company._id,
        avatarColor: u.avatarColor,
      });
      await user.save();
      users.push(user);
    }
    console.log(`Successfully created ${users.length} teammates!`);

    // Helper map of users for fast retrieval
    const uMap = {};
    users.forEach((u) => {
      uMap[u.email.split('@')[0]] = u;
    });

    // 3. Define and Create 5 Projects
    console.log('Creating 5 Project Boards...');
    const projectsData = [
      {
        name: 'UPI Autopay & Settlement Systems',
        description: 'Integrating state-of-the-art UPI auto-pay and instant settlement pipelines across mobile client services.',
        owner: uMap.aarav._id,
        members: [uMap.aarav._id, uMap.priya._id, uMap.rohan._id, uMap.diya._id],
        createdBy: uMap.aarav._id,
      },
      {
        name: 'Cloud Infra & Security Hardening',
        description: 'Migrating legacy containerized workloads to highly secure multi-zone microservice instances.',
        owner: uMap.priya._id,
        members: [uMap.priya._id, uMap.kabir._id, uMap.arjun._id, uMap.sneha._id, uMap.vihaan._id],
        createdBy: uMap.priya._id,
      },
      {
        name: 'E-Commerce Client App v2.0',
        description: 'Re-engineering checkout dashboards with lightning-fast React components and caching layers.',
        owner: uMap.kabir._id,
        members: [uMap.kabir._id, uMap.ananya._id, uMap.ishaan._id, uMap.zara._id, uMap.dev._id],
        createdBy: uMap.kabir._id,
      },
      {
        name: 'AI Customer Support Agent',
        description: 'Deploying custom transformer models to automate instant settlement responses and client refunds.',
        owner: uMap.ananya._id,
        members: [uMap.ananya._id, uMap.aarav._id, uMap.riya._id, uMap.aditya._id, uMap.meera._id],
        createdBy: uMap.ananya._id,
      },
      {
        name: 'Core Data Warehousing Pipeline',
        description: 'Consolidating analytics from multiple transaction platforms into an optimized clickstream ledger.',
        owner: uMap.aarav._id,
        members: [uMap.aarav._id, uMap.rohan._id, uMap.arjun._id, uMap.dev._id, uMap.zara._id],
        createdBy: uMap.aarav._id,
      },
    ];

    const projects = [];
    for (const p of projectsData) {
      const proj = new Project({
        name: p.name,
        description: p.description,
        status: 'active',
        companyId: company._id,
        owner: p.owner,
        members: p.members,
        createdBy: p.createdBy,
        dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      });
      await proj.save();
      projects.push(proj);
    }
    console.log(`Successfully created ${projects.length} project boards!`);

    // Helper map of projects
    const pMap = {
      upi: projects[0],
      cloud: projects[1],
      ecommerce: projects[2],
      ai: projects[3],
      data: projects[4],
    };

    // 4. Create Backlog Tasks (at least 3-4 tasks per project, total 18 tasks)
    console.log('Creating Tasks Backlog...');
    const tasksData = [
      // --- Project 1: UPI Autopay
      {
        title: 'Design UPI Autopay UI Dashboard',
        description: 'Create elegant and responsive dark-themed UI components for user recurring payments.',
        status: 'todo',
        priority: 'high',
        projectId: pMap.upi._id,
        assignedTo: uMap.rohan._id,
        createdBy: uMap.aarav._id,
      },
      {
        title: 'Configure Bank Gateway Webhooks',
        description: 'Set up fast, secure, and authenticated webhook callback handlers to confirm UPI response packets.',
        status: 'in-progress',
        priority: 'high',
        projectId: pMap.upi._id,
        assignedTo: uMap.priya._id,
        createdBy: uMap.aarav._id,
      },
      {
        title: 'Stress Testing & Latency Benchmarks',
        description: 'Run load stress tests on the UPI transaction queue to ensure latency remains under 150ms.',
        status: 'review',
        priority: 'medium',
        projectId: pMap.upi._id,
        assignedTo: uMap.diya._id,
        createdBy: uMap.aarav._id,
      },
      {
        title: 'Draft Autopay API Documentation',
        description: 'Publish complete schemas, parameters, and callback responses on internal docs.',
        status: 'done',
        priority: 'low',
        projectId: pMap.upi._id,
        assignedTo: uMap.rohan._id,
        createdBy: uMap.aarav._id,
      },

      // --- Project 2: Cloud Infra
      {
        title: 'Migrate Docker Containers to Kubernetes',
        description: 'Configure pod security policies and configure YAML deployment manifests for high availability.',
        status: 'todo',
        priority: 'high',
        projectId: pMap.cloud._id,
        assignedTo: uMap.arjun._id,
        createdBy: uMap.priya._id,
      },
      {
        title: 'Audit IAM Cloud Roles',
        description: 'Enforce principle of least privilege across cloud assets, groups, and service credentials.',
        status: 'in-progress',
        priority: 'high',
        projectId: pMap.cloud._id,
        assignedTo: uMap.sneha._id,
        createdBy: uMap.priya._id,
      },
      {
        title: 'Setup Prometheus & Grafana Alerts',
        description: 'Create real-time dashboards to alert engineering teams of RAM spikes and traffic surges.',
        status: 'review',
        priority: 'medium',
        projectId: pMap.cloud._id,
        assignedTo: uMap.vihaan._id,
        createdBy: uMap.priya._id,
      },

      // --- Project 3: E-Commerce Client App v2.0
      {
        title: 'Optimize Checkout Cart Latency',
        description: 'Integrate custom Redis caching structures to eliminate redundant item list queries.',
        status: 'todo',
        priority: 'medium',
        projectId: pMap.ecommerce._id,
        assignedTo: uMap.ishaan._id,
        createdBy: uMap.kabir._id,
      },
      {
        title: 'Implement Dark Mode Layout Settings',
        description: 'Integrate customizable theme profiles and clean micro-animations in settings dropdowns.',
        status: 'in-progress',
        priority: 'low',
        projectId: pMap.ecommerce._id,
        assignedTo: uMap.zara._id,
        createdBy: uMap.kabir._id,
      },
      {
        title: 'Debug Stripe Payment Declines',
        description: 'Investigate callback packet drop rates on international bank checkouts.',
        status: 'review',
        priority: 'high',
        projectId: pMap.ecommerce._id,
        assignedTo: uMap.dev._id,
        createdBy: uMap.kabir._id,
      },

      // --- Project 4: AI Customer Support Agent
      {
        title: 'Fine-tune Support LLM Weights',
        description: 'Train models on standard chat logs to yield fast, precise refund policy explanations.',
        status: 'todo',
        priority: 'high',
        projectId: pMap.ai._id,
        assignedTo: uMap.riya._id,
        createdBy: uMap.ananya._id,
      },
      {
        title: 'Build Fallback Intent Routing',
        description: 'Wire up a manual escape hatch to route high-value ticket queries to customer executives.',
        status: 'in-progress',
        priority: 'medium',
        projectId: pMap.ai._id,
        assignedTo: uMap.aditya._id,
        createdBy: uMap.ananya._id,
      },
      {
        title: 'Verify Compliance Sandbox Rules',
        description: 'Verify anonymizer pipelines are purging credit cards and phone numbers from chat databases.',
        status: 'review',
        priority: 'high',
        projectId: pMap.ai._id,
        assignedTo: uMap.meera._id,
        createdBy: uMap.ananya._id,
      },

      // --- Project 5: Core Data Warehousing Pipeline
      {
        title: 'Develop Real-time Kafka Consumers',
        description: 'Architect decoupled message consumers to stream event logs into unified analytical blocks.',
        status: 'todo',
        priority: 'high',
        projectId: pMap.data._id,
        assignedTo: uMap.dev._id,
        createdBy: uMap.aarav._id,
      },
      {
        title: 'Refactor Redshift Database Schemas',
        description: 'Eliminate duplicate indexes to yield faster daily analytic cohort assemblies.',
        status: 'in-progress',
        priority: 'medium',
        projectId: pMap.data._id,
        assignedTo: uMap.rohan._id,
        createdBy: uMap.aarav._id,
      },
      {
        title: 'Automate Spark SQL ETL Sprints',
        description: 'Configure cron scripts to pipeline clean payment logs directly to S3 data blocks.',
        status: 'review',
        priority: 'low',
        projectId: pMap.data._id,
        assignedTo: uMap.zara._id,
        createdBy: uMap.aarav._id,
      },
    ];

    for (const t of tasksData) {
      const task = new Task({
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        projectId: t.projectId,
        companyId: company._id,
        assignedTo: t.assignedTo,
        createdBy: t.createdBy,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      });
      await task.save();
    }
    console.log('Backlog tasks saved.');

    // 5. Log Activity Notifications
    const notificationsData = [
      { message: 'Aarav Sharma created workspace "UPI Autopay & Settlement Systems".', userId: uMap.aarav._id },
      { message: 'Priya Patel created workspace "Cloud Infra & Security Hardening".', userId: uMap.priya._id },
      { message: 'Kabir Singh created workspace "E-Commerce Client App v2.0".', userId: uMap.kabir._id },
      { message: 'Ananya Iyer created workspace "AI Customer Support Agent".', userId: uMap.ananya._id },
      { message: 'Rohan Verma shifted task "Design UPI Autopay UI Dashboard" to todo.', userId: uMap.rohan._id },
      { message: 'Arjun Mehta was assigned to task "Migrate Docker Containers to Kubernetes".', userId: uMap.arjun._id },
    ];

    for (const n of notificationsData) {
      const notif = new Notification({
        message: n.message,
        companyId: company._id,
        userId: n.userId,
      });
      await notif.save();
    }
    console.log('Activity notifications created.');

    console.log('\n=========================================');
    console.log('SEED DATA EXPANDED SUCCESSFULLY!');
    console.log('Company Workspace Code: COM-BHARAT');
    console.log('Common Password for all: Password@123');
    console.log('-----------------------------------------');
    console.log('Seeded Projects: 5 active boards');
    console.log('Seeded Teammates: 15 active users');
    console.log('1. Admin: aarav@bharattech.in (Aarav Sharma)');
    console.log('2. Manager: priya@bharattech.in (Priya Patel)');
    console.log('3. Manager: kabir@bharattech.in (Kabir Singh)');
    console.log('4. Manager: ananya@bharattech.in (Ananya Iyer)');
    console.log('5. Member: rohan@bharattech.in (Rohan Verma)');
    console.log('...and 10 other members.');
    console.log('=========================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding database failed:', error);
    process.exit(1);
  }
};

seedDatabase();
