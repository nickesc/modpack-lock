/**
 * One of the license objects in a response from the GitHub API
 * @property spdx_id - The SPDX ID of the license
 * @property key - The key of the license
 */
export type LicenseResponseItem = {
    spdx_id: string;
    key: string;
};

/**
 * The response from the GitHub API for a license text
 * @property body - The text of the license
 */
export type LicenseTextResponse = {
    body: string;
};
