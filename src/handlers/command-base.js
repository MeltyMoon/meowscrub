/* eslint-disable no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable no-inline-comments */
const Discord = require("discord.js");
const humanizeDuration = require("humanize-duration");

const util = require("../util/util");

const botInfoSchema = require("../models/bot-info-schema");
const settingsSchema = require("../models/settings-schema");
// const tagsSchema = require("../models/tags-schema");
// const userBlacklistSchema = require("../models/user-blacklist-schema");

const { denyEmoji } = require("../assets/json/tick-emoji.json");
const modPerms = require("../assets/json/mod-permissions.json");
const normalPerms = require("../assets/json/normal-permissions.json");

const cooldowns = new Map();

// validate permissions input
function validatePerms(permissions) {
  const validPerms = normalPerms.concat(modPerms);

  for (const permission of permissions) {
    if (!validPerms.includes(permission))
      throw new Error(`Invalid permission detected: "${permission}"`);
  }
}

const allCommands = {};

module.exports = (client, commandOptions) => {
  let {
    aliases = [], // [REQUIRED] the command's name and aliases
    memberName = "", // [REQUIRED] the command id
    group = "", // [REQUIRED] which group it belongs
    description = "", // [REQUIRED] basic description on a command
    details = "", // further details on a command
    format = "", // how to use the command
    examples = [], // command examples
    clientPermissions = [], // required user permissions for the client
    userPermissions = [], // required user permissions for the excecutor
    cooldown = -1, // command cooldown in seconds
    singleArgs = false, // if argument shouldn't be split every whitespace characters
    guildOnly = false, // make the command work on servers only
    ownerOnly = false, // make the command only accessible for bot owners
    guarded = false, // prevent the command from being disabled
    hidden = false, // make the command hidden from the help command
    nsfw = false, // make the command usable for nsfw channels only
    callback, // (client, message, args)
  } = commandOptions;

  if (typeof aliases === "string") aliases = [aliases];
  if (typeof examples === "string") examples = [examples];
  if (typeof clientPermissions === "string")
    clientPermissions = [clientPermissions];
  if (typeof userPermissions === "string") userPermissions = [userPermissions];

  if (!memberName) throw new Error("A command doesn't have any memberName.");
  if (typeof memberName !== "string")
    throw new Error(
      `The command ${aliases[0]} must have memberName as a string.`
    );

  if (aliases.length <= 0)
    throw new Error(`The command ${memberName} must have at least one alias.`);

  if (!description)
    throw new Error(`The command ${memberName} must have a description.`);
  if (typeof description !== "string")
    throw new Error(
      `The command ${memberName} must have the description as a string.`
    );

  if (!group)
    throw new Error(`The command ${memberName} must belong in a group.`);
  if (typeof group !== "string")
    throw new Error(
      `The command ${memberName} must have the group as a string.`
    );

  let placeholderString = "";
  client.commandGroups.forEach((grp) => {
    if (grp[0] === group) placeholderString = grp[0];
  });

  if (!placeholderString)
    throw new Error(
      `The command ${memberName} belongs in an non-existent group.`
    );

  if (nsfw && !guildOnly)
    throw new Error(
      `The command ${aliases[0]} which is marked as NSFW must be only usable in guilds.`
    );

  // transform all hyphens in aliases to blank
  const newAliases = [];
  for (let i = 0; i < aliases.length; i++) {
    const aliasPiece = aliases[i];
    const patternReplace = aliasPiece.split(/-/g).join("");
    // eslint-disable-next-line no-empty
    if (patternReplace === aliasPiece) {
    } else {
      newAliases.push(patternReplace);
    }
  }

  aliases = aliases.concat(newAliases);

  if (clientPermissions.length) {
    if (typeof clientPermissions === "string")
      clientPermissions = [clientPermissions];

    validatePerms(clientPermissions);
  }

  if (userPermissions.length) {
    if (typeof userPermissions === "string")
      userPermissions = [userPermissions];

    validatePerms(userPermissions);
  }

  for (const alias of aliases) {
    allCommands[alias] = {
      ...commandOptions,
      aliases,
      memberName,
      group,
      description,
      details,
      format,
      examples,
      clientPermissions,
      userPermissions,
      cooldown,
      singleArgs,
      guildOnly,
      ownerOnly,
      guarded,
      hidden,
      nsfw,
      callback,
    };
  }

  client.emit("debug", `Registered command ${group}:${memberName}`);
};

