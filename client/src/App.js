import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [tasks, setTasks] = useState([]);
  const [levelUp, setLevelUp] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [skills, setSkills] = useState({
    strength: 0,
    intelligence: 0,
    discipline: 0,
  });

  const [taskName, setTaskName] = useState("");
  const [taskXP, setTaskXP] = useState("");
  const [taskSkill, setTaskSkill] = useState("strength");

  const [achievements, setAchievements] = useState({
    firstTask: false,
    fiveTasks: false,
    level3: false,
  });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  let xpNeeded = 100 * level * level;
  let xpPercent = (xp / xpNeeded) * 100;

  
  const questRewards = [
    { xp: 20, skill: "strength", skillPoints: 20 },
    { xp: 30, skill: "intelligence", skillPoints: 15 },
    { xp: 40, skill: "discipline", skillPoints: 25 },
    { xp: 50, skill: "strength", skillPoints: 30 }, 
  ];

  useEffect(() => {
    if (loggedIn) {
      axios.get(`http://localhost:5000/user/${username}`)
        .then((res) => {
          const user = res.data;
          setXp(user.xp);
          setLevel(user.level);
          setSkills(user.skills);
          setTasks(user.tasks);
          setAchievements(user.achievements);
        });
    }
  }, [loggedIn, username]);

  const login = async () => {
    await axios.post("http://localhost:5000/login", { username, password });
    setLoggedIn(true);
  };

  const register = async () => {
    await axios.post("http://localhost:5000/register", { username, password });
    login();
  };

  const addTask = async () => {

  if (!taskName.trim() || !taskXP) {
    alert("⚠️ Filling form is mandatory!");
    return;
  }

  if (Number(taskXP) <= 0) {
    alert("⚠️ XP must be greater than 0!");
    return;
  }

  try {
    await axios.post("http://localhost:5000/add-task", {
      username,
      name: taskName,
      xp: Number(taskXP),
      skill: taskSkill,
    });

    const userRes = await axios.get(`http://localhost:5000/user/${username}`);
    setTasks(userRes.data.tasks);

    
    setTaskName("");
    setTaskXP("");

  } catch (err) {
    alert("Error adding task");
  }
};

  const completeTask = async (task) => {
    if (completing) return;

    setCompleting(true);

    try {
      const res = await axios.post("http://localhost:5000/complete-task", {
        username,
        taskId: task._id,
      });

      const user = res.data;
      let updatedXP = user.xp;
      let updatedSkills = { ...user.skills };

      
      const completedTasks = user.tasks.filter(t => t.completed).length;
      if (completedTasks % 3 === 0) {
        const questNumber = completedTasks / 3;
        const reward = questRewards[(questNumber - 1) % questRewards.length];

        updatedXP += reward.xp;
        updatedSkills[reward.skill] += reward.skillPoints;
      }

      setXp(updatedXP);
      setSkills(updatedSkills);
      setTasks(user.tasks);

      if (user.levelUp) {
        setLevelUp(true);
        setTimeout(() => setLevelUp(false), 2000);
      }

    } catch (err) {
      alert("Error completing task");
    }

    setCompleting(false);
  };

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const skillPercent = (value) => Math.min(value, 100);

  if (!loggedIn) {
    return (
      <div className="container">
        <h1>🔐 Login</h1>
        <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
        <br /><br />
        <button className="button" onClick={login}>Login</button>
        <button className="button" onClick={register}>Register</button>
      </div>
    );
  }


  const totalCompleted = tasks.filter(t => t.completed).length;
  const questsCount = Math.ceil(totalCompleted / 3);
  const quests = Array.from({ length: questsCount }, (_, i) => {
    const objective = 3;
    const completedInThisQuest = Math.min(3, totalCompleted - i * 3);
    const isCompleted = completedInThisQuest === objective;
    const reward = questRewards[i % questRewards.length];
    return { questNumber: i + 1, objective, progress: completedInThisQuest, isCompleted, reward };
  });

  return (
    <div className="container">
      <h1>🎮 Life RPG Dashboard</h1>

      {levelUp && <div className="level-up-toast">✨ Level Up! ✨</div>}

      <div className="dashboard-grid">

  
        <div className="card">
          <h2>Level: {level}</h2>
          <p>XP: {xp} / {xpNeeded}</p>
          <div className="xp-bar">
            <div style={{ width: `${xpPercent}%` }} className="xp-fill xp-level"></div>
          </div>
        </div>


        <div className="card">
          <h2>💪 Skills</h2>
          <div className="skills-container">
            {["strength", "intelligence", "discipline"].map(skill => (
              <div key={skill} className="skill-circle">
                <svg viewBox="0 0 36 36">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                  <path className="circle"
                    strokeDasharray={`${skillPercent(skills[skill])}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                  <text x="18" y="20" className="circle-text">
                    {skill === "strength" ? "💪" : skill === "intelligence" ? "🧠" : "⏳"}
                  </text>
                </svg>
                <p>{skills[skill]}%</p>
              </div>
            ))}
          </div>
        </div>

    
        <div className="card">
          <h2>🗡️ Quests</h2>
          {quests.length === 0 && <p>No quests yet. Complete tasks to start quests!</p>}
          {quests.map(q => (
            <div key={q.questNumber} className="quest-item">
              <p><strong>Quest {q.questNumber}:</strong> Complete {q.objective} tasks</p>
              <p>Progress: {q.progress} / {q.objective}</p>
              <p>Reward: {q.reward.xp} XP + {q.reward.skillPoints} {q.reward.skill}</p>
              {q.isCompleted && <p>✅ Completed!</p>}
            </div>
          ))}
        </div>

    
        <div className="card">
          <h2>➕ Add Task</h2>
          <input placeholder="Task name" value={taskName} onChange={(e) => setTaskName(e.target.value)} />
          <input placeholder="XP" value={taskXP} onChange={(e) => setTaskXP(e.target.value)} />
          <select onChange={(e) => setTaskSkill(e.target.value)}>
            <option value="strength">Strength</option>
            <option value="intelligence">Intelligence</option>
            <option value="discipline">Discipline</option>
          </select>
          <br /><br />
          <button className="button" onClick={addTask}>Add Task</button>
        </div>

      
        <div className="card">
          <h2>📋 Pending Tasks</h2>
          {pendingTasks.length ? pendingTasks.map(task => (
            <div key={task._id}>
              <p>{task.name} (+{task.xp})</p>
              <button
                className="button"
                disabled={completing}
                onClick={() => completeTask(task)}
              >
                {completing ? "..." : "Complete"}
              </button>
            </div>
          )) : <p>No pending tasks</p>}
        </div>

        
        <div className="card">
          <h2>✅ Completed Tasks</h2>
          {completedTasks.length ? completedTasks.map(task => (
            <p key={task._id}>{task.name}</p>
          )) : <p>No completed tasks</p>}
        </div>

        
        <div className="card">
          <h2>🏆 Achievements</h2>
          <p>{achievements.firstTask ? "✅ First Task" : "🔒 First Task"}</p>
          <p>{achievements.fiveTasks ? "✅ 5 Tasks" : "🔒 5 Tasks"}</p>
          <p>{achievements.level3 ? "✅ Level 3" : "🔒 Level 3"}</p>
        </div>

      </div>
    </div>
  );
}

export default App;