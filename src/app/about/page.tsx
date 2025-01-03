"use client";

const AboutUs = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black text-white font-mono">
      <h1 className="text-3xl mb-8">About This Game</h1>
      <p className="text-center text-lg px-8 max-w-2xl">
        This game is a fun, experimental project created to bring a unique experience to players. 
        Combining creativity and a passion for coding, the game was built to entertain, challenge, and maybe even surprise you.
      </p>
      <div className="mt-12 text-center">
        <p className="text-xl mb-4">Made with ❤️ by Sahil Udar</p>
        <div className="flex justify-center space-x-8">
          <a 
            href="https://github.com/ProgrammerSahil" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline"
          >
            GitHub
          </a>
          <a 
            href="https://www.linkedin.com/in/sahil-udar-467a71194/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;