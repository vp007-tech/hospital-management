import { useState } from "react";
import axios from "../../api/axios";

export default function PatientRegister() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    gender: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/patients", formData);
      alert("Patient registered successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Error registering patient");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">Patient Registration</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="name" placeholder="Name" onChange={handleChange} className="w-full border p-2 rounded"/>
        <input type="email" name="email" placeholder="Email" onChange={handleChange} className="w-full border p-2 rounded"/>
        <input type="password" name="password" placeholder="Password" onChange={handleChange} className="w-full border p-2 rounded"/>
        <input type="number" name="age" placeholder="Age" onChange={handleChange} className="w-full border p-2 rounded"/>
        <select name="gender" onChange={handleChange} className="w-full border p-2 rounded">
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Register</button>
      </form>
    </div>
  );
}
