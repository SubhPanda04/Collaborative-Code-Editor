import React, { useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom';
import {Projects, SignUp} from '../container';
import { motion } from 'framer-motion';

const Home = () => {
    const [user,setUser] = useState(null);
  return (
    <>
    <div className='text-white'>
      Home Page 
    </div>
    <div>
        {/* Profile section */}
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
    </>
    
  )
}

export default Home
