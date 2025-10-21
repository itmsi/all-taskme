import { Outlet } from 'react-router-dom'
import logo from '../assets/images/motor-sights-logo.png'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
            <div className="text-center mb-8">
              <img 
                src={logo} 
                alt="Motor Sights International" 
                className="h-20 w-auto mx-auto mb-6 filter brightness-0 invert"
              />
              <h1 className="text-4xl font-bold mb-4">Motor Sights International</h1>
              <p className="text-xl text-blue-100 mb-8">
                Task Management System
              </p>
            </div>
            
            <div className="space-y-6 text-center">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Kelola proyek dengan efisien</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Kolaborasi tim yang seamless</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Tracking progress real-time</span>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-white opacity-10 rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-white opacity-10 rounded-full"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white opacity-5 rounded-full"></div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <img 
                src={logo} 
                alt="Motor Sights International" 
                className="h-16 w-auto mx-auto mb-4"
              />
              <h1 className="text-2xl font-bold text-gray-900">Motor Sights International</h1>
              <p className="text-sm text-gray-600">Task Management System</p>
            </div>

            <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
              <Outlet />
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                © {new Date().getFullYear()} Motor Sights International. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
