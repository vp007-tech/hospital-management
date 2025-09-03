import { useEffect, useState } from "react";
import API from "../api/axios";

function Patients() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    API.get("/patients")
      .then((res) => setPatients(res.data))
      .catch(() => alert("Error fetching patients"));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Patients</h1>
      <ul className="space-y-2">
        {patients.map((p) => (
          <li key={p._id} className="p-2 border rounded">
            {p.name} ({p.email})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Patients;
