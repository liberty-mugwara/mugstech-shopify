import { setTimeout } from "timers/promises";
import {
  IFormartArgs,
  ITaxLine,
  TShopifyIdTypes,
  TShopifyObject,
} from "./types";

export function getTotalTax(taxLines: ITaxLine[]) {
  return taxLines.reduce(
    (prevValue, currentValue) =>
      prevValue + parseFloat(currentValue.priceSet.presentmentMoney.amount),
    0
  );
}

export function multiplyCash(amount: string, multiplier: number) {
  return parseFloat(
    (
      (parseInt(parseFloat(amount).toFixed(2).toString().replace(".", ""), 10) *
        multiplier) /
      100
    ).toFixed(2)
  );
}

interface IObjectIdParams<T> {
  id: T;
  object: TShopifyObject;
}

export function getShopifyIdNumber({ id, object }: IObjectIdParams<string>) {
  return parseInt(id.replace(`gid://shopify/${object}/`, ""), 10);
}

export function formartId({ id, object }: IObjectIdParams<number>) {
  return `gid://shopify/${object}/${id}`;
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
