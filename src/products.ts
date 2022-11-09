import { gql, graphqlClient } from "./api";

import { bulkUpdate } from "./bulk-operations";
import { setTimeout } from "timers/promises";

export const updateProductTagsMutation = gql`
  mutation productUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        tags
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export function bulkUpdateProductsTags(JSONLReadStream: NodeJS.ReadableStream) {
  return bulkUpdate({ JSONLReadStream, mutation: updateProductTagsMutation });
}

export async function getProductIdFromVariantId(variantId: string | number) {
  try {
    const res: {
      productVariant: {
        product: {
          id: string;
        };
      };
    } = await graphqlClient.request(
      `
        {
          productVariant(id: "gid://shopify/ProductVariant/${variantId}") {
            product {
              id
            }
          }
        }
      `
    );

    const map: Record<string | number, string> = {};
    map[variantId] = res.productVariant.product.id;
    return map;
  } catch (e) {
    throw e;
  }
}

export async function getProductIdsFromVariantIds(
  variantIds: (string | number)[],
  limit = 475,
  wait = 20000
) {
  try {
    const reqInput = [...variantIds];
    const results: Record<string, string> = {};
    let failuresCounts = 0;

    while (reqInput.length) {
      const tempInput = [];

      while (tempInput.length < limit + 1 && reqInput.length) {
        const val = reqInput.pop();
        if (val) tempInput.push(val);
      }

      const createQuery = (id: string | number) => `
          _${id}: productVariant(id: "gid://shopify/ProductVariant/${id}") {
            product {
              id
            }
          }
        `;

      const query = `
          {
            ${tempInput.map((id) => createQuery(id)).join(" ")}
          }
        `;

      const res2: Record<string, { product: { id: string } }> | undefined =
        await graphqlClient.request(query).catch((e: Error) => {
          failuresCounts++;
          console.error(e);
        });

      if (res2) {
        for (const [vId, value] of Object.entries(res2)) {
          if (vId && value) {
            results[vId.replace("_", "")] = value.product.id;
          } else {
            console.log(vId, value);
          }
        }
      }

      if (wait === 0) continue;
      await setTimeout(wait);
    }
    console.log({ failuresCounts });
    return results;
  } catch (e) {
    throw e;
  }
}
