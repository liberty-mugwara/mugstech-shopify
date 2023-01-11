import { gql, graphqlClient } from "./api";

import { bulkQuery, bulkUpdate } from "./bulk-operations";
import { setTimeout } from "timers/promises";
import { IProductCreateInput } from "./types";

export type TProductBulkMutationFns =
  | "bulkCreateProducts"
  | "bulkUpdateProductsTags";
export type TProductBulkQueryFns =
  | "getAllProductVariantIds"
  | "getAllProductImages";

export const createProductMutation = gql`
  mutation productCreate($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        handle
        description
        createdAt
        status
        totalVariants
        variants(first: 1) {
          edges {
            node {
              id
              sku
              inventoryItem {
                id
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function bulkCreateProducts(
  JSONLReadStream: NodeJS.ReadableStream
) {
  return bulkUpdate({ JSONLReadStream, mutation: createProductMutation });
}

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

export async function bulkUpdateProductsTags(
  JSONLReadStream: NodeJS.ReadableStream
) {
  return bulkUpdate({ JSONLReadStream, mutation: updateProductTagsMutation });
}

export const updateProductMutation = gql`
  mutation productUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        tags
        id
        handle
        description
        createdAt
        status
        totalVariants
        variants(first: 1) {
          edges {
            node {
              id
              sku
              inventoryItem {
                id
              }
            }
          }
        }
      }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function bulkUpdateProducts(
  JSONLReadStream: NodeJS.ReadableStream
) {
  return bulkUpdate({ JSONLReadStream, mutation: updateProductMutation });
}

export const deleteProductMutation = `
mutation productDelete($input: ProductDeleteInput!) {
  productDelete(input: $input) {
    deletedProductId
    userErrors {
      field
      message
    }
  }
}
`;

export type TProductDeleteReturn = Promise<{
  productDelete: {
    deletedProductId: string | null;
    userErrors: {
      field: [string];
      message: string;
    }[];
  };
}>;

export async function deleteProduct(id: string): TProductDeleteReturn;
export async function deleteProduct(deleteVars: {
  input: { id: string };
}): TProductDeleteReturn;
export async function deleteProduct(
  input: string | { input: { id: string } }
): TProductDeleteReturn {
  const formattedInput =
    typeof input === "string" ? { input: { id: input } } : input;
  return await graphqlClient.request(deleteProductMutation, formattedInput);
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

export async function createProduct(input: IProductCreateInput) {
  const mutation = gql`
    mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  return await graphqlClient.request(mutation, input);
}

export async function productExists(sku: string) {
  const query = gql`
  {
    products(first:1,query:"sku:${sku}") {
      nodes {
        id
      }
    }
  }
  `;
  const res = await graphqlClient.request(query);
  if (res.products.nodes?.length) {
    return { exists: true, productId: res.products.nodes[0].id };
  }

  return false;
}

export async function getAllProductImages() {
  const query = `
  query {
    products {
      edges {
        node {
          id
          images {
            edges {
              node {
                id
                altText
                url
              }
            }
          }
        }
      }
    }
  }
  `;

  return await bulkQuery(query);
}

export async function getAllProductVariantIds() {
  const query = `
  query {
    productVariants {
      edges {
        node {
          id
          sku
          product {
            id
          }
        }
      }
    }
  }
  `;

  return await bulkQuery(query);
}
