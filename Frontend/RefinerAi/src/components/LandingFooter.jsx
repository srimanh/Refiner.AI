import React from 'react'
import { Link } from 'react-router-dom'

function LandingFooter() {
  return (
    <div className='flex justify-around relative bottom-[60px]'>
        <div className='text-white'>
            <h1 className='text-[1.5rem] text-[#ffffffc2]'>Site Links</h1>
            <ul className=' flex flex-col'>
                <Link>About us</Link>
                <Link>Help</Link>
                <Link>Support</Link>
            </ul>
        </div>
        <div className='text-white'>
            <h1 className='text-[1.5rem] text-[#ffffffc2]'>APIs</h1>
            <ul className=' flex flex-col'>
                <Link>Github API</Link>
                <Link>Gemini API</Link>
            </ul>
        </div>
        <div className='text-white'>
            <h1 className='text-[1.5rem] text-[#ffffffc2]'>Contact Developer</h1>
            <ul className=' flex flex-col'>
                <Link>abrahamjeron40@gmail.com</Link>
                <Link>Linked in</Link>
                <Link>Instagram</Link>
            </ul>
        </div>
    </div>
  )
}

export default LandingFooter