"use client";

import ChatWindow from "@/components/ChatWindow";
import InputBox from "@/components/InputBox";
import { useState, useRef } from "react";
import Container from "@/components/Container";
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
        body: JSON.stringify({ message: userMessage, context })
      });

      const data = await response.json();
      console.log("Received:", data);
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Error fetching response." }
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
          topic: selectedTopic
        })
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Error fetching response." }
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
      body: formData
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
    const greeting =
      "Hello, I am your tax assistance, please how can I help you?";
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
          history: messages.slice(-5) // send last 5 messages for context
        })
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
    <div className="bg-background relative">
      <Container>
        <nav className="py-3 ">
          <h1 className="text-text text-lg font-medium text-center">
            Tax Tutor Chatbot
          </h1>
        </nav>

        <div className="shadow-md rounded-2xl p-4">
          <h1 className="text-base mx-auto w-[700px] text-center font-medium mb-4 text-text">
            TTC-bot is an AI-powered virtual tax assistant. Select a topic, ask
            questions, upload documents, take quizzes, or have a voice call to
            get tax help!
          </h1>

          {/* Topic Selector */}
          {/* <div className="mb-4 flex mx-auto w-[700px]">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="border px-2 py-1 text-white rounded-md w-full"
            >
              <option value="" disabled>
                -- Select a Topic --
              </option>
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div> */}

          <div className="grid grid-cols-2 gap-6">
            {/* Chat Window */}
            <div className="mb-4 bg-[#282828] p-4 rounded-2xl ">
              {/* <div>
                <InputBox
                  input={input}
                  onInputChange={(e) => setInput(e.target.value)}
                  onSend={handleSend}
                  onVoice={handleVoiceInput}
                  onSpeak={handleSpeakOutput}
                />
              </div> */}

              <div className="mt-4 h-[400px] overflow-y-auto">
                <ChatWindow messages={messages} />
              </div>
            </div>

            {/* Tax Scenario Q&A */}
            <div className="mb-4 bg-[#282828] px-4 py-10 rounded-2xl space-y-10">
              <div>
                <label className="block font-semibold mb-2 text-text">
                  Ask a Tax Scenario Question:
                </label>
                <textarea
                  value={scenarioQuestion}
                  onChange={(e) => setScenarioQuestion(e.target.value)}
                  className="w-full placeholder:text-gray-400 placeholder:italic text-text border rounded-2xl px-2 py-1 mb-2"
                  rows={3}
                  placeholder="Describe your case study or scenario..."
                ></textarea>

                <div className="">
                  <div className="flex space-x-2 mb-2">
                    <button
                      onClick={handleScenarioVoiceInput}
                      className="cursor-pointer text-sm hover:opacity-90 bg-green-500 text-white px-4 py-1 rounded-2xl"
                    >
                      🎤 Voice
                    </button>
                    <button
                      onClick={handleScenarioSpeakOutput}
                      className="cursor-pointer text-sm hover:opacity-90 bg-purple-500 text-white px-4 py-1 rounded-2xl"
                    >
                      🔊 Listen
                    </button>

                    <button
                      onClick={handleScenarioSubmit}
                      className="cursor-pointer text-sm hover:opacity-90 border border-text text-white px-4 py-1 rounded-2xl"
                    >
                      Submit
                    </button>

                    {/* <button
                onClick={handleScenarioStopSpeech}
                className="bg-red-500 text-white px-4 py-1 rounded-2xl"
              >
                ⏹️ Stop
              </button> */}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl">
                <h2 className="font-semibold mb-2 text-text">
                  🎧 Voice Call with Tax Tutor
                </h2>
                {!isCalling ? (
                  <button
                    onClick={startVoiceCall}
                    className="cursor-pointer hover:opacity-90 text-sm bg-green-600 text-white px-4 py-2 rounded-2xl"
                  >
                    Start Call
                  </button>
                ) : (
                  <button
                    onClick={endVoiceCall}
                    className="bg-red-600 text-white cursor-pointer px-4 py-2 rounded-2xl"
                  >
                    End Call
                  </button>
                )}
              </div>

              {/* <div>
                <Quiz />
              </div> */}

              {/* Document Analyzer */}
              <div>
                <label className="block font-semibold mb-2 text-text">
                  Document Analyzer:
                </label>

                {/* File Upload */}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="block cursor-pointer mb-2 text-text border border-text rounded-2xl p-2"
                />

                {/* Analyze Button */}
                <button
                  onClick={handleDocumentAnalysis}
                  className="bg-gray-700 cursor-pointer hover:opacity-90 text-sm text-white px-4 py-1 rounded-2xl"
                >
                  Analyze Document
                </button>

                {/* Transcript Display */}
                <div className="mt-4 bg-[#353839] text-text p-2 rounded-2xl border">
                  <strong>Transcript:</strong>
                  <p>{documentTranscript || "No document analyzed yet."}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
