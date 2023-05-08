import { NextResponse, NextRequest } from 'next/server';
import kv from "@vercel/kv";
import { KJUR, hextob64 } from 'jsrsasign';

/**
 * 32 位随机字符串
 * @returns 
 */
function getNonceStr() {
    let str = '';
    for (let index = 0; index < 4; index++) {
        str += Math.random().toString(32).slice(-8);
    }
    return str.toUpperCase();
}

/**
 * rsa签名
 * @param content 签名内容
 * @param privateKey 私钥，PKCS#1
 * @param hash hash算法，SHA256withRSA，SHA1withRSA
 * @returns 返回签名字符串，base64
 */
function rsaSign(content: string, privateKey: string, hash = 'SHA256withRSA') {
    // 创建 Signature 对象
    const signature = new KJUR.crypto.Signature({
        alg: hash,
    })
    signature.init(privateKey);
    signature.updateString(content)
    const signData = signature.sign()
    // 将内容转成base64
    return hextob64(signData)
}

export async function POST(req: NextRequest) {
    try {
        const params = await req.json();
        const session = req.cookies.get('session') || '';
        const data = await kv.get<any>(session.toString()) || {};
        const nonce_str = getNonceStr();
        const timestamp = Math.floor(Date.now() / 1000);

        const body = JSON.stringify({
            mchid: process.env.WECHAT_PAY_MCHID,
            out_trade_no: `${params.type}-${Date.now()}`,
            appid: process.env.WECHAT_IC_PUBLIC_APPID,
            description: params.desc,
            notify_url: "https://agent.l0l.ink/api/v1/weixin/pay/notify",
            amount: {
                total: Number(params.fee),
                currency: "CNY"
            },
            payer: {
                openid: data.openid || 'onS696a5kcVeSO6In29aqWkP3gJk'
            }
        });

        const content = `POST\n/v3/pay/transactions/jsapi\n${timestamp}\n${nonce_str}\n${body}\n`;
        const signature = rsaSign(content, process.env.WECHAT_PAY_API_CLENT_KEY || '');
        const Authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${process.env.WECHAT_PAY_MCHID}",nonce_str="${nonce_str}",signature="${signature}",timestamp="${timestamp}",serial_no="${process.env.WECHAT_PAY_SERIAL_NO}"`;

        const res = await fetch(
            'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi',
            {
                cache: 'no-cache',
                method: 'POST',
                headers: {
                    'Accept-Language': 'zh-CN,zh;',
                    'Content-Type': 'application/json',
                    Authorization
                },
                body,
            }
        ).then((response) => response.json());

        console.log('res:', res);

        return NextResponse.json(res);
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify(error), {
            status: 500
        });
    }
}
/**
 *  timestamp: 0, // 支付签名时间戳，注意微信jssdk中的所有使用timestamp字段均为小写。但最新版的支付后台生成签名使用的timeStamp字段名需大写其中的S字符
  nonceStr: '', // 支付签名随机串，不长于 32 位
  package: '', // 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=\*\*\*）
  signType: '', // 微信支付V3的传入RSA,微信支付V2的传入格式与V2统一下单的签名格式保持一致
  paySign: '', // 支付签名
 * @param req 
 */
export async function GET(req: NextRequest) {
    try {
        const id = req.nextUrl.searchParams.get('id');
        if (id) {
            const nonceStr = getNonceStr();
            const timestamp = Math.floor(Date.now() / 1000);
            const pkg = `prepay_id=${id}`;

            const paySign = rsaSign(`${process.env.WECHAT_IC_PUBLIC_APPID}\n${timestamp}\n${nonceStr}\n${pkg}\n`, process.env.WECHAT_PAY_API_CLENT_KEY || '');

            return NextResponse.json({
                timestamp,
                nonceStr,
                package: pkg,
                signType: 'RSA',
                paySign
            });
        }

        return new Response('没有id参数');
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify(error), {
            status: 500
        });
    }
};