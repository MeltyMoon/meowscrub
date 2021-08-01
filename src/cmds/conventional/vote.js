const Commando = require("discord.js-commando");
const Discord = require("discord.js");
const fetch = require("node-fetch");

module.exports = class VoteCommand extends Commando.Command {
  constructor(client) {
    super(client, {
      name: "vote",
      group: "conventional",
      memberName: "vote",
      description: "Vote the bot in top.gg!",
      clientPermissions: ["EMBED_LINKS"],
      throttling: {
        usages: 1,
        duration: 5,
      },
    });
  }

  async run(message) {
    const resJson = await fetch(
      `https://top.gg/api/bots/${this.client.user.id}/check?userId=${message.author.id}`,
      {
        headers: {
          Authorization: process.env.TOPGG_TOKEN,
        },
      }
    ).then((res) => res.json());

    let voteDesc = "";

    switch (resJson.voted) {
      case 0:
        voteDesc = `You haven't voted for **${this.client.user.username}** yet!\n[Click here to vote](https://top.gg/bot/${this.client.user.id}/vote)`;
        break;
      default:
        voteDesc = `You've voted for **${this.client.user.username}** already!`;
        break;
    }

    const voteEmbed = new Discord.MessageEmbed()
      .setColor("RANDOM")
      .setAuthor(
        `Vote for ${this.client.user.username}`,
        this.client.user.displayAvatarURL()
      )
      .setDescription(voteDesc);

    message.channel.send(voteEmbed);
  }
};