import axios from "axios";

const API_URL = process.env.SEED_API_URL || "http://localhost:5000";

const users = [
  { name: "Group Leader", email: "leader@scc.edu", password: "Password123!", role: "student", studentId: "SCC-STU-002" },
  { name: "Student One", email: "student1@scc.edu", password: "Password123!", role: "student", studentId: "SCC-STU-001" },
  { name: "Member Two", email: "member2@scc.edu", password: "Password123!", role: "student", studentId: "SCC-STU-003" },
  { name: "Member Three", email: "member3@scc.edu", password: "Password123!", role: "student", studentId: "SCC-STU-004" }
];

const registerOrLogin = async (u) => {
  try {
    const res = await axios.post(`${API_URL}/api/auth/register`, u);
    return res.data.data;
  } catch (e) {
    // if exists, login
    const msg = e.response?.data?.message || "";
    if (e.response?.status === 400 && msg.toLowerCase().includes("already exists")) {
      const login = await axios.post(`${API_URL}/api/auth/login`, { email: u.email, password: u.password });
      return login.data.data;
    }
    throw e;
  }
};

const authed = (token) =>
  axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

const main = async () => {
  console.log(`Seeding via API at ${API_URL}`);

  const leaderAuth = await registerOrLogin(users[0]);
  const othersAuth = await Promise.all(users.slice(1).map(registerOrLogin));

  const leaderApi = authed(leaderAuth.accessToken);

  // Create group
  const groupRes = await leaderApi.post("/api/groups", {
    name: "SCC Project Group A",
    description: "Seeded group for testing Groups + Meetups + Polls",
    subject: "Software Engineering",
    courseCode: "SE-201",
    tags: ["project", "meetups"],
    isPublic: false,
    allowMemberInvites: true,
    maxMembers: 50
  });

  const group = groupRes.data.data;
  console.log("Group created:", group._id);

  // Invite/add members (immediate add model)
  for (const a of othersAuth) {
    await leaderApi.post(`/api/groups/${group._id}/invite`, { userId: a.user._id });
  }

  // Create meetups (leader creates)
  const inTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const inFiveDays = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

  const meetup1 = await leaderApi.post(`/api/groups/${group._id}/meetups`, {
    title: "Hybrid Sprint Planning",
    description: "Plan tasks and confirm timeline.",
    meetingDate: inTwoDays,
    time: "16:00",
    duration: 60,
    mode: "HYBRID",
    meetingLink: "https://meet.google.com/example-link",
    location: "Main Library - Room 2",
    minConfirmations: 2
  });

  const meetup2 = await leaderApi.post(`/api/groups/${group._id}/meetups`, {
    title: "Online Demo Session",
    description: "Weekly demo and progress check.",
    meetingDate: inFiveDays,
    time: "19:30",
    duration: 45,
    mode: "ONLINE",
    meetingLink: "https://meet.google.com/example-link-2",
    location: "",
    minConfirmations: 3
  });

  console.log("Meetups created:", meetup1.data.data.meetup._id, meetup2.data.data.meetup._id);

  // Activate first meetup
  await leaderApi.post(`/api/meetups/${meetup1.data.data.meetup._id}/activate`);

  // Vote from two members
  const memberApi1 = authed(othersAuth[0].accessToken);
  const memberApi2 = authed(othersAuth[1].accessToken);
  await memberApi1.post(`/api/meetups/${meetup1.data.data.meetup._id}/vote`, { response: "YES" });
  await memberApi2.post(`/api/meetups/${meetup1.data.data.meetup._id}/vote`, { response: "NO" });

  console.log("Seed complete. Logins:");
  users.forEach((u) => console.log(`- ${u.email} / ${u.password}`));
};

main().catch((e) => {
  console.error("Seed via API failed:", e.response?.data || e.message);
  process.exit(1);
});

