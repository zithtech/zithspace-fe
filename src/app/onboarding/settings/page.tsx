"use client";
import React from 'react'
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
const settings = () => {
  return (
   < MainLayout> <div>Settings</div> </MainLayout>      
    )   
}
export default settings