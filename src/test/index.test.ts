import { expect, it } from 'vitest'
import { readInt, writeInt } from '../utils/headhandle'

it('write * read Int Buffer', () => {
  const arr = new Uint8Array([0, 0, 0, 25])
  const arr2 = new Uint8Array([1, 0, 0, 1])
  writeInt(arr, 0, 4, 257)
  expect(Uint8Array.from([...arr, ...arr2])).toMatchInlineSnapshot(`
    Uint8Array [
      0,
      0,
      1,
      1,
      1,
      0,
      0,
      1,
    ]
  `)
  // expect(arr).toStrictEqual([0, 0, 1, 1])
})
