import { gql, graphqlClient } from "./api";
import fetch from "node-fetch";
import FormData from "form-data";
import concat from "concat-stream";
import { parseString } from "xml2js";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import readline from "readline";
import { setTimeout } from "node:timers/promises";
import {
  IBulkOperationRunQueryResponse,
  IBulkOperationRunMutationResponse,
  ICurrentBulkOperation,
} from "./types";
import { BulkOperationError } from "./errors";

export async function bulkQuery(query: string) {
  const mutation = gql`
    mutation bulkOperationRunQuery($query: String!) {
      bulkOperationRunQuery(query: $query) {
        bulkOperation {
          id
          url
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  return graphqlClient.request(mutation, {
    query,
  }) as Promise<IBulkOperationRunQueryResponse>;
}

export async function bulkUpdate({
  JSONLReadStream,
  mutation,
}: {
  JSONLReadStream: NodeJS.ReadableStream;
  mutation: string;
}) {
  try {
    const JSONLUploadOptions = await generateJSONLUploadOptions();

    const form = new FormData();
    JSONLUploadOptions.parameters.forEach(({ name, value }) => {
      form.append(name, value);
    });

    form.append("file", JSONLReadStream);

    const submitForm = promisify(form.submit.bind(form));

    const resStream = await submitForm(JSONLUploadOptions.url);

    let uploadResMessage: { PostResponse: { Key: string[] } } | undefined;

    await pipeline(
      resStream as any as NodeJS.ReadableStream,
      concat((data) => {
        parseString(data, function (err, result) {
          if (err) throw err;
          uploadResMessage = result;
        });
      })
    );

    if (uploadResMessage?.PostResponse) {
      console.log(uploadResMessage);
      // make bulk request
      const bulkRequestResponse: IBulkOperationRunMutationResponse =
        await graphqlClient.request(
          `
             mutation {
               bulkOperationRunMutation(
                 mutation: "${mutation}",
                 stagedUploadPath: "${uploadResMessage.PostResponse.Key[0]}"
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
    } else {
      throw new Error("JSONL Upload Failed");
    }
  } catch (e) {
    throw e;
  }
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
  return getBulkOperationStatus("MUTATION");
}

export async function getBulkQueryStatus() {
  return getBulkOperationStatus("QUERY");
}

export async function getBulkOperationStatus(type: "MUTATION" | "QUERY") {
  try {
    const query = gql`
      query {
        currentBulkOperation(type: ${type}) {
          id
          status
          errorCode
          objectCount
          url
        }
      }
    `;

    const res: ICurrentBulkOperation = await graphqlClient.request(query);

    const BusyStates = ["RUNNING", "CREATED", "CANCELING"];

    return { ...res.currentBulkOperation, BusyStates };
  } catch (error) {
    throw error;
  }
}

async function waitForBulkQueryToComplete(interval = 30000) {
  let statusData = await getBulkQueryStatus();
  if (statusData.BusyStates.includes(statusData.status)) {
    while (statusData.BusyStates.includes(statusData.status)) {
      await setTimeout(interval);
      statusData = await getBulkQueryStatus();
    }
  }
  return statusData;
}

async function bulkQueryComplete({
  query,
  lineByLine,
}: {
  query: string;
  lineByLine?: boolean;
}) {
  try {
    await waitForBulkQueryToComplete();

    const res = await bulkQuery(query);

    if (!res.bulkOperationRunQuery.bulkOperation) {
      throw new BulkOperationError({
        message: "Malformed query/mutation",
        userErrors: res.bulkOperationRunQuery.userErrors,
      });
    } else if (res.bulkOperationRunQuery.bulkOperation.status !== "CREATED") {
      throw new Error(
        `The bulk operation was not created, the current status is: ${res.bulkOperationRunQuery.bulkOperation.status}`
      );
    }

    const finishedBulkState = await waitForBulkQueryToComplete();

    if (!finishedBulkState.url) throw new Error("No url, check your query");

    const response = await fetch(finishedBulkState.url);

    if (!response.ok)
      throw new Error(`unexpected response ${response.statusText}`);

    if (lineByLine) {
      const rl = readline.createInterface({
        input: response.body as NodeJS.ReadableStream,
        crlfDelay: Infinity,
      });

      return rl;
    }

    return response.body as NodeJS.ReadableStream;
  } catch (e) {
    throw e;
  }
}
