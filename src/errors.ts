import { TbulkOperationUserErrors } from "./types";

export class BulkOperationError extends Error {
  userErrors: TbulkOperationUserErrors;
  constructor({
    message,
    userErrors,
  }: {
    message?: string;
    userErrors: TbulkOperationUserErrors;
  }) {
    super(message);
    this.userErrors = userErrors;
  }
}
