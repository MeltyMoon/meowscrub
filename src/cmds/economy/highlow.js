const Commando = require("discord.js-commando");
const Discord = require("discord.js");

const { green, red, what } = require("../../assets/json/colors.json");

const economy = require("../../economy");

module.exports = class LeaderboardCommand extends Commando.Command {
  constructor(client) {
    super(client, {
      name: "high-low",
      group: "economy",
      memberName: "high-low",
      description:
        "Guess if the actual number is higher or lower than the first provided number.",
      details: "If you guess it right, you will earn some coins.",
      guildOnly: true,
    });
  }

  async run(message) {
    function between(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }

    const actualNumber = between(15, 85);
    const hintedNumber = between(0, 100);

    const readyEmbed = new Discord.MessageEmbed()
      .setColor(what)
      .setAuthor(
        `${message.author.username}'s high-low game`,
        message.author.displayAvatarURL()
      )
      .setDescription(
        `
The actual number between 1-100 has been chosen. Your hint is **${hintedNumber}**.
Respond with \`high\`, \`low\`, or \`jackpot\`.
`
      )
      .setFooter(
        "choose whether you think the secret number is higher, lower, or the same as the hinted number"
      );
    await message.channel.send(readyEmbed);

    let winning;
    const preppedMoney = between(200, 2500);
    const passedResponse = new Discord.MessageEmbed()
      .setColor(green)
      .setAuthor(
        `${message.author.username}'s winning of a high-low game`,
        message.author.displayAvatarURL()
      )
      .setFooter("kudos to you");
    const failedResponse = new Discord.MessageEmbed()
      .setColor(red)
      .setAuthor(
        `${message.author.username}'s loss of a high-low game`,
        message.author.displayAvatarURL()
      )
      .setDescription(
        `
**You lose!**
The hint was **${hintedNumber}**, and the actual number was **${actualNumber}**.
      `
      )
      .setFooter("well, idk what to say");
    const filter = (m) => m.author.id === message.author.id;
    message.channel
      .awaitMessages(filter, {
        max: 1,
        time: 30000,
      })
      .then(async (collectedMessage) => {
        switch (collectedMessage.first().content.toLowerCase()) {
          case "high":
            if (actualNumber > hintedNumber) {
              winning = await economy.addCoins(
                message.guild.id,
                message.author.id,
                preppedMoney
              );

              passedResponse.setDescription(`
**You won ¢${preppedMoney}!**
The hint was **${hintedNumber}**, and the actual number was **${actualNumber}**.
              `);
              message.reply(passedResponse);
            } else {
              message.reply(failedResponse);
            }
            return;
          case "low":
            if (actualNumber < hintedNumber) {
              winning = await economy.addCoins(
                message.guild.id,
                message.author.id,
                preppedMoney
              );

              passedResponse.setDescription(`
**You won ¢${preppedMoney}!**
The hint was **${hintedNumber}**, and the actual number was **${actualNumber}**.
              `);
              message.reply(passedResponse);
            } else {
              message.reply(failedResponse);
            }
            return;
          case "jackpot":
            if (actualNumber === hintedNumber) {
              winning = await economy.addCoins(
                message.guild.id,
                message.author.id,
                preppedMoney
              );

              passedResponse.setDescription(`
**You won ¢${winning}!**
The hint was **${hintedNumber}**, and the actual number was **${actualNumber}**.
              `);
              message.reply(passedResponse);
            } else {
              message.reply(failedResponse);
            }
            return;
          default: {
            const invalidResponse = new Discord.MessageEmbed()
              .setColor(red)
              .setDescription(
                `
<:scrubred:797476323169533963> THAT is not a valid response.
Try the command again with these response: \`high\`, \`low\`, and \`jackpot\`.
                `
              )
              .setFooter(`the secret number was ${actualNumber} by the way`);
            message.reply(invalidResponse);
          }
        }
      })
      .catch(() => {
        message.reply("Stalling for time is not a good idea.");
      });
  }
};
