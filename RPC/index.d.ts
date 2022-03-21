declare class RpcError extends Error {
    name: string;
}
declare class Rpc {
    game: discordPresence | null;
    constructor(rpcObj?: discordPresence | null, readonly?: boolean);
    lock(): void;
    toDiscord(): {
        game: discordPresence | null;
    };
    toObject(): discordPresence;
    toString(): string;
    setName(name: string | null): this;
    setApplicationId(id: string | null): this;
    setType(type: PresenceType | number): this;
    setUrl(url: string | null): this;
    setDetails(details: string | null): this;
    setState(state: string | null): this;
    setSyncId(sync_id: string | null): this;
    setId(id: string | null): this;
    setSessionId(session_id: string | null): this;
    setParty(party: discordPresence["party"]): this;
    setFlags(flags: number | null): this;
    setCreatedAt(created_at: number | null): this;
    setAssets(assetsFunc: (AssetsObj: setAssetsObj) => void): Rpc;
    /**
     *
     * @param large_image *ID image*
     */
    setAssetsLargeImage(large_image: string | null): this;
    /**
     *
     * @param large_image *ID image*
     */
    setAssetsSmallImage(small_image: string | null): this;
    setAssetsLargeText(large_text: string | null): this;
    setAssetsSmallText(small_text: string | null): this;
    setStartTimestamp(start: number | null): this;
    setEndTimestamp(end: number | null): this;
    setPartySize(size: [number, number] | null): this;
    setPartyId(id: string | null): this;
    setJoinSecret(secret: string | null): this;
    setSpectateSecret(secret: string | null): this;
    setMatch(secret: string | null): this;
    setSecrets(secrets: discordPresence["secrets"] | null): this;
    /**
     * Twitch
     */
    setTwitchAssets(assetsFunc: (AssetsObj: setAssetsObj) => void): Rpc;
    /**
     *
     * @param large_image *ID Image*
     */
    setTwitchAssetsLargeImage(large_image: string | null): this;
    /**
     *
     * @param large_image *ID Image*
     */
    setTwitchAssetsSmallImage(small_image: string | null): this;
    /** Spotify */
    setSpotifyAssets(assetsFunc: (AssetsObj: setAssetsObj) => void): Rpc;
    /**
     *
     * @param large_image *ID Image*
     */
    setSpotifyAssetsLargeImage(large_image: string | null): this;
    /**
     *
     * @param large_image *ID Image*
     */
    setSpotifyAssetsSmallImage(small_image: string | null): this;
    private verifyNull;
    private verifyNullAssets;
    private verifyNullTimestamps;
    private verifyNullParty;
    private verifyNullSecrets;
}
declare class CustomStatus {
    game: CustomStatusGame;
    constructor(CustomStatusGame?: CustomStatusGame);
    /**
     * Name
     * @param state Name of the status
     */
    setState(state: string): CustomStatus;
    /**
     * Custom Status with Emoji Custom
     * @param emoji Object
     * emoji.name: string
     * emoji.id: string
     * emoji.animated: boolean
     */
    setDiscordEmoji(emoji: emojiLike): CustomStatus;
    /**
     * Unicode Emoji
     * @param emoji String
     */
    setUnicodeEmoji(emoji: string): CustomStatus;
    /** Convert to JSON Activity */
    toDiscord(): CustomStatusGame;
    toObject(): CustomStatusGame;
    toString(): string;
}
interface setEmojiObj {
    setName(name: string): setEmojiObj;
    setId(id: string): setEmojiObj;
    setAnimated(animated: boolean): setEmojiObj;
}
interface setAssetsObj {
    setLargeImage(img: string | null): setAssetsObj;
    setSmallImage(img: string | null): setAssetsObj;
    setLargeText(text: string | null): setAssetsObj;
    setSmallText(text: string | null): setAssetsObj;
    setNull(): setAssetsObj;
}
interface CustomStatusGame {
    name: string;
    emoji: {
        name: string;
        id: string | null;
        animated: boolean;
    } | null;
    state: string;
}
interface rpcManager {
    default?: rpcManager;
    Rpc: {
        new (rpcobj?: discordPresence): Rpc;
    };
    PresenceTypes: PresenceType[];
    PresenceTypesString: PresenceTypeString[];
    PresenceTypesNumber: PresenceTypeNumber[];
    RpcError: {
        new (message: string): RpcError;
    };
    getRpcImages(application_id: string): Promise<Image[]>;
    getRpcImage(application_id: string, name: string): Promise<Image>;
    __esModule: true;
    createSpotifyRpc(client: clientLike, rpcobj?: discordPresence): Rpc;
    version: string;
    CustomStatus: {
        new (CustomStatusGame?: CustomStatusGame): CustomStatus;
    };
}
interface emojiLike {
    id: string;
    animated: boolean;
    name: string;
    [k: string]: any;
}
interface clientLike {
    ws: {
        connection: {
            sessionID: string;
            [k: string]: any;
        };
        [k: string]: any;
    };
    user: {
        id: string;
        [k: string]: any;
    };
    [k: string]: any;
}
interface discordPresence {
    "name": string;
    "platform"?: string;
    "application_id"?: string;
    "type": PresenceTypeNumber;
    "url"?: string;
    "details"?: string;
    "state"?: string;
    "sync_id"?: string;
    "id"?: string;
    "session_id"?: string;
    "party"?: {
        "size"?: [number, number];
        "id": string;
    };
    "flags"?: number;
    "created_at"?: number;
    "assets"?: {
        "large_image"?: string;
        "small_image"?: string;
        "small_text"?: string;
        "large_text"?: string;
    };
    "timestamps"?: {
        "start"?: number;
        "end"?: number;
    };
    "secrets"?: {
        "join"?: string;
        "spectate"?: string;
        "match"?: string;
    };
}
/** getRPC {@link getRpcImage} */
declare type Image = {
    name: string;
    id: string;
    type: number;
};
declare type PresenceTypeString = "PLAYING" | "STREAMING" | "LISTENING" | "WATCHING" | "CUSTOM" | "COMPETING";
declare type PresenceTypeNumber = 0 | 1 | 2 | 3 | 4 | 5;
declare type PresenceType = PresenceTypeNumber | PresenceTypeString;
declare var rpcManager: rpcManager;
export = rpcManager;
