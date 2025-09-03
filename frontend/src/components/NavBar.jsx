import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";

function Navbar() {
  const { user, logout, isAuthenticated, isDoctor, isPatient } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold">
              Hospital Management System
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-6">
            {isAuthenticated() ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="hover:bg-blue-700 px-3 py-2 rounded transition duration-200"
                >
                  Dashboard
                </Link>
                
                {/* Show different links based on role */}
                {!isPatient() && (
                  <Link 
                    to="/patients" 
                    className="hover:bg-blue-700 px-3 py-2 rounded transition duration-200"
                  >
                    Patients
                  </Link>
                )}
                
                {!isPatient() && (
                  <Link 
                    to="/doctors" 
                    className="hover:bg-blue-700 px-3 py-2 rounded transition duration-200"
                  >
                    Doctors
                  </Link>
                )}
                
                <Link 
                  to="/appointments" 
                  className="hover:bg-blue-700 px-3 py-2 rounded transition duration-200"
                >
                  Appointments
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/" 
                  className="hover:bg-blue-700 px-3 py-2 rounded transition duration-200"
                >
                  Home
                </Link>
                <Link 
                  to="/login" 
                  className="hover:bg-blue-700 px-3 py-2 rounded transition duration-200"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="hover:bg-blue-700 px-3 py-2 rounded transition duration-200"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center space-x-4">
            {isAuthenticated() && (
              <>
                <div className="hidden md:block text-sm">
                  Welcome, {user?.name || user?.email}
                  <span className="ml-2 px-2 py-1 bg-blue-700 rounded text-xs">
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition duration-200"
                >
                  Logout
                </button>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-blue-700 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-blue-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {isAuthenticated() ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>

                  {!isPatient() && (
                    <Link
                      to="/patients"
                      className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Patients
                    </Link>
                  )}

                  {!isPatient() && (
                    <Link
                      to="/doctors"
                      className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Doctors
                    </Link>
                  )}

                  <Link
                    to="/appointments"
                    className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Appointments
                  </Link>

                  <div className="px-3 py-2 text-sm border-t border-blue-700 mt-2">
                    Welcome, {user?.name || user?.email}
                    <span className="ml-2 px-2 py-1 bg-blue-700 rounded text-xs">
                      {user?.role?.toUpperCase()}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    to="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
