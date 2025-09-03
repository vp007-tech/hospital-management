import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="rounded-lg p-8 bg-gradient-to-r from-sky-50 to-white shadow-sm">
        <h1 className="text-3xl font-bold mb-2">Welcome to the Hospital Management System</h1>
        <p className="mb-4 text-gray-700">Login as a patient or doctor to continue.</p>
        <div className="flex gap-3">
          <Link to="/login/patient" className="px-4 py-2 bg-sky-600 text-white rounded-md shadow">Patient Login</Link>
          <Link to="/login/doctor" className="px-4 py-2 border border-sky-600 text-sky-600 rounded-md">Doctor Login</Link>
        </div>
      </div>
    </main>
  );
}
