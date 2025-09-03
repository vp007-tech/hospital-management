import { useEffect, useState } from "react";
import axios from "../api/axios";

function Doctor() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const doctorId = localStorage.getItem("doctorId");

        const { data } = await axios.get(`/doctors/${doctorId}/appointments`);
        setAppointments(data);
      } catch (error) {
        console.error("Error fetching doctor appointments:", error);
      }
    };

    fetchAppointments();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Doctor Dashboard</h1>
      <h2 className="text-xl mb-2">My Appointments</h2>
      <ul className="space-y-2">
        {appointments.map((appt) => (
          <li key={appt._id} className="p-4 border rounded-md shadow-sm">
            <p><strong>Patient:</strong> {appt.patientName}</p>
            <p><strong>Date:</strong> {new Date(appt.date).toLocaleString()}</p>
            <p><strong>Status:</strong> {appt.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Doctor;
