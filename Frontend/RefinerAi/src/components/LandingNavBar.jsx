import React from 'react'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom'
import Logo from '../assets/Logo.svg'
import { useUser } from '../context/userContext.jsx';  

function LandingNavBar({userData}) {
    const { setUser } = useUser(); 
    const navigate = useNavigate()
  return (
    <nav className='flex'>
        <Link className='flex items-center' onClick={()=>{console.log("clicked")}}>
            <img className='h-12' src={Logo} alt="" />
            <h1 className='text-white text-[1.5rem] font-bold'>Refiner Ai</h1>
        </Link>
        <ul className='text-[#ffffffc2] font-extralight space-x-[50px] text-[1.1rem] ml-[60px] flex items-center'>
            <Link>
                Product
            </Link>
            <Link>
                About
            </Link>
            <Link>
                Help
            </Link>
            <Link>
                Support
            </Link>
            <Link>
                APIs
            </Link>
        </ul>
        <ul className="text-[#ffffffc2] items-center font-extralight text-[1.1rem] space-x-4 mr-4 flex ml-auto">
            <Link>
                Contact
            </Link>{    
            localStorage.getItem("accessToken") ? 
            <button className='bg-white rounded-3xl text-black py-[10px] px-[20px] text-[1rem]' onClick={() => { 
        
                localStorage.removeItem("accessToken"); 
                navigate('/auth')
                setUser(null);  // Clear user data in context
              }}>
                Logout
          </button> : 
                      <Link to='/auth' className='bg-white rounded-3xl text-black py-[10px] px-[20px] text-[1rem]'>
                      Log in
                  </Link>
            }
        </ul>
    </nav>
  )
}

export default LandingNavBar