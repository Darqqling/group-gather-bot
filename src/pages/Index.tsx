
import { Route, Routes, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Collections from "@/pages/Collections";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";
import Help from "@/pages/Help";
import MiniApp from "@/pages/MiniApp";

const Index = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="collections" element={<Collections />} />
        <Route path="users" element={<Users />} />
        <Route path="analytics" element={<Navigate to="/" />} />
        <Route path="miniapp" element={<MiniApp />} />
        <Route path="settings" element={<Settings />} />
        <Route path="help" element={<Help />} />
      </Route>
    </Routes>
  );
};

export default Index;
