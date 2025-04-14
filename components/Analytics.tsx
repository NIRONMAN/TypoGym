import { useTypingSession } from '@/store'
import React from 'react'

function Analytics() {
    const currentLetter=useTypingSession((state)=>state.currentLetter);
    const currentLetterIndex=useTypingSession((state)=>state.currentLetterIndex)
    const currentSessionString=useTypingSession((state)=>state.currentSessionString)
   
  return (
    <div>
        <div>Current Key: {currentLetter?currentLetter.toUpperCase():"None Selected"}</div>
        <div className=' h-5 border bg-gray-500 rounded-full'>
            <div style={{width:`${Math.floor((currentLetterIndex/currentSessionString.length)*100)}%`}} className={`bg-gradient-to-r from-indigo-400 to-emerald-300  h-full rounded-full transition ease-in-out duration-300`}></div>
        </div>
    </div>
  )
}

export default Analytics