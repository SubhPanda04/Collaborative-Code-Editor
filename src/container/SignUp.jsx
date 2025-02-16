import React, { useState } from 'react'
import { UserAuthInput } from '../components'
import { FaEnvelope } from 'react-icons/fa6'
import { FcGoogle } from 'react-icons/fc'
import { MdPassword } from 'react-icons/md'
import { AnimatePresence, motion } from 'framer-motion'
import { FaGithub } from 'react-icons/fa'
import { signINWithGitHub, signINWithGoogle } from '../utils/helpers'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth,db } from '../config/firebase.config'
import { fadeInOut } from '../animations'
import { doc, setDoc } from "firebase/firestore";

const SignUp = () => {
    const [email,setEmail] = useState("")
    const [password,setPassword] = useState("")
    const [getEmailValidationStatus, setGetEmailValidationStatus] = useState(false);
    const [isLogin, setisLogin] = useState(false)
    const [alert , setAlert] = useState(false)
    const [alertMsg, setAlertMsg] = useState("")

    // const createNewUser = async() => {
    //     if(getEmailValidationStatus){
    //         await createUserWithEmailAndPassword(auth,email,password).then
    //         (userCred => {
    //             console.log(userCred)
    //         }).catch(err => console.log(err)) 
    //     }
    // }

    const createNewUser = async () => {
        if (getEmailValidationStatus) {
            try {
                // Create user in Firebase Authentication
                const userCred = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCred.user;
    
                // User data to store in Firestore
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    createdAt: new Date().toISOString(),
                };
    
                // Save user data in Firestore under "users" collection
                await setDoc(doc(db, "users", user.uid), userData);
    
                console.log("User created and data stored in Firestore:", userData);
            } catch (err) {
                console.log("Error:", err);
            }
        }
    };

    const loginWithEmailPassword = async() => {
        if(getEmailValidationStatus){
            await signInWithEmailAndPassword(auth, email, password)
            .then((userCred)=> {
                if(userCred) {
                    console.log(userCred);
                }
            })
            .catch((err) => {
                  console.log("Login error ",err.code)
                // console.log(err.message,err.code);
                // if(err.message.includes("invalid-credential")){
                //     setAlert(true)
                //     setAlertMsg("Invalid Id : User Not Found")
                // } 
                // else if(err.message.includes("wrong-password")){
                //     setAlert(true)
                //     setAlertMsg("Password Mismatch")
                // }
                // else{
                //     setAlert(true)
                //     setAlertMsg("Temporarily disabled due to many logins")
                // }

                if (err.code === "auth/invalid-credential") {
                    setAlert(true)
                    setAlertMsg("Invalid email or password. Please try again.");
                }  else if (err.code === "auth/too-many-requests") {
                    setAlert(true)
                    setAlertMsg("Too many login attempts. Try again later.");
                } else {
                    setAlert(true)
                    setAlertMsg("An error occurred. Please try again.");
                }

                setInterval(() => {
                    setAlert(false);
                },7000);
            });
        }
    };
  return (
    <div className='w-full h-full flex flex-col items-center justify-start py-10'>
      <div className='w-full flex flex-col items-center justify-center gap-8'>
        <p className='text-3xl text-white font-bold'>Welcome to Code-Editor</p>
        <p className='text-2xl text-primaryText'>Join with Us!</p>

        <div className='w-full md:w-auto px-8 py-6 rounded-xl bg-secondary shadow-md flex flex-col items-center justify-center gap-8'>
          {/* Email Input */}
          <UserAuthInput 
            label="Email" 
            placeHolder="Email" 
            isPass={false} 
            key="Email" 
            setStateFunction={setEmail} 
            Icon={FaEnvelope} 
            setGetEmailValidationStatus={setGetEmailValidationStatus} 
          />

          {/* Password Input */}
          <UserAuthInput 
            label="Password" 
            placeHolder="Password" 
            isPass={true} 
            key="Password" 
            setStateFunction={setPassword} 
            Icon={MdPassword}
          />

          {/* Alert Message */}
          <AnimatePresence>
            {alert && (
              <motion.p key={"AlertMessage"} {...fadeInOut} className='text-red-500'>
                {alertMsg}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Action Button */}
          <motion.div 
            onClick={!isLogin ? createNewUser : loginWithEmailPassword}
            whileTap={{scale: 0.9}} 
            className='w-full px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 cursor-pointer text-center'
          >
            <p className='text-xl text-white'>{!isLogin ? "Sign Up" : "Login"}</p>
          </motion.div>

          {/* Toggle Login/Signup */}
          <p className='text-sm text-primaryText flex items-center justify-center gap-3'>
            {!isLogin ? "Already have an account? " : "Don't have an account? "}
            <span 
              onClick={() => setisLogin(!isLogin)} 
              className='text-emerald-500 cursor-pointer hover:text-emerald-600'
            >
              {!isLogin ? "Login Here" : "Create Here"}
            </span>
          </p>

          {/* Divider */}
          <div className='flex items-center justify-center gap-12'>
            <div className='h-[1px] bg-[rgba(256,256,256,0.2)] rounded-md w-24'></div>
            <p className="text-sm text-[rgba(256,256,256,0.2)]">OR</p>
            <div className='h-[1px] bg-[rgba(256,256,256,0.2)] rounded-md w-24'></div>
          </div>

          {/* Social Auth Buttons */}
          <div className='flex flex-col gap-4 w-full'>
            <motion.div
              onClick={signINWithGoogle}
              className='flex items-center justify-center gap-3 bg-[rgba(256,256,256,0.2)] backdrop-blur-md w-full py-3 rounded-xl hover:bg-[rgba(256,256,256,0.4)] cursor-pointer'
              whileTap={{scale: 0.9}}
            >
              <FcGoogle className='text-3xl'/>
              <p className='text-xl text-white'>Sign in with Google</p>
            </motion.div>

            <motion.div 
              onClick={signINWithGitHub}
              className='flex items-center justify-center gap-3 bg-[rgba(256,256,256,0.2)] backdrop-blur-md w-full py-3 rounded-xl hover:bg-[rgba(256,256,256,0.4)] cursor-pointer'
              whileTap={{scale: 0.9}}
            >
              <FaGithub className='text-3xl text-white'/>
              <p className='text-xl text-white'>Sign in with GitHub</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUp
