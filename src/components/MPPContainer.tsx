"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function MPPContainer({
  children,
  getFee,
  onClick,
}: {
  children: any;
  getFee: Function;
  onClick: Function;
}) {
  const [prepayId, setPrepayId] = useState<string>("");
  const [fee, setFee] = useState<number>(0);
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<boolean>(false);
  const [config, setConfig] = useState<any>({});
  const [show, setShow] = useState<boolean>(false);
  if (navigator.userAgent.toLowerCase().match(/micromessenger/i)) {
    let session = searchParams.get("session");
    if (!session) {
      session = localStorage.getItem("session");
      if (!session)
        window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${process.env.NEXT_PUBLIC_WECHAT_IC_PUBLIC_APPID}&redirect_uri=${process.env.NEXT_PUBLIC_WECHAT_PUBLIC_REDIRECT_URI}&response_type=code&scope=snsapi_base&state=agent#wechat_redirect`;
    } else {
      localStorage.setItem("session", session);
    }

    useEffect(() => {
      getPayInfo();
    }, []);

    const getPayInfo = () => {
      const ifee = getFee();

      fetch("https://public.l0l.ink/api/v1/weixin/pay/transactions/jsapi", {
        method: "POST",
        body: JSON.stringify({
          desc: "支付消耗Tokens的费用",
          fee: ifee,
          session,
          type: "JSAPI-AGENT-ONECE",
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          console.log("jsapi res:", res);
          if (res.prepay_id) {
            setPrepayId(res.prepay_id);
            setFee(ifee);
            setLoading(true);
            getPayConfig();
          }
        });
    };

    const getPayConfig = () => {
      fetch(
        `https://public.l0l.ink/api/v1/weixin/pay/transactions/jsapi?id=${prepayId}`
      )
        .then((res) => res.json())
        .then((cfg) => {
          setConfig(cfg);
        })
        .catch(console.log);
    };

    return (
      <>
        {prepayId && (
          <Script
            src="https://res2.wx.qq.com/open/js/jweixin-1.6.0.js"
            strategy="lazyOnload"
            onReady={() => {
              (async () => {
                try {
                  const res = await fetch(
                    "https://public.l0l.ink/api/v1/weixin/config",
                    {
                      method: "POST",
                      body: JSON.stringify({
                        url: window.location.href.split("#")[0],
                      }),
                    }
                  );

                  const cfg = await res.json();
                  wx.config({
                    ...cfg,
                    jsApiList: ["chooseWXPay"],
                  });

                  wx.ready(function () {
                    setLoading(false);
                    console.log("wx ready");
                  });

                  wx.error(function (err: any) {
                    // config信息验证失败会执行error函数，如签名过期导致验证失败，具体错误信息可以打开config的debug模式查看，也可以在返回的res参数中查看，对于SPA可以在这里更新签名。
                    console.error("wx.error:", err);
                  });
                } catch (error) {
                  console.error(error);
                }
              })();
            }}
          />
        )}
        {show && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/70 p-3 font-mono text-white outline-none transition-all"
            
          >
            <div className="relative mx-auto my-6 w-auto max-w-3xl rounded-lg border-2 border-zinc-600">
              {/*content*/}
              <div
                className="relative z-50 flex w-full flex-col rounded-lg border-0 bg-[#3a3a3a] shadow-lg outline-none focus:outline-none"
                onClick={(e) => e.stopPropagation()} // Avoid closing the modal
              >
                {/*header*/}
                <div className="flex items-start justify-between rounded-t border-b-2 border-solid border-white/20 p-5">
                  <h3 className="font-mono text-3xl font-semibold">费用评估</h3>
                  <button onClick={close} className="float-right ml-auto border-0 bg-transparent p-1 text-3xl font-semibold leading-none opacity-5 outline-none focus:outline-none">
                    <span className="block h-6 w-6 bg-transparent text-2xl opacity-5 outline-none focus:outline-none">
                      ×
                    </span>
                  </button>
                </div>
                {/*body*/}
                <div className="text-md relative my-3 max-h-[50vh] flex-auto overflow-y-auto p-3 leading-relaxed">
                  
                </div>
                {/*footer*/}
                <div className="flex items-center justify-end gap-2 rounded-b border-t-2 border-solid border-white/20 p-2">
                  <button className="middle none center mr-1 rounded-lg px-6 py-3 font-sans text-xs font-bold uppercase text-red-500 transition-all hover:bg-red-500/10 active:bg-red-500/30 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none">
                    参加会员计划
                  </button>
                  <button
                    data-ripple-light="true"
                    data-dialog-close="true"
                    className="middle none center rounded-lg bg-gradient-to-tr from-green-600 to-green-400 px-6 py-3 font-sans text-xs font-bold uppercase text-white shadow-md shadow-green-500/20 transition-all hover:shadow-lg hover:shadow-green-500/40 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                  >
                    支付费用
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && (
          <div
            onClick={() => {
              if (prepayId) {
                wx.chooseWXPay({
                  ...config,
                  success(msg: any) {
                    console.log("支付成功", msg);
                    getPayInfo();
                    onClick();
                  },
                });
              } else {
                onClick();
              }
            }}
          >
            {children}
          </div>
        )}
      </>
    );
  }

  return <div onClick={() => onClick()}>{children}</div>;
}
