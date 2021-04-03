const Commando = require("discord.js-commando");
const Discord = require("discord.js");

const { red, what, green } = require("../../assets/json/colors.json");

const notTimestampMsg =
  "<:scrubred:797476323169533963> THAT is not a valid timestamp.";

module.exports = class SeekMusicCommand extends Commando.Command {
  constructor(client) {
    super(client, {
      name: "seek",
      aliases: ["playhead"],
      group: "music",
      memberName: "seek",
      argsType: "single",
      description: "Seek the playhead by providing the timestamp.",
      format: "<hh:mm:ss> | <mm:ss> | <ss>",
      examples: ["seek 26", "seek 10:40", "seek 01:25:40"],
      guildOnly: true,
    });
  }

  async run(message, args) {
    const seekValue = args;
    let actualSeekValue = seekValue.split(":");
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel)
      return message.reply(
        "<:scrubnull:797476323533783050> Join an appropriate voice channel to seek."
      );

    const isPlaying = await this.client.distube.isPlaying(message);

    if (!isPlaying)
      return message.reply(
        "<:scrubnull:797476323533783050> There's no music playing. How am I supposed to seek?"
      );

    if (!seekValue)
      return message.reply(
        "<:scrubnull:797476323533783050> There's no timestamp provided to seek."
      );

    let milliseconds = Number;
    // Now converting the value into milliseconds
    if (seekValue.length < 3) {
      milliseconds = seekValue * 1000;
      if (seekValue > 59) {
        return message.reply(notTimestampMsg);
      }
    } else if (seekValue.length < 6) {
      milliseconds = +actualSeekValue[0] * 60000 + +actualSeekValue[1] * 1000;
      if (+actualSeekValue[0] > 59 || +actualSeekValue[1] > 59) {
        return message.reply(notTimestampMsg);
      }
    } else {
      milliseconds =
        +actualSeekValue[0] * 3600000 +
        +actualSeekValue[1] * 60000 +
        +actualSeekValue[2] * 1000;
      if (
        +actualSeekValue[0] > 23 ||
        +actualSeekValue[1] > 59 ||
        +actualSeekValue[2] > 59
      ) {
        return message.reply(notTimestampMsg);
      }
    }

    if (isNaN(milliseconds) || !Number.isInteger(milliseconds)) {
      message.reply(notTimestampMsg);
      return;
    }

    this.client.distube.seek(message, Number(milliseconds));
    const seekEmbed = new Discord.MessageEmbed()
      .setColor(green)
      .setDescription(
        `<:scrubgreen:797476323316465676> Moved the playhead to **${new Date(
          milliseconds
        )
          .toISOString()
          .substr(11, 8)}**.`
      );
    message.channel.send(seekEmbed);
  }
};
