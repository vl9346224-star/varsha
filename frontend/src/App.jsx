import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";
import ReportItem from "./pages/ReportItem.jsx";
import ItemDetails from "./pages/ItemDetails.jsx";
import Search from "./pages/Search.jsx";
import MyReports from "./pages/MyReports.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />

        {/* Member 2: Report Lost & Found */}
        <Route path="/report-lost" element={<ReportItem itemType="lost" />} />
        <Route path="/report-found" element={<ReportItem itemType="found" />} />

        {/* Member 3: Search, Filter, Details & My Reports */}
        <Route path="/search" element={<Search />} />
        <Route path="/items/:id" element={<ItemDetails />} />
        <Route path="/my-reports" element={<MyReports />} />

        {/* Member 6: Admin Dashboard (Guarded for admin role) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
