export type ContentVersionDependency = {
    version_id: string;
    project_id: string;
    file_name: string;
    dependency_type: string;
};

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
    dependencies?: ContentVersionDependency[];
};

export type ProjectResponseItem = {
    id: string; //
    project_type: string; //
    team: string; //
    published: string; //
    updated: string; //
    downloads: number; //
    followers: number; //
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

export type MinecraftVersionType = "release" | "alpha" | "beta" | "snapshot";

export type MinecraftVersionResponseItem = {
    version: string;
    version_type: MinecraftVersionType;
    date: string;
    major: boolean;
};

export type ModloaderResponseItem = {
    icon: string;
    name: string;
    supported_project_types: string[];
};

export type UserResponseItem = {
    username: string; //
    id: string; //
    created: string; //
    role: "admin" | "moderator" | "developer"; //
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
