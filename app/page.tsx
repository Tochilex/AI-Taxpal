"use client";

import ChatWindow from "@/components/ChatWindow";
import InputBox from "@/components/InputBox";
import { useState, useRef } from "react";

import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import Quiz from "@/components/Quiz";

const topics = ["VAT", "WHT", "CIT", "E-Invoicing"];

type Message = {
  role: "user" | "bot" | "scenario";
  text: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const [selectedTopic, setSelectedTopic] = useState<string>("VAT");
  const [scenarioQuestion, setScenarioQuestion] = useState("");

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentTranscript, setDocumentTranscript] = useState("");

  const [isCalling, setIsCalling] = useState(false);
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const synthesizerRef = useRef<SpeechSDK.SpeechSynthesizer | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const handleScenarioVoiceInput = async () => {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY!,
      process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION!
    );
    speechConfig.speechRecognitionLanguage = "en-NG";

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new SpeechSDK.SpeechRecognizer(
      speechConfig,
      audioConfig
    );

    recognizer.recognizeOnceAsync((result) => {
      if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        setScenarioQuestion(result.text);
      } else {
        alert("Speech not recognized. Try again.");
      }
      recognizer.close();
    });
  };

  const handleScenarioSpeakOutput = async () => {
    const lastBotMessage = messages.filter((msg) => msg.role === "bot").pop();

    if (!lastBotMessage) {
      alert("No bot message to speak.");
      return;
    }

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY!,
      process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION!
    );
    speechConfig.speechSynthesisVoiceName = "en-NG-AbeoNeural";

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
    const synthesizer = new SpeechSDK.SpeechSynthesizer(
      speechConfig,
      audioConfig
    );

    synthesizerRef.current = synthesizer;

    synthesizer.speakTextAsync(
      lastBotMessage.text,
      () => {},
      (err) => {
        console.error(err);
      }
    );
  };

  // const handleScenarioStopSpeech = () => {
  //   if (synthesizerRef.current) {
  //     synthesizerRef.current.close(); // This stops the speech in the browser
  //     synthesizerRef.current = null;
  //   }
  // };

  const handleSend = async () => {
    const context = `Topic: ${selectedTopic}`;
    const userMessage = input;
    setMessages([...messages, { role: "user", text: userMessage }]);
    setInput("");

    try {
      console.log("Sending:", { message: userMessage, context });
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, context }),
      });

      const data = await response.json();
      console.log("Received:", data);
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Error fetching response." },
      ]);
    }
  };

  const handleVoiceInput = () => {
    alert("Voice input started (placeholder for Azure Speech-to-Text)");
  };

  const handleSpeakOutput = () => {
    alert("Speaking response (placeholder for Azure Text-to-Speech)");
  };

  const handleScenarioSubmit = async () => {
    if (!scenarioQuestion.trim()) return;
    console.log("Submitting scenario:", scenarioQuestion);
    setMessages([...messages, { role: "scenario", text: scenarioQuestion }]);
    setScenarioQuestion("");

    try {
      const response = await fetch("/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: scenarioQuestion,
          topic: selectedTopic,
        }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Error fetching response." },
      ]);
    }
  };

  
