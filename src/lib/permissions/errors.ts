export class PermissionWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionWorkflowError";
  }
}
