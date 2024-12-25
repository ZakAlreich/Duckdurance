import { downloadMeme } from '../utils/memeHelpers';

const MemeDisplay = ({ memeUrl, onRegenerate }) => {
  return (
    <div>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <p className="text-yellow-700">
          Remember: Even a duck paddles like crazy under the surface! Keep going! 🦆 💪
        </p>
        <p className="text-yellow-600 text-sm italic">
          Determined duck believes in you!
        </p>
      </div>

      {memeUrl && <img src={memeUrl} alt="Generated meme" className="generated-meme" />}

      <div className="flex gap-2 mt-4">
        <button
          onClick={onRegenerate}
          className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Regenerate Meme
        </button>
        
        <button
          onClick={() => downloadMeme(memeUrl)}
          className="flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
        >
          Download Meme
        </button>

        <button
          className="flex-1 bg-pink-500 text-white py-2 px-4 rounded hover:bg-pink-600"
        >
          Share to Instagram
        </button>
      </div>
    </div>
  );
};

export default MemeDisplay; 