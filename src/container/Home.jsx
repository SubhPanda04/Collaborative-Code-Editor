import React, { useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom';
import { FaSearchengin } from 'react-icons/fa6';
import {Projects, SignUp} from '../container';
import { motion } from 'framer-motion';
import { HiChevronDoubleLeft } from "react-icons/hi2"


const Home = () => {
    const [isSideMenu, setIsSideMenu] = useState(false)
    const [user,setUser] = useState(null);
  return (
    <>
    <div className= {`w-2 ${
        isSideMenu ? "w-2" : "flex-[.2] xl:flex-[.2]"
    }  min-h-screen max-h-screen relative bg-secondary px-3 py-6 flex flex-col
    items-center justify-start gap-4 transition-all duration-200 ease-in-out` }
    >

    {/* anchor */}
    <motion.div whileTap={{scale : 0.9}} onClick={() => setIsSideMenu(!isSideMenu)} className='w-8 h-8 bg-secondary rounded-tr-lg rounded-br-lg
    absolute -right-6 flex items-center justify-center cursor-pointer'>
        <HiChevronDoubleLeft className='text-white text-xl' />

    </motion.div> 

    <div className='overflow-hidden w-full flex flex-col gap-4'>
        {/*logo */}
        {/*start coding */}
        
        {/* Home Nav*/}
        
    </div> 
      
    </div>
    <div className='flex-1 min-h-screen max-h-screen overflow-y-scroll
    h-full flex flex-col items-start justify-start px-4 md:px-12 py-4 md:py-12'>
        {/*top section */}
        
        <div className='w-full flex items-center justify-between gap-3'>
            {/*search */}
            <div className='bg-secondary w-full px-4 py-3 rounded-md flex items-center justify-center gap-3'>
                <FaSearchengin className='text-2xl text-primaryText'/>
                <input type='text' className='flex-1 px-4 py-1 text-xl bg-transparent
                outline-none border-none text-primaryText placeholder:text-gray-600' 
                placeholder='Search here...'/>
            </div>
            {/* profile section */} 
        {!user && (
            <motion.div 
                whileTap={{scale: 0.9}}
                className="flex items-center justtify-center gap-3"
            >
                <Link
                to={"/home/auth"}
                className='bg-emerald-500 px-6 py-2 rounded-md text-white 
                text-lg cursor-pointer hover:bg-emerald-700'
                >
                    SignUp 
                </Link>

            </motion.div>
            
        )}

        {user && <div></div>}
    </div>

    
    {/*bottom section */}
    <div className='w-full'>
        <Routes>
            <Route path="/*" element={<Projects />} />
            <Route path="/auth" element={<SignUp />} />
        </Routes>
    </div>
    </div>
    </>
    
  )
}

export default Home
