import { NextResponse } from 'next/server'
import { getToken, setToken } from "../token"
import { NextURL } from 'next/dist/server/web/next-url';


async function getUrl({ pathname, searchParams }: { pathname: string, searchParams: URLSearchParams }) {
    const token = await getToken();
    searchParams.set('access_token', token);
    return `${process.env.PROXY_HOST}${pathname}?${searchParams.toString()}`
}

export async function proxyFetch(nextUrl: NextURL, options?: any) {
    const op = options || {};
    const headers = options.headers || new Headers()
    headers.append('Proxy-Secret', process.env.PROXY_SECRET)
    headers.append('Proxy-Type', 'api')
    options.headers = headers;
    const url = await getUrl(nextUrl);
    const data = await fetch(url, op)
        .then(res => res.json())
    if (data.errcode) {
        // 40014: access_token 失效
        if (data.errcode === 40014) {
            await setToken();
            const refreshUrl = await getUrl(nextUrl);
            const res = await fetch(refreshUrl, options)
                .then(res => res.json())
            return NextResponse.json(res)
        }
        return NextResponse.json(data, {
            status: 500
        })
    }
    return NextResponse.json(data)
}