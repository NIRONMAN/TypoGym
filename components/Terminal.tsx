import React, { useEffect, useState } from 'react'

function Terminal() {
    const [current, Setcurrent] = useState(0);
    const [isError, setIsError] = useState(false);
    const [isstarted, setIsstarted] = useState(false);
    const words = "apple bicycle harmony glacier envelope quantum sunflower notebook thunder melody giraffe lantern sapphire canyon cricket fossil whisper velvet rainbow orbit shadow castle comet maple tapestry"

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "/") {
                e.preventDefault();
                setIsstarted((prev) => !prev);
            }

        }
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        }
    }, [])


    useEffect(() => {

        if (!isstarted) {
            return;
        }
        function handleKeyDown2(e: KeyboardEvent) {
            if (e.key === words[current]) {
                Setcurrent(prev => (prev + 1) % words.length);
                setIsError(false)
            }
            else if (e.key === "Backspace") {
                if(current>0){
                    Setcurrent(prev => prev - 1 );
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
    }, [current, isstarted])


    return (
        <div id='Terminal' className=' bg-[#29282b] h-[50%] w-[80%] text-white rounded-2xl border-2 p-6'>
            {
                isstarted ?
                    words.split("").map((ele, index) => (
                        <span key={index} id={index.toString()} className={`
              text-xl
            ${current === index && " border-b-4 border-black"}
            ${current > index && "text-gray-500"}
            ${isError && current === index && "text-red-400"}

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