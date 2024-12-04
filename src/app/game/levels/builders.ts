import Matter from "matter-js";

const spawnWorldBox = (Bodies: typeof Matter.Bodies) => {
    const ground = Bodies.rectangle(3000, 590, 7000, 20, {
        isStatic: true,
        render: { fillStyle: "#ffffff" }, // Medium sea green
      });
      const leftWall = Bodies.rectangle(-500, 300, 1000, 1000, {
        isStatic: true,
        render: { fillStyle: "#ffffff" }, // Saddle brown
      });
      const rightWall = Bodies.rectangle(6310, 300, 1000, 600, {
        isStatic: true,
        render: { fillStyle: "#FFFFFF" },
      });

      return {ground, rightWall, leftWall};
      
}

const createObstacle = (Bodies: typeof Matter.Bodies, x: number, y: number, width: number, height: number, color:string) => {
    const obstacle = Bodies.rectangle(x, y, width, height, {
        isStatic: true,
        render: { fillStyle: color }, 
      });
      return obstacle;
};

export {spawnWorldBox, createObstacle}