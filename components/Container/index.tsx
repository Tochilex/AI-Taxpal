import Image from "next/image";
import React from "react";

type ContainerProps = {
  children: any;
  className?: string;
};

const index = ({ children, className }: ContainerProps) => {
  return (
    <div
      className={`mx-auto max-w-[1300px] lg:w-10/12 w-10/12 relative ${className}`}
    >
      {children}
    </div>
  );
};

export default index;
