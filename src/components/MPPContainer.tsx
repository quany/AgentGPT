"use client";

import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";

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
  const [loading, setLoading] = useState<boolean>(false);
  const [config, setConfig] = useState<any>({});
  const [show, setShow] = useState<boolean>(false);

  const searchParams = useSearchParams();
  if (navigator.userAgent.toLowerCase().match(/micromessenger/i)) {
    let session = localStorage.getItem("session");
    if (!session) {
      session = searchParams.get("session");
      if (!session) {
        window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${process.env.NEXT_PUBLIC_WECHAT_IC_PUBLIC_APPID}&redirect_uri=${process.env.NEXT_PUBLIC_WECHAT_PUBLIC_REDIRECT_URI}&response_type=code&scope=snsapi_base&state=agent#wechat_redirect`;
      } else {
        localStorage.setItem("session", session);
      }
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
          <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/70 p-3 font-mono text-white outline-none transition-all">
            <div className="relative mx-auto my-6 w-auto max-w-3xl rounded-lg border-2 border-zinc-600">
              {/*content*/}
              <div
                className="relative z-50 flex w-full flex-col rounded-lg border-0 bg-[#3a3a3a] shadow-lg outline-none focus:outline-none"
                onClick={(e) => e.stopPropagation()} // Avoid closing the modal
              >
                {/*header*/}
                <div className="flex items-start justify-between rounded-t border-b-2 border-solid border-white/20 p-5">
                  <h3 className="font-mono text-3xl font-semibold">费用说明</h3>
                  <button
                    onClick={() => setShow(false)}
                    className="float-right ml-auto border-0 bg-transparent p-1 text-3xl font-semibold leading-none opacity-5 outline-none focus:outline-none"
                  >
                    <span className="block h-6 w-6 bg-transparent text-2xl opacity-5 outline-none focus:outline-none">
                      ×
                    </span>
                  </button>
                </div>
                {/*body*/}
                <div className="text-md relative my-3 max-h-[50vh] flex-auto overflow-y-auto p-3 leading-relaxed">
                  根据需要消耗的Tokens,预计需要支付:{fee / 100}元.
                  <br />
                  请确认支付金额无误后点击支付按钮.
                  <br />
                  <br />
                  也可以参加我们的
                  <a className="text-blue-500" href="https://public.l0l.ink">
                    会员计划
                  </a>
                  ,享受更多服务,使用体验更便捷.
                  <br />
                </div>
                {/*footer*/}
                <div className="flex items-center justify-end gap-2 rounded-b border-t-2 border-solid border-white/20 p-2">
                  <button
                    data-ripple-light="true"
                    data-dialog-close="true"
                    onClick={() => {
                      setShow(false);
                      wx.chooseWXPay({
                        ...config,
                        success(msg: any) {
                          console.log("支付成功", msg);
                          getPayInfo();
                          onClick();
                        },
                      });
                    }}
                    className="middle none center rounded-lg bg-gradient-to-tr from-green-600 to-green-400 px-6 py-3 font-sans text-xs font-bold uppercase text-white shadow-md shadow-green-500/20 transition-all hover:shadow-lg hover:shadow-green-500/40 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                  >
                    支付{fee / 100}元
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
                setShow(true);
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
