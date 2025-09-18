// components/InputBox.tsx
import React, { useState } from "react";

type InputBoxProps = {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: (message: string) => void;
  onVoice: () => void;
  onSpeak: () => void;
};

const InputBox: React.FC<InputBoxProps> = ({input, onInputChange, onSend, onVoice, onSpeak }) => {
  
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSend(input);
    }
  };

  return (
    <div>
      <div className="flex space-x-2 mb-2">
        <button
          onClick={onVoice}
          className="bg-green-500 text-white px-4 py-1 rounded"
        >
          🎤 Voice
        </button>
        <button
          onClick={onSpeak}
          className="bg-purple-500 text-white px-4 py-1 rounded"
        >
          🔊 Listen
        </button>
      </div>
      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          className="flex-grow border px-2 py-1 rounded"
          placeholder="Type your question..."
        />
        <button
          onClick={() => onSend(input)}
          className="bg-blue-500 text-white px-4 py-1 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default InputBox;
