import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Left_Fragement from "../assets/Left_Fragement.svg";
import Right_Fragment from '../assets/Right_Fragment.svg';
import Wrench from '../assets/Wrench.svg';
import SourceCode from '../assets/SourceCode.svg';
import ChatGPT from '../assets/ChatGPT.svg';
import Rocket from '../assets/Rocket.svg';

function LandingInfos() {
  // Fade-in and slide-up animation for cards
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom) => ({
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.7, 
        delay: custom * 0.2,
        ease: "easeOut"
      }
    })
  };

  // Floating animation for icons
  const iconVariants = {
    float: {
      y: [-5, 5, -5],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Rotation animation for fragments
  const fragmentVariants = {
    rotate: (custom) => ({
      rotate: custom ? [0, 3, 0, -3, 0] : [0, -3, 0, 3, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    })
  };

  return (
    <div className='relative bottom-[120px] right-[20px] min-h-screen min-w-screen bg-gradient-to-b from-[#000000] to-[#370f578d] overflow-hidden'>
      <motion.h1 
        className='text-white text-center text-[1.7rem] font-semibold'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        With RefinerAI, you can
      </motion.h1>
      
      <motion.img 
        className='-ml-[20px] relative bottom-[70px]' 
        src={Left_Fragement} 
        alt=""
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        variants={fragmentVariants}
        custom={false}
      />
      
      <div className='flex justify-center items-center relative bottom-[260px]'>
        <div className='space-y-[100px]'>
          <motion.div 
            className='bg-[#53A1FF] text-[1.5rem] font-semibold p-[50px] rounded-3xl'
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={1}
            whileHover={{ scale: 1.03, boxShadow: "0px 0px 15px rgba(83, 161, 255, 0.5)" }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.img 
              className='relative bottom-[20px]' 
              src={Wrench} 
              alt=""
              variants={iconVariants}
              animate="float"
            />
            <h1 className='text-white mt-[10px]'>Optimize Code, <br /> Elevate Efficiency</h1>
          </motion.div>

          <motion.div 
            className='bg-[#802FFF] text-[1.5rem] font-semibold p-[50px] rounded-3xl'
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={3}
            whileHover={{ scale: 1.03, boxShadow: "0px 0px 15px rgba(128, 47, 255, 0.5)" }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.img 
              className='relative bottom-[20px]' 
              src={SourceCode} 
              alt=""
              variants={iconVariants}
              animate="float"
            />
            <h1 className='text-white mt-[10px]'>Code Smarter, <br /> Achieve More</h1>
          </motion.div>
        </div>
        
        <div className='space-y-[100px] ml-[120px] mt-[150px]'>
          <motion.div 
            className='bg-[#802FFF] text-[1.5rem] font-semibold p-[50px] rounded-3xl'
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={2}
            whileHover={{ scale: 1.03, boxShadow: "0px 0px 15px rgba(128, 47, 255, 0.5)" }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.img 
              className='relative bottom-[20px]' 
              src={ChatGPT} 
              alt=""
              variants={iconVariants}
              animate="float"
            />
            <h1 className='text-white mt-[10px]'>AI-Driven Code <br /> Perfection</h1>
          </motion.div>

          <motion.div 
            className='bg-[#53A1FF] text-[1.5rem] font-semibold p-[50px] px-[60px] rounded-3xl'
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={4}
            whileHover={{ scale: 1.03, boxShadow: "0px 0px 15px rgba(83, 161, 255, 0.5)" }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.img 
              className='relative bottom-[20px]' 
              src={Rocket} 
              alt=""
              variants={iconVariants}
              animate="float"
            />
            <h1 className='text-white mt-[10px]'>Boost Code, <br /> Beat Deadlines</h1>
          </motion.div>
        </div>
      </div>
      
      <motion.img 
        className='absolute -right-[70px] bottom-[120px]' 
        src={Right_Fragment} 
        alt=""
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, delay: 0.7 }}
        variants={fragmentVariants}
        custom={true}
        
      />
    </div>
  );
}

export default LandingInfos;