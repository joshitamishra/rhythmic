import { Routes, Route } from "react-router-dom"
import HomePage from "./pages/HomePage"
import PomodoroPage from "./pages/PomodoroPage"
import ProfilePage from "./pages/ProfilePage"
import InsightsPage from "./pages/InsightsPage"

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pomodoro" element={<PomodoroPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/insights" element={<InsightsPage />} />
    </Routes>
  )
}

export default App
