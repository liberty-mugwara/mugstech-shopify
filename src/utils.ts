import { setTimeout } from "timers/promises";

type TShopifyIdTypes =
  | "PRODUCT_ID"
  | "PRODUCT_VARIANT_ID"
  | "INVENTORY_ITEM"
  | "LOCATION";

interface IFormartArgs {
  id: number;
  type: TShopifyIdTypes;
}

export function formartId({ id, type }: IFormartArgs) {
  const base = "gid://shopify";
  const map: Record<TShopifyIdTypes, string> = {
    PRODUCT_ID: `${base}/Product`,
    PRODUCT_VARIANT_ID: `${base}/ProductVariant`,
    INVENTORY_ITEM: `${base}/InventoryItem`,
    LOCATION: `${base}/Location`,
  };

  return `${map[type]}/${id}`;
}

export async function throttle<TInput, TReqReturn>(
  req: (val: TInput) => Promise<TReqReturn>,
  reqInputList: TInput[],
  limit: number = 4,
  wait: number = 2000
) {
  const reqInput = [...reqInputList];
  const results: PromiseSettledResult<TReqReturn>[] = [];

  while (reqInput.length) {
    const tempInput: TInput[] = [];
    while (tempInput.length < limit + 1 && reqInput.length) {
      const val = reqInput.pop();
      if (val) tempInput.push(val);
    }

    const res2 = await Promise.allSettled(tempInput.map((input) => req(input)));
    results.push(...res2);

    if (wait === 0) continue;

    await setTimeout(wait);
  }

  return results;
}

export function getThrottleResValues<T>(res: PromiseSettledResult<T>[]) {
  return getFulfilledResults(res).map(({ value }) => value);
}

export function getFulfilledResults<T>(res: PromiseSettledResult<T>[]) {
  return res.filter(
    ({ status }) => status === "fulfilled"
  ) as PromiseFulfilledResult<T>[];
}

export function getShopifyDate(daysFromToday = 0) {
  const today = new Date();
  const date = new Date(new Date().setDate(today.getDate() + daysFromToday));
  return date.toISOString().split("T")[0];
}
