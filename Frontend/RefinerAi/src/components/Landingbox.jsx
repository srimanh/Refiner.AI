import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Paranthesis_small from '../assets/Paranthesis_small.svg';
import Paranthesis_big from '../assets/Paranthesis_big.svg';
import Fragment from '../assets/Fragment.svg';
import { motion } from 'framer-motion';

function Landingbox() {
    const navigate = useNavigate();
    const [text, setText] = useState("");
    const fullText = "Your Refining Intelligence, One Code At a Time";
    const [textIndex, setTextIndex] = useState(0);

    useEffect(() => {
        if (textIndex < fullText.length) {
            const timeout = setTimeout(() => {
                setText(prevText => prevText + fullText[textIndex]);
                setTextIndex(prevText => prevText + 1);
            }, 40);  // Adjust typing speed here
            
            return () => clearTimeout(timeout);
        }
    }, [textIndex]);

    const checkLoggedIn = () => {
        const isLoggedIn = !!localStorage.getItem('accessToken'); 
        if (isLoggedIn) {
            navigate('/dashboard');
            console.log("Logged in");
        } else {
            navigate('/auth'); 
        }
    };

    return (
        <div className="flex justify-center items-center h-screen relative overflow-hidden">
            <motion.img 
                className="absolute left-0 ml-[10px] top-[10%]" 
                src={Paranthesis_small} 
                alt=""
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            />
            
            <motion.div 
                className="flex justify-center items-center mb-[150px]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                <div className="px-[120px] bg-gradient-to-b from-[#000000] space-y-4 py-[50px] to-[#350957] p-4">
                    <h2 className="text-white text-[2.5rem] w-[650px] font-semibold word-wider text-center relative">
                        {text}
                        <motion.span 
                            className="absolute inline-block h-8 w-1 bg-white"
                            animate={{ opacity: [1, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            style={{ marginLeft: '4px' }}
                        />
                        <br />
                    </h2>
                    
                    <motion.p 
                        className="text-[#ffffffc2] font-extralight text-[1.1rem] word-wider text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.2, delay: 2.5 }}
                    >
                        Reiner AI is a cutting-edge platform designed to enhance <br />
                        and optimize code through artificial intelligence. <br />
                        Perfect for developers and teams looking to <br />
                        streamline their coding process.
                    </motion.p>
                    
                    <motion.div 
                        className="flex mt-[30px] justify-center space-x-[20px]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 3 }}
                    >
                        <motion.button 
                            className="border-[0.5px] font-extralight text-[1rem] text-white p-[3px] px-3 rounded-3xl border-white"
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Get a Demo
                        </motion.button>
                        
                        <motion.button 
                            onClick={checkLoggedIn} 
                            className="bg-white font-extralight text-[1rem] text-black p-[3px] px-3 rounded-3xl"
                            whileHover={{ scale: 1.05, boxShadow: "0px 0px 8px rgba(255, 255, 255, 0.5)" }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Start Refining
                        </motion.button>
                    </motion.div>
                    
                    <motion.div 
                        className="flex justify-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 3.3 }}
                    >
                        <motion.img 
                            src={Fragment} 
                            alt=""
                            animate={{ rotate: [0, 5, 0, -5, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </motion.div>
                </div>
            </motion.div>
            
            <motion.img 
                className="absolute right-0 bottom-[10%]" 
                src={Paranthesis_big} 
                alt=""
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            />
        </div>
    );
}

export default Landingbox;