module.exports.listen = (client) => {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    let prefix = "";
    let pattern;

    if (message.guild) {
      if (!client.guildPrefixes[message.guild.id]) {
        const result = await util.getPrefix(message.guild.id);
        client.guildPrefixes[message.guild.id] = result;
        client.emit(
          "debug",
          `Loaded the prefix for the guild ${message.guild.id}: ${
            client.guildPrefixes[message.guild.id]
          }`
        );
      }

      prefix = client.guildPrefixes[message.guild.id] || client.settings.defaultPrefix;
    } else prefix = client.settings.defaultPrefix;

    if (message.guild)
      if (!client.commandsState[message.guild.id]) {
        const result = await settingsSchema.findOne({
          guildId: message.guild.id,
        });

        if (result && result.commands)
          client.commandsState[message.guild.id] = result.commands;
        else client.commandsState[message.guild.id] = {};

        client.emit(
          "debug",
          `Loaded all command states for the guild ${message.guild.id}`
        );
      }

    function escapeRegex(string) {
      return string.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
    }

    const escapedPrefix = escapeRegex(prefix);
    if (message.guild)
      pattern = new RegExp(
        `^(<@!?${client.user.id}>\\s+(?:${escapedPrefix}\\s*)?|${escapedPrefix}\\s*)([^\\s]+)`,
        "i"
      );
    else
      pattern = new RegExp(
        `^(<@!?${client.user.id}>\\s+(?:${escapedPrefix}?\\s*)?|${escapedPrefix}?\\s*)([^\\s]+)`,
        "i"
      );

    const patternRemovePrefix = new RegExp(
      `^(<@!?${client.user.id}>\\s+(?:${escapedPrefix}\\s*)?|${escapedPrefix}\\s*)`
    );

    // if an user tries to run a command
    if (pattern.test(message.content)) {
      // setup arguments
      let text = message.content.replace(patternRemovePrefix, "").split(/\s+/);

      // check if it's a custom command
      // if (message.guild) {
      //   const tagsConfig = await tagsSchema.findOne({
      //     guildId: message.guild.id,
      //   });

      //   if (tagsConfig) {
      //     const tag = tagsConfig.tags.find(
      //       (i) => i.name.toLowerCase() === text[0].toLowerCase()
      //     );

      //     if (tag) message.channel.send(tag.response);
      //   }
      // }

      const command = allCommands[text[0].toLowerCase()];
      if (!command) {
        return message.reply(
          denyEmoji +
            ` Unknown command. Please use \`${prefix}help\` or \`@${client.user.tag} help\` to view the command list.`
        );
      }

      const {
        aliases,
        memberName,
        group,
        description,
        details,
        format,
        examples,
        clientPermissions,
        userPermissions,
        cooldown,
        singleArgs,
        guildOnly,
        ownerOnly,
        guarded,
        hidden,
        nsfw,
        callback,
      } = command;

      client.emit("debug", `Running command ${group}:${aliases[0]}`);

      // const blacklistedRes = await userBlacklistSchema.findOne({
      //   userId: message.author.id,
      // });

      // if (blacklistedRes)
      //   return message.reply(
      //     "You are blacklisted from accessing my stuff. The only way for you to use my functionality again is to appeal."
      //   );

      if (message.guild) {
        const commandsState = client.commandsState[message.guild.id];

        if (commandsState)
          if (memberName in commandsState)
            if (!commandsState[memberName])
              return message.reply(
                denyEmoji + " That command is disabled in this server."
              );
      }

      if (ownerOnly)
        if (!client.isOwner(message.author))
          return message.reply(
            denyEmoji +
              " Messing with this command is unauthorized by regulars.\nOnly intended for bot owner(s)."
          );

      if (nsfw)
        if (message.guild)
          if (!message.channel.nsfw)
            return message.reply(
              denyEmoji + " You can only use this command in an NSFW channel."
            );

      if (guildOnly)
        if (!message.guild)
          return message.reply(
            denyEmoji + " You can only use this command in a server."
          );

      const userMissingPerms = [];
      const clientMissingPerms = [];

      if (message.guild) {
        // check if the message author doesn't have the required permissions
        const chPermissionsAuthor = message.channel
          .permissionsFor(message.author)
          .toArray();
        for (const permission of userPermissions) {
          if (!chPermissionsAuthor.includes(permission))
            userMissingPerms.push(
              permission.split("_").join(" ").toProperCase()
            );
        }

        if (userMissingPerms.length > 0)
          return message.reply(
            denyEmoji +
              ` This command requires you to have the following permission(s): \`${userMissingPerms.join(
                ","
              )}\` in order to use this command.`
          );

        // check if the client doesn't have the required permissions
        const chPermissionsClient = message.channel
          .permissionsFor(client.user.id)
          .toArray();
        for (const permission of clientPermissions) {
          if (!chPermissionsClient.includes(permission))
            clientMissingPerms.push(
              permission.split("_").join(" ").toProperCase()
            );
        }

        if (clientMissingPerms.length > 0)
          return message.reply(
            denyEmoji +
              ` I need to have the following permission(s): \`${clientMissingPerms.join(
                ","
              )}\` in order to run this command.`
          );
      }

      let timestamps, currentTime, cooldownAmount;

      if (cooldown > 0) {
        if (!cooldowns.has(memberName))
          cooldowns.set(memberName, new Discord.Collection());

        currentTime = Date.now();
        timestamps = cooldowns.get(memberName);
        cooldownAmount = cooldown * 1000;

        if (timestamps.has(message.author.id)) {
          const expirationTime =
            timestamps.get(message.author.id) + cooldownAmount;

          if (currentTime < expirationTime) {
            const timeLeft = humanizeDuration(expirationTime - currentTime);
            return message.reply(
              denyEmoji +
                ` You may not use the \`${aliases[0]}\` command again for ${timeLeft}.`
            );
          }
        }
      }

      if (cooldown > 0) {
        timestamps.set(message.author.id, currentTime);
        setTimeout(() => {
          timestamps.delete(message.author.id);
        }, cooldownAmount);
      }

      let args = message.content
        .replace(pattern, "")
        .replace(/\s+/, "")
        .split(/\s+/);

      if (singleArgs) {
        args = message.content.replace(pattern, "").replace(/\s+/, "");
      }

      callback(client, message, args)
        .then(async () => {
          let botInfo = await botInfoSchema.findOne();
          if (!botInfo) {
            await new botInfoSchema({
              cmdsExecuted: 0,
            }).save();

            botInfo = await botInfoSchema.findOne();
          }
          await botInfoSchema.updateOne({
            cmdsExecuted: botInfo.cmdsExecuted + 1,
          });
        })
        .catch(async (err) => {
          const dateTimeOptions = {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            timeZoneName: "short",
          };

          const currentDate = new Date().toLocaleDateString(
            "en-US",
            dateTimeOptions
          );

          console.log(err);
          message.channel.send(
            `
An unexpected error occurred whie executing the command.
You shouldn't receive an error like this. Please contact my owner and report the error with the text below.
\`\`\`
User: ${message.author.tag} (${message.author.id})
Command: ${memberName}
Last Ran: ${currentDate}

───── ERROR ─────
${err}
\`\`\`
          `
          );
        });
    }
  });
};
