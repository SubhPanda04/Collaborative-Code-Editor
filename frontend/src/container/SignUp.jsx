import React, { useState, useEffect } from 'react'
import { UserAuthInput } from '../components'
import { FaEnvelope } from 'react-icons/fa6'
import { FcGoogle } from 'react-icons/fc'
import { MdPassword } from 'react-icons/md'
import { AnimatePresence, motion } from 'framer-motion'
import { FaGithub } from 'react-icons/fa'
import { signINWithGitHub, signINWithGoogle } from '../utils/helpers'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '../config/firebase.config'
import { fadeInOut } from '../animations'
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [getEmailValidationStatus, setGetEmailValidationStatus] = useState(false);
    const [isLogin, setisLogin] = useState(false)
    const [alert, setAlert] = useState(false)
    const [alertMsg, setAlertMsg] = useState("")
    const navigate = useNavigate();

    useEffect(() => {
        // Clear any existing auth state
        localStorage.clear();
        return () => {
            setEmail("");
            setPassword("");
            setAlert(false);
            setAlertMsg("");
        };
    }, []);

    const createNewUser = async () => {
        if (getEmailValidationStatus) {
            try {
                const userCred = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCred.user;

                const userData = {
                    uid: user.uid,
                    email: user.email,
                    createdAt: new Date().toISOString(),
                };

                await setDoc(doc(db, "users", user.uid), userData);
                localStorage.setItem('userName', user.email.split('@')[0]);
                navigate('/home/projects');
            } catch (err) {
                console.log("Error:", err);
                setAlert(true);
                setAlertMsg("Error creating account. Please try again.");
            }
        }
    };

    const loginWithEmailPassword = async () => {
        if (getEmailValidationStatus) {
            try {
                const userCred = await signInWithEmailAndPassword(auth, email, password);
                if (userCred) {
                    localStorage.setItem('userName', userCred.user.email.split('@')[0]);
                    navigate('/home/projects');
                }
            } catch (err) {
                console.log("Login error ", err.code);
                setAlert(true);
                setAlertMsg(err.code === "auth/invalid-credential"
                    ? "Invalid email or password. Please try again."
                    : "Error logging in. Please try again.");
            }
        }
    };
  return (
    <div className='w-full h-screen flex flex-col items-center justify-start pt-20 bg-[#051630]'>
      <div className='w-full flex flex-col items-center justify-center'>
        <p className='text-2xl text-primaryText mb-6'>Join with Us!</p>

        <div className='px-8 w-full md:w-auto py-4 rounded-xl bg-secondary
        shadow-md flex flex-col items-center justify-center gap-6'>
            {/*email */}
            <UserAuthInput 
                label="Email" 
                placeHolder="Email" 
                isPass={false} 
                key="Email" 
                setStateFunction={setEmail} 
                Icon={FaEnvelope} 
                setGetEmailValidationStatus={setGetEmailValidationStatus} 
            />

            {/*password */}
            <UserAuthInput 
                label="Password" 
                placeHolder="Password" 
                isPass={true} 
                key="Password" 
                setStateFunction={setPassword} 
                Icon={MdPassword}
            />

            {/*alert */}

            <AnimatePresence>
                {alert && (
                    <motion.p 
                        key={"AlertMessage"} 
                        {...fadeInOut} 
                        className='text-red-500'>
                        {alertMsg} 
                    </motion.p>
                )}
            </AnimatePresence>

            {/* login button */}
            {!isLogin ? (
                <motion.div 
                onClick={createNewUser}
                whileTap= {{scale : 0.9}} 
                    className='flex items-center justify-center w-full py-3 
                    rounded-xl hover:bg-emerald-400 cursor-pointer bg-emerald-500'>
                        <p className='text-xl text-white'>Sign Up</p>
                    </motion.div>) : (
                        <motion.div 
                        onClick={loginWithEmailPassword}
                        whileTap= {{scale : 0.9}} 
                        className='flex items-center justify-center w-full py-3 
                        rounded-xl hover:bg-emerald-400 cursor-pointer bg-emerald-500'>
                            <p className='text-xl text-white'>Login</p>
                        </motion.div>
            )}

            {/*account text section*/}

            {!isLogin ? (<p className='text-sm text-primaryText flex items-center justify-center gap-3'>Already Have an account !{" "} 
                <span onClick={() => setisLogin(!isLogin)} className='text-emerald-500 cursor-pointer'>Login Here</span></p>
            ) : (
                <p className='text-sm text-primaryText flex items-center justify-center gap-3'>Don't Have an account !{" "} 
                <span onClick={() => setisLogin(!isLogin)} className='text-emerald-500 cursor-pointer'>Create Here</span></p>

            )}
            

            {/* or section */}

            <div className='flex items-center justify-center gap-12'>
                <div className='h-[1px] bg-[rgba(256,256,256,0.2)] rounded-md w-24'></div>
                <p className="text-sm text-[rgba(256,256,256,0.2)]">OR</p>
                <div className='h-[1px] bg-[rgba(256,256,256,0.2)] rounded-md w-24'></div>
            </div>

            {/* sign in with google */}
            <motion.div
            onClick={signINWithGoogle}
            className='flex items-center justify-center gap-3 bg-[rgba(256,256,256,0.2)]
             backdrop-blur-md w-full py-3 rounded-xl hover:bg-[rgba(256,256,256,0.4)]
             cursor-pointer'
            whileTap={{scale : 0.9}}>
                <FcGoogle className='text-3xl'/>
                <p className='text-xl text-white'>Sign in with Google</p>
            </motion.div>

            {/* or section */}

            


            {/* sign in with github */}

            {/*<motion.div 
            onClick={signINWithGitHub}
            className='flex items-center justify-center gap-3 bg-[rgba(256,256,256,0.2)]
             backdrop-blur-md w-full py-3 rounded-xl hover:bg-[rgba(256,256,256,0.4)]
             cursor-pointer'
            whileTap={{scale : 0.9}}>
                <FaGithub className='text-white'/>
                <p className='text-xl text-white'>Sign in with GitHub</p>
            </motion.div>*/}
        </div>
      </div>
    </div>
  )
}

export default SignUp
