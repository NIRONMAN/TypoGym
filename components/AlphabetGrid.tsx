import { CharKeyType, useTypingSession } from '@/store';
import React from 'react'
//65
function AlphabetGrid() {
  const alphabetSession =useTypingSession((state)=>state.alphabetSession);

  return (
    <div className=' flex my-4  rounded-lg items-center justify-center'>
      {
        Array.from({ length: 26 }, (_, i) => {
          return <div key={i} onClick={()=>{
            alphabetSession(String.fromCharCode(97+i) as CharKeyType)
          }} className='hover:scale-110 me-2 border border-gray-500 py-1 px-2 bg-neutral-600 hover:bg-neutral-400 rounded-md'>
              {String.fromCharCode(65+i)}
          </div>
        })
      }
    </div>
  )
}

export default AlphabetGrid