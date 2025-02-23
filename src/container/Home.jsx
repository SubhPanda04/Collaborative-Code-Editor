import React from 'react'
import { Route, Routes, Navigate } from 'react-router-dom';
import { Projects, SignUp } from '../container';
import { ProtectedRoute } from '../components';

const Home = () => {
    return (
        <div className='w-full min-h-screen flex flex-col items-center justify-start'>
            <div className='w-full h-full flex flex-col items-start justify-start'>
                <div className='w-full h-full'>
                    <Routes>
                        <Route path="/auth" element={<SignUp />} />
                        <Route 
                            path="/projects" 
                            element={
                                <ProtectedRoute>
                                    <Projects />
                                </ProtectedRoute>
                            } 
                        />
                        <Route path="/" element={<Navigate to="/auth" />} />
                        <Route path="*" element={<Navigate to="/auth" />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

export default Home;
