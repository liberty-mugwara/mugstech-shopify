import { GraphQLClient } from "graphql-request";
import { RawTaxOrder } from "./types";

export const graphqlClient = new GraphQLClient(
  `https://${process.env.SHOPIFY_PASSWORD}:${process.env.SHOPIFY_USERNAME}/admin/api/2021-07/graphql.json`,
  {
    headers: {
      "Content-Type": "application/json",
    },
  }
);

export async function getOrders<TOderParams>({
  query,
  orderParams,
  limit = 250,
}: {
  query: string;
  orderParams: string;
  limit?: number;
}) {
  try {
    const res1: {
      orders: {
        edges: {
          node: {
            id: string;
          };
        }[];
      };
    } = await graphqlClient.request(
      `{
              orders(first: ${limit},query: ${query}) {
                edges {
                  node {
                    id
                  }
                }
              }
            }`
    );

    const orderQueue = res1.orders.edges.map(({ node }) => ({
      orderId: node.id,
      orderParams,
    }));

    const res2 = await throttle<
      { orderId: string; orderParams: string },
      TOderParams & { id: string }
    >(getOrder, orderQueue, 4, 1500);

    const successfulRes = getThrottleResValues(res2);

    return successfulRes;
  } catch (e) {
    throw e;
  }
}

export async function getOrder<TOderParams>({
  orderId,
  orderParams,
  onlyTags = false,
}: {
  orderId: string;
  orderParams: string;
  onlyTags?: boolean;
}) {
  type Order = TOderParams & {
    id: string;
  };
  const res = await graphqlClient.request(
    `{
            node(id: "${orderId}") {
              id
              ...on Order {
                ${onlyTags ? "tags" : orderParams}
              }
            }
          }`
  );
  return res.node as Order;
}

export function formatTax<T extends RawTaxOrder>(orderOrOrders: T | T[]) {
  type TaxOrder = T & {
    lineItems: {
      edges: {
        node: {
          taxLine: {
            priceSet: number;
            ratePercentage: number;
          };
        };
      }[];
    };
  };

  const format = (node: T) => {
    node.lineItems.edges.forEach(({ node: item }) => {
      const data = {
        priceSet: 0,
        ratePercentage: 0,
      };

      item.taxLines.forEach(
        ({
          priceSet: {
            presentmentMoney: { amount: priceSet },
          },
          ratePercentage,
        }) => {
          data.priceSet += parseFloat(priceSet);
          data.ratePercentage += ratePercentage;
        }
      );
      (item as any).taxLine = data;
    });

    return node as TaxOrder;
  };

  if (Array.isArray(orderOrOrders)) {
    orderOrOrders.forEach((order) => {
      format(order);
    });
  } else {
    format(orderOrOrders);
  }
}

export async function markOrderAsPaid(orderId: string) {
  try {
    const res: { orderMarkAsPaid: Record<"order", Record<"id", string>> } =
      await graphqlClient.request(
        `mutation orderMarkAsPaid($input: OrderMarkAsPaidInput!) {
              orderMarkAsPaid(input: $input) {
                order {
                  id
                }
                userErrors {
                  field
                  message
                }
              }
            }`,
        { input: { id: orderId } }
      );
    return res.orderMarkAsPaid.order;
  } catch (e) {
    throw e;
  }
}

export async function updateTags(id: string, ...newTags: string[]) {
  const order = await getOrder<{ tags: string[] }>({
    orderId: id,
    orderParams: `tags`,
    onlyTags: true,
  });
  const existingTags = order.tags;
  const finalTags = [...new Set([...existingTags, ...newTags])];
  const res = await graphqlClient.request(
    `mutation orderUpdate($input: OrderInput!) {
              orderUpdate(input: $input) {
                userErrors {
                  field
                  message
                }
                order {
                  name
                }
              }
            }`,
    { input: { id, tags: finalTags } }
  );

  const returnVal = { orderId: id, tagged: false };
  if (res.orderUpdate.order) returnVal.tagged = true;
  return returnVal;
}

export async function updateTagsForMultipleOrders(
  orderIds: string[],
  ...newTags: string[]
) {
  const req = async (orderId: string) => {
    return await updateTags(orderId, ...newTags);
  };
  const res = await throttle(req, orderIds, 1, 0);
  return getThrottleResValues(res);
}

export function optimizeOrderCustomAttributes(
  customAttributes: { key: string; value: string }[]
) {
  const map = new Map<string, string>();
  customAttributes.forEach(({ key, value }) => {
    map.set(key, value);
  });
  return map;
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

    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), wait);
    });
  }

  return results;
}

/** - date must be an ISO string */
export function convertISODateToEDIDate(date: string) {
  return date.split("T")[0].split("-").join("");
}

export function getThrottleResValues<T>(res: PromiseSettledResult<T>[]) {
  return getFulfilledResults(res).map(({ value }) => value);
}

export function getFulfilledResults<T>(res: PromiseSettledResult<T>[]) {
  return res.filter(
    ({ status }) => status === "fulfilled"
  ) as PromiseFulfilledResult<T>[];
}
