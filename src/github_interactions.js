import * as config from './config/index.js';


/**
 * Fetch a list of the most popular licenses from GitHub
 * @param {boolean} featured - If the fetch should be limited to featured licenses
 * @returns {Promise<Array<Object>>} The list of licenses for use in a prompt
 */
export async function getLicenseList(featured = false) {
    try {
        const url = featured ? config.GITHUB_FEATURED_LICENSES_ENDPOINT : config.GITHUB_LICENSES_ENDPOINT;
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub API error (${response.status}): ${errorText}`);
        }
        let licenseList = await response.json();

        let licenseSpdxIds = licenseList.map(license => ({ title: license.spdx_id, value: license.key }));


        if (!featured) {
            // get featured licenses and place them at the beginning of the list, removing them from the original list
            licenseSpdxIds.unshift(config.ALL_RIGHTS_RESERVED_LICENSE);
            licenseSpdxIds.push(config.OTHER_OPTION);
            const featuredLicenseList = await getLicenseList(true);
            for (const license of featuredLicenseList) {
                licenseSpdxIds= licenseSpdxIds.filter( id => id !== license );
                licenseSpdxIds.unshift(license);
            };
        }

        return licenseSpdxIds;
    } catch (error) {
        console.warn(`Warning: failed to fetch license list. Using fallbacks.`);
        const licenses = config.FALLBACK_LICENSES.push(config.ALL_RIGHTS_RESERVED_LICENSE)
        licenses.push(config.OTHER_OPTION);
        return licenses;
    }
}

/**
 * Fetch specific license information from GitHub
 * @param {string} spdxId - The SPDX ID of the license
 * @returns {Promise<string> | null} The license text
 */
export async function getLicenseText(spdxId) {
    if (spdxId === 'all-rights-reserved') {
        return config.ARR_LICENSE_TEXT;
    }
    try {
        const url = config.GITHUB_LICENSE_ENDPOINT(spdxId.toLowerCase());
        const response = await fetch(url);
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
        return null;
    } catch (error) {
        console.warn(`Warning: unable to find license text for: ${spdxId}`);
        return null;
    }
}



