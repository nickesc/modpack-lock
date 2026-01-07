
<a href="https://github.com/nickesc/modpack-lock"><img alt="Source: Github" src="https://img.shields.io/badge/source-github-brightgreen?style=for-the-badge&logo=github&labelColor=%23505050"></a>
<a href="https://www.npmjs.com/package/modpack-lock"><img alt="NPM: npmjs.com/package/modpack-lock" src="https://img.shields.io/npm/v/modpack-lock?style=for-the-badge&logo=npm&logoColor=white&label=npm&color=%23C12127&labelColor=%23505050"></a>

# modpack-lock

###### by nickesc - [GitHub](https://github.com/nickesc) | [Modrinth](https://modrinth.com/user/nickesc)

Creates a modpack lockfile for files hosted on Modrinth (mods, resource packs, shaders and datapacks).


## Overview

Many mod and pack authors request that modpack creators link to Modrinth or CurseForge downloads rather than re-hosting files. This makes it difficult to track content files in version control when pushing to a remote server.

This script generates a `modpack.lock` file in the current directory containing a JSON object with a plaintext representation of the modpack's contents. This object contains the metadata for the content available on Modrinth, including hashes, versions, names, download URLs and more. This allows for easy diffing and clear version history.

> While an `.mrpack` file could be used to track changes to the modpack, it is a large, binary file that cannot be diffed and can contain large amounts of duplicate data from the rest of the repository.

The lockfile could also serve as a basis for restoring modpack contents after cloning the repository to a new machine.

## Installation

To install the script globally with `npm`:

```bash
npm install -g modpack-lock
```

Alternatively, you can run it using `npx`:

```bash
npx modpack-lock
```

## Usage

Navigate to your Minecraft profile directory (the folder containing `mods`, `resourcepacks`, `datapacks`, and `shaderpacks` folders) and run:

```bash
modpack-lock
```

Flags:

- `--dry-run` or `-d`: Print the files that would be scanned, but don't actually scan them
- `--quiet` or `-q`: Print only errors and warnings
- `--silent` or `-s`: Print nothing
- `--gitignore` or `-g`: Print the rules to add to your `.gitignore` file

The script will:

1. Scan the `mods`, `resourcepacks`, `datapacks`, and `shaderpacks` directories for `.jar` and `.zip` files
2. Calculate SHA1 hashes for each file
3. Query the Modrinth API to find version information
4. Generate a `modpack.lock` file in the current directory

Then, commit the `modpack.lock` file to your repository and push it to your remote.

> [!TIP]
>
> You can run this script as a pre-commit hook to ensure that the modpack lockfile is up to date before committing your changes to your repository.
>
> Also, consider adding these rules to your `.gitignore` to ensure you don't commit the modpack contents to your repository, with exceptions for any files that are not Modrinth-hosted:
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

## Output

The `modpack.lock` file has the following structure:

```json
{
  "version": "1.0.0",
  "generated": "2026-01-06T03:00:00.000Z",
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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for more details.
