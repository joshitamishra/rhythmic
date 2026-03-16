import { Routes, Route } from "react-router-dom"
import HomePage from "./pages/HomePage"
import PomodoroPage from "./pages/PomodoroPage"

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pomodoro" element={<PomodoroPage />} />
    </Routes>
  )
}

export default App
