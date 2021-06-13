const Commando = require("discord.js-commando");
const Discord = require("discord.js");
const { PaginatedEmbed } = require("embed-paginator");

const { embedcolor } = require("../../assets/json/colors.json");

module.exports = class ListQueueCommand extends Commando.Command {
  constructor(client) {
    super(client, {
      name: "queue",
      group: "music",
      memberName: "queue",
      description: "Display the guild's music queue.",
      clientPermissions: ["EMBED_LINKS", "ADD_REACTIONS", "MANAGE_MESSAGES"],
      throttling: {
        usages: 1,
        duration: 5,
      },
      guildOnly: true,
    });
  }

  async run(message) {
    const queue = await this.client.distube.getQueue(message);
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel)
      return message.reply(
        "<:scrubnull:797476323533783050> Go to the same VC that I'm blasting music out to list the queue."
      );

    if (!queue)
      return message.reply("<:scrubnull:797476323533783050> There's no queue.");

    const loopSetting = queue.repeatMode
      .toString()
      .replace("0", "Disabled")
      .replace("1", "Song")
      .replace("2", "Queue");

    const autoplaySetting = queue.autoplay
      .toString()
      .replace("true", "On")
      .replace("false", "Off");

    const nowPlaying = `[${queue.songs[0].name}](${queue.songs[0].url}) | \`${queue.songs[0].formattedDuration} Requested by: ${queue.songs[0].user.tag}\``;

    const mainQueue = [...queue.songs];
    mainQueue.shift();
    const queueMap = mainQueue
      .map(
        (song, id) =>
          `\`${id + 1}.\` [${song.name}](${song.url}) | \`${song.formattedDuration} Requested by: ${song.user.tag}\`\n`
      )
      .join("\n");

    const queueList = `__Now Playing:__\n${nowPlaying}\n\n__Up Next:__\n${queueMap}`;

    const splitQueue = Discord.splitMessage(queueList, {
      maxLength: 1024,
      char: "\n",
      prepend: "",
      append: "",
    });

    const currentQueueEmbed = new PaginatedEmbed({
      colours: [embedcolor],
      descriptions: splitQueue,
      duration: 60 * 1000,
      paginationType: "description",
      itemsPerPage: 2,
    })
      .setTitle(`Queue for ${message.guild.name}`)
      .setAuthor(
        `Loop: ${loopSetting} | Volume: ${queue.volume}% | Autoplay: ${autoplaySetting}`
      );

    currentQueueEmbed.send(message.channel);
  }
};
