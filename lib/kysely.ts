import { Generated, ColumnType } from 'kysely'
import { createKysely } from '@vercel/postgres-kysely'

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

interface WechatPayNotifyDataTable {
  // Columns that are generated by the database should be marked
  // using the `Generated` type. This way they are automatically
  // made optional in inserts and updates.
  id: string
  resourceType: string
  eventType: string
  summary: string
  resource: string

  // You can specify a different type for each operation (select, insert and
  // update) using the `ColumnType<SelectType, InsertType, UpdateType>`
  // wrapper. Here we define a column `createdAt` that is selected as
  // a `Date`, can optionally be provided as a `string` in inserts and
  // can never be updated:
  createTime: ColumnType<Date, string | undefined, never>
}

interface WechatPublicUserTable {
  id: Generated<number>
  openid: string
  createdAt: ColumnType<Date, string | undefined, never>
}

// Keys of this interface are table names.
export interface Database {
  notify: WechatPayNotifyDataTable,
  users: WechatPublicUserTable
}

export const db = createKysely<Database>()
export { sql } from 'kysely'