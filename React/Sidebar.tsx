import React, { useState } from 'react';
import Tiptap from './React/Tiptap';
import Etusivu from './React/Etusivu';
import type { FormProps } from './React/Etusivu';
const Sidebar = () => {
  const handleFormSubmit = (data: { title: string; description: string }) => {
    //console.log('Form submitted:', data);
    // You can handle the data here, e.g., send to an API or update state
  };
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex min-h-screen">
      {/* Fixed Sidebar */}
      <div
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-0 bg-gray-800 bg-opacity-75 z-50 md:translate-x-0 md:flex md:w-64 md:fixed md:left-0 md:top-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="flex flex-col w-64 p-4 text-white">
          <h2 className="text-2xl font-bold mb-6"></h2>
          <ul>
            <li className="mb-4 hover:bg-gray-700 p-2 rounded-md">
              <a href="#">Tervetuloa</a>
            </li>
            <li className="mb-4 hover:bg-gray-700 p-2 rounded-md">
              <a href="#">Henkilökunta</a>
            </li>
            <li className="mb-4 hover:bg-gray-700 p-2 rounded-md">
              <a href="#">Option 3</a>
            </li>
            <li className="mb-4 hover:bg-gray-700 p-2 rounded-md">
              <a href="#">Option 4</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Hamburger Button for Mobile */}
      <button
        onClick={toggleSidebar}
        className="md:hidden p-4 text-gray-800 fixed top-4 left-4 z-50"
      >
        <svg
          className="w-6 h-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Main Content Area */}
      <div className="flex ">
        <Tiptap />
        <Etusivu onSubmit={handleFormSubmit} />
      </div>
    </div>
  );
};

export default Sidebar;