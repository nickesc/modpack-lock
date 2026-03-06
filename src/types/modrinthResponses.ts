/**
 * The shape of a dependency on another version of another project
 * @property version_id - The ID of the dependency version
 * @property project_id - The ID of the project
 * @property file_name - The name of the file
 * @property dependency_type - The type of dependency
 */
export type VersionDependency = {
    version_id: string;
    project_id: string;
    file_name: string;
    dependency_type: string;
};

/**
 * A metadata for a specific version file of a project on Modrinth. Saved in the lockfile.
 * @property id - The ID of the version
 * @property project_id - The ID of the project
 * @property author_id - The ID of the author
 * @property date_published - The date the version was published
 * @property downloads - The number of downloads of the version
 * @property files - The files of the version
 * @property game_versions - The game versions the version is compatible with
 * @property loaders - The loaders the version is compatible with
 * @property featured - Whether the version is featured
 * @property name - The name of the version
 * @property version_number - The version number
 * @property changelog - The changelog of the version
 * @property changelog_url - The URL of the changelog
 * @property version_type - The type of version
 * @property status - The status of the version
 * @property requested_status - The requested status of the version
 * @property dependencies - The dependencies for this version
 */
export type ContentVersion = {
    id: string;
    project_id: string;
    author_id: string;
    date_published: string;
    downloads: number;
    files: any[];
    game_versions?: string[];
    loaders?: string[];
    featured?: boolean;
    name?: string;
    version_number?: string;
    changelog?: string;
    changelog_url?: string | null;
    version_type?: string;
    status?: string;
    requested_status?: string | null;
    dependencies?: VersionDependency[];
};

/**
 * The shape of a project response from the Modrinth API
 */
export type ProjectResponseItem = {
    id: string;
    project_type: string;
    team: string;
    published: string;
    updated: string;
    downloads: number;
    followers: number;
    slug?: string;
    client_side?: string;
    server_side?: string;
    game_versions?: string[];
    organization?: string | null;
    title?: string;
    description?: string;
    body?: string;
    body_url?: string | null;
    approved?: string;
    queued?: string | null;
    status?: string;
    requested_status?: string | null;
    moderator_message?: string | null;
    license?: any;
    categories?: string[];
    additional_categories?: string[];
    loaders?: string[];
    versions?: string[];
    icon_url?: string;
    issues_url?: string;
    source_url?: string;
    wiki_url?: string;
    discord_url?: string;
    donation_urls?: string[];
    gallery?: string[];
    color?: number;
    thread_id?: string;
    monetization_status?: string;
};

/**
 * The types of Minecraft versions that can be returned from the Modrinth API
 */
export type MinecraftVersionType = "release" | "alpha" | "beta" | "snapshot";

/**
 * The shape of an item in the Minecraft versions response from the Modrinth API
 */
export type MinecraftVersionResponseItem = {
    version: string;
    version_type: MinecraftVersionType;
    date: string;
    major: boolean;
};

/**
 * The shape of an item in the modloaders response from the Modrinth API
 */
export type ModloaderResponseItem = {
    icon: string;
    name: string;
    supported_project_types: string[];
};

/**
 * The shape of an item in the users response from the Modrinth API
 */
export type UserResponseItem = {
    username: string;
    id: string;
    created: string;
    role: "admin" | "moderator" | "developer";
    name?: string;
    email?: string | null;
    bio?: string;
    payout_data?: any;
    avatar_url?: string;
    badges?: number;
    auth_providers?: string[];
    email_verified?: boolean | null;
    has_password?: boolean | null;
    has_totp?: boolean | null;
    github_id?: number | null;
};
