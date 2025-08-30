import { useState } from "react";
import { useWS } from '../WsContext'; // pontosítsd az elérési utat

export default function SliderBar() {
  const [value, setValue] = useState(50);
  const { sendMessage } = useWS();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setValue(newValue);

    // Üzenet küldése a WS-en
    sendMessage({ type: "slider", value: newValue });
  };

  return (
  <div className="w-screen fixed bottom-0 left-0 h-1/15 flex items-center justify-center bg-black select-none">
    <input
      type="range"
      min="0"
      max="100"
      value={value}
      onChange={handleChange}
      className="w-2/3"
        style={{
      accentColor: 'red',  // egyszerű megoldás modernebb böngészőkben
    }}
    />
  </div>
);

}
