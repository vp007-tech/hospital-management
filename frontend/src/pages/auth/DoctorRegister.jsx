import { useState } from "react";
import axios from "../../api/axios";

export default function DoctorRegister() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    specialization: "",
    experience: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/doctors", formData);
      alert("Doctor registered successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Error registering doctor");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">Doctor Registration</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="name" placeholder="Name" onChange={handleChange} className="w-full border p-2 rounded"/>
        <input type="email" name="email" placeholder="Email" onChange={handleChange} className="w-full border p-2 rounded"/>
        <input type="password" name="password" placeholder="Password" onChange={handleChange} className="w-full border p-2 rounded"/>
        <input type="text" name="phone" placeholder="Phone" onChange={handleChange} className="w-full border p-2 rounded"/>
        <input type="text" name="specialization" placeholder="Specialization" onChange={handleChange} className="w-full border p-2 rounded"/>
        <input type="number" name="experience" placeholder="Experience (years)" onChange={handleChange} className="w-full border p-2 rounded"/>
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">Register</button>
      </form>
    </div>
  );
}