const handleDocumentAnalysis = async () => {
  if (!uploadedFile) {
    alert("Please upload a document first.");
    return;
  }

  const formData = new FormData();
  formData.append("file", uploadedFile);
  formData.append("topic", selectedTopic);

  const response = await fetch("/api/analyser", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  setDocumentTranscript(data.transcript || "No insights found.");
};


//   const handleDocumentAnalysis = () => {
//     if (!uploadedFile) {
//       alert("Please upload a document first.");
//       return;
//     }
//     const reader = new FileReader();

    
// reader.onload = async (e) => {
//     const text = e.target?.result as string;

    
// // Send to Azure OpenAI or your backend for analysis
//     const response = await fetch("/api/analyser", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
      
// body: JSON.stringify({
//     text: extractedText, // from FileReader or parser
//     topic: selectedTopic // optional, helps guide the analysis
//   }),

//     });

    
// const data = await response.json();
//     setDocumentTranscript(data.transcript || "No insights found.");
//   };

  
// reader.readAsText(uploadedFile); // works for .txt; use other libs for .pdf/.docx
// };

  // // Simulate analysis
  //   const simulatedText = `Simulated analysis of "${uploadedFile.name}"...`;
  //   setDocumentTranscript(simulatedText);
  //   // setMessages([
  //   //   ...messages,
  //   //   `Document Uploaded: ${uploadedFile.name}`,
  //   //   `Bot: ${simulatedText}`,
  //   // ]);
  // };




  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadedFile(file);
  };

  const startVoiceCall = () => {
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY!,
      process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION!
    );
    speechConfig.speechRecognitionLanguage = "en-NG";

    // Extend silence timeout to give users more time
    speechConfig.setProperty("SPEECH-EndpointSilenceTimeoutMs", "2000"); // 2 seconds

    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new SpeechSDK.SpeechRecognizer(
      speechConfig,
      audioConfig
    );

    recognizerRef.current = recognizer;
    setIsCalling(true);

    // Bot greets first
    const greeting = "Hello, I am your tax assistance, please how can I help you?";
    setMessages((prev) => [...prev, { role: "bot", text: greeting }]);
    speakResponse(greeting);

    recognizer.recognizing = (_, event) => {
      console.log("Recognizing:", event.result.text);
    };

    recognizer.recognized = async (_, event) => {
      const userText = event.result.text.trim();

      // Ignore empty, whitespace, or non-informative speech
      if (!userText || !/[a-zA-Z0-9]/.test(userText)) return;

      setMessages((prev) => [...prev, { role: "user", text: userText }]);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          context: `Topic: ${selectedTopic}`,
          history: messages.slice(-5)  // send last 5 messages for context
        }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
      speakResponse(data.reply);
    };

    recognizer.startContinuousRecognitionAsync();
  };

  // const speakResponse = (text: string) => {
  //   if (synthesizerRef.current) {
  //     synthesizerRef.current.close(); // This stops playback
  //     synthesizerRef.current = null;
  //   }

  //   const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
  //     process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY!,
  //     process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION!
  //   );
  //   speechConfig.speechSynthesisVoiceName = "en-NG-AbeoNeural";

  //   const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
  //   const synthesizer = new SpeechSDK.SpeechSynthesizer(
  //     speechConfig,
  //     audioConfig
  //   );

  //   synthesizerRef.current = synthesizer;

  //   synthesizer.speakTextAsync(
  //     text,
  //     () => {},
  //     (err) => console.error("Speech synthesis error:", err)
  //   );
  // };

  const speakResponse = async (text: string) => {
    // Stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
      process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY!,
      process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION!
    );
    speechConfig.speechSynthesisVoiceName = "en-NG-AbeoNeural";

    const stream = SpeechSDK.AudioOutputStream.createPullStream();
    const audioConfig = SpeechSDK.AudioConfig.fromStreamOutput(stream);
    const synthesizer = new SpeechSDK.SpeechSynthesizer(
      speechConfig,
      audioConfig
    );

    synthesizer.speakTextAsync(
      text,
      (result) => {
        const audioData = result.audioData;
        const blob = new Blob([audioData], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play();
      },
      (error) => {
        console.error("Speech synthesis error:", error);
      }
    );
  };

  const endVoiceCall = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stopContinuousRecognitionAsync(() => {
        recognizerRef.current?.close();
        recognizerRef.current = null;
      });
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    setIsCalling(false);
  };

  // const endVoiceCall = () => {
  //   if (recognizerRef.current) {
  //     recognizerRef.current.stopContinuousRecognitionAsync(() => {
  //       recognizerRef.current?.close();
  //       recognizerRef.current = null;
  //     });
  //   }

  //   if (synthesizerRef.current) {
  //     synthesizerRef.current.close();
  //     synthesizerRef.current = null;
  //   }

  //   setIsCalling(false);
  // };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1>Tax Tutor Chatbot</h1>

      <div className="max-w-xl mx-auto bg-white shadow-md rounded p-4">
        <h1 className="text-xl font-bold mb-4">Tax Tutor Chatbot</h1>

        {/* Topic Selector */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Select a Topic:</label>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="border px-2 py-1 rounded w-full"
          >
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>

        <ChatWindow messages={messages} />
        <InputBox
          input={input}
          onInputChange={(e) => setInput(e.target.value)}
          onSend={handleSend}
          onVoice={handleVoiceInput}
          onSpeak={handleSpeakOutput}
        />

        {/* Tax Scenario Q&A */}
        <div className="mt-6">
          <label className="block font-semibold mb-2">
            Ask a Tax Scenario Question:
          </label>
          <textarea
            value={scenarioQuestion}
            onChange={(e) => setScenarioQuestion(e.target.value)}
            className="w-full border rounded px-2 py-1 mb-2"
            rows={3}
            placeholder="Describe your case study or scenario..."
          ></textarea>

          <div className="">
            <div className="flex space-x-2 mb-2">
              <button
                onClick={handleScenarioVoiceInput}
                className="bg-green-500 text-white px-4 py-1 rounded"
              >
                🎤 Voice
              </button>
              <button
                onClick={handleScenarioSpeakOutput}
                className="bg-purple-500 text-white px-4 py-1 rounded"
              >
                🔊 Listen
              </button>

              {/* <button
                onClick={handleScenarioStopSpeech}
                className="bg-red-500 text-white px-4 py-1 rounded"
              >
                ⏹️ Stop
              </button> */}
            </div>
            <button
              onClick={handleScenarioSubmit}
              className="bg-indigo-500 text-white px-4 py-1 rounded"
            >
              Submit Scenario
            </button>
          </div>

          <div className="mt-6">
            <h2 className="font-semibold mb-2">🎧 Voice Call with Tax Tutor</h2>
            {!isCalling ? (
              <button
                onClick={startVoiceCall}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Start Call
              </button>
            ) : (
              <button
                onClick={endVoiceCall}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                End Call
              </button>
            )}
          </div>

          <Quiz />
        </div>

        <div className="mt-6">
          <label className="block font-semibold mb-2">Document Analyzer:</label>

          {/* File Upload */}
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            className="mb-2"
          />

          {/* Analyze Button */}
          <button
            onClick={handleDocumentAnalysis}
            className="bg-gray-700 text-white px-4 py-1 rounded"
          >
            Analyze Document
          </button>

          {/* Transcript Display */}
          <div className="mt-4 bg-gray-100 p-2 rounded border">
            <strong>Transcript:</strong>
            <p>{documentTranscript || "No document analyzed yet."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
