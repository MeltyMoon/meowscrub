const Discord = require("discord.js");
const { pagination } = require("reconlx");

const warnSchema = require("../../models/warn-schema");

const emoji = require("../../assets/json/tick-emoji.json");

module.exports = {
  aliases: ["warnings", "warns", "warn-list", "strikes"],
  memberName: "warnings",
  group: "moderation",
  description:
    "Displays all warnings from a specified user in the current server.",
  format: "<@user | userID>",
  examples: ["warnings @frockles"],
  clientPermissions: ["EMBED_LINKS"],
  userPermissions: ["BAN_MEMBERS"],
  cooldown: 3,
  singleArgs: true,
  guildOnly: true,
  callback: async (client, message, args) => {
    if (!args)
      return message.reply(
        emoji.missingEmoji + " No specified user for listing strikes."
      );

    const dateTimeOptions = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    };

    let target;
    try {
      target =
        message.mentions.users.first() || (await client.users.fetch(args));
    } catch (err) {
      console.log(err);
      return message.reply(emoji.denyEmoji + " THAT'S not a valid user.");
    }

    const guildId = message.guild.id;
    const userTag = target.tag;
    const userAvatar = target.displayAvatarURL({ dynamic: true });
    const userId = target.id;

    const results = await warnSchema.findOne({
      guildId,
      userId,
    });

    let output = "";

    try {
      results.warnings = results.warnings.sort(
        (a, b) => b.timestamp - a.timestamp
      );

      for (const warning of results.warnings) {
        const { authorId, timestamp, warnId, reason } = warning;

        const formattedTimestamp = new Date(timestamp).toLocaleDateString(
          "en-US",
          dateTimeOptions
        );

        const author = await client.users.fetch(authorId);

        // output += `\`${warnId}: ${formattedTimestamp}\` - By **${author.tag}** (${authorId})\n**Reason:** ${reason}\n\n`;
        output += `**${warnId}**\n⠀• Date: \`${formattedTimestamp}\`\n⠀• By: \`${author.tag} (${authorId})\`\n⠀• Reason: \`${reason}\`\n\n`;
      }
    } catch (err) {
      return message.reply(
        emoji.denyEmoji + " There's no warnings for that user."
      );
    }

    if (!output)
      return message.reply(
        emoji.denyEmoji + " There's no warnings for that user."
      );

    const splitOutput = Discord.Util.splitMessage(output, {
      maxLength: 1024,
      char: "\n\n",
      prepend: "",
      append: "",
    });

    const embeds = [];

    for (let i = 0; i < splitOutput.length; i++) {
      const embed = new Discord.MessageEmbed()
        .setColor("RANDOM")
        .setAuthor(`Previous warnings for ${userTag} (${userId})`, userAvatar)
        .setDescription(splitOutput[i])
        .setFooter(`${results.warnings.length} warn(s) in total`)
        .setTimestamp();
      embeds.push(embed);
    }

    pagination({
      embeds: embeds,
      author: message.author,
      channel: message.channel,
      fastSkip: true,
      time: 60000,
      button: [
        {
          name: "first",
          emoji: emoji.firstEmoji,
          style: "PRIMARY",
        },
        {
          name: "previous",
          emoji: emoji.leftEmoji,
          style: "PRIMARY",
        },
        {
          name: "next",
          emoji: emoji.rightEmoji,
          style: "PRIMARY",
        },
        {
          name: "last",
          emoji: emoji.lastEmoji,
          style: "PRIMARY",
        },
      ],
    });
  },
};
