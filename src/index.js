const { sep } = require("path");

require("dotenv").config();

const Client = require("./structures/Client"),
	{ readdirSync } = require("fs"),
	client = new Client({
		allowedMentions: {
			parse: ["roles", "users"],
			repliedUser: true,
		},
		partials: ["USER", "CHANNEL", "GUILD_MEMBER", "MESSAGE", "REACTION"],
		intents: [
			"GUILDS",
			"GUILD_MESSAGES",
			"DIRECT_MESSAGES",
			"GUILD_VOICE_STATES",
			"GUILD_PRESENCES",
		],
		// intents: 32767,
	});

// Load discord commands
for (const dir of readdirSync(`${__dirname}${sep}commands${sep}`)) {
	for (const cmd of readdirSync(`${__dirname}${sep}commands${sep}${dir}${sep}`).filter(file => file.endsWith(".js"))) {
		client.commands.load(`${__dirname}${sep}commands${sep}${dir}${sep}${cmd}`);
	}
}

// Load discord events
for (const dir of readdirSync(`${__dirname}${sep}events${sep}`)) {
	try {
		for (const file of readdirSync(`${__dirname}${sep}events${sep}${dir}${sep}`).filter(file => file.endsWith(".js"))) {
			try {
				client.events.load(`${__dirname}${sep}events${sep}${dir}${sep}${file}`, client);
			} catch { }
		}
	} catch { }
}

// Object.defineProperty(String.prototype, "toProperCase", {
// 	value: function () {
// 		return this.replace(
// 			/([^\W_]+[^\s-]*) */g,
// 			(txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
// 		);
// 	},
// });

// require("dotenv").config();

// const Discord = require("discord.js");
// const DisTube = require("distube");
// const { DiscordTogether } = require("discord-together");
// const mongoose = require("mongoose");
// const path = require("path");

// const client = new Discord.Client({
// 	allowedMentions: {
// 		parse: ["roles", "users"],
// 		repliedUser: true,
// 	},
// 	partials: ["USER", "CHANNEL", "GUILD_MEMBER", "MESSAGE", "REACTION"],
// 	intents: [
// 		"GUILDS",
// 		"GUILD_MESSAGES",
// 		"DIRECT_MESSAGES",
// 		"GUILD_VOICE_STATES",
// 		"GUILD_PRESENCES",
// 	],
// 	// intents: 32767,
// });

// // Connecting to MongoDB
// mongoose
// 	.connect(client.settings.mongoConnectionPath, {
// 		useNewUrlParser: true,
// 		useUnifiedTopology: true,
// 	})
// 	.then(() => {
// 		console.log("Successfully connected to your MongoDB Database.");
// 	});

// client.cache = {
// 	globalChat: {},
// 	playSongLog: {},
// 	userLog: "",
// 	userLogCopy: "",
// };

// client.commandsState = {};

// client.commandGroups = [
// 	["context", "Context Menu Commands", "<:context_menu:883737356283293726>"],
// 	["covid", "Covid-Related Commands", "<:virus:877817262692769813>"],
// 	["discord-together", "Discord Together", "🎮"],
// 	["economy", "Economy System", "💵"],
// 	["funs", "Really Simple Fun Stuff", "🎭"],
// 	["images", "Images API", "🖼"],
// 	["info", "Information & Such", "<:monitor:877822719004127312>"],
// 	["misc", "Miscellaneous Stuff", "<:dots:877933696890589255>"],
// 	["moderation", "Moderation Stuff", "🛠"],
// 	["music", "Music-Related Commands", "<:headphones:877930317015572581>"],
// 	["music-lib", "Short Music Library", "🎼"],
// 	["owner-only", "Owner-Only Tools", "👮‍♂️"],
// 	["settings", "Server Settings", "<:gear:877813686180405248>"],
// 	["soundboard", "Soundboard!", "🎹"],
// 	["ticket", "Ticket Managing Tools", "📩"],
// 	["util", "Utility", "🔧"],
// ];

// client.discordTogether = new DiscordTogether(client);

// client.distube = new DisTube.default(client, {
// 	emitAddSongWhenCreatingQueue: false,
// 	emitAddListWhenCreatingQueue: false,
// 	leaveOnFinish: true,
// 	youtubeDL: true,
// 	updateYouTubeDL: true,
// 	youtubeCookie: process.env.YTCOOKIE,
// });

// client.isOwner = function isOwner(user) {
// 	user = client.users.resolve(user);
// 	if (!user) throw new Error("Unable to resolve user.");
// 	if (typeof client.settings.owner === "string")
// 		return user.id === client.settings.owner;

// 	if (client.settings.owner instanceof Array)
// 		return client.settings.owner.includes(user.id);

// 	if (client.settings.owner instanceof Set)
// 		return client.settings.owner.has(user.id);

// 	throw new Error("The owner option is an unknown value.");
// };

// module.exports = client;

// require("./handlers/event-handler")(client);

// client.on("ready", async () => {
// 	await require("./handlers/command-handler")(client);
// 	await require("./handlers/slash-command-handler")(client);

// 	const settingsSchema = require("./models/settings-schema");

// 	async function loadCommandsState() {
// 		for (const guild of client.guilds.cache) {
// 			const guildId = guild[1].id;
// 			const result = await settingsSchema.findOne({
// 				guildId,
// 			});

// 			if (result && result.commands)
// 				client.commandsState[guildId] = result.commands;
// 			else client.commandsState[guildId] = {};
// 		}

// 		client.emit("debug", "Loaded all command states for all guilds.");
// 	}

// 	await loadCommandsState();

// 	console.log(
// 		"Initialized frockles (meowscrub) successfully. Give it a warm welcome."
// 	);
// });
