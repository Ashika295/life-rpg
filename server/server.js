const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());


mongoose.connect("mongodb://127.0.0.1:27017/lifeRPG")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));


const User = require("./models/User");


app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ message: "User exists" });

  const user = new User({ username, password });
  await user.save();
  res.json(user);
});


app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.password !== password) return res.status(401).json({ message: "Wrong password" });
  res.json(user);
});

app.get("/user/:username", async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  res.json(user);
});


app.post("/add-task", async (req, res) => {
  const { username, name, xp, skill } = req.body;
  const user = await User.findOne({ username });

  user.tasks.push({ name, xp, skill, completed: false });
  await user.save();

  res.json(user.tasks[user.tasks.length - 1]);
});


app.post("/complete-task", async (req, res) => {
  const { username, taskId } = req.body;
  const user = await User.findOne({ username });
  const task = user.tasks.id(taskId);
  if (!task) return res.status(404).json({ message: "Task not found" });
  if (task.completed) return res.json(user); 

  
  task.completed = true;
  task.completedAt = new Date();


  user.xp += task.xp;
  user.skills[task.skill] += task.xp;

  
  let xpNeeded = 100 * user.level * user.level;
  let levelUp = false;
  if (user.xp >= xpNeeded) {
    user.level += 1;
    user.xp -= xpNeeded;
    levelUp = true;
  }

  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  
  const completedToday = user.tasks.filter(
    t => t.completed && t.completedAt && new Date(t.completedAt) >= todayStart
  ).length;

  
  const dailyGoal = 3;
  if (completedToday === dailyGoal) {
    user.xp += 10; 
    user.habitPoints = (user.habitPoints || 0) + 1; 
  }

  await user.save();
  res.json({ ...user.toObject(), levelUp, completedToday });
});


app.listen(5000, () => console.log("Server running on port 5000"));