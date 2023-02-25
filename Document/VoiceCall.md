# Setup
- Before you use it, properly initialize the module (`@discordjs/voice` patch)

```js
new Client({
  patchVoice: true,
})
```

# Usage: Call DM / Group DM

```js
const dmChannel = client.channels.cache.get('id');
/* or
const dmChannel = User.dmChannel || await User.createDM();
*/
const connection = await dmChannel.call();
/* Return @discordjs/voice VoiceConnection */
```

# Play Music using `play-dl`

```js
const play = require('play-dl');
const {
	createAudioPlayer,
	createAudioResource,
  NoSubscriberBehavior,
} = require('@discordjs/voice');
const channel = (await (message.member.user.dmChannel || message.member.user.createDM()));
const connection = channel.voiceConnection || await channel.call();
let stream;
if (!args[0]) {
	return message.channel.send('Enter something to search for.');
} else if (args[0].startsWith('https://www.youtube.com/watch?v=')) {
	stream = await play.stream(args.join(' '));
} else {
	const yt_info = await play.search(args, {
		limit: 1
	});
	stream = await play.stream(yt_info[0].url);
}
const resource = createAudioResource(stream.stream, {
	inputType: stream.type,
	inlineVolume: true,
});
resource.volume.setVolume(0.25);
const player = createAudioPlayer({
	behaviors: {
		noSubscriber: NoSubscriberBehavior.Play,
	},
});
let i = setInterval(() => {
	const m = channel.voiceUsers.get(message.author.id);
	if (m) {
		player.play(resource);
		connection.subscribe(player);
		clearInterval(i);
	}
	else console.log('waiting for voice connection');
}, 250);
```

# Play Music with module (support Play, Pause, Search, Skip, Previous, Volume, Loop)

