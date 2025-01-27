import React, { useState } from 'react'
import { UserAuthInput } from '../components'
import { FaEnvelope } from 'react-icons/fa6'
import { FcGoogle } from 'react-icons/fc'
import { MdPassword } from 'react-icons/md'
import { motion } from 'framer-motion'
import { FaGithub } from 'react-icons/fa'
import { signINWithGoogle } from '../utils/helpers'

const SignUp = () => {
    const [email,setEmail] = useState("")
    const [password,setPassword] = useState("")
    const [getEmailValidationStatus, setGetEmailValidationStatus] = useState(false);
    const [isLogin, setisLogin] = useState(false)
  return (
    <div className='w-full py-6'>
      <div className='text-white'>Code-Editor Signup page</div>

      <div className="w-full flex flex-col items-center justify-center py-8">
        <p className='py-12 text-2xl text-primaryText'>Join with Us!</p>

        <div className='px-8 w-full md:w-auto py-4 rounded-xl bg-secondary
        shadow-md flex flex-col items-center justify-center gap-8'>
            {/*email */}
            <UserAuthInput label="Email" placeHolder="Email" isPass={false} key="Email" setStateFunction={setEmail} Icon={FaEnvelope} setGetEmailValidationStatus= {setGetEmailValidationStatus} />

            {/*password */}
            <UserAuthInput label="Password" placeHolder="Password" isPass={true} key="Password" setStateFunction={setPassword} Icon={MdPassword}/>

            {/*alert */}

            {/* login button */}
            {!isLogin ? (<motion.div whileTap= {{scale : 0.9}} 
            className='flex items-center justify-center w-full py-3 
            rounded-xl hover:bg-emerald-400 cursor-pointer bg-emerald-500'>
                <p className='text-xl text-white'>Sign Up</p>
            </motion.div>) : (
                <motion.div whileTap= {{scale : 0.9}} 
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

            <div className='flex items-center justify-center gap-12'>
                <div className='h-[1px] bg-[rgba(256,256,256,0.2)] rounded-md w-24'></div>
                <p className="text-sm text-[rgba(256,256,256,0.2)]">OR</p>
                <div className='h-[1px] bg-[rgba(256,256,256,0.2)] rounded-md w-24'></div>
            </div>


            {/* sign in with github */}

            <motion.div
            className='flex items-center justify-center gap-3 bg-[rgba(256,256,256,0.2)]
             backdrop-blur-md w-full py-3 rounded-xl hover:bg-[rgba(256,256,256,0.4)]
             cursor-pointer'
            whileTap={{scale : 0.9}}>
                <FaGithub className='text-white'/>
                <p className='text-xl text-white'>Sign in with GitHub</p>
            </motion.div>
        </div>
      </div>
    </div>
  )
}

export default SignUp
