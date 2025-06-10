import {
  APIGatewayTokenAuthorizerEvent,
  AuthResponse,
  Callback,
  Context,
  StatementEffect,
} from "aws-lambda";
import * as dotenv from "dotenv";

dotenv.config();

export async function basicAuthorizer(
  event: APIGatewayTokenAuthorizerEvent,
  _context: Context,
  callback: Callback
) {
  if (!event.authorizationToken) {
    return callback("Unauthorized"); // Will result in 401
  }

  const encodedToken = event.authorizationToken.split(" ")[1];
  if (!encodedToken) return callback("Unauthorized");

  const decodedToken = Buffer.from(encodedToken, "base64").toString("utf-8"); // e.g. username:password
  const [username, password] = decodedToken.split(":");

  const storedPassword = process.env[username];

  if (!storedPassword || storedPassword !== password) {
    return callback(null, generatePolicy("user", "Deny", event.methodArn)); // 403
  }

  return callback(null, generatePolicy(username, "Allow", event.methodArn));
}

const generatePolicy = (
  principalId: string,
  effect: StatementEffect,
  resource: string
): AuthResponse => {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
};