```js
/* Copyright aiko-chan-ai @2022. All rights reserved. */
const DjsVoice = require('@discordjs/voice');
const Discord = require('discord.js-selfbot-v13');
const playDL = require('play-dl');
const EventEmitter = require('events');
const Event = {
    READY: 'ready',
    NO_SEARCH_RESULT: 'searchNoResult',
    SEARCH_RESULT: 'searchResult',
    PLAY_SONG: 'playSong',
    ADD_SONG: 'addSong',
    ADD_PLAYLIST: 'addPlaylist',
    LEAVE_VC: 'disconnect',
    FINISH: 'finish',
    EMPTY: 'empty',
    ERROR: 'error',
}
class Stack {
    constructor() {
        this.data = [];
    }

    push(item) {
        return this.data.push(item);
    }

    pop() {
        return this.data.pop();
    }

    peek() {
        return this.data[this.length - 1];
    }

    get length() {
        return this.data.length;
    }

    isEmpty() {
        return this.length === 0;
    }

    reset () {
        this.data = [];
        return this;
    }
}

class Queue {
    constructor() {
        this.data = [];
    }

    enqueue(item) {
        return this.data.unshift(item);
    }

    dequeue() {
        return this.data.pop();
    }

    peek() {
        return this.data[this.length - 1];
    }

    get length() {
        return this.data.length;
    }

    isEmpty() {
        return this.data.length === 0;
    }

    reset() {
        this.data = [];
        return this;
    }
}
class Player extends EventEmitter {
    constructor(client, options = {}) {
        super();
        if (!client || !client instanceof Discord.Client) throw new Error('Invalid Discord Client (Selfbot)');
        Object.defineProperty(this, 'client', { value: client });
        this._playDl = playDL;
        this._queue = new Queue();
        this._previousSongs = new Stack();
        this.song = null;
        this.guild = undefined;
        this.channel = undefined;
        this._currentResourceAudio = undefined;
        this._currentTime = 0;
        this._playingTime = null;
        this.isPlaying = false;
        this.volume = 100;
        this.loopMode = 0;
        this.message = undefined;
        this._timeoutEmpty = undefined;
        this._player = DjsVoice.createAudioPlayer({
            behaviors: {
                noSubscriber: DjsVoice.NoSubscriberBehavior.Play,
            },
        });
        this._playerEvent();
        this._validateOptions(options);
        this._discordEvent();
        this._privateEvent();
    }
    get currentTime() {
        return this._currentTime || Date.now() - this._playingTime;
    }
    get currentConnection() {
        return DjsVoice.getVoiceConnection(this.guild?.id || null);
    }
    get queue() {
        return this._queue.data;
    }
    get previousSongs() {
        return this._previousSongs.data;
    }
    authorization() {
        this._playDl.authorization();
    }
    _validateOptions(options) {
        if (typeof options !== 'object') throw new Error(`Invalid options type (Required: object, got: ${typeof options})`);
        this.options = {
            directLink: true,
            joinNewVoiceChannel: true,
            waitingUserToPlayInDMs: true,
            nsfw: false,
            leaveOnEmpty: true,
            leaveOnFinish: true,
            leaveOnStop: true,
            savePreviousSongs: true,
            emptyCooldown: 10_000,
        }
        if (typeof options.directLink === 'boolean') {
            this.options.directLink = options.directLink;
        }
        if (typeof options.joinNewVoiceChannel === 'boolean') {
            this.options.joinNewVoiceChannel = options.joinNewVoiceChannel;
        }
        if (typeof options.waitingUserToPlayInDMs === 'boolean') {
            this.options.waitingUserToPlayInDMs = options.waitingUserToPlayInDMs;
        }
        if (typeof options.nsfw === 'boolean') {
            this.options.nsfw = options.nsfw;
        }
        if (typeof options.leaveOnEmpty === 'boolean') {
            if (typeof options.emptyCooldown === 'number') {
                this.options.leaveOnEmpty = options.leaveOnEmpty;
                this.options.emptyCooldown = options.emptyCooldown;
            } else {
                this.options.leaveOnEmpty = false;
            }
        }
        if (typeof options.leaveOnFinish === 'boolean') {
            this.options.leaveOnFinish = options.leaveOnFinish;
        }
        if (typeof options.leaveOnStop === 'boolean') {
            this.options.leaveOnStop = options.leaveOnStop;
        }
        if (typeof options.savePreviousSongs === 'boolean') {
            this.options.savePreviousSongs = options.savePreviousSongs;
        }
    }
    async play(options = {}) {
        const {
            message,
            channel,
            query,
        } = options;
        if (!(message instanceof Discord.Message)) throw new Error(`Invalid message type (Required: Message, got: ${typeof message})`);
        if (channel &&
            (
                channel instanceof Discord.DMChannel ||
                channel instanceof Discord.PartialGroupDMChannel ||
                channel instanceof Discord.VoiceChannel ||
                channel instanceof Discord.StageChannel
            )
        ) {
            let checkChangeVC = false;
            if (!this.channel) this.channel = channel;
            else {
                if (this.options.joinNewVoiceChannel) {
                    if (this.channel.id !== channel.id) checkChangeVC = true;
                    this.channel = channel;
                }
            }
            this.guild = channel.guild;
            this.message = message;
            if (typeof query !== 'string') throw new Error(`Invalid query type (Required: string, got: ${typeof query})`);
            const result = await this.search(message, query);
            if (result.length < 1) {
                throw new Error('No search result with the given query: ' + query);
            } else {
                for (let i = 0; i < result.length; i++) {
                    this._queue.enqueue(result[i]);
                }
                if (!this.isPlaying) {
                    this._skip(checkChangeVC);
                } else if (!result[0].playlist) {
                    this.emit(Event.ADD_SONG, result[0]);
                }
            }
        } else {
            throw new Error(`Invalid channel. Make sure the channel is a DMChannel | PartialGroupDMChannel | VoiceChannel | StageChannel.`);
        }
    }
    async search(message, query, limit = 1) {
        if (!(message instanceof Discord.Message)) throw new Error(`Invalid message type (Required: Message, got: ${typeof message})`);
        if (typeof query !== 'string') throw new Error(`Invalid query type (Required: string, got: ${typeof query})`);
        if (typeof limit !== 'number') throw new Error(`Invalid limit type (Required: number, got: ${typeof limit})`);
        if (limit < 1) {
            limit = 1;
            process.emitWarning(`Invalid limit value (Required: 1 or more, got: ${limit})`);
        };
        if (limit > 10) {
            limit = 10;
            process.emitWarning(`Invalid limit value (Required: 10 or less, got: ${limit})`);
        };
        if (/^(https?\:\/\/)?(www\.youtube\.com|youtu\.be)\/.+$/.test(query)) {
            const validateData = this._playDl.yt_validate(query);
            if (validateData == 'video') {
                const result = await this._playDl.video_info(query);
                return [result.video_details];
            } else if (validateData == 'playlist') {
                const result = await this._playDl.playlist_info(query);
                this.emit(Event.ADD_PLAYLIST, result);
                const allVideo = await result.all_videos();
                return allVideo.map(video => {
                    Object.defineProperty(video, 'playlist', { value: result });
                    return video;
                });
            } else {
                return this.emit(Event.ERROR, new Error('Invalid YouTube URL: ' + query));
            }
        } else {
            const result = await this._playDl.search(query, {
                limit,
                unblurNSFWThumbnails: this.options.nsfw,
            });
            if (result.length < 1) {
                this.emit(Event.NO_SEARCH_RESULT, message, query, limit);
                return [];
            } else {
                this.emit(Event.SEARCH_RESULT, message, result, query, limit);
                return result;
            }
        }
    }
    setLoopMode(mode) {
        if ([0, 1, 2].includes(mode)) {
            this._loopMode = mode;
        } else {
            throw new Error(`Invalid mode value (Required: 0 [No loop], 1 [Loop song], 2 [Loop queue], got: ${mode})`);
        }
    }
    async createStream(url) {
        const stream = await this._playDl.stream(url);
        const resource = DjsVoice.createAudioResource(stream.stream, {
            inputType: stream.type,
            inlineVolume: true,
        });
        this._currentResourceAudio = resource;
        this.setVolume(this.volume);
    }
    _play() {
        this._player.play(this._currentResourceAudio);
    }
    setVolume(volume) {
        if (!this._currentResourceAudio) throw new Error('No current resource audio');
        if (typeof volume !== 'number') throw new Error(`Invalid volume type (Required: number, got: ${typeof volume})`);
        if (volume < 0) {
            volume = 0;
            process.emitWarning(`Invalid volume value (Required: 0 or more, got: ${volume})`);
        } else if (volume > 100) {
            volume = 100;
            process.emitWarning(`Invalid volume value (Required: 100 or less, got: ${volume})`);
        }
        this._currentResourceAudio.volume.setVolume((volume / 100).toFixed(2));
        this.volume = (volume / 100).toFixed(2) * 100;
        return (volume / 100).toFixed(2) * 100;
    }
    pause() {
        if (!this._currentResourceAudio) throw new Error('No current resource audio');
        this._player.pause();
    }
    resume() {
        if (!this._currentResourceAudio) throw new Error('No current resource audio');
        this._player.unpause();
    }
    stop() {
        if (!this._currentResourceAudio) throw new Error('No current resource audio');
        this._stop(false, this.options.leaveOnStop);
    }
    _reset(){
        this._currentTime = 0;
        this._currentResourceAudio = null;
        this._playingTime = 0;
        this.isPlaying = false;
        this._player.stop();
    }
    _stop(finish = false, force = false) {
        if (!this._currentResourceAudio) return;
        this._queue.reset();
        this._previousSongs.reset();
        this._timeoutEmpty = undefined;
        this._reset();
        if (force || finish && this.options.leaveOnFinish) this.currentConnection?.destroy();
        this.channel = null;
        this.guild = null;
        this.song = null;
        this.volume = 100;
        this.loopMode = 0;
        this.message = null;
    }
    skip() {
        this._skip();
    }
    async _skip(checkChangeVC = false) {
        if (!this._queue.length) throw new Error('No song in the queue');
        const currentSong = this.song;
        if (this.loopMode == 0) {
            if (this.options.savePreviousSongs) this._previousSongs.push(currentSong);
            const nextSong = this._queue.dequeue();
            this.song = nextSong;
        } else if (this.loopMode == 1) {
            this.song = currentSong;
        } else if (this.loopMode == 2) {
            this._queue.enqueue(currentSong);
            const nextSong = this._queue.dequeue();
            this.song = nextSong;
        }
        await this.createStream(this.song.url);
        await this.joinVC(checkChangeVC);
        this.emit(Event.PLAY_SONG, this.song);
        if (!this.guild?.id) await this._awaitDM();
        this._play();
        this._playingTime = Date.now();
    }
    async previous() {
        if (!this._previousSongs.length) throw new Error('No previous songs');
        const currentSong = this.song;
        // add to queue
        this._queue.enqueue(currentSong);
        const previousSong = this._previousSongs.pop();
        this.song = previousSong;
        await this.createStream(this.song.url);
        await this.joinVC();
        this._play();
        this.emit(Event.PLAY_SONG, this.song, this.queue);
    }
    async joinVC(changeVC = false) {
        if (this.currentConnection && !changeVC) {
            this.currentConnection.subscribe(this._player);
        } else if (this.channel instanceof Discord.VoiceChannel) {
            const connection = DjsVoice.joinVoiceChannel({
                channelId: this.channel.id,
                guildId: this.guild.id,
                adapterCreator: this.guild.voiceAdapterCreator,
            });
            await DjsVoice.entersState(
                connection,
                DjsVoice.VoiceConnectionStatus.Ready,
                10_000,
            );
            connection.subscribe(this._player);
        } else if (this.channel instanceof Discord.StageChannel) {
            const connection = DjsVoice.joinVoiceChannel({
                channelId: this.channel.id,
                guildId: this.guild.id,
                adapterCreator: this.guild.voiceAdapterCreator,
            });
            await DjsVoice.entersState(
                connection,
                DjsVoice.VoiceConnectionStatus.Ready,
                10_000,
            );
            connection.subscribe(this._player);
            await this.channel.guild.members.me.voice
                .setSuppressed(false)
                .catch(async () => {
                    return await this.channel.guild.members.me.voice
                        .setRequestToSpeak(true);
                });
        } else {
            const connection = this.channel.voiceConnection || await this.channel.call();
            connection.subscribe(this._player);
        }
    }
    _discordEvent() {
        // Event sus .-.
        this.client.on('voiceStateUpdate', (oldState, newState) => {
            if (!this._currentResourceAudio) return;
            if (newState.guild?.id == this.guild?.id) {
                if (oldState.channel?.id !== newState.channel?.id && oldState.channel?.id && newState.channel?.id && newState.id == this.client.user.id) {
                    // change vc
                }
                if (newState.id == this.client.user.id && oldState.channel?.members?.has(this.client.user.id) && !newState.channel?.members?.has(this.client.user.id)) {
                    this._stop();
                    this.emit(Event.LEAVE_VC, this.message);  
                }
                if (newState.channel?.members?.has(this.client.user.id) && !newState.channel?.members?.filter(m => m.id != this.client.user.id && !m.bot).size) {
                    // empty
                    if (this.options.leaveOnEmpty && !this._timeoutEmpty) {
                        this._timeoutEmpty = setTimeout(() => {
                            this._stop(false, true);
                            this.emit(Event.EMPTY, this.message);
                        }, this.options.emptyCooldown);
                    }
                }
                if (newState.channel?.members?.has(this.client.user.id) && newState.channel?.members?.filter(m => m.id != this.client.user.id && !m.bot).size > 0) {
                    // not empty
                    if (this._timeoutEmpty) clearTimeout(this._timeoutEmpty);
                    this._timeoutEmpty = undefined;
                }
            } else if (!this.guild?.id && !newState.guild?.id) {
                // DM channels
                if (!newState.channel?.voiceUsers?.filter(m => m.id != this.client.user.id).size) {
                    // empty
                    if (this.options.leaveOnEmpty && !this._timeoutEmpty) {
                        this._timeoutEmpty = setTimeout(() => {
                            this._stop(false, true);
                            this.emit(Event.EMPTY, this.message);
                        }, this.options.emptyCooldown);
                    }
                }
                if (newState.channel?.voiceUsers?.filter(m => m.id != this.client.user.id).size > 0) {
                    // not empty
                    if (this._timeoutEmpty) clearTimeout(this._timeoutEmpty);
                    this._timeoutEmpty = undefined;
                }
            }
        });
    }
    _awaitDM () {
        if (!this.options.waitingUserToPlayInDMs) return true;
        return new Promise(resolve => {
            let i = setInterval(() => {
                const m = this.channel.voiceUsers.get(this.client.user.id);
                if (m) {
                    clearInterval(i);
                    resolve(true);
                }
            }, 250);
        })
    }
    _privateEvent() {
        this.on('next_song', async () => {
            await this._skip().catch(() => {
                if (this.message) this.emit(Event.FINISH, this.message);
                this._reset();
            });
        });
    }
    _playerEvent() {
        const player = this._player;
        player.on('stateChange', async (oldState, newState) => {
            // idle -> playing
            // idle -> buffering
            // buffering -> playing
            // playing -> idle 
            if (newState.status.toLowerCase() == 'idle') {
                this.isPlaying = false;
            } else if (newState.status.toLowerCase() == 'paused' || newState.status.toLowerCase() == 'autopaused') {
                this.isPlaying = false;
            } else {
                this.isPlaying = true;
            }
            this._currentTime = newState.playbackDuration;
            //
            if (oldState.status == 'playing' && newState.status == 'idle') {
                this.emit('next_song');
            }
        });
        player.on('error', (e) => {
            this.emit(Event.ERROR, e);
        });
    }
}

module.exports = Player;

/* Example
const player = new Player(client, options);

player
    .on('playSong', song => {
	    player.message.channel.send(`Now playing: ${song.title}`);
    })
	.on('addSong', song => {
		player.message.channel.send(`Added: ${song.title}`);
	})
	.on('addPlaylist', playlist => {
		player.message.channel.send(`Added Playlist: ${playlist.title}`);
	})
	.on('disconnect', (message) => {
		message.channel.send('Disconnected from voice channel.');
	})
	.on('finish', (message) => {
		message.channel.send('Finished playing.');
	})
	.on('empty', (message) => {
		message.channel.send('The queue is empty.');
	})
	.on('error', error => {
		console.log('Music error', error);
	})

client.player = player;

// Method

client.player.play({
      message,
      channel: message.member.voice.channel, // VoiceChannel | DMChannel | StageChannel | GroupDMChannel
      query: string,
});

client.player.skip();

client.player.previous();

client.player.pause();

client.player.resume();

client.player.setVolume(50); // 50%

client.player.setLoopMode(1); // 0: none, 1: song, 2: queue;

client.player.stop();

// Options

options = {
            directLink: true, // Whether or not play direct link of the song (not support)
            joinNewVoiceChannel: true, // Whether or not joining the new voice channel when using #play method
            waitingUserToPlayInDMs: true, // Waiting User join Call to play in DM channels
            nsfw: false, // Whether or not play NSFW
            leaveOnEmpty: true, // Whether or not leave voice channel when empty (not working)
            leaveOnFinish: true, // Whether or not leave voice channel when finish
            leaveOnStop: true, //  Whether or not leave voice channel when stop
            savePreviousSongs: true, // Whether or not save previous songs
            emptyCooldown: 10_000, // Cooldown when empty voice channel
}

// Properties

song = Song;
guild = Discord.Guild;
channel = Channel;
client = Discord.Client;
isPlaying = false;
volume = 100;
currentTime = Unix timestamp miliseconds;
currentConnection = VoiceConnection;
queue: Song[];
previousSongs: Song[];
loopMode = 0;
*/
```
