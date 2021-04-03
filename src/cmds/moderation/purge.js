const Commando = require("discord.js-commando");
const Discord = require("discord.js");

const { red, green, what } = require("../../assets/json/colors.json");

module.exports = class BanCommand extends Commando.Command {
  constructor(client) {
    super(client, {
      name: "purge",
      group: "moderation",
      aliases: ["clean"],
      memberName: "purge",
      description: "Purge messages in an easy way.",
      format: "<number>",
      examples: ["purge 25"],
      argsType: "single",
      clientPermissions: ["MANAGE_MESSAGES", "READ_MESSAGE_HISTORY"],
      userPermissions: ["MANAGE_MESSAGES", "READ_MESSAGE_HISTORY"],
      guildOnly: true,
    });
  }

  async run(message, args) {
    if (!args)
      return message.reply(
        "<:scrubnull:797476323533783050> No valid numbers of messages that you want to clean..."
      );

    const amountToDelete = Number(args, 10);

    if (isNaN(amountToDelete))
      return message.reply(
        "<:scrubred:797476323169533963> Are you trying to break me using things like that?"
      );

    if (!Number.isInteger(amountToDelete))
      return message.reply(
        "<:scrubred:797476323169533963> How am I supposed to purge if the value isn't an integer?"
      );

    if (!amountToDelete || amountToDelete < 2 || amountToDelete > 100)
      return message.reply(
        "<:scrubred:797476323169533963> The value must be somewhere in-between 2 and 100."
      );

    let fetched;
    message.delete().then(() => {
      fetched = message.channel.messages.fetch({
        limit: amountToDelete,
      });
    });

    try {
      await message.channel.bulkDelete(fetched).then((messages) => {
        const purgeOKEmbed = new Discord.MessageEmbed()
          .setColor(green)
          .setDescription(
            `<:scrubgreen:797476323316465676> Successfully purged off **${messages.size}** messages.\n(Message older than 14 days can't be cleaned off due to how Discord API works.)`
          )
          .setFooter("hmmmmmmm")
          .setTimestamp();
        message.reply(purgeOKEmbed).then((msg) => {
          msg.delete({ timeout: 5000 });
        });
      });
    } catch (err) {
      message.reply(
        "<:scrubred:797476323169533963> Message older than 14 days can't be cleaned off due to how Discord API works."
      );
    }
  }
};
