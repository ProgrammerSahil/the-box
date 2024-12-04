"use client";

import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

export default function Home() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userLevel, setUserLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication and fetch user level
    const checkAuthAndLevel = async () => {
      const username = localStorage.getItem("username");
      if (username) {
        setIsAuthenticated(true);
        try {
          const response = await axios.get(
            `/api/users/getLevel?username=${username}`
          );
          setUserLevel(response.data.level);
        } catch (error) {
          console.error("Error fetching user level:", error);
          toast.error("Failed to fetch game progress");
        }
      }
      setLoading(false);
    };

    checkAuthAndLevel();

    // Matter.js setup
    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    const Runner = Matter.Runner;

    // Create engine
    engineRef.current = Engine.create({
      gravity: { x: 0, y: 1 },
    });

    // Create renderer
    renderRef.current = Render.create({
      element: sceneRef.current!,
      engine: engineRef.current,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: "#000000",
      },
    });

    // Button dimensions for spawn area calculation
    const buttonWidth = 200;
    const buttonHeight = 60;
    const buttonSpacing = 20;
    const totalWidth = buttonWidth * 2 + buttonSpacing;
    const startX = (window.innerWidth - totalWidth) / 2;
    const buttonY = window.innerHeight / 2 + 50;

    // Create falling boxes with concentrated spawn area
    const boxes: Matter.Body[] = [];

    // Create two extra large boxes
    for (let i = 0; i < 2; i++) {
      const size = Math.random() * 30 + 80; // 80-110px
      boxes.push(
        Bodies.rectangle(
          // Spawn near the buttons
          startX + Math.random() * totalWidth,
          Math.random() * -500 - 200,
          size,
          size,
          {
            render: {
              fillStyle: "#ffffff",
            },
            friction: 0.1,
            restitution: 0.8,
            density: 0.001,
          }
        )
      );
    }

    // Create regular boxes
    for (let i = 0; i < 13; i++) {
      const size = Math.random() * 20 + 40; // 40-60px
      // Calculate spawn position concentrated around buttons
      const spawnWidth = totalWidth + 200; // Slightly wider than buttons area
      const spawnX = startX - 100 + Math.random() * spawnWidth; // Center around buttons

      boxes.push(
        Bodies.rectangle(
          spawnX,
          Math.random() * -800, // Stagger the fall heights
          size,
          size,
          {
            render: {
              fillStyle: "#ffffff",
            },
            friction: 0.1,
            restitution: 0.8,
            density: 0.001,
          }
        )
      );
    }

    // Create button physics bodies (invisible but collidable)
    const continueButton = Bodies.rectangle(
      startX + buttonWidth / 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      {
        isStatic: true,
        render: { visible: false },
      }
    );

    const aboutButton = Bodies.rectangle(
      startX + buttonWidth + buttonSpacing + buttonWidth / 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      {
        isStatic: true,
        render: { visible: false },
      }
    );

    // Create ground and walls
    const ground = Bodies.rectangle(
      window.innerWidth / 2,
      window.innerHeight + 30,
      window.innerWidth,
      60,
      {
        isStatic: true,
        render: { fillStyle: "#ffffff" },
      }
    );

    const leftWall = Bodies.rectangle(
      -30,
      window.innerHeight / 2,
      60,
      window.innerHeight,
      {
        isStatic: true,
        render: { fillStyle: "#ffffff" },
      }
    );

    const rightWall = Bodies.rectangle(
      window.innerWidth + 30,
      window.innerHeight / 2,
      60,
      window.innerHeight,
      {
        isStatic: true,
        render: { fillStyle: "#ffffff" },
      }
    );

    // Add all bodies to the world
    World.add(engineRef.current.world, [
      ...boxes,
      ground,
      leftWall,
      rightWall,
      continueButton,
      aboutButton,
    ]);

    // Run the engine and renderer
    const runner = Runner.create();
    Runner.run(runner, engineRef.current);
    Render.run(renderRef.current);

    // Handle window resize
    const handleResize = () => {
      if (renderRef.current) {
        renderRef.current.canvas.width = window.innerWidth;
        renderRef.current.canvas.height = window.innerHeight;
        Matter.Body.setPosition(ground, {
          x: window.innerWidth / 2,
          y: window.innerHeight + 30,
        });
        Matter.Body.setPosition(rightWall, {
          x: window.innerWidth + 30,
          y: window.innerHeight / 2,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);
      if (renderRef.current) {
        Render.stop(renderRef.current);
        World.clear(engineRef.current!.world, false);
        Engine.clear(engineRef.current!);
        renderRef.current.canvas.remove();
      }
      Runner.stop(runner);
    };
  }, []);

  return (
    <div className="relative min-h-screen">
      <link rel="preconnect" href="https://fonts.googleapis.com"></link>
      <link rel="preconnect" href="https://fonts.gstatic.com"></link>
      <link
        href="https://fonts.googleapis.com/css2?family=Sixtyfour+Convergence&display=swap"
        rel="stylesheet"
      ></link>
      {/* Matter.js canvas container */}
      <div ref={sceneRef} className="absolute inset-0 z-0" />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
        <h1
          className="text-4xl font-bold text-white mb-8"
          style={{
            fontFamily: "'Sixtyfour Convergence', sans-serif",
            fontVariationSettings: "'BLED' 0, 'SCAN' 0, 'XELA' 0, 'YELA' 0",
          }}
        >
          The Box
        </h1>

        {loading ? (
          <div className="text-white">Loading...</div>
        ) : (
          <div className="flex space-x-4">
            {isAuthenticated ? (
              <Link
                href={`/game/${userLevel}`}
                className="px-8 py-3 text-lg font-semibold text-black bg-white rounded-lg hover:bg-gray-200 transition-colors"
              >
                Continue Level {userLevel}
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-8 py-3 text-lg font-semibold text-black bg-white rounded-lg hover:bg-gray-200 transition-colors"
              >
                Login
              </Link>
            )}

            <Link
              href="/about"
              className="px-8 py-3 text-lg font-semibold text-black bg-white rounded-lg hover:bg-gray-200 transition-colors"
            >
              About Us
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
