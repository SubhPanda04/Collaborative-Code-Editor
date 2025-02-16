import React, { useState } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa6'
import { motion } from 'framer-motion'

const UserAuthInput = ({label,placeHolder,isPass,setStateFunction,Icon,setGetEmailValidationStatus}) => {
    const[value,setValue] = useState("");
    const[showPass,setShowPass] = useState(false);
    const [isEmailValid, setIsEmailValid] = useState(false);

    const handleTextChange = (e) => {
        setValue(e.target.value)
        setStateFunction(e.target.value)

        if(placeHolder === "Email"){
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const status = emailRegex.test(value)
            setIsEmailValid(status)
            setGetEmailValidationStatus(status);
        }
    };

  return (
    <div className='w-full flex flex-col items-start justify-start gap-2'>
      <label className='text-sm text-gray-300'>{label}</label>
      <div className={`w-full px-4 py-3 rounded-lg flex items-center justify-center gap-3 bg-gray-200 ${
        !isEmailValid && placeHolder === "Email" && value.length > 0 && "border-2 border-red-500"
      }`}>
        <Icon className='text-text555 text-2xl'/>
        <input 
          type={isPass && !showPass ? "password" : "text"}
          placeholder={placeHolder}
          className='flex-1 w-full h-full py-1 outline-none border-none bg-transparent text-text555 text-lg'
          value={value}
          onChange={handleTextChange}
        />
        {isPass && (
          <motion.div 
            onClick={() => setShowPass(!showPass)} 
            whileTap={{scale: 0.9}} 
            className='cursor-pointer'
          >
            {showPass ? (
              <FaEyeSlash className='text-text555 text-2xl' />
            ) : (
              <FaEye className='text-text555 text-2xl' />
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default UserAuthInput
