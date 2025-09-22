import React, { useEffect, useState } from 'react'

const Quiz = () => {
   const [topic, setTopic] = useState("");
  const [questionData, setQuestionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchQuestion = async () => {
    setLoading(true);
    setError("");
    setFeedback(null);
    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await response.json();
      setQuestionData(data);
    } catch (err) {
      setError("Failed to fetch question. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestion();
  }, [topic]);

  const handleAnswer = (option: string) => {
    if (!questionData) return;
    const isCorrect = option === questionData.answer;
    if (isCorrect) {
      setScore(score + 1);
    }
    setFeedback(isCorrect ? "✅ Correct! " + questionData.explanation : "❌ Incorrect. " + questionData.explanation);
  };

  const nextQuestion = () => {
    const nextCount = questionCount + 1;
    if (nextCount >= 5) {
      setShowResult(true);
    } else {
      setQuestionCount(nextCount);
      fetchQuestion();
    }
  };

  const restartQuiz = () => {
    setScore(0);
    setQuestionCount(0);
    setShowResult(false);
    setFeedback(null);
    fetchQuestion();
  };

  return (
    <div className="bg-white p-4 rounded shadow-md mt-6">
      <h2 className="text-lg font-bold mb-2">Tax Quiz Mode</h2>
      <select
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        className="border px-2 py-1 rounded mb-4"
      >
        <option value="" disabled>Choose topic</option>
        <option value="VAT">VAT</option>
        <option value="WHT">WHT</option>
        <option value="CIT">CIT</option>
      </select>

      {loading ? (
        <p>Loading question...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : showResult ? (
        <div>
          <p className="text-green-700 font-semibold">You scored {score} out of 5</p>
          <button
            onClick={restartQuiz}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Restart Quiz
          </button>
        </div>
      ) : questionData ? (
        <div>
          <p className="font-semibold mb-2">{questionData.question}</p>
          <div className="space-y-2">
            {questionData?.options?.map((opt: string) => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                className="block w-full text-left px-4 py-2 bg-gray-100 rounded hover:bg-blue-100"
                disabled={!!feedback}
              >
                {opt}
              </button>
            ))}
          </div>
          {feedback && (
            <div className="mt-4">
              <p className="font-semibold">{feedback}</p>
              <button
                onClick={nextQuestion}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded"
              >
                Next Question
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );

}

export default Quiz