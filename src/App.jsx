import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import MazeRunner from "./Sgames/mazeRunner/MazeRunner";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/maze-runner" element={<MazeRunner />} />
      </Routes>
    </Router>
  );
}

export default App;
