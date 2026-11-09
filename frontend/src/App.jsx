import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { features } from './config/features';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import FoodLog from './pages/FoodLog';
import ExerciseLog from './pages/ExerciseLog';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import Measurements from './pages/Measurements';
import ExportData from './pages/ExportData';
import Recipes from './pages/Recipes';
import MealPlanning from './pages/MealPlanning';
import Achievements from './pages/Achievements';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Onboarding (authenticated but not fully protected) */}
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />
          
          {/* Protected Routes with Layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="food" element={<FoodLog />} />
            {features.exercise && <Route path="exercise" element={<ExerciseLog />} />}
            {features.recipes && <Route path="recipes" element={<Recipes />} />}
            {features.mealPlanning && <Route path="meal-planning" element={<MealPlanning />} />}
            <Route path="progress" element={<Progress />} />
            {features.measurements && <Route path="measurements" element={<Measurements />} />}
            {features.gamification && <Route path="achievements" element={<Achievements />} />}
            {features.export && <Route path="export" element={<ExportData />} />}
            <Route path="profile" element={<Profile />} />
          </Route>
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

