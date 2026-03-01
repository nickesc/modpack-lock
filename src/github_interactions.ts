import * as config from "./config/index.js";
import {logm} from "./logger.js";
import type { Choice } from "prompts";

type LicenseResponse = {
    spdx_id: string;
    key: string;
};

/**
 * Fetch a list of the most popular licenses from GitHub
 * @param featured - If the fetch should be limited to featured licenses
 * @returns The list of licenses for use in a prompt
 */
export async function getLicenseList(featured: boolean = false) {
    try {
        const url: string = featured ? config.GITHUB_FEATURED_LICENSES_ENDPOINT : config.GITHUB_LICENSES_ENDPOINT;
        const response = await fetch(url, {
            headers: {
                Accept: config.GITHUB_ACCEPT_HEADER,
                "User-Agent": config.PACKAGE_USER_AGENT,
            },
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub API error (${response.status}): ${errorText}`);
        }
        const licenseList: LicenseResponse[] = (await response.json()) as LicenseResponse[];

        let licenseSpdxIds: Choice[] = licenseList.map((license: LicenseResponse): Choice => ({title: license.spdx_id, value: license.key}));

        if (!featured) {
            // get featured licenses and place them at the beginning of the list, removing them from the original list
            licenseSpdxIds.unshift(config.ALL_RIGHTS_RESERVED_LICENSE);
            licenseSpdxIds.push(config.OTHER_OPTION);
            const featuredLicenseList = await getLicenseList(true);
            for (const license of featuredLicenseList) {
                licenseSpdxIds = licenseSpdxIds.filter((id) => id.value !== license.value);
                licenseSpdxIds.unshift(license);
            }
        }

        return licenseSpdxIds;
    } catch {
        logm.warn(`Could not fetch license list. Using fallbacks.`);
        const licenses = [...config.FALLBACK_LICENSES, config.ALL_RIGHTS_RESERVED_LICENSE, config.OTHER_OPTION];
        return licenses;
    }
}

/**
 * Fetch specific license information from GitHub
 * @param {string} spdxId - The SPDX ID of the license
 * @returns {Promise<string> | null} The license text
 */
export async function getLicenseText(spdxId) {
    if (spdxId === "all-rights-reserved") {
        return config.ARR_LICENSE_TEXT;
    }
    try {
        const url = config.GITHUB_LICENSE_ENDPOINT(spdxId.toLowerCase());
        const response = await fetch(url, {
            headers: {
                Accept: config.GITHUB_ACCEPT_HEADER,
                "User-Agent": config.PACKAGE_USER_AGENT,
            },
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub API error (${response.status}): ${errorText}`);
        }

        const json = await response.json();
        if (json.body) {
            return json.body;
        } else {
            throw new Error();
        }
    } catch {
        logm.warn(`Could not find license text for: ${spdxId}`);
        return null;
    }
}
