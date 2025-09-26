"use client";


import { useEffect, useState } from "react";
import { BiLoaderAlt } from "react-icons/bi";

export default function Loader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background h-screen">
      <div className="relative lg:text-3xl text-base">
        <p className="animate-spin">
          <BiLoaderAlt className="text-white" />
        </p>
      </div>
    </div>
  );
}
