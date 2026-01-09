import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import MazeRunner from "./Sgames/mazeRunner/MazeRunner";
import Uma from "./Sgames/uma/Uma";
import Race from "./Sgames/race/Race";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/maze-runner" element={<MazeRunner />} />
        <Route path="/uma" element={<Uma />} />
        <Route path="/race" element={<Race />} />
      </Routes>
    </Router>
  );
}

export default App;
