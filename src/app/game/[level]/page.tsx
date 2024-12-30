"use client";
import React from "react";
import { useParams } from "next/navigation";
import Level1 from "../levels/Level1";
import Level2 from "../levels/Level2";
import Level3 from "../levels/Level3";
import Level4 from "../levels/Level4";
import Level5 from "../levels/Level5";
import FinalLevel from "../levels/Unknown0";

const MatterGamePage: React.FC = () => {
  const params = useParams();
  const level = Number(params.level);

  const renderLevel = () => {
    switch (level) {
      case 1:
        return <Level1 />;
      case 2:
        return <Level2 />;
      case 3:
        return <Level3 />;
      case 4:
        return <Level4 />;
      case 5:
        return <Level5 />;
      case 404:
        return <FinalLevel />;
      default:
        return <div>Invalid level selected</div>;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full">
      <link rel="preconnect" href="https://fonts.googleapis.com"></link>
      <link rel="preconnect" href="https://fonts.gstatic.com"></link>
      <link
        href="https://fonts.googleapis.com/css2?family=Sixtyfour+Convergence&display=swap"
        rel="stylesheet"
      ></link>
      <h1
        className="text-2xl mb-4"
        style={{
          fontFamily: "'Sixtyfour Convergence', sans-serif",
          fontVariationSettings: "'BLED' 0, 'SCAN' 0, 'XELA' 0, 'YELA' 0",
        }}
      >
        Level {level}
      </h1>
      <div className="flex justify-center items-center w-full max-w-[1200px]">
        {renderLevel()}
      </div>
    </div>
  );
};

export default MatterGamePage;
