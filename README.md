<a href="https://www.npmjs.com/package/modpack-lock"><img alt="NPM: npmjs.com/package/modpack-lock" src="https://img.shields.io/npm/v/modpack-lock?style=for-the-badge&logo=npm&logoColor=white&label=npm&color=%23C12127&labelColor=%23505050"></a>
<a href="https://github.com/nickesc/modpack-lock"><img alt="Source: Github" src="https://img.shields.io/badge/source-github-brightgreen?style=for-the-badge&logo=github&labelColor=%23505050"></a>
<a href="https://github.com/nickesc/modpack-lock/actions/workflows/generateLockfile-tests.yml"><img alt="Tests: github.com/nickesc/modpack-lock/actions/workflows/generateLockfile-tests.yml" src="https://img.shields.io/github/actions/workflow/status/nickesc/modpack-lock/modpack-lock-tests.yml?logo=github&label=tests&logoColor=white&style=for-the-badge&labelColor=%23505050"></a>

# modpack-lock

###### by nickesc - [GitHub](https://github.com/nickesc) | [Modrinth](https://modrinth.com/user/nickesc)

Creates a modpack lockfile for files hosted on Modrinth (mods, resource packs, shaders and datapacks).

## Overview

Many mod and pack authors request that modpack creators link to Modrinth or CurseForge downloads rather than re-hosting files. This makes it difficult to track content files in version control when pushing to a remote server.

This script generates a `modpack.lock` file containing a plaintext representation of the modpack's contents. This object contains the metadata for the content available on Modrinth, including hashes, versions, names, download URLs and more. An optional `modpack.json` file can also be created to store your modpack's metadata (name, version, modloader, dependencies, etc.) alongside the lockfile. This setup allows for easy diffing and clear version history.

> While an `.mrpack` file could be used to track changes to the modpack, it is a large, binary file that cannot be diffed and can contain large amounts of duplicate data from the rest of the repository.

Using the `scripts` field in `modpack.json`, you can also define reusable, tracked shell commands for common modpack tasks (like publishing, generating assets or CI/CD workflows).

## Installation

To install the script globally with `npm`:

```bash
npm install -g modpack-lock
```

Alternatively, you can run it using `npx`:

```bash
npx modpack-lock
```

## CLI

To generate a lockfile for your modpack, run:

```bash
modpack-lock
```

The script will:

- Scan target directory's `mods`, `resourcepacks`, `datapacks`, and `shaderpacks` directories for `.jar` and `.zip` files
- Calculate SHA1 hashes for each file
- Query the Modrinth API for matching versions
- Generate a `modpack.lock` file (and update `modpack.json` dependencies if present)

Use flags to generate `README.md` files for each category or print `.gitignore` rules for files that are not hosted on Modrinth.

```text
Usage: modpack-lock [options] [command]

Creates a modpack lockfile for files hosted on Modrinth (mods, resource packs, shaders and datapacks)

Options:
  -p, --path <path>       Path to the modpack directory
  -d, --dry-run           Dry-run mode - no files will be written

GENERATION
  -g, --gitignore         Print .gitignore rules for files not hosted on Modrinth
  -r, --readme            Generate README.md files for each category

LOGGING
  -q, --quiet             Quiet mode - only show errors and warnings
  -s, --silent            Silent mode - no output

INFORMATION
  -V                      output the version number
  -h, --help              display help for modpack-lock

Commands:
  init [options]          This utility will walk you through creating a modpack.json file. It only covers the most common items, and tries to guess sensible defaults.
  run [options] <script>  Run a script (shell command) defined in modpack.json's 'scripts' object
```


### Initialization

To initialize a new modpack, run:

```bash
modpack-lock init
```

This command will:

- Prompt the user for the modpack's metadata (name, version, author, etc.)
- Generate the lockfile
- Generate a `modpack.json` file that stores your modpack's metadata (name, version, author, etc.), including a list of dependencies

The interactive mode will prompt you for each field. Set their initial values using the available option flags. Use `--noninteractive` with the required options to skip the interactive-prompt and use the provided values.

