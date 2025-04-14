"use client"
import AlphabetGrid from '@/components/AlphabetGrid'
import Analytics from '@/components/Analytics'
import Terminal from '@/components/Terminal'
import React from 'react'

function page() {

  return (
    <div className='p-8 h-screen  bg-black'>
     <div className='w-2/3 flex flex-col mx-auto h-full'>
     <h1 className=' text-3xl font-semibold py-4 text-white flex-1 text-center'>Typo Gym</h1>
        <Analytics></Analytics>
        <AlphabetGrid></AlphabetGrid>
        <Terminal></Terminal>
     </div>

    </div>
  )
}

export default page