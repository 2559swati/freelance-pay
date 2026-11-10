import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import Hero from "./components/Hero";
import JobForm from "./components/JobForm";
import MyJobs from "./components/MyJobs";
import JobDetail from "./components/JobDetail";
import ArbitratorPanel from "./components/ArbitratorPanel";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/create" element={<JobForm />} />
          <Route path="/my-jobs/*" element={<MyJobs />} />
          <Route path="/job/:id" element={<JobDetail />} />
          <Route path="/arbitrator" element={<ArbitratorPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-center" />
      </Layout>
    </Router>
  );
}

export default App;

