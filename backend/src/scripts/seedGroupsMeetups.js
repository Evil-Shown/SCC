import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db.js";

import User from "../models/User.js";
import Group from "../models/Group.js";
import Meeting from "../models/Meeting.js";
import Notification from "../models/Notification.js";
import Message from "../models/Message.js";

const seedUsers = [
  {
    name: "Nethshan Student",
    email: "student1@scc.edu",
    password: "Password123!",
    role: "student",
    department: "Computing",
    year: 2,
    studentId: "SCC-STU-001"
  },
  {
    name: "Group Leader",
    email: "leader@scc.edu",
    password: "Password123!",
    role: "student",
    department: "Computing",
    year: 3,
    studentId: "SCC-STU-002"
  },
  {
    name: "Member Two",
    email: "member2@scc.edu",
    password: "Password123!",
    role: "student",
    department: "Engineering",
    year: 1,
    studentId: "SCC-STU-003"
  },
  {
    name: "Member Three",
    email: "member3@scc.edu",
    password: "Password123!",
    role: "student",
    department: "Business",
    year: 4,
    studentId: "SCC-STU-004"
  }
];

const getOrCreateUsers = async () => {
  const out = [];
  for (const u of seedUsers) {
    let user = await User.findOne({ email: u.email }).select("+password");
    if (!user) {
      user = await User.create(u);
    }
    out.push(user);
  }
  return out;
};

const getOrCreateGroup = async ({ name, creatorId, memberIds }) => {
  let group = await Group.findOne({ name });
  if (!group) {
    group = await Group.create({
      name,
      description: "Seeded group for testing Groups + Meetups + Polls",
      creator: creatorId,
      admins: [creatorId],
      members: [{ user: creatorId, role: "admin", joinedAt: new Date() }],
      subject: "Software Engineering",
      courseCode: "SE-201",
      tags: ["project", "meetups"],
      isPublic: false,
      isActive: true,
      settings: {
        isPublic: false,
        allowMemberInvites: true,
        maxMembers: 50
      }
    });
  }

  // Ensure members exist
  for (const memberId of memberIds) {
    group.addMember(memberId, "member");
  }
  await group.save();

  await group.populate("creator", "name email profilePicture");
  await group.populate("members.user", "name email profilePicture");
  await group.populate("admins", "name email profilePicture");
  return group;
};

const createMeetupsForGroup = async ({ group, organizerId, voterIds }) => {
  const now = Date.now();
  const inTwoDays = new Date(now + 2 * 24 * 60 * 60 * 1000);
  const inFiveDays = new Date(now + 5 * 24 * 60 * 60 * 1000);

  const meetup1 = await Meeting.create({
    groupId: group._id,
    organizerId,
    title: "Hybrid Sprint Planning",
    description: "Plan tasks, assign roles, and confirm timeline.",
    meetingDate: inTwoDays,
    time: "16:00",
    duration: 60,
    mode: "HYBRID",
    meetingLink: "https://meet.google.com/example-link",
    location: "Main Library - Room 2",
    minConfirmations: 2,
    status: "Active",
    votes: [
      { user: voterIds[0], response: "YES", votedAt: new Date() },
      { user: voterIds[1], response: "NO", votedAt: new Date() }
    ]
  });

  const meetup2 = await Meeting.create({
    groupId: group._id,
    organizerId,
    title: "Online Demo Session",
    description: "Weekly demo and progress check.",
    meetingDate: inFiveDays,
    time: "19:30",
    duration: 45,
    mode: "ONLINE",
    meetingLink: "https://meet.google.com/example-link-2",
    location: "",
    minConfirmations: 3,
    status: "Draft",
    votes: []
  });

  return [meetup1, meetup2];
};

const seedNotifications = async ({ users, group, meetup }) => {
  // One meetup notification for everyone to test realtime bell + list
  const payload = users.map((u) => ({
    userId: u._id,
    type: "group_meetup_created",
    title: "Seed: New meetup created",
    message: `Seeded meetup "${meetup.title}" in "${group.name}"`,
    relatedId: meetup._id,
    relatedModel: "Meeting",
    isRead: false
  }));
  await Notification.insertMany(payload, { ordered: false });
};

const seedMessages = async ({ groupId, senderId }) => {
  const exists = await Message.findOne({ group: groupId, type: "system" });
  if (exists) return;

  await Message.create({
    group: groupId,
    sender: senderId,
    content: "Seeded: Welcome to the group chat",
    type: "system"
  });
};

const main = async () => {
  await connectDB();

  const users = await getOrCreateUsers();
  const [student1, leader, member2, member3] = users;

  const group = await getOrCreateGroup({
    name: "SCC Project Group A",
    creatorId: leader._id,
    memberIds: [student1._id, member2._id, member3._id]
  });

  // Clear old seeded meetups for this group to avoid duplicates
  await Meeting.deleteMany({ groupId: group._id, title: { $in: ["Hybrid Sprint Planning", "Online Demo Session"] } });

  const meetups = await createMeetupsForGroup({
    group,
    organizerId: leader._id,
    voterIds: [student1._id, member2._id]
  });

  await seedNotifications({ users, group, meetup: meetups[0] });
  await seedMessages({ groupId: group._id, senderId: leader._id });

  console.log("Seed complete.");
  console.log("Demo logins:");
  console.log("- leader@scc.edu / Password123!");
  console.log("- student1@scc.edu / Password123!");
  console.log("- member2@scc.edu / Password123!");
  console.log("- member3@scc.edu / Password123!");
  console.log("Group:", group.name, group._id.toString());

  await mongoose.disconnect();
};

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});

