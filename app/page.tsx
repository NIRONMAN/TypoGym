"use client"
import Terminal from '@/components/Terminal'
import React, { useEffect, useRef, useState } from 'react'

function page() {



  return (
    <div className='p-8 h-screen flex-col flex justify-between items-center bg-black '>
      <h1 className=' text-3xl font-semibold py-4 text-white'>Typo Gym</h1>
      <Terminal></Terminal>

    </div>
  )
}

export default page