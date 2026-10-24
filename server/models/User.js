const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  name: String,
  xp: Number,
  skill: String,
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null }
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,

  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },

  skills: {
    strength: { type: Number, default: 0 },
    intelligence: { type: Number, default: 0 },
    discipline: { type: Number, default: 0 }
  },

  habitPoints: { type: Number, default: 0 }, 

  tasks: [taskSchema],

  achievements: {
    firstTask: { type: Boolean, default: false },
    fiveTasks: { type: Boolean, default: false },
    level3: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model("User", userSchema);