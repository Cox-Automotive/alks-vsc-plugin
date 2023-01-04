import * as ALKS from "alks.js";
import { Settings } from "./settings";

/**
 * Creats an ALKS client and exchanges the refresh token for an access token.
 *
 * @returns {Promise<ALKS.Alks>} Authenticated ALKS client
 * @throws {Error} Thrown on invalid refresh token or ALKS server error.
 */
export const getALKSClient = async (): Promise<ALKS.Alks> => {
  let client: ALKS.Alks;
  let accessToken: ALKS.AccessToken;

  try {
    client = ALKS.create({
      baseUrl: Settings.instance.getServer(),
    } as ALKS.AlksProps);
    const refreshToken = await Settings.instance.getRefreshToken();
    console.log(`Exchanging refresh token for access token`);
    accessToken = await client.getAccessToken({
      refreshToken,
    } as ALKS.GetAccessTokenProps);
    console.log(`Got access token!`);
  } catch (e: any) {
    console.error(
      `Error exchanging refresh token for access token: "${e?.message}". Purging existing refresh token.`
    );

    throw new Error("Unable to authenticate token.");
  }
  Settings.instance.deleteRefreshToken();

  try {
    console.log(`Creating ALKS client with access token auth.`);
    client = ALKS.create({
      baseUrl: Settings.instance.getServer()!,
      accessToken: accessToken.accessToken,
    });
  } catch (e: any) {
    console.error(`Error instantiating client: ${e?.message}`);
    throw new Error("Unable to connect to ALKS server.");
  }

  return client;
};

/**
 * Validates that an ALKS refresh token is valid.
 * @param {string} token Refresh token
 * @returns {Promise<boolean>} Boolean representing validity.
 */
export const isValidRefreshToken = async (token: string): Promise<boolean> => {
  try {
    console.log("Validating refresh token from user.");
    await ALKS.getAccessToken({
      baseUrl: Settings.instance.getServer(),
      refreshToken: token,
    });
  } catch (e: any) {
    console.error(`Invalid resource token supplied: ${e.message}`);
    return false;
  }

  return true;
};

/**
 * Parses the account and role from an account/role string.
 * @param {string} acct Account role string
 * @returns {[string, string]} Tuple containing account and role
 * @throws {Error} Thrown on an invalid account selection.
 */
export const getAccountAndRole = (acct: string | undefined): [string, string] => {
  const role = acct?.match(/(?<=\/).+?(?=\s)/g)?.[0];

  if (!acct || !role) {
    throw new Error(
      'Invalid account selected. Account should be in format "#####/role - name"'
    );
  }

  return [acct.split("/")[0], role];
};

/**
 * Retrieves the ALKS accounts available to the current user.
 * @returns {Promise<ALKS.Account[]>} Array of accounts
 */
export const getAccounts = async (): Promise<ALKS.Account[]> => {
  const client = await getALKSClient();
  const accounts: ALKS.Account[] = await client.getAccounts();

  return accounts;
};