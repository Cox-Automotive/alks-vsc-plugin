import { Key } from "alks.js";
import fetch from "node-fetch";

const AWS_SIGNIN_URL = "https://signin.aws.amazon.com/federation",
  AWS_CONSOLE_URL = "https://console.aws.amazon.com/";

export async function generateConsoleUrl(key: Key): Promise<string> {
  const payload = {
    sessionId: key.accessKey,
    sessionKey: key.secretKey,
    sessionToken: key.sessionToken,
  };

  const endpoint = `${AWS_SIGNIN_URL}?Action=getSigninToken&SessionType=json&Session=${encodeURIComponent(
    JSON.stringify(payload)
  )}`;

  let results;
  try {
    results = await fetch(endpoint);
  } catch (e: any) {
    console.error(`Error receiving console URL: ${e.message}`);
    throw e;
  }

  if (!results || !results.ok) {
    throw new Error("Invalid response.");
  }

  const respJson = await results?.json();

  if (!respJson || !respJson.SigninToken) {
    throw new Error("Invalid response or missing token.");
  }

  return `${AWS_SIGNIN_URL}?Action=login&Destination=${encodeURIComponent(
    AWS_CONSOLE_URL
  )}&SigninToken=${encodeURIComponent(respJson.SigninToken)}`;
}
