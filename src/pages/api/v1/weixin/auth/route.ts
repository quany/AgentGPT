import { NextRequest, NextResponse } from "next/server";
import kv from "@vercel/kv";
import { db, sql } from "@/../../lib/kysely";
import { nanoid } from "nanoid";

// export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code"); // and state
    console.log("code:", code);
    if (code) {
      const data = await fetch(
        `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${process.env.WECHAT_IC_PUBLIC_APPID}&secret=${process.env.WECHAT_IC_PUBLIC_APP_SECRET}&code=${code}&grant_type=authorization_code`
      ).then((res) => res.json());

      const createTable = await db.schema
        .createTable("users")
        .ifNotExists()
        .addColumn("id", "serial", (cb) => cb.primaryKey())
        .addColumn("openid", "varchar(255)", (cb) => cb.notNull().unique())
        .addColumn("createdAt", sql`timestamp with time zone`, (cb) =>
          cb.defaultTo(sql`current_timestamp`)
        )
        .execute();
      console.log(`Created "notify" table:`, createTable);

      const addUser = await db
        .insertInto("users")
        .values({
          openid: data.openid,
        })
        .execute();

      console.log("notify:", addUser);

      const key = nanoid();
      await kv.set(key, data);

      let url = "/";

      const state = req.nextUrl.searchParams.get("state");

      if (state) url = (await kv.get<string>(state)) || "/";

      console.log("redirect url:", url);

      const redirect = new URL(url, req.url);
      redirect.searchParams.set("session", key);
      return NextResponse.redirect(redirect);
    }
    return new Response("没有code", {
      status: 500,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify(error), {
      status: 500,
    });
  }
}
