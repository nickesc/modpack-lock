# modpack-lock

Create a modpack lockfile for files hosted on Modrinth (mods, resource packs, shaders and datapacks)

## Installation

### Global Installation

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

The script will:

1. Scan the `mods`, `resourcepacks`, `datapacks`, and `shaderpacks` directories for `.jar` and `.zip` files
2. Calculate SHA1 hashes for each file
3. Query the Modrinth API to find version information
4. Generate a `modpack.lock` file in the current directory

## Output

The `modpack.lock` file has the following structure:

```json
{
  "version": "1.0.0",
  "generated": "2026-01-04T12:00:00.000Z",
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
