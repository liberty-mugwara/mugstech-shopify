import { gql, graphqlClient } from "./api";

import FormData from "form-data";
import concat from "concat-stream";
import { parseString } from "xml2js";
import { pipeline } from "node:stream";

type TBulkOperationStatus =
  | "CANCELED"
  | "CANCELING"
  | "COMPLETED"
  | "CREATED"
  | "EXPIRED"
  | "FAILED"
  | "RUNNING";

interface IBulkOperationRunMutationResponse {
  bulkOperationRunMutation: {
    bulkOperation: { status: TBulkOperationStatus };
  };
}

export async function bulkUpdate({
  JSONLReadStream,
  mutation,
}: {
  JSONLReadStream: NodeJS.ReadableStream;
  mutation: string;
}) {
  const JSONLUploadOptions = await generateJSONLUploadOptions();

  const form = new FormData();

  JSONLUploadOptions.parameters.forEach(({ name, value }) => {
    form.append(name, value);
  });

  form.append("file", JSONLReadStream);

  const { PostResponse: uploadRes } = await new Promise<{
    PostResponse: { Key: string[] };
  }>((resolve, reject) => {
    form.submit(JSONLUploadOptions.url, function (err, res) {
      if (err) reject(err);

      pipeline(
        res,
        concat((data) => {
          parseString(data, function (err, result) {
            if (err) return reject(err);
            resolve(result);
          });
        })
      );
    });
  });

  // make bulk request
  const bulkRequestResponse: IBulkOperationRunMutationResponse =
    await graphqlClient.request(
      `
           mutation {
             bulkOperationRunMutation(
               mutation: "${mutation}",
               stagedUploadPath: "${uploadRes.Key[0]}"
             ) {
               bulkOperation {
                 id
                 url
                 status
               }
               userErrors {
                 message
                 field
               }
             }
           }
         `
    );

  // console.log(bulkRequestResponse);

  return bulkRequestResponse;
}

export async function generateJSONLUploadOptions(): Promise<{
  parameters: { name: string; value: string }[];
  url: string;
}> {
  try {
    const query = gql`
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          userErrors {
            field
            message
          }
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
            }
          }
        }
      }
    `;

    const res = await graphqlClient.request(query, {
      input: [
        {
          resource: "BULK_MUTATION_VARIABLES",
          filename: "bulk_op_vars",
          mimeType: "text/jsonl",
          httpMethod: "POST",
        },
      ],
    });

    return res.stagedUploadsCreate.stagedTargets[0];
  } catch (err) {
    throw err;
  }
}

export async function getBulkUpdateStatus() {
  try {
    const query = gql`
      query {
        currentBulkOperation(type: MUTATION) {
          id
          status
          errorCode
          objectCount
          url
        }
      }
    `;

    const res: { currentBulkOperation: { status: TBulkOperationStatus } } =
      await graphqlClient.request(query);

    const BusyStates = ["RUNNING", "CREATED", "CANCELING"];
    return { status: res.currentBulkOperation.status, BusyStates };
  } catch (error) {
    throw error;
  }
}
