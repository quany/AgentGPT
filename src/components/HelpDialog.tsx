import React from "react";
import { FaDiscord, FaGithub, FaTwitter } from "react-icons/fa";
import Dialog from "./Dialog";

export default function HelpDialog({
  show,
  close,
}: {
  show: boolean;
  close: () => void;
}) {
  return (
    <Dialog header="欢迎使用AgentGPT🤖" isShown={show} close={close}>
      <div className="text-md relative flex-auto p-2 leading-relaxed">
        <p>
          <strong>AgentGPT</strong> 允许您配置和部署自治 AI 代理。 为您的自定义 AI 命名并让它开始任何可以想象的目标。 它将尝试通过思考要完成的任务、执行任务并从结果中学习来实现目标🚀
        </p>
        <div>
          <br />
          该平台目前处于测试阶段，我们目前正在致力于：
          <ul className="ml-5 list-inside list-disc">
            <li>长期记忆 🧠</li>
            <li>网页浏览 🌐</li>
            <li>与网站和人的互动 👨‍👩‍👦</li>
          </ul>
          <br />
          {/* <p className="mt-2">按照下面的旅程：</p> */}
        </div>
        <div className="mt-4 flex w-full items-center justify-center gap-5">
          <p>
          我正在
          <a
            href="https://t.zsxq.com/0dScWktE1"
            className="text-blue-500"
          >
            「Auto-GPT」
          </a>
          和朋友们讨论有趣的话题，你⼀起来吧？
          </p>
          {/* <div
            className="cursor-pointer rounded-full bg-black/30 p-3 hover:bg-black/70"
            onClick={() =>
              window.open("https://discord.gg/jdSBAnmdnY", "_blank")
            }
          >
            <FaDiscord size={30} />
          </div>
          <div
            className="cursor-pointer rounded-full bg-black/30 p-3 hover:bg-black/70"
            onClick={() =>
              window.open(
                "https://twitter.com/asimdotshrestha/status/1644883727707959296",
                "_blank"
              )
            }
          >
            <FaTwitter size={30} />
          </div>
          <div
            className="cursor-pointer rounded-full bg-black/30 p-3 hover:bg-black/70"
            onClick={() =>
              window.open("https://github.com/reworkd/AgentGPT", "_blank")
            }
          >
            <FaGithub size={30} />
          </div> */}
        </div>
      </div>
    </Dialog>
  );
}
