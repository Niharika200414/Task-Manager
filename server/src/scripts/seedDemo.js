const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { connectDb } = require('../db');
const User = require('../models/User');
const Project = require('../models/Project');
const Membership = require('../models/Membership');
const Task = require('../models/Task');

const DEMO_PASSWORD = 'DemoPass123!';

async function upsertUser({ name, email }) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await User.findOneAndUpdate(
    { email },
    { name, email, passwordHash },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );
  return user;
}

function daysFromNow(days, hours = 9) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hours, 0, 0, 0);
  return date;
}

async function recreateProject(projectName, description, createdBy, members, tasks) {
  const existing = await Project.findOne({ name: projectName, createdBy: createdBy._id }).lean();
  if (existing) {
    await Promise.all([
      Task.deleteMany({ projectId: existing._id }),
      Membership.deleteMany({ projectId: existing._id }),
      Project.deleteOne({ _id: existing._id }),
    ]);
  }

  const project = await Project.create({
    name: projectName,
    description,
    createdBy: createdBy._id,
  });

  await Membership.insertMany(
    members.map((member) => ({
      projectId: project._id,
      userId: member.user._id,
      role: member.role,
    }))
  );

  await Task.insertMany(
    tasks.map((task) => ({
      projectId: project._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      assignedTo: task.assignedTo?._id,
      createdBy: task.createdBy._id,
    }))
  );

  return project;
}

async function main() {
  await connectDb();

  const [admin, member] = await Promise.all([
    upsertUser({ name: 'Ariana Admin', email: 'admin@taskflowpro.demo' }),
    upsertUser({ name: 'Mason Member', email: 'member@taskflowpro.demo' }),
  ]);

  await recreateProject(
    'Northstar Product Launch',
    'Launch planning workspace with design, engineering, and campaign coordination.',
    admin,
    [
      { user: admin, role: 'ADMIN' },
      { user: member, role: 'MEMBER' },
    ],
    [
      {
        title: 'Finalize launch landing page',
        description: 'Polish the hero, value props, and CTA hierarchy before sign-off.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: daysFromNow(1, 14),
        assignedTo: member,
        createdBy: admin,
      },
      {
        title: 'Approve pricing announcement copy',
        description: 'Review legal notes and tighten the announcement for launch day.',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: daysFromNow(2, 11),
        assignedTo: admin,
        createdBy: admin,
      },
      {
        title: 'QA responsive marketing layouts',
        description: 'Test navigation, card stacking, and mobile spacing across breakpoints.',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: daysFromNow(3, 16),
        assignedTo: member,
        createdBy: admin,
      },
      {
        title: 'Retro on onboarding funnel',
        description: 'Capture first-week activation signals and friction points.',
        status: 'DONE',
        priority: 'LOW',
        dueDate: daysFromNow(-1, 10),
        assignedTo: member,
        createdBy: member,
      },
      {
        title: 'Resolve overdue analytics tagging fix',
        description: 'Patch the missing conversion event on signup completion.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: daysFromNow(-2, 9),
        assignedTo: member,
        createdBy: admin,
      },
    ]
  );

  await recreateProject(
    'Client Success Ops',
    'Internal delivery board for customer success, documentation, and reporting.',
    admin,
    [{ user: admin, role: 'ADMIN' }],
    [
      {
        title: 'Prepare executive status report',
        description: 'Summarize blockers, wins, and upcoming milestones for stakeholders.',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: daysFromNow(4, 13),
        assignedTo: admin,
        createdBy: admin,
      },
      {
        title: 'Refresh onboarding SOP',
        description: 'Update screenshots and add escalation guidance for the team.',
        status: 'DONE',
        priority: 'LOW',
        dueDate: daysFromNow(-3, 15),
        assignedTo: admin,
        createdBy: admin,
      },
    ]
  );

  console.log('Demo data ready.');
  console.log('Admin  : admin@taskflowpro.demo / DemoPass123!');
  console.log('Member : member@taskflowpro.demo / DemoPass123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
