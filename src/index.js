import { generateLockfile, generateReadmeFiles, generateGitignoreRules } from './generate_lockfile.js';
import generateJson from './generate_json.js';
import promptUserForInfo from './modpack_info.js';
import { getModpackJson, getLockfile } from './directory_scanning.js';

export default async function generateModpackFiles(modpackInfo, directory) {
    generateLockfile({ path: directory })
    .then(lockfile => {
        generateJson(modpackInfo, lockfile, directory).catch(error => {
            throw new Error('Error:', error);
        });
    }, error => {
        throw new Error('Error:', error);
    });
}

export { generateJson, generateLockfile, generateGitignoreRules, generateReadmeFiles, getModpackJson, getLockfile, promptUserForInfo };
