import React, { useEffect, useState } from "react";
import API from "../api/axios";

export default function Appointments() {
  const [appts, setAppts] = useState([]);

  useEffect(() => {
    API.get("/appointments")
      .then(res => setAppts(res.data))
      .catch(() => alert("Failed to load appointments"));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/appointments/${id}/status`, { status }); // PUT /api/appointments/:id/status
      setAppts(prev => prev.map(a => a._id === id ? { ...a, status } : a));
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Appointments</h2>
      {appts.map(a => (
        <div key={a._id} className="p-3 border rounded mb-2 flex justify-between items-center">
          <div>
            <div className="font-medium">{a.patient?.name} → {a.doctor?.user?.name || a.doctor?.name}</div>
            <div className="text-sm text-gray-600">{new Date(a.date).toLocaleString()} • {a.status}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => updateStatus(a._id, "confirmed")} className="px-2 py-1 bg-green-500 text-white rounded">Confirm</button>
            <button onClick={() => updateStatus(a._id, "cancelled")} className="px-2 py-1 bg-red-500 text-white rounded">Cancel</button>
          </div>
        </div>
      ))}
    </div>
  );
}
