const router = require("express").Router();
const Attendance = require("../models/Attendance");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const User = require("../models/User");
const moment = require("moment");

const mongoose = require("mongoose");
// Mark attendance - only manager
router.post("/mark", auth, role(["manager", "admin"]), async (req, res) => {
  try {
    const { userId, status, advance, date } = req.body;

    if (!userId || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Step 1: Fetch user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const selectedDate = moment(date).startOf("day").toDate();
    const endOfSelectedDate = moment(date).endOf("day").toDate();

    const alreadyMarked = await Attendance.findOne({
      userId,
      date: { $gte: selectedDate, $lte: endOfSelectedDate },
      status:{ $exists:true},
    });

    if (alreadyMarked) {
      return res
        .status(400)
        .json({ error: "Attendance already marked today." });
    }

    // ✅ Step 2: Use gender from user document
    const newAttendance = new Attendance({
      userId,
      status,
      advance: Number(advance) || 0,
      date: date ? new Date(date) : Date.now(), // ✅ accept from frontend
      gender: user.gender,
      name: user.name,
      salaryPerDay: user.salaryPerDay,
    });

    await newAttendance.save();
   
    res.send("Marked");
  } catch (err) {
    console.error("❌ Attendance Save Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/edit/paid", async (req, res) => {
  const { salaryStatus } = req.body || {};
  const user = await Attendance.updateMany(
    {
      $or:[
        {status:"Present"},
        {advance:{$gt:0}},
        {oT:{$gt:0}}
      ]
    },
    { $set: { salaryStatus: "paid" } }
  );
  res.json("updated sucessfully");
});

router.put("/edit/paid/:userId", async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const userId = req.params.userId;

    const start = moment(startDate).startOf("day").toDate();
    const end = moment(endDate).endOf("day").toDate();

    await Attendance.updateMany(
      {
        userId,
        date: { $gte: start, $lte: end },
        salaryStatus: "paid" // only change paid → unpaid
      },
      { $set: { salaryStatus: "unpaid" } }
    );

    res.json({ message: "Updated to unpaid for selected range" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update" });
  }
});
router.put(
  "/edit/:userId",
  auth,
  role(["admin", "manager"]),
  async (req, res) => {
    const { status, advance, oT } = req.body;
    const userId = req.params.userId;

    try {
      // Ensure userId is valid
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid userId format" });
      }

      // Get today's date with time set to 00:00:00

      const startOfDay = moment().startOf("day").toDate();
      const endOfDay = moment().endOf("day").toDate();

      const attendance = await Attendance.findOneAndUpdate(
        {
          userId,
          date: { $gte: startOfDay, $lte: endOfDay }, // ⬅️ Only today's record
        },
        {
          status,
          advance: Number(advance) || 0,
          oT: Number(oT) || 0,
          edited: true,
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!attendance) {
        return res
          .status(404)
          .json({ error: "Attendance not found for today" });
      }

      res.json({ message: "Updated attendance", data: attendance });
    } catch (err) {
      console.error("Edit error:", err);
      res.status(500).json({ error: "Edit failed" });
    }
  }
);

router.post("/advance", async (req, res) => {
  try{
  const { userId, advance } = req.body;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const attendance = new Attendance({
    userId,
    advance,
    name: user.name,
    date: new Date(),
  });
  await attendance.save();
  res.json({ message: "OT added successfully", data: attendance });}
  catch{
  }
});
// View all attendance - admin & manager
router.get("/", auth, role(["admin", "manager"]), async (req, res) => {
  const records = await Attendance.find({ salaryStatus: "unpaid" });
  res.json(records);
});
router.get("/all", auth, role(["admin", "manager"]), async (req, res) => {
  const records = await Attendance.find();
  res.json(records);
});
router.post("/ot", async (req, res) => {
  try {
    const { userId, oT } = req.body;

 
    // ✅ get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ create new attendance entry (like advance)
    const attendance = new Attendance({
      userId,
      oT: Number(oT) || 0,
      advance: 0,
      name: user.name,
      date: new Date(),
  
    });

    await attendance.save();

    res.json({ message: "OT added successfully", data: attendance });
  } catch (err) {
    console.error("OT error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
// Get specific user history - all roles
router.get("/user/:id", auth, async (req, res) => {
  const records = await Attendance.find({ userId: req.params.id });
  res.json(records);
});

//view get Attendance summart for today

router.get("/today", async (req, res) => {
  try {
    const today = moment().startOf("day");
    const data = await Attendance.find({ date: { $gte: today.toDate() } });

    const summary = {
      malepresent: 0,
      femalepresent: 0,
      absent: 0,
     
      totalOt: 0,
      totaladvance: 0,
    };

    data.forEach((data) => {
      if (data.gender === "male" && data.status === "Present")
        summary.malepresent += 1;
      if (data.gender === "female" && data.status === "Present")
        summary.femalepresent += 1;
      if (data.status === "Absent") summary.absent += 1;
   

      summary.totalOt += data.oT || 0;
      summary.totaladvance += data.advance || 0;
    });

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch today summary" });
  }
});
``;

router.get("/week-summary", async (req, res) => {
  try {
    const startOfWeek = moment().startOf("isoWeek");
    const endOfWeek = moment().endOf("isoWeek");

    const data = await Attendance.find({
      date: {
        $gte: startOfWeek.toDate(),
        $lte: endOfWeek.toDate(),
      },
    });

    let summary = {
      malepresentDays: 0,
      femalepresentDays: 0,
   
      otHours: 0,
      advance: 0,
    };

    data.forEach((entry) => {
      if (entry.gender === "male" && entry.status === "Present")
        summary.malepresentDays += 1;
      if (entry.gender === "female" && entry.status === "Present")
        summary.femalepresentDays += 1;

      summary.otHours += entry.oT || 0;
      summary.advance += entry.oT || 0;
    });

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch weekly summary" });
  }
});

router.get("/today/attendance", async (req, res) => {
  const today = moment().startOf("day");
  const todaydata = await Attendance.find({ date: { $gte: today.toDate() } });
  res.json(todaydata);
});
router.get("/today/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const todayStart = moment().startOf("day").toDate();
    const todayEnd = moment().endOf("day").toDate();

    const record = await Attendance.findOne({
      userId,
      date: { $gte: todayStart, $lte: todayEnd },
    });

    let summary = {
      todayStatus: record ? record.status : "Not Marked",
      todayOT: record ? record.oT || 0 : 0,
      todayAdvance: record ? record.advance || 0 : 0,
    };

    res.json(summary);
  } catch (err) {
    console.error("Today summary error", err);
    res.status(500).json({ error: "Failed to fetch today summary" });
  }
});

// ✅ Weekly summary for specific user
router.get("/week-summary/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const startOfWeek = moment().startOf("isoWeek");
    const endOfWeek = moment().endOf("isoWeek");

    const records = await Attendance.find({
      userId,
      date: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() },
    });

    let summary = {
      presentDays: 0,
      absentDays: 0,
      halfDays: 0,
      totalOT: 0,
      totalAdvance: 0,
    };

    records.forEach((r) => {
      if (r.status === "Present") summary.presentDays += 1;
      if (r.status === "Absent") summary.absentDays += 1;
      if (r.status.toLowerCase() === "half day") summary.halfDays += 1;
      summary.totalOT += r.oT || 0;
      summary.totalAdvance += r.advance || 0;
    });

    res.json(summary);
  } catch (err) {
    console.error("Weekly summary error", err);
    res.status(500).json({ error: "Failed to fetch weekly summary" });
  }
});

module.exports = router;
