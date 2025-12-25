import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import MazeRunner from "./Sgames/mazeRunner/MazeRunner";
import Uma from "./Sgames/uma/Uma";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/maze-runner" element={<MazeRunner />} />
        <Route path="/uma" element={<Uma />} />
      </Routes>
    </Router>
  );
}

export default App;
