"use client";

import Script from "next/script";
import VConsole from "vconsole";
import { useSearchParams } from 'next/navigation';
import { useEffect } from "react";

async function init() {
  const res = await fetch("https://public.l0l.ink/api/v1/weixin/config", {
    method: "POST",
    body: JSON.stringify({
      url: window.location.href.split("#")[0],
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  const cfg = await res.json();
  wx.config({
    ...cfg,
    jsApiList: ["chooseWXPay", "updateTimelineShareData", "updateAppMessageShareData"], // 必填，需要使用的JS接口列表
  });

  wx.ready(function () {
    wx.updateAppMessageShareData({
      title: "自主式人工智能", // 分享标题
      desc: "给我一个支点我将撬动地球，给我一个目标我将为您描绘出路线图。", // 分享描述
      link: "https://agent.l0l.ink",
      imgUrl: "https://agent.l0l.ink/coder.png",
      success() {
        // 设置成功
        console.log("分享朋友设置成功");
      },
    });

    wx.updateTimelineShareData({
      title: "给我一个支点我将撬动地球，给我一个目标我将为您描绘蓝图。", // 分享标题
      link: "https://agent.l0l.ink",
      imgUrl: "https://agent.l0l.ink/coder.png",
      success() {
        // 设置成功
        console.log("分享朋友圈设置成功");
      },
    });
  });

  wx.error(function (err: any) {
    // config信息验证失败会执行error函数，如签名过期导致验证失败，具体错误信息可以打开config的debug模式查看，也可以在返回的res参数中查看，对于SPA可以在这里更新签名。
    console.error("wx.error:", err);
  });
  // return cfg;
}

export default function WechatPublicScript() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const vconsole = searchParams.get('vconsole');
    if (vconsole) {
      new VConsole();
    }
  },[])
  if (navigator.userAgent.toLowerCase().match(/micromessenger/i)) {
    return (
      <Script
        src="https://res2.wx.qq.com/open/js/jweixin-1.6.0.js"
        strategy="lazyOnload"
        onReady={() => {
          init();
        }}
      />
    );
  }

  return <></>;
}
