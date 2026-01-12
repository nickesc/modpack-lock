import { generateLockfile, generateReadmeFiles, generateGitignoreRules } from './generate_lockfile.js';
import generateJson from './generate_json.js';
import promptUserForInfo from './modpack_info.js';
import { getModpackInfo, getLockfile } from './directory_scanning.js';

async function generateModpackFiles(modpackInfo, directory, options = {}) {
    const lockfile = await generateLockfile(directory, options);
    await generateJson(modpackInfo, lockfile, directory, options);
    return lockfile;
}

export { generateModpackFiles, generateJson, generateLockfile, generateGitignoreRules, generateReadmeFiles, getModpackInfo, getLockfile, promptUserForInfo };