```text
Usage: modpack-lock init [options]

This utility will walk you through creating a modpack.json file. It only covers the most common items, and tries to guess sensible defaults.

Options:
  -f, --folder <path>                                Path to the modpack directory
  -n, --noninteractive                               Non-interactive mode - must provide options for required fields
  --add-license                                      Add the license file to the modpack

MODPACK INFORMATION
  --name <name>                                      Modpack name; defaults to the directory name
  --version <version>                                Modpack version; defaults to 1.0.0
  --id <id>                                          Modpack slug/ID; defaults to the directory name slugified
  --description <description>                        Modpack description
  --author <author>                                  Modpack author; required
  --projectUrl <projectUrl>                          Modpack URL
  --sourceUrl <sourceUrl>                            Modpack source code URL
  --license <license>                                Modpack license
  --modloader <modloader>                            Modpack modloader; required
  --targetModloaderVersion <targetModloaderVersion>  Target modloader version
  --targetMinecraftVersion <targetMinecraftVersion>  Target Minecraft version; required

INFORMATION
  -h, --help                                         display help for modpack-lock init
```

### Running Scripts

To run a script defined in `modpack.json`, run:

```bash
modpack-lock run <script>
```

This command takes the name of the script as its first argument:

- It searches for a scripts fiels in `modpack.json` in the current directory by default.
- Use the `-f` option to specify a different path to the modpack directory.
- For debug logging, use the `-D` option.

> To pass additional arguments and options to the script, write them after a `--` separator:
>
> ```bash
> modpack-lock run <script> -- [options] <args>
> ```

The `scripts` field in `modpack.json` is a key-value pair of script names and their corresponding shell commands. The `scripts` field is optional and is omitted by default.

```text
Usage: modpack-lock run [options] <script>

Run a script (shell command) defined in modpack.json's 'scripts' object

Arguments:
  script               The name of the script to run

Options:
  -f, --folder <path>  Path to the modpack directory
  -D, --debug          Debug mode -- show more information about how the command is being parsed
  -h, --help           display help for modpack-lock run
```

## API

For programmatic usage, `modpack-lock` exports these functions:

- `getModpackInfo()`
- `getLockfile()`
- `generateJson()`
- `generateGitignoreRules()`
- `generateReadmeFiles()`
- `generateLicense()`
- `generateLockfile()`
- `generateModpackFiles()`
- `promptUserForInfo()`

See the [API documentation](https://nickesc.github.io/modpack-lock) for full details.

## File Formats

### `modpack.lock`

The lockfile contains metadata about Modrinth-hosted files found in modpack directories:

```json
{
  "version": "1.0.1",
  "generated": "2026-01-06T03:00:00.000Z",
  "total": 7,
  "counts": {
    "mods": 1,
    "resourcepacks": 3,
    "datapacks": 1,
    "shaderpacks": 2
  },
  "dependencies": {
    "mods": [
      {
        "path": "mods/example-mod.jar",
        "version": { ... }
      }
    ],
    "resourcepacks": [ ... ],
    "datapacks": [ ... ],
    "shaderpacks": [ ... ]
  }
}
```

### `modpack.json`

The JSON file contains your modpack metadata and a dependency list:

```json
{
  "name": "My Modpack",
  "version": "1.0.0",
  "id": "my-modpack",
  "description": "",
  "author": "name",
  "projectUrl": "",
  "sourceUrl": "",
  "license": "",
  "modloader": "modloader",
  "targetModloaderVersion": "",
  "targetMinecraftVersion": "x.y.z",
  "scripts": {
    "example": "echo 'example script'"
  },
  "dependencies": {
    "mods": [ ... ],
    "resourcepacks": [ ... ],
    "datapacks": [ ... ],
    "shaderpacks": [ ... ]
  }
}
```

> [!TIP] Don't commit binaries
>
> Consider adding these rules to your `.gitignore` to ensure you don't commit the modpack contents to your repository, with exceptions for any files that are not Modrinth-hosted:
>
> ```txt
> mods/*.jar
> resourcepacks/*.zip
> datapacks/*.zip
> shaderpacks/*.zip
> 
> ## Exceptions
> # !mods/example.jar
> ```
>
> Use `modpack-lock -g` to generate and print the rules for your project to the console.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for more details.

<a href="https://github.com/nickesc/modpack-lock/blob/main/LICENSE"><img class="badge-img" alt="GitHub License" src="https://img.shields.io/github/license/nickesc/modpack-lock?style=for-the-badge&labelColor=%23333&color=%230070ff"></a>
