"use client";

import Script from "next/script";
import VConsole from "vconsole";
import { useSearchParams } from 'next/navigation';
import { useEffect } from "react";

async function init() {
  const res = await fetch("/api/v1/weixin/config", {
    method: "POST",
    body: JSON.stringify({
      url: window.location.href.split("#")[0],
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  const cfg = await res.json();
  console.log("cfg:", cfg);
  wx.config({
    ...cfg,
    // debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
    // timestamp: Date.now(), // 必填，生成签名的时间戳
    // nonceStr: Math.random().toString(16).slice(-10), // 必填，生成签名的随机串
    // signature: '',// 必填，签名
    jsApiList: ["chooseWXPay", "onMenuShareTimeline", "onMenuShareAppMessage"], // 必填，需要使用的JS接口列表
  });

  wx.ready(function () {
    // config信息验证后会执行ready方法，所有接口调用都必须在config接口获得结果之后，config是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在ready函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在ready函数中。
    wx.onMenuShareTimeline({
      title: "给我一个支点我将撬动地球，给我一个目标我将为您描绘出路线图。",
      link: "https://agent.l0l.ink/",
      imgUrl: "https://agent.l0l.ink/favicon.ico",
      success() {
        console.log("分享成功");
      },
      cancel() {
        console.log("取消分享");
      },
    });

    wx.updateAppMessageShareData({
      title: "自主式人工智能", // 分享标题
      desc: "给我一个支点我将撬动地球，给我一个目标我将为您描绘出路线图。", // 分享描述
      link: "https://agent.l0l.ink",
      imgUrl: "https://agent.l0l.ink/favicon.ico",
      success() {
        // 设置成功
        console.log("分享给朋友 设置成功");
      },
    });

    wx.updateTimelineShareData({
      title: "给我一个支点我将撬动地球，给我一个目标我将为您描绘蓝图。", // 分享标题
      link: "https://agent.l0l.ink",
      imgUrl: "https://agent.l0l.ink/favicon.ico",
      success() {
        // 设置成功
        console.log("分享给朋友 设置成功");
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
