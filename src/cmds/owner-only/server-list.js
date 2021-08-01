const Commando = require("discord.js-commando");
const Discord = require("discord.js");
const { PaginatedEmbed } = require("embed-paginator");
const botStaffSchema = require("../../models/bot-staff-schema");

module.exports = class ServerListCommand extends Commando.Command {
  constructor(client) {
    super(client, {
      name: "server-list",
      aliases: ["servers"],
      group: "owner-only",
      memberName: "server-list",
      description: "List all servers that i'm in.",
      details: "Only the bot owner(s) and bot staff(s) may use this command.",
      clientPermissions: ["EMBED_LINKS"],
      hidden: true,
    });
  }

  async run(message) {
    const isBotStaff = await botStaffSchema.findOne({
      userId: message.author.id,
    });

    // eslint-disable-next-line no-empty
    if (isBotStaff || this.client.isOwner(message.author)) {
    } else {
      return message.reply(
        "<:scrubred:797476323169533963> Messing with this command is unauthorized by regulars.\nOnly intended for bot owner(s) and bot staff(s)."
      );
    }

    const clientGuilds = this.client.guilds.cache;

    const serverList = clientGuilds
      .map(
        (guild) =>
          `**+ ${guild.name}**\n⠀• ID: \`${guild.id}\`\n⠀• Owner: \`${
            guild.owner.user.tag
          } (${guild.ownerID})\`\n⠀• \`${(
            guild.memberCount -
            guild.members.cache.filter((m) => m.user.bot).size
          ).toLocaleString()} member(s) | ${guild.members.cache
            .filter((m) => m.user.bot)
            .size.toLocaleString()} bot(s)\`\n`
      )
      .join("\n");

    const splitOutput = Discord.Util.splitMessage(serverList, {
      maxLength: 1024,
      char: "\n\n",
      prepend: "",
      append: "",
    });

    const outputEmbed = new PaginatedEmbed({
      colours: ["RANDOM"],
      descriptions: splitOutput,
      duration: 60 * 1000,
      paginationType: "description",
      itemsPerPage: 1,
    })
      .setTitle(`In ${this.client.guilds.cache.size} server(s) as of right now`)
      .setTimestamp();

    outputEmbed.send(message.channel);
  }
};