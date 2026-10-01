import { Product } from '../models/index.js';
import { HttpError } from '../utils/http.js';

type Line = { product: unknown; quantity: number };

export async function restoreStock(items: { product: unknown; quantity?: number | null }[]) {
  await Promise.all(items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity ?? 0 } })));
}

/** Atomically reserves stock for each line; rolls everything back if any line can't be reserved. */
export async function reserveStock(lines: (Line & { name: string })[]) {
  const reserved: Line[] = [];
  for (const l of lines) {
    const ok = await Product.updateOne({ _id: l.product, stock: { $gte: l.quantity } }, { $inc: { stock: -l.quantity } });
    if (!ok.modifiedCount) {
      await restoreStock(reserved);
      throw new HttpError(409, `${l.name} just went out of stock`);
    }
    reserved.push(l);
  }
  return reserved;
}
