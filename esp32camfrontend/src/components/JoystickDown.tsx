import { useEffect, useRef } from 'react';
import nipplejs from 'nipplejs';
import { useWS } from '../WsContext'; // A pontos elérési út legyen helyes nálad

const JoystickDown = () => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickInstanceRef = useRef<any>(null);
  const { sendMessage } = useWS();

  const createJoystick = () => {
    if (!joystickRef.current) return;

    if (joystickInstanceRef.current) {
      joystickInstanceRef.current.destroy();
      joystickInstanceRef.current = null;
    }

    const screenHeight = window.innerHeight;
    const joystickSize = screenHeight * 0.28;

    const joystick = nipplejs.create({
      zone: joystickRef.current,
      mode: 'static',
      position: { left: '50%', top: '50%' },
      color: 'black',
      size: joystickSize,
    });

    joystick.on('move', (_evt, data) => {
      if (!data?.vector) return;
      const x = parseFloat((data.vector.x || 0).toFixed(2));
      const y = parseFloat((data.vector.y || 0).toFixed(2));

      sendMessage({ x, y });
    });

    joystick.on('end', () => {
      sendMessage({ x: 0, y: 0 });
    });

    joystickInstanceRef.current = joystick;
  };

  useEffect(() => {
    createJoystick();

    const handleResize = () => {
      createJoystick();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (joystickInstanceRef.current) {
        joystickInstanceRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="w-screen h-7/15 fixed bottom-10 left-0 bg-gray-800 flex items-center justify-center select-none">
      <div
        ref={joystickRef}
        className="w-auto h-2/3 aspect-square bg-gray-600 rounded-full"
        style={{ position: 'relative' }}
      />
    </div>
  );
};

export default JoystickDown;
