"use client";

import { useState, useEffect, useCallback } from "react";
import { FaQuestion } from "react-icons/fa6";
import { IoIosArrowUp } from "react-icons/io";
import Quiz from "./Quiz";
import { MdOutlineCancel } from "react-icons/md";
import { LiaHourglassStartSolid } from "react-icons/lia";

const FloatingButton = () => {
  const [openQuiz, setOpenQuiz] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (openQuiz) {
      const prev = root.style.overflow;
      root.style.overflow = "hidden";
      return () => {
        root.style.overflow = prev;
      };
    }
  }, [openQuiz]);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpenQuiz(false);
  }, []);

  useEffect(() => {
    if (!openQuiz) return;
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openQuiz, onKeyDown]);

  return (
    <>
      <button
        onClick={() => setOpenQuiz((e) => !e)}
        className={`fixed bottom-[90px] right-4 p-4 md:p-4 z-30 drop-shadow-2xl 
              rounded-full bg-purple-500 text-white cursor-pointer group
              transition-transform duration-300 ease-in-out hover:scale-110 hover:bg-[#2a2a2a] flex items-center space-x-3`}
        aria-haspopup="dialog"
        aria-expanded={openQuiz}
        aria-controls="quiz-dialog"
      >
        <LiaHourglassStartSolid className="text-xl group-hover:animate-spin transition-all duration-800" />
        <span className="block text-center text-base">Start Quiz</span>
      </button>

      {openQuiz && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpenQuiz(false)}
          />

          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            <div
              id="quiz-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="quiz-title"
              className="relative w-full max-w-[900px] bg-[#282828] text-white
                         rounded-2xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setOpenQuiz(false)}
                className="absolute right-3 top-3 rounded-full p-2
                           hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label="Close quiz"
                title="Close"
              >
                <MdOutlineCancel className="rotate-180 text-2xl" />
              </button>

              <div className="px-4 sm:px-6 pt-5">
                <h2 id="quiz-title" className="text-lg font-semibold mb-3">
                  Quiz
                </h2>
              </div>

              <div className="px-4 sm:px-6 pb-5 max-h-[75vh] overflow-y-auto">
                <Quiz />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default FloatingButton;
