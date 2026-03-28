import { Routes, Route } from "react-router-dom"
import HomePage from "./pages/HomePage"
import PomodoroPage from "./pages/PomodoroPage"
import ProfilePage from "./pages/ProfilePage"
import InsightsPage from "./pages/InsightsPage"
import CoffeePage from "./pages/CoffeePage"

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pomodoro" element={<PomodoroPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/insights" element={<InsightsPage />} />
      <Route path="/coffee" element={<CoffeePage />} />
    </Routes>
  )
}

export default App
