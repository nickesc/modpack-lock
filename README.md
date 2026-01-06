
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

## Future Plans

- [ ] Add support for CurseForge
- [ ] Add support for restoring modpack contents using the lockfile
- [ ] Add CLI option to generate .md files for each category that lists the avaiable content
- [ ] add fields in each category for count of mods (including unhosted)
- [ ] create a modpack.json counterpart to the modpack.lock file
  - [ ] add a field for version
  - [ ] add a field for id
  - [ ] add a field for author
  - [ ] add a field for license
  - [ ] add a field for dependencies
  - [ ] add a field for modloader
  - [ ] add a field for target minecraft version
  - [ ] add a field for target loader version
  - [ ] add optional field for description
  - [ ] add optional field for project URL
  - [ ] add optional field for source URL
  - [ ] add optional field for issues URL
  - [ ] add optional field for renderer
  - [ ] add optional field for tags
  - [ ] add optional field for categories
  - [ ] add custom location(s) for outputted modpack.json (for use with mods like fancymenu that have an assets folder)
- [ ] build create-modpack-json npx script to create a modpack.json file from the modpack.lock file and user input

Feel free to submit a pull request working on any of the above, or open an issue for any feature requests or bug reports.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for more details.
