import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Logo from '../assets/Logo.svg';
import DropDown from '../assets/DropDown.svg';
import { useUser } from '../context/userContext.jsx';  

function Header() {
    const { user } = useUser();  // Correctly extract user from context
    const navigate = useNavigate();

    return (
        <nav className='flex flex-col border-2'>
            <div className="flex w-full items-center">
                <Link to='/' className='flex items-center ml-3' onClick={() => { console.log("clicked") }}>
                    <img className='h-12' src={Logo} alt="Refiner AI Logo" />
                    <h1 className='text-white text-[1.5rem] font-bold'>Refiner AI</h1>
                </Link>

                <ul className="text-[#ffffffc2] items-center font-extralight text-[1.1rem] space-x-4 mr-4 flex ml-auto">
                <div className='mr-[50px] p-[20px] border-x  border-[#ffffffb8]'>

                        <button className='flex items-center'>
                            New
                            <img className='px-2' src={DropDown} alt="Dropdown Icon" />
                        </button>
                    </div>

                    {user && (
                        <button className='text-white'>
                            <div className='flex space-x-3 items-center'>                   
                                <img className='h-8 w-8 rounded-full' src={user.avatar_url} alt="User Avatar" />
                                <p className='text-[#ffffffc2] text-[1.1rem]'>{user.login}</p>
                                <img className='px-2' src={DropDown} alt="Dropdown Icon" />
                            </div>
                        </button> 
                    )}
                </ul>
            </div>

            {/* Horizontal Line Under UL */}
            <hr className="border-t border-[#ffffffb8] w-full" />
        </nav>
    );
}

export default Header;
