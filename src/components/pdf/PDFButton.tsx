import WindowButton from "../WindowButton";
import { FaSave } from "react-icons/fa";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import type { Message } from "../ChatWindow";
import MyDocument from "./MyDocument";

const PDFButton = ({ messages }: { messages: Message[] }) => {
  const content = getContent(messages);

  const downloadPDF = async () => {
    const blob = await pdf(<MyDocument content={content} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-document.pdf";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <WindowButton
        delay={0.8}
        onClick={() => {
          downloadPDF().catch(console.error);
        }}
        icon={<FaSave size={12} />}
        text={"保存"}
      />
    </>
  );
};

const getContent = (messages: Message[]): string => {
  // Note "Thinking" messages have no `value` so they show up as new lines
  return messages
    .map((message) => {
      if (message.type == "goal") {
        return `目标: ${message.value}`;
      }
      if (message.type == "task") {
        return `正在添加任务: ${message.value}`;
      }
      return message.value;
    })
    .join("\n");
};

export default PDFButton;
