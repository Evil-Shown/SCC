import User from "../models/User.js";
import Group from "../models/Group.js";
import Note from "../models/Note.js";
import KuppiPost from "../models/KuppiPost.js";
import Message from "../models/Message.js";

/**
 * GET /api/admin/analytics
 * Returns aggregated platform statistics and chart data
 */
export const getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Parallel aggregate queries
    const [
      totalUsers,
      totalGroups,
      totalNotes,
      totalKuppi,
      totalMessages,
      registrationsByDay,
      roleDistribution,
      departmentDistribution,
      weeklyMessages,
      verifiedUsers,
      newUsersThisWeek,
      newGroupsThisWeek,
    ] = await Promise.all([
      // Counts
      User.countDocuments(),
      Group.countDocuments(),
      Note.countDocuments(),
      KuppiPost.countDocuments(),
      Message.countDocuments(),

      // User registrations per day (last 30 days)
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]),

      // Role distribution
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Top 7 departments by user count
      User.aggregate([
        { $match: { department: { $ne: null, $ne: "" } } },
        { $group: { _id: "$department", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 7 },
      ]),

      // Messages per day in last 7 days
      Message.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]),

      // Verified vs unverified
      User.countDocuments({ isVerified: true }),

      // New users this week
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),

      // New groups this week
      Group.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    // Format registration chart data for last 30 days (fill gaps with 0)
    const registrationMap = {};
    registrationsByDay.forEach((item) => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, "0")}-${String(item._id.day).padStart(2, "0")}`;
      registrationMap[key] = item.count;
    });

    const registrationsChart = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      registrationsChart.push({ date: label, users: registrationMap[key] || 0 });
    }

    // Format weekly messages chart
    const messageMap = {};
    weeklyMessages.forEach((item) => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, "0")}-${String(item._id.day).padStart(2, "0")}`;
      messageMap[key] = item.count;
    });

    const weeklyMessagesChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      weeklyMessagesChart.push({ day: label, messages: messageMap[key] || 0 });
    }

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalGroups,
          totalNotes,
          totalKuppi,
          totalMessages,
          verifiedUsers,
          newUsersThisWeek,
          newGroupsThisWeek,
        },
        charts: {
          registrationsChart,
          weeklyMessagesChart,
          roleDistribution: roleDistribution.map((r) => ({
            name: r._id ? r._id.charAt(0).toUpperCase() + r._id.slice(1) : "Unknown",
            value: r.count,
          })),
          departmentDistribution: departmentDistribution.map((d) => ({
            name: d._id,
            count: d.count,
          })),
        },
      },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    res.status(500).json({ success: false, message: "Error fetching analytics" });
  }
};

/**
 * GET /api/admin/users
 * Paginated, searchable user list
 */
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const role = req.query.role || "";
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ];
    }
    if (role) query.role = role;

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-refreshTokens -googleRefreshToken -oneDriveRefreshToken")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("Admin getUsers error:", error);
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
};

/**
 * PUT /api/admin/users/:id
 * Admin updates a user's role, department, year, isVerified
 */
export const updateUser = async (req, res) => {
  try {
    const { role, department, year, isVerified, name } = req.body;
    const allowedUpdates = {};
    if (role !== undefined) allowedUpdates.role = role;
    if (department !== undefined) allowedUpdates.department = department;
    if (year !== undefined) allowedUpdates.year = year;
    if (isVerified !== undefined) allowedUpdates.isVerified = isVerified;
    if (name !== undefined) allowedUpdates.name = name;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      allowedUpdates,
      { new: true, runValidators: true }
    ).select("-refreshTokens -googleRefreshToken -oneDriveRefreshToken");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User updated successfully", data: { user } });
  } catch (error) {
    console.error("Admin updateUser error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: Object.values(error.errors).map(e => e.message).join(", ") });
    }
    res.status(500).json({ success: false, message: "Error updating user" });
  }
};

/**
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Admin deleteUser error:", error);
    res.status(500).json({ success: false, message: "Error deleting user" });
  }
};

/**
 * GET /api/admin/groups
 */
export const getGroups = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { courseCode: { $regex: search, $options: "i" } },
      ];
    }

    const [groups, total] = await Promise.all([
      Group.find(query)
        .populate("creator", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Group.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        groups,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("Admin getGroups error:", error);
    res.status(500).json({ success: false, message: "Error fetching groups" });
  }
};

/**
 * DELETE /api/admin/groups/:id
 */
export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    res.json({ success: true, message: "Group deleted successfully" });
  } catch (error) {
    console.error("Admin deleteGroup error:", error);
    res.status(500).json({ success: false, message: "Error deleting group" });
  }
};

/**
 * GET /api/admin/notes
 */
export const getNotes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    const [notes, total] = await Promise.all([
      Note.find(query)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Note.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        notes,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("Admin getNotes error:", error);
    res.status(500).json({ success: false, message: "Error fetching notes" });
  }
};

/**
 * DELETE /api/admin/notes/:id
 */
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: "Note not found" });
    res.json({ success: true, message: "Note deleted successfully" });
  } catch (error) {
    console.error("Admin deleteNote error:", error);
    res.status(500).json({ success: false, message: "Error deleting note" });
  }
};

/**
 * GET /api/admin/kuppi
 */
export const getKuppiPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    const [posts, total] = await Promise.all([
      KuppiPost.find(query)
        .populate("tutor", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      KuppiPost.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        posts,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("Admin getKuppiPosts error:", error);
    res.status(500).json({ success: false, message: "Error fetching kuppi posts" });
  }
};

/**
 * DELETE /api/admin/kuppi/:id
 */
export const deleteKuppiPost = async (req, res) => {
  try {
    const post = await KuppiPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Kuppi post not found" });
    res.json({ success: true, message: "Kuppi post deleted successfully" });
  } catch (error) {
    console.error("Admin deleteKuppiPost error:", error);
    res.status(500).json({ success: false, message: "Error deleting kuppi post" });
  }
};

/**
 * GET /api/admin/system-health
 */
export const getSystemHealth = async (req, res) => {
  try {
    const [
      userCount,
      groupCount,
      noteCount,
      kuppiCount,
      messageCount,
    ] = await Promise.all([
      User.countDocuments(),
      Group.countDocuments(),
      Note.countDocuments(),
      KuppiPost.countDocuments(),
      Message.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        server: "ok",
        dbConnected: true,
        timestamp: new Date().toISOString(),
        collections: {
          users: userCount,
          groups: groupCount,
          notes: noteCount,
          kuppiPosts: kuppiCount,
          messages: messageCount,
        },
        environment: process.env.NODE_ENV || "development",
        nodeVersion: process.version,
      },
    });
  } catch (error) {
    console.error("Admin system health error:", error);
    res.status(500).json({ success: false, message: "Error fetching system health" });
  }
};
