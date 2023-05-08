import { NextResponse, NextRequest } from "next/server";
import { db, sql } from "@/../../lib/kysely";

// import {  RawBuilder } from 'kysely'

// function json<T>(value: T): RawBuilder<T> {
//   return sql`CAST(${JSON.stringify(value)} AS JSONB)`
// }

// {
//     "id": "EV-2018022511223320873",
//     "create_time": "2015-05-20T13:29:35+08:00",
//     "resource_type": "encrypt-resource",
//     "event_type": "TRANSACTION.SUCCESS",
//     "summary": "支付成功",
//     "resource": {
//         "original_type": "transaction",
//         "algorithm": "AEAD_AES_256_GCM",
//         "ciphertext": "",
//         "associated_data": "",
//         "nonce": ""
//     }
// }

// data: {
//     id: 'eedd98d4-5ca5-5fdc-84f6-b8efc816479d',
//     create_time: '2023-04-27T21:34:04+08:00',
//     resource_type: 'encrypt-resource',
//     event_type: 'TRANSACTION.SUCCESS',
//     summary: '支付成功',
//     resource: {
//       original_type: 'transaction',
//       algorithm: 'AEAD_AES_256_GCM',
//       ciphertext: 'e9NOejsNveSSlSPyD2v+iGHtSsQjKiaxPtKVHics/2LAdIJWu+u47ukM7uvrJyVfnpoDnY/oB5+0zDx20DOZ1zg7qeTHrWEjjSJLi2vQGLH6NpFTIILl6zE1mJQ5wwwzHKEzhGXpgCD6h/kIGN+VxJaLfk6pAUyMoprFD6ja3rNNITGHZgd8q4Z4zb/yUSf5ghkf9vozWyHTYrqgB0pFZ0ZF/Xg2+v3cMCUJfp+PEyS+1ALA31c2GTY1WQ3bAOX64PdbG5cCF42jrvREo/iQyKWyEc842l9V72bAvtXVIfsMEXRfUo55KDV2R35006HoNuho/++mQj/22gBJrfn4iicJnnPirunKd63Cdhxbo3g8JVVqzgc8EPuV9wqk8TEl1Ar1DxVswndQDlnrVF7Xpuhjo0mulPWNmbXw+gpDMIuB+DED2ThoupLbvUlICIyKJFtvM4fBSMW2vm/nPZmF3XMSdUhl4kPE37II8WbOClsjkyoFv8eG6G9OEy29bbaQNWBBCHv1QspyvODgzRyyC1kCKCmMDTuWUV9L7f/WnRJlk6n3qF4NAH14fBYKVQsE4l0FLP8R57P4CIZA',
//       associated_data: 'transaction',
//       nonce: 'nwgd6QWjnzrd'
//     }
//   }

// function decrypt(nonce: WithImplicitCoercion<string> | {
//         [Symbol.toPrimitive](hint // {
//             : "string"): string;
//     }, ciphertext: WithImplicitCoercion<string> | {
//         [Symbol.toPrimitive](hint // {
//             : "string"): string;
//     }, associatedData: WithImplicitCoercion<string> | {
//         [Symbol.toPrimitive](hint // {
//             : "string"): string;
//     }) {
//     const key = Buffer.from('Your32Apiv3Key', 'utf8');
//     const nonceBytes = Buffer.from(nonce, 'utf8');
//     const adBytes = Buffer.from(associatedData, 'utf8');
//     const data = Buffer.from(ciphertext, 'base64');

//     const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonceBytes);
//     decipher.setAAD(adBytes);
//     decipher.setAuthTag(data.slice(-16));
//     let decrypted = decipher.update(data.slice(0, -16));
//     decrypted += decipher.final();
//     return decrypted.toString('utf8');
//   }

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log("data:", data);
    const ws = req.headers.get("Wechatpay-Signature");
    console.log("ws:", ws);// 验签

    // ws: Rwftf5KREZ0WiOqdGeHMComg2IOx82SfSWwfaYp7hLAgqgJLIZm6b093HdzAW4wvuIpTd7B3jVb2UX0lPQGP3Mx+YwktRmrEMF9C0L4DKgGYNPj6TJYi4soqK+QVO26MUN4dR7vQ6DWth43G6PEOx/FrqspiCfnQbW4bM0KAXQ0HB0f9bJvH8zlMFNZ6GdxXL9jUM2hdYTw+j90k7zzxLAIUnfI84SjARZTrGc2lqVYs0FOEx72GYFukJXNQoCfh69aa9+3hkuxV//AaUoY0PCWKlk9RXP6esFa6kub24dOauIJwzDFGEunlGDJvY9Zm9sU7tkgsr/dYaXi+GFWt2g==

    const createTable = await db.schema
      .createTable("notify")
      .ifNotExists()
      .addColumn("id", "varchar(255)", (cb) => cb.primaryKey())
      .addColumn("resourceType", "varchar(255)", (cb) => cb.notNull())
      .addColumn("eventType", "varchar(255)")
      .addColumn("summary", "varchar(255)")
      .addColumn("resource", "varchar")
      .addColumn("createTime", sql`timestamp with time zone`, (cb) =>
        cb.defaultTo(sql`current_timestamp`)
      )
      .execute();
    console.log(`Created "notify" table:`, createTable);

    const addUsers = await db
      .insertInto("notify")
      .values({
        id: data.id,
        resourceType: data.resource_type,
        eventType: data.event_type,
        summary: data.summary,
        createTime: data.create_time,
        resource: JSON.stringify(data.resource),
      })
      .execute();

    console.log("notify:", addUsers);
  } catch (error) {
    console.log("error:", error)
    return NextResponse.json({
      code: "FAIL",
      message: error,
    });
  }

  return NextResponse.json({
    code: "SUCCESS",
    message: "",
  });
}
