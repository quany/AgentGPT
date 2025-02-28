import type { Message } from "./ChatWindow";
import type { AxiosError } from "axios";
import axios from "axios";
import type { ModelSettings } from "../utils/types";
import {
  createAgent,
  executeAgent,
  startAgent,
} from "../services/agent-service";
import { DEFAULT_MAX_LOOPS, DEFAULT_MAX_LOOPS_FREE } from "../utils/constants";

class AutonomousAgent {
  name: string;
  goal: string;
  tasks: string[] = [];
  completedTasks: string[] = [];
  modelSettings: ModelSettings;
  isRunning = true;
  renderMessage: (message: Message) => void;
  shutdown: () => void;
  numLoops = 0;

  constructor(
    name: string,
    goal: string,
    renderMessage: (message: Message) => void,
    shutdown: () => void,
    modelSettings: ModelSettings
  ) {
    this.name = name;
    this.goal = goal;
    this.renderMessage = renderMessage;
    this.shutdown = shutdown;
    this.modelSettings = modelSettings;
  }

  async run() {
    this.sendGoalMessage();
    this.sendThinkingMessage();

    // Initialize by getting tasks
    try {
      this.tasks = await this.getInitialTasks();
      for (const task of this.tasks) {
        await new Promise((r) => setTimeout(r, 800));
        this.sendTaskMessage(task);
      }
    } catch (e) {
      console.log(e);
      this.sendErrorMessage(getMessageFromError(e));
      this.shutdown();
      return;
    }

    await this.loop();
  }

  async loop() {
    console.log(`Loop ${this.numLoops}`);
    console.log(this.tasks);

    if (!this.isRunning) {
      return;
    }

    if (this.tasks.length === 0) {
      this.sendCompletedMessage();
      this.shutdown();
      return;
    }

    this.numLoops += 1;
    const maxLoops =
      this.modelSettings.customApiKey === ""
        ? DEFAULT_MAX_LOOPS_FREE
        : this.modelSettings.customMaxLoops || DEFAULT_MAX_LOOPS;
    if (this.numLoops > maxLoops) {
      this.sendLoopMessage();
      this.shutdown();
      return;
    }

    // Wait before starting
    await new Promise((r) => setTimeout(r, 1000));

    // Execute first task
    // Get and remove first task
    this.completedTasks.push(this.tasks[0] || "");
    const currentTask = this.tasks.shift();
    this.sendThinkingMessage();

    const result = await this.executeTask(currentTask as string);
    this.sendExecutionMessage(currentTask as string, result);

    // Wait before adding tasks
    await new Promise((r) => setTimeout(r, 1000));
    this.sendThinkingMessage();

    // Add new tasks
    try {
      const newTasks = await this.getAdditionalTasks(
        currentTask as string,
        result
      );
      this.tasks = this.tasks.concat(newTasks);
      for (const task of newTasks) {
        await new Promise((r) => setTimeout(r, 800));
        this.sendTaskMessage(task);
      }

      if (newTasks.length == 0) {
        this.sendActionMessage("任务标记为完成！");
      }
    } catch (e) {
      console.log(e);
      this.sendErrorMessage(
        `添加附加任务时出错。 运行它们可能违反了我们模型的政策。 继续。`
      );
      this.sendActionMessage("任务标记为完成。");
    }

    await this.loop();
  }

  async getInitialTasks(): Promise<string[]> {
    if (this.shouldRunClientSide()) {
      await testConnection(this.modelSettings);
      return await startAgent(this.modelSettings, this.goal);
    }

    const res = await axios.post(`/api/chain`, {
      modelSettings: this.modelSettings,
      goal: this.goal,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
    return res.data.newTasks as string[];
  }

  async getAdditionalTasks(
    currentTask: string,
    result: string
  ): Promise<string[]> {
    if (this.shouldRunClientSide()) {
      return await createAgent(
        this.modelSettings,
        this.goal,
        this.tasks,
        currentTask,
        result,
        this.completedTasks
      );
    }

    const res = await axios.post(`/api/create`, {
      modelSettings: this.modelSettings,
      goal: this.goal,
      tasks: this.tasks,
      lastTask: currentTask,
      result: result,
      completedTasks: this.completedTasks,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
    return res.data.newTasks as string[];
  }

  async executeTask(task: string): Promise<string> {
    if (this.shouldRunClientSide()) {
      return await executeAgent(this.modelSettings, this.goal, task);
    }

    const res = await axios.post(`/api/execute`, {
      modelSettings: this.modelSettings,
      goal: this.goal,
      task: task,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
    return res.data.response as string;
  }

  private shouldRunClientSide() {
    return this.modelSettings.customApiKey != "";
  }

  stopAgent() {
    this.sendManualShutdownMessage();
    this.isRunning = false;
    this.shutdown();
    return;
  }

  sendMessage(message: Message) {
    if (this.isRunning) {
      this.renderMessage(message);
    }
  }

  sendGoalMessage() {
    this.sendMessage({ type: "goal", value: this.goal });
  }

  sendLoopMessage() {
    this.sendMessage({
      type: "system",
      value:
        this.modelSettings.customApiKey !== ""
          ? `此代理运行时间过长（50 个循环）。 为了保存您的钱包，此代理正在关闭。 将来，迭代次数将是可配置的。`
          : "很抱歉，因为这是一个演示，我们不能让我们的代理运行太久。 请注意，如果您希望运行更长的时间，请在设置中提供您自己的 API 密钥。 休息一下",
    });
  }

  sendManualShutdownMessage() {
    this.sendMessage({
      type: "system",
      value: `代理程序已手动关闭。`,
    });
  }

  sendCompletedMessage() {
    this.sendMessage({
      type: "system",
      value: "所有任务完成! 休息一下。",
    });
  }

  sendThinkingMessage() {
    this.sendMessage({ type: "thinking", value: "" });
  }

  sendTaskMessage(task: string) {
    this.sendMessage({ type: "task", value: task });
  }

  sendErrorMessage(error: string) {
    this.sendMessage({ type: "system", value: error });
  }

  sendExecutionMessage(task: string, execution: string) {
    this.sendMessage({
      type: "action",
      info: `执行中 "${task}"`,
      value: execution,
    });
  }

  sendActionMessage(message: string) {
    this.sendMessage({
      type: "action",
      info: message,
      value: "",
    });
  }
}

const testConnection = async (modelSettings: ModelSettings) => {
  // A dummy connection to see if the key is valid
  // Can't use LangChain / OpenAI libraries to test because they have retries in place
  return await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: modelSettings.customModelName,
      messages: [{ role: "user", content: "说这是一个测试" }],
      max_tokens: 7,
      temperature: 0,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${modelSettings.customApiKey}`,
      },
    }
  );
};

const getMessageFromError = (e: unknown) => {
  let message =
    "访问 OpenAI API 时出错。 请检查您的 API 密钥或稍后重试";
  if (axios.isAxiosError(e)) {
    const axiosError = e as AxiosError;
    if (axiosError.response?.status === 429) {
      message = `使用您的 OpenAI API 密钥时出错。 您已超出当前配额，请检查您的计划和账单明细。`;
    }
    if (axiosError.response?.status === 404) {
      message = `错误您的 API 密钥没有 GPT-4 访问权限。 您必须先加入 OpenAI 的候补名单。 （这与 ChatGPT Plus 不同）`;
    }
  } else {
    message = `检索初始任务数组时出错。 重试，使您的目标更明确，或修改您的目标，使其符合我们模型的运行策略。 休息一下...`;
  }
  return message;
};

export default AutonomousAgent;
