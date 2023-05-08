import kv from "@vercel/kv";

async function requestToken() {
    const headers = new Headers()
    headers.append('Proxy-Secret', process.env.PROXY_SECRET || "")
    headers.append('Proxy-Type', 'api')
    const data = await fetch(`${process.env.PROXY_HOST}/cgi-bin/token?grant_type=client_credential&appid=${process.env.WECHAT_IC_PUBLIC_APPID}&secret=${process.env.WECHAT_IC_PUBLIC_SECRET}`, {
        headers
    }).then(res => res.json())
    return data;
}

export async function getToken() {
    const token = await kv.get<string>(`${process.env.TOKEN_KEY}`);
    if (token) {
        return token;
    }
    const res = await setToken();
    return res;
}

export async function setToken() {
    const data = await requestToken();
    await kv.set(`${process.env.TOKEN_KEY}`, data.access_token, { ex: data.expires_in });
    return data.access_token;
}