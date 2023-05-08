import { NextRequest, NextResponse, NextFetchEvent } from 'next/server';
import kv from "@vercel/kv";
import { nanoid } from "./lib/utils";

export const config = {
    // matcher: ['/api/v1/weixin/public', '/cgi-bin/:path*'],
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|MP_verify_nrobkm8ZEGiic2B0.txt).*)',
    ],
};


export default async function middleware(req: NextRequest, context: NextFetchEvent) {
    try {

        const ua = req.headers.get('user-agent') || '';
        console.log('ua:', ua);

        if (ua && ua.match(/micromessenger/i)) {
            const cookieSession =  req.cookies.get('session');
            if (cookieSession) {
                return NextResponse.next();
            }

            const requestSession = req.nextUrl.searchParams.get('session');
            if (requestSession) {
                const res = NextResponse.next();
                res.cookies.set('session', requestSession);
                return res;
            }

            const state = nanoid();
            console.log('state:', state);
            console.log('url', `${req.nextUrl.pathname}${req.nextUrl.search}`);
            await kv.set(state, `${req.nextUrl.pathname}${req.nextUrl.search}`, { ex: 5 * 60 });
            return NextResponse.redirect(`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${process.env.WECHAT_IC_PUBLIC_APPID}&redirect_uri=${process.env.WECHAT_PUBLIC_REDIRECT_URI}&response_type=code&scope=snsapi_base&state=${state}#wechat_redirect`)
        }


        // if (req.nextUrl.pathname === '/api/v1/weixin/public') {
        //     const valid = checkSignature(req.nextUrl.searchParams)
        //     if (valid) {
        //         return NextResponse.next();
        //     }
        //     // context.waitUntil(new Promise(async (resolve, reject) => {

        //     // }));
        //     return new Response("signature invalid", {
        //         status: 400,
        //     });
        // } else {
        //     const ua = req.headers.get('user-agent') || '' ;
        //     console.log('ua:', ua);

        //     if (ua && ua.match(/micromessenger/i)) {

        //         return NextResponse.redirect(`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${process.env.WECHAT_IC_PUBLIC_APPID}&redirect_uri=${process.env.WECHAT_PUBLIC_REDIRECT_URI}&response_type=code&scope=snsapi_base&state=123#wechat_redirect`)
        //     }
        //     const secret = req.headers.get('Proxy-Secret');
        //     if (secret === process.env.PROXY_SECRET) {
        //         return NextResponse.next();
        //     }
        //     return new Response("Unauthorized", {
        //         status: 401
        //     })
        // }


    } catch (error) {
        console.log('error:', error)
        return new Response(JSON.stringify(error), {
            status: 500,
        });
    }
}
