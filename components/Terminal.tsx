import { useTypingSession } from '@/store';
import React, { useEffect, useState } from 'react'

function Terminal() {
    const [isError, setIsError] = useState(false);
    const {alphabetSession,currentSessionString,currentLetterIndex,setCurrentIndex,isSessionStarted,toggleSessionStart}=useTypingSession();
    const [terminalBlur,setTerminalBlur]=useState(false);

    useEffect(()=>{
        // (async ()=>{
        //     const {data}=await nixios.get("api");
        //     console.log(data)
           
        // })();

        alphabetSession("a");
    },[])

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "/") {
                e.preventDefault();
                toggleSessionStart();
            }

        }
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        }
    }, [])


    useEffect(() => {

        if (!isSessionStarted && !currentSessionString) {
            return;
        }
        function handleKeyDown2(e: KeyboardEvent) {
            if (e.key === currentSessionString![currentLetterIndex]) {
                setCurrentIndex((currentLetterIndex+1) % currentSessionString!.length);
                setIsError(false)
            }
            else if (e.key === "Backspace") {
                if(currentLetterIndex>0){
                    setCurrentIndex(currentLetterIndex- 1 );
                }
                setIsError(false);
            }
            else {
                setIsError(true);
            }
        }
        document.addEventListener('keydown', handleKeyDown2);

        return () => {
            document.removeEventListener('keydown', handleKeyDown2);
        }
    }, [currentLetterIndex, isSessionStarted])


    return (
        <div
        tabIndex={0}
        onFocus={()=>setTerminalBlur(false)}
        onBlur={()=>setTerminalBlur(true)}
         id='Terminal' className={`font-mono  bg-[#29282b] w-full text-white rounded-2xl border-2 p-6 min-h-60 ${terminalBlur?"blur-sm":"border-green-300"}`}>
            {
                isSessionStarted && currentSessionString ?
                    currentSessionString.split("").map((ele, index) => (
                        <span key={index} id={index.toString()} className={`
              text-xl
            ${currentLetterIndex === index && " border-b-4 border-black"}
            ${currentLetterIndex > index && "text-gray-500"}
            ${isError && currentLetterIndex === index && "text-red-400"}

            `}>
                    {ele}
                        </span>
                    ))
                    : <div className="text-center">Type /start here...</div>
            }
        </div>
    )
}

export default Terminal

