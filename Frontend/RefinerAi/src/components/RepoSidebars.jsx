import React, { useState } from 'react';
import Menu from '../assets/Menu.svg';
import Recent from '../assets/Recent.svg';
import Builds from '../assets/Builds.svg';
import CodeExplainer from '../assets/CodeExplainer.svg';
import About from '../assets/About.svg';
import Help from '../assets/Help.svg';
import Support from '../assets/Support.svg';
import APIs from '../assets/APIs.svg';
import Settings from '../assets/Settings.svg';
import Logout from '../assets/Logout.svg';

function RepoSidebars() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`h-screen overflow-y-scroll bg-[#0000] transition-all duration-300 ${
        isCollapsed ? 'w-[80px]' : 'w-[400px]'
      }`}
    >
      <div className="m-[10px] h-[100vh] overflow-y-scroll">
        {/* Menu Toggle Button */}
        <button
          className="flex items-center p-3 hover:bg-[#ffffff10] rounded-lg transition-all duration-300 w-full"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <img src={Menu} alt="Menu" className="w-6 h-6 transition-transform duration-200 hover:scale-110" />
          <p
            className={`text-[1.2rem] text-white ml-3 transition-opacity duration-300 ${
              isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
            }`}
          >
            Menu
          </p>
        </button>



        {/* Sidebar Navigation */}
        <div className="text-white space-y-5 mt-10">
          {[
            { icon: Recent, label: 'Recently Refined' },
            { icon: Builds, label: 'Builds' },
            { icon: CodeExplainer, label: 'Code Explainer' },
          ].map((item, index) => (
            <button
              key={index}
              className="flex items-center p-3 hover:bg-[#ffffff10] rounded-lg transition-all duration-300 w-full"
            >
              <img src={item.icon} alt={item.label} className="w-6 h-6 transition-transform duration-200 hover:scale-110" />
              <p
                className={`text-[1.2rem] ml-3 transition-opacity duration-300 ${
                  isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                }`}
              >
                {item.label}
              </p>
            </button>
          ))}
        </div>

        <hr className="border-t border-[#ffffffb8] mt-8 w-full" />

        {/* More Navigation */}
        <div className="text-white space-y-5 mt-10">
          {[
            { icon: About, label: 'About' },
            { icon: Help, label: 'Help' },
            { icon: Support, label: 'Support' },
            { icon: APIs, label: 'APIs' },
          ].map((item, index) => (
            <button
              key={index}
              className="flex items-center p-3 hover:bg-[#ffffff10] rounded-lg transition-all duration-300 w-full"
            >
              <img src={item.icon} alt={item.label} className="w-6 h-6 transition-transform duration-200 hover:scale-110" />
              <p
                className={`text-[1.2rem] ml-3 transition-opacity duration-300 ${
                  isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                }`}
              >
                {item.label}
              </p>
            </button>
          ))}
        </div>

        <hr className="border-t border-[#ffffffb8] mt-8 w-full" />

        {/* Settings & Logout */}
        <div className="text-white space-y-5 mt-10">
          {[
            { icon: Settings, label: 'Settings' },
            { icon: Logout, label: 'Logout' },
          ].map((item, index) => (
            <button
              key={index}
              className="flex items-center p-3 hover:bg-[#ff4d4d10] rounded-lg transition-all duration-300 hover:text-[#ff4d4d] w-full"
            >
              <img src={item.icon} alt={item.label} className="w-6 h-6 transition-transform duration-200 hover:scale-110" />
              <p
                className={`text-[1.2rem] ml-3 transition-opacity duration-300 ${
                  isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                }`}
              >
                {item.label}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RepoSidebars;
