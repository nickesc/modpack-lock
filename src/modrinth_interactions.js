const MODRINTH_API_BASE = 'https://api.modrinth.com/v2';
const MODRINTH_VERSION_FILES_ENDPOINT = `${MODRINTH_API_BASE}/version_files`;
const MODRINTH_PROJECTS_ENDPOINT = `${MODRINTH_API_BASE}/projects`;
const MODRINTH_USERS_ENDPOINT = `${MODRINTH_API_BASE}/users`;
const BATCH_SIZE = 100;

/**
 * Split an array into chunks of specified size
 */
function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }


/**
 * Query Modrinth API for version information from hashes
 */
export async function getVersionsFromHashes(hashes) {
  if (hashes.length === 0) {
    return {};
  }

  try {
    const response = await fetch(MODRINTH_VERSION_FILES_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hashes: hashes,
        algorithm: 'sha1',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Modrinth API error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error querying Modrinth API: ${error.message}`);
    throw error;
  }
}

/**
 * Fetch multiple projects by their IDs in batches
 */
export async function getProjects(projectIds) {
  if (projectIds.length === 0) {
    return [];
  }

  const chunks = chunkArray(projectIds, BATCH_SIZE);
  const results = [];

  for (const chunk of chunks) {
    try {
      const url = `${MODRINTH_PROJECTS_ENDPOINT}?ids=${encodeURIComponent(JSON.stringify(chunk))}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Modrinth API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      results.push(...data);
    } catch (error) {
      console.error(`Error fetching projects: ${error.message}`);
      throw error;
    }
  }

  return results;
}

/**
 * Fetch multiple users by their IDs in batches
 */
export async function getUsers(userIds) {
  if (userIds.length === 0) {
    return [];
  }

  const chunks = chunkArray(userIds, BATCH_SIZE);
  const results = [];

  for (const chunk of chunks) {
    try {
      const url = `${MODRINTH_USERS_ENDPOINT}?ids=${encodeURIComponent(JSON.stringify(chunk))}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Modrinth API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      results.push(...data);
    } catch (error) {
      console.error(`Error fetching users: ${error.message}`);
      throw error;
    }
  }

  return results;
}
