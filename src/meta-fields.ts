import { bulkUpdate } from "./bulk-operations";
import { gql } from "./api";

export const setMetaFieldsMutation = gql`
  mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        key
        namespace
        value
        createdAt
        updatedAt
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export async function bulkSetMetafields(
  JSONLReadStream: NodeJS.ReadableStream,
  fileName: string
) {
  return bulkUpdate({
    JSONLReadStream,
    mutation: setMetaFieldsMutation,
    fileName,
  });
}
