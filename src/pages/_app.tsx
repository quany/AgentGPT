import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import dynamic from 'next/dynamic';

import { api } from "../utils/api";

import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/react";

const WechatPublicScript = dynamic(() => import('../components/WechatPublicScript'), { ssr: false })

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
      <Analytics />
      <WechatPublicScript />
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
