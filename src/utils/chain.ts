import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import type { ModelSettings } from "./types";
import { GPT_35_TURBO } from "./constants";

export const createModel = (settings: ModelSettings) =>
  new OpenAI({
    openAIApiKey:
      settings.customApiKey === ""
        ? process.env.OPENAI_API_KEY
        : settings.customApiKey,
    temperature: settings.customTemperature || 0.9,
    modelName:
      settings.customModelName === "" ? GPT_35_TURBO : settings.customModelName,
    maxTokens: 750,
  });

const startGoalPrompt = new PromptTemplate({
  template:
    "你是一种名为 AgentGPT 的自主任务创建人工智能。你有以下目标 {goal}。创建一个零到三个任务的列表，由你的 AI 系统完成，以使你的目标更接近或完全达成。返回字符串数组响应，可以在 JSON.parse() 中使用。",
  inputVariables: ["goal"],
});
export const startGoalAgent = async (model: OpenAI, goal: string) => {
  return await new LLMChain({
    llm: model,
    prompt: startGoalPrompt,
  }).call({
    goal,
  });
};

const executeTaskPrompt = new PromptTemplate({
  template:
    "你是一种名为 AgentGPT 的自主任务执行人工智能。你有以下目标 {goal}。你有以下任务 {task}。执行任务并将响应作为字符串返回。",
  inputVariables: ["goal", "task"],
});
export const executeTaskAgent = async (
  model: OpenAI,
  goal: string,
  task: string
) => {
  return await new LLMChain({ llm: model, prompt: executeTaskPrompt }).call({
    goal,
    task,
  });
};

const createTaskPrompt = new PromptTemplate({
  template:
    "你是一种 AI 任务创建代理。你的目标是 {goal}。你有以下未完成任务 {tasks}，并刚刚执行了以下任务 {lastTask} 并收到了以下结果 {result}。基于此，请创建一个新的任务，仅在需要时由你的 AI 系统完成，以便更接近或完全达成你的目标。返回响应作为字符串数组，仅可用于 JSON.parse()，不得使用任何其他内容",
  inputVariables: ["goal", "tasks", "lastTask", "result"],
});
export const executeCreateTaskAgent = async (
  model: OpenAI,
  goal: string,
  tasks: string[],
  lastTask: string,
  result: string
) => {
  return await new LLMChain({ llm: model, prompt: createTaskPrompt }).call({
    goal,
    tasks,
    lastTask,
    result,
  });
};

export const extractArray = (inputStr: string): string[] => {
  // Match an outer array of strings (including nested arrays)
  const regex = /(\[(?:\s*"(?:[^"\\]|\\.)*"\s*,?)+\s*\])/;
  const match = inputStr.match(regex);

  if (match && match[0]) {
    try {
      // Parse the matched string to get the array
      return JSON.parse(match[0]) as string[];
    } catch (error) {
      console.error("Error parsing the matched array:", error);
    }
  }

  console.warn("Error, could not extract array from inputString:", inputStr);
  return [];
};

// Model will return tasks such as "No tasks added". We should filter these
export const realTasksFilter = (input: string): boolean => {
  const noTaskRegex =
    /^No( (new|further|additional|extra|other))? tasks? (is )?(required|needed|added|created|inputted).*$/i;
  const taskCompleteRegex =
    /^Task (complete|completed|finished|done|over|success).*/i;
  const doNothingRegex = /^(\s*|Do nothing(\s.*)?)$/i;

  return (
    !noTaskRegex.test(input) &&
    !taskCompleteRegex.test(input) &&
    !doNothingRegex.test(input)
  );
};

// import { OpenAI } from "langchain/llms/openai";
// import { PromptTemplate } from "langchain/prompts";
// import { LLMChain } from "langchain/chains";
// import type { ModelSettings } from "./types";
// import { GPT_35_TURBO } from "./constants";

// export const createModel = (settings: ModelSettings) =>
//   new OpenAI({
//     openAIApiKey:
//       settings.customApiKey === ""
//         ? process.env.OPENAI_API_KEY
//         : settings.customApiKey,
//     temperature: settings.customTemperature || 0.9,
//     modelName:
//       settings.customModelName === "" ? GPT_35_TURBO : settings.customModelName,
//     maxTokens: 750,
//   });

// const startGoalPrompt = new PromptTemplate({
//   template:
//     "You are an autonomous task creation AI called AgentGPT. You have the following objective `{goal}`. Create a list of zero to three tasks to be completed by your AI system such that your goal is more closely reached or completely reached. Return the response as an array of strings that can be used in JSON.parse()",
//   inputVariables: ["goal"],
// });
// export const startGoalAgent = async (model: OpenAI, goal: string) => {
//   return await new LLMChain({
//     llm: model,
//     prompt: startGoalPrompt,
//   }).call({
//     goal,
//   });
// };

// const executeTaskPrompt = new PromptTemplate({
//   template:
//     "You are an autonomous task execution AI called AgentGPT. You have the following objective `{goal}`. You have the following tasks `{task}`. Execute the task and return the response as a string.",
//   inputVariables: ["goal", "task"],
// });
// export const executeTaskAgent = async (
//   model: OpenAI,
//   goal: string,
//   task: string
// ) => {
//   return await new LLMChain({ llm: model, prompt: executeTaskPrompt }).call({
//     goal,
//     task,
//   });
// };

// const createTaskPrompt = new PromptTemplate({
//   template:
//     "You are an AI task creation agent. You have the following objective `{goal}`. You have the following incomplete tasks `{tasks}` and have just executed the following task `{lastTask}` and received the following result `{result}`. Based on this, create a new task to be completed by your AI system ONLY IF NEEDED such that your goal is more closely reached or completely reached. Return the response as an array of strings that can be used in JSON.parse() and NOTHING ELSE",
//   inputVariables: ["goal", "tasks", "lastTask", "result"],
// });
// export const executeCreateTaskAgent = async (
//   model: OpenAI,
//   goal: string,
//   tasks: string[],
//   lastTask: string,
//   result: string
// ) => {
//   return await new LLMChain({ llm: model, prompt: createTaskPrompt }).call({
//     goal,
//     tasks,
//     lastTask,
//     result,
//   });
// };

// export const extractArray = (inputStr: string): string[] => {
//   // Match an outer array of strings (including nested arrays)
//   const regex = /(\[(?:\s*"(?:[^"\\]|\\.)*"\s*,?)+\s*\])/;
//   const match = inputStr.match(regex);

//   if (match && match[0]) {
//     try {
//       // Parse the matched string to get the array
//       return JSON.parse(match[0]) as string[];
//     } catch (error) {
//       console.error("Error parsing the matched array:", error);
//     }
//   }

//   console.warn("Error, could not extract array from inputString:", inputStr);
//   return [];
// };

// // Model will return tasks such as "No tasks added". We should filter these
// export const realTasksFilter = (input: string): boolean => {
//   const noTaskRegex =
//     /^No( (new|further|additional|extra|other))? tasks? (is )?(required|needed|added|created|inputted).*$/i;
//   const taskCompleteRegex =
//     /^Task (complete|completed|finished|done|over|success).*/i;
//   const doNothingRegex = /^(\s*|Do nothing(\s.*)?)$/i;

//   return (
//     !noTaskRegex.test(input) &&
//     !taskCompleteRegex.test(input) &&
//     !doNothingRegex.test(input)
//   );
// };
