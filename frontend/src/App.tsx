import { useEffect, useState } from 'react';
import ImageStream from './components/ImageStream';
import JoystickControl from './components/JoystickControl';
import JoysticTwo from './components/JoystickTwo';
import ImageStreamHalf from './components/ImageStreamHalf';
import ImageStreamUp from './components/ImageStreamUp';
import JoystickDown from './components/JoystickDown';
import { WSProvider } from './WsContext'; // az előbb létrehozott fájl
import SliderBar from './components/SliderBar';

function App() {
  const [isLandscape, setIsLandscape] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const checkOrientation = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    setIsLandscape(width > height);
    setIsMobile(width < 1024); // pl. mobilnak tekintjük, ha kisebb mint laptop screen
  };

  useEffect(() => {
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);
  
let content;
if (isMobile && isLandscape) {
  // Mobil + fekvő mód: videó + joystick oldalra
  content = (
    <div className="flex w-screen h-screen overflow-hidden bg-gray-800">
      <ImageStream />
      <JoysticTwo />
      <SliderBar />
    </div>
  );
} else if (!isMobile && isLandscape) {
  // Asztali + fekvő mód: csak joystick
  content = (
    <div className="flex w-screen h-screen overflow-hidden bg-gray-800">
      <JoystickControl/>
      <ImageStreamHalf/>
      <SliderBar />
    </div>
  );
} else {
  // Minden más esetben (pl. mobil portré, asztali álló): videó + joystick alul
  content = (
    <div className="flex w-screen h-screen overflow-hidden bg-gray-800 flex-col">
      <ImageStreamUp />
      <JoystickDown />
      <SliderBar/>
    </div>
  );
}

return (
  <WSProvider>
      <main className="w-screen h-screen bg-gray-800 text-white">
        {content}
      </main>
    </WSProvider>
);
}

export default App