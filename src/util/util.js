/* eslint-disable no-inline-comments */
const client = require("../index");

module.exports.findCommands = (searchString = String) => {
  const lcSearch = searchString.toLowerCase();
  const matchedCommands = Array.from(
    client.commands
      .filter((cmd) => {
        return cmd.aliases.some((ali) => ali.toLowerCase().includes(lcSearch));
      })
      .values()
  );

  for (const command of matchedCommands) {
    if (command.aliases.some((ali) => ali.toLowerCase() === lcSearch)) {
      return [command];
    }
  }

  return matchedCommands;
};

module.exports.findSlashCommands = (searchString = String) => {
  const lcSearch = searchString.toLowerCase();
  const matchedCommands = Array.from(
    client.slashCommands
      .filter((cmd) => {
        return cmd.data.name.toLowerCase().includes(lcSearch);
      })
      .values()
  );

  for (const command of matchedCommands) {
    if (command.data.name.toLowerCase() === lcSearch) {
      return [command];
    }
  }

  return matchedCommands;
};

module.exports.endsWithAny = (suffixes = Array, string = String) => {
  // suffixes is an array
  return suffixes.some(function (suffix) {
    return string.endsWith(suffix);
  });
};

module.exports.getRandomString = (length = 1) => {
  const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += randomChars.charAt(
      Math.floor(Math.random() * randomChars.length)
    );
  }
  return result;
};

module.exports.trim = (string = String, max = 2048) => {
  return string.length > max ? `${string.slice(0, max - 3)}...` : string;
};

module.exports.shuffleArray = (array = []) => {
  let m = array.length;
  let t;
  let i;

  while (m) {
    i = Math.floor(Math.random() * m--);

    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
};

module.exports.formatDuration = (milliseconds) => {
  function formatInt(int) {
    if (int < 10) return `0${int}`;
    return int;
  }

  if (!milliseconds || !parseInt(milliseconds)) return "00:00";
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  const hours = Math.floor(milliseconds / 3600000);
  if (hours > 0) {
    return `${formatInt(hours)}:${formatInt(minutes)}:${formatInt(seconds)}`;
  }
  if (minutes > 0) {
    return `${formatInt(minutes)}:${formatInt(seconds)}`;
  }
  return `00:${formatInt(seconds)}`;
};

module.exports.prefixChange = async (guildId, prefix) => {
  const settingsSchema = require("../models/settings-schema");

  await settingsSchema.findOneAndUpdate(
    {
      guildId,
    },
    {
      guildId,
      $set: {
        "settings.prefix": prefix,
      },
    },
    {
      upsert: true,
    }
  );

  const results = await settingsSchema.findOne({
    guildId,
  });

  return results.settings.prefix;
};

module.exports.getPrefix = async (guildId) => {
  const settingsSchema = require("../models/settings-schema");
  const defaultPrefix = client.settings.defaultPrefix;
  let prefix;
  if (guildId) {
    const results = await settingsSchema.findOne({
      guildId,
    });

    prefix = (results ? results.settings.prefix : results)
      ? results.settings.prefix
      : defaultPrefix;
  } else {
    prefix = client.settings.defaultPrefix;
  }

  return prefix;
};

module.exports.round = (number, decimals) => {
  return Number(Math.round(number + "e" + decimals) + "e-" + decimals);
};

module.exports.hasDiscordInvite = (string = "") => {
  const pattern =
    /(h(\s+)*t(\s+)*t(\s+)*p(\s+)*(s*)(\s+)*:(\s+)*\/(\s+)*\/(\s+)*)*d(\s+)*i(\s+)*s(\s+)*c(\s+)*o(\s+)*r(\s+)*d(\s+)*(\s+)*\.(\s+)*(i(\s+)*o|g(\s+)*g|p(\s+)*l(\s+)*u(\s+)*s|l(\s+)*i(\s+)*n(\s+)*k)(\s+)*\/(\s+)*\w{1,10}/gi;

  const strSplit = string.split(" ");
  const testArray = [];

  for (const strPiece of strSplit) {
    const patternReplace = strPiece.replace(pattern, "");
    testArray.push(patternReplace);
  }

  if (testArray.join(" ") !== string) return true;
  else return false;
};

module.exports.hasURL = (string = "") => {
  // not suitable
  // const pattern = new RegExp(
  //   "^(https?:\\/\\/)?" + // protocol
  //     "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
  //     "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
  //     "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
  //     "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
  //     "(\\#[-a-z\\d_]*)?$",
  //   "i"
  // ); // fragment locator

  const pattern =
    /^((ftp|http|https):\/\/)?(www\.)?([^\s$.?#]+)\.([^\s]{2,})/gm;

  const strSplit = string.split(" ");
  const testArray = [];

  for (const strPiece of strSplit) {
    const patternReplace = strPiece.replace(pattern, "");
    testArray.push(patternReplace);
  }

  console.log(testArray.join(" "), string);
  if (testArray.join(" ") !== string) return true;
  else return false;
};

module.exports.splitString = (string = "", numberOfLines = Number) => {
  const number = Number(numberOfLines);
  if (isNaN(number)) return null;

  const regex = new RegExp(`(?:^.*$\n?){1,${number}}`, "gm");
  return string.match(regex);
};

module.exports.compareMaps = (map1, map2) => {
  let testVal;
  if (map1.size !== map2.size) {
    return false;
  }
  for (const [key, val] of map1) {
    testVal = map2.get(key);
    // in cases of an undefined value, make sure the key
    // actually exists on the object so there are no false positives
    if (
      JSON.stringify(testVal) !== JSON.stringify(val) ||
      (testVal === undefined && !map2.has(key))
    ) {
      return false;
    }
  }
  return true;
};
