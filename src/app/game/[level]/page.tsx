"use client";

import React from "react";
import { useParams } from "next/navigation";
import Level1 from "../levels/Level1";
//import Level2 from "../levels/Level2";
//import Level3 from "../levels/Level3";

const MatterGamePage: React.FC = () => {
  const params = useParams();
  const level = Number(params.level); // Get the level from the dynamic URL

  const renderLevel = () => {
    switch (level) {
      case 1:
        return <Level1 />;
      // case 2:
      //   return <Level2 />;
      // case 3:
      //   return <Level3 />;
      default:
        return <div>Invalid level selected</div>;
    }
  };

  return (
    <div>
      <h1>Level {level}</h1>
      {renderLevel()}
    </div>
  );
};

export default MatterGamePage;
