import { generateLockfile, generateReadmeFiles, generateGitignoreRules } from './generate_lockfile.js';
import generateJson from './generate_json.js';
import promptUserForInfo from './modpack_info.js';
import { getModpackJson, getLockfile } from './directory_scanning.js';

export default async function generateModpackFiles(modpackInfo, directory) {
    const lockfile = await generateLockfile({ path: directory });
    await generateJson(modpackInfo, lockfile, directory);
    return lockfile;
}

export { generateJson, generateLockfile, generateGitignoreRules, generateReadmeFiles, getModpackJson, getLockfile, promptUserForInfo };
