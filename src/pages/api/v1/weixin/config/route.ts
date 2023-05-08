import { NextRequest, NextResponse } from 'next/server'
import CryptoJS from 'crypto-js'
import { getToken } from '@/../../lib/token'

export async function POST(req: NextRequest) {
    try {
        const url = req.headers.get('referer');
        console.log('url', url);
        const timestamp = Math.floor(Date.now() / 1000);
        const nonceStr = Math.random().toString(16).slice(-10);
        const token = await getToken();
        console.log('token', token);

        const data = await fetch(`https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`)
            .then(res => res.json())

        console.log('data', data);
        if (!data.errcode) {
            const signature = CryptoJS.SHA1(`jsapi_ticket=${data.ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`).toString(CryptoJS.enc.Hex);

            return NextResponse.json({
                timestamp,
                nonceStr,
                signature,
                appId: process.env.WECHAT_IC_PUBLIC_APPID, 
            });
        }
        return NextResponse.json(data, {
            status: 500
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify(error), {
            status: 500
        });
    }
}