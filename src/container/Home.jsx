import React, { useState } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { Projects, SignUp } from '../container';
import { motion } from 'framer-motion';
import { HiChevronDoubleLeft } from "react-icons/hi2"

const Home = () => {
    const [user, setUser] = useState(null);
    const location = useLocation();
    const isAuthPage = location.pathname === "/home/auth";
    const isProjectsPage = location.pathname === "/home/projects" || location.pathname === "/home";

    return (
        <div className='w-full min-h-screen max-h-screen'>
            <div className={`w-full min-h-screen max-h-screen overflow-y-scroll h-full flex flex-col items-start justify-start ${isProjectsPage ? 'px-8' : 'px-4'} md:px-12 py-4 md:py-12`}>
                {!isAuthPage && (
                    <div className='w-full flex items-center justify-between gap-3 mb-8'>
                        {/* Removed Sign Up button */}
                        {user && <div></div>}
                    </div>
                )}
                
                {/*bottom section */}
                <div className='w-full'>
                    <Routes>
                        <Route path="/*" element={<Projects />} />
                        <Route path="/auth" element={<SignUp />} />
                    </Routes>
                </div>
            </div>
        </div>
    )
}

export default Home
