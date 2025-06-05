import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "workout-assistant",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

interface Exercise {
  id: number;
  name: string;
  notes: string;
  reps: {
    weight: number;
    reps: number;
  }[];
};

interface Workout {
  id: number;
  startDate: Date;
  endDate: Date | null;
  name: string;
  notes: string;
  exercises: Exercise[];
};

const workouts: Workout[] = [
  {
    id: 1,
    startDate: new Date('2025-06-05 10:00:00'),
    endDate: new Date('2025-06-05 11:00:00'),
    name: "Push",
    notes: "Chest, Shoulders, Triceps",
    exercises: [
      {
        id: 1,
        name: "Pushups",
        notes: "10 reps",
        reps: [
          {
            weight: 0,
            reps: 10,
          },
        ],
      },
    ],
  },
];

function getCurrentWorkout() {
  return workouts[workouts.length - 1];
}

function getCurrentExercise() {
  const workout = getCurrentWorkout();
  return workout.exercises[workout.exercises.length - 1];
}

server.tool(
    "start-workout",
    "Start a new workout",
    {
      name: z.string().max(200).describe("Name of the workout"),
    },
    async ({ name }) => {
      workouts.push({
        id: workouts.length + 1,
        startDate: new Date(),
        endDate: null,
        name: name,
        notes: "",
        exercises: [],
      });

      return {
        content: [
          {
            type: "text",
            text: `Starting workout ${workouts.length}: ${name}`,
          },
        ],
      };
    },
  );

server.tool(
    "add-exercise",
    "Add an exercise to the current workout",
    {
      name: z.string().max(200).describe("Name of the exercise"),
      notes: z.string().max(2000).describe("Notes about the exercise"),
    },
    async ({ name, notes }) => {
      const workout = getCurrentWorkout();
      workout.exercises.push({
        id: workout.exercises.length + 1,
        name: name,
        notes: notes,
        reps: [],
      });

      return {
        content: [
          {
            type: "text",
            text: `Added exercise ${workout.exercises.length}: ${name}`,
          },
        ],
      };
    },
  );

  server.tool(
    "add-exercise-rep",
    "Add a rep to the current exercise",
    {
      weight: z.number().describe("Weight of the rep"),
      reps: z.number().describe("Number of reps"),
    },
    async ({ weight, reps }) => {
      const exercise = getCurrentExercise();
      exercise.reps.push({
        weight: weight,
        reps: reps,
      });

      return {
        content: [
          {
            type: "text",
            text: `Added rep ${exercise.reps.length}: ${weight}x${reps}`,
          },
        ],
      };
    },
  );

server.tool(
    "end-workout",
    "End the current workout",
    {},
    async () => {
      const workout = getCurrentWorkout();
      workout.endDate = new Date();

      return {
        content: [
          {
            type: "text",
            text: `Ended workout ${workout.id}: ${workout.name}`,
          },
        ],
      };
    },
  );
  
  async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Workout Assistant MCP Server running on stdio");
  }
  
  main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });

  