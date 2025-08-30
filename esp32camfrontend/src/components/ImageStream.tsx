import { useWS } from '../WsContext';

export default function ImageStream() {
  /*const { sendMessage } = useWS();
  const handleClick = () => {
    sendMessage({ type: "button", value: "click" });
  };
  */
  const { imageData } = useWS();
  return (
    <div className="fixed left-1/2 transform -translate-x-1/2 w-1/2 h-13/15 flex items-center justify-center bg-gray-800 select-none">
  {imageData ? (
    <button
      //onClick={handleClick}
      className="w-full h-full rounded-2xl border-4 border-gray-600 bg-black p-0 m-0 cursor-pointer
             active:scale-95 active:brightness-90 transition-transform duration-150"
    >
      <img
        className="w-full h-full rounded-2xl object-contain"
        src={imageData}
        alt="Live ESP32 CAM"
        style={{ maxWidth: "100%" }}
      />
    </button>
  ) : (
    <p>Nincs kép</p>
  )}
</div>
  );
}
