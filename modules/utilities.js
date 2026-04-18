import * as ICAL from  "./ical.js"



export const TIME_HH_MM_SS_REGEX = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
export const TIME_HH_MM_REGEX    = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

export const WEEK_MS             = 604800000; // one week   in MS
export const DAY_MS              = 86400000;  // one day    in MS
export const HOUR_MS             = 3600000;   // one hour   in MS
export const MINUTE_MS           = 60000;     // one minute in MS
export const MIN_MS              = MINUTE_MS;
export const SECOND_MS           = 1000;      // one second in MS
export const SEC_MS              = SECOND_MS;


export const KB_TO_BYTES = 1000n;               // KiloByte
export const KB          = KB_TO_BYTES;         // KiloByte
export const MB_TO_BYTES = KB_TO_BYTES * 1000n; // MegaByte
export const MB          = MB_TO_BYTES;         // MegaByte
export const GB_TO_BYTES = MB_TO_BYTES * 1000n; // GigaByte
export const GB          = GB_TO_BYTES;         // GigaByte
export const TB_TO_BYTES = GB_TO_BYTES * 1000n; // TeraByte
export const TB          = TB_TO_BYTES;         // TeraByte
export const PB_TO_BYTES = TB_TO_BYTES * 1000n; // PetaByte
export const PB          = PB_TO_BYTES;         // PetaByte
export const EB_TO_BYTES = PB_TO_BYTES * 1000n; // ExaByte
export const EB          = EB_TO_BYTES;         // ExaByte, then ZettaByte (ZB,) YottaByte (YB,) RonnaByte (RB,) QuettaByte (QB)

export const KiB_TO_BYTES = 1024n;                // KibiByte
export const KiB          = KiB_TO_BYTES;         // KibiByte
export const MiB_TO_BYTES = KiB_TO_BYTES * 1024n; // MebiByte
export const MiB          = MiB_TO_BYTES;         // MebiByte
export const GiB_TO_BYTES = MiB_TO_BYTES * 1024n; // GibiByte
export const GiB          = GiB_TO_BYTES;         // GibiByte
export const TiB_TO_BYTES = GiB_TO_BYTES * 1024n; // TibiByte
export const TiB          = TiB_TO_BYTES;         // TibiByte
export const PiB_TO_BYTES = TiB_TO_BYTES * 1024n; // PibiByte
export const PiB          = PiB_TO_BYTES;         // PibiByte
export const EiB_TO_BYTES = PiB_TO_BYTES * 1024n; // ExbiByte
export const EiB          = EiB_TO_BYTES;         // ExbiByte, then ZebiByte (ZiB,) YobiByte (YiB,) RobiByte (RiB,) QuebiByte (QiB)

export const STORAGE_UNIT_MULTIPLIERS = Object.freeze(
  {
    'EB':    EB_TO_BYTES,
    'PB':    PB_TO_BYTES,
    'TB':    TB_TO_BYTES,
    'GB':    GB_TO_BYTES,
    'MB':    MB_TO_BYTES,
    'KB':    KB_TO_BYTES,
    'Bytes': 1,
    'EiB':   EiB_TO_BYTES,
    'PiB':   PiB_TO_BYTES,
    'TiB':   TiB_TO_BYTES,
    'GiB':   GiB_TO_BYTES,
    'MiB':   MiB_TO_BYTES,
    'KiB':   KiB_TO_BYTES,
  }
);




function debug(logger, ...info) {
  let msg = info.shift();

  if (logger && (typeof logger.debug === 'function')) {
    logger.debug("utilities.js#" + msg, ...info);
  } else {
    console.debug("utilities.js#" + msg, ...info);
  }
}



export function logProps(indent, key, props) {
  if (typeof props === 'object') {
    if (Array.isArray(props)) {
      if (key) {
        console.log(`${indent}${key}: ARRAY (${props.length})`);
      } else {
        console.log(`${indent}ARRAY (${props.length})`);
      }
      for (const prop of props) {
        logProps(indent + '----', "", prop);
      }
    } else {
      const entries = Object.entries(props);
      if (key) {
        console.log(`${indent}${key}:OBJECT (${entries.length})`);
      } else {
        console.log(`${indent}OBJECT (${entries.length})`);
      }
      for (const[key,value] of entries) {
         logProps(indent + '----', key, value);
      }
    }
  } else if (typeof props === 'string') {
    if (key) {
      console.log(`${indent}${typeof props} ${key}: "${props}"`);
    } else {
      console.log(`${indent}${typeof props} "${props}"`);
    }
  } else {
    if (key) {
      console.log(`${indent}${typeof props} ${key}: ${props}`);
    } else {
      console.log(`${indent}${typeof props} ${props}`);
    }
  }
}



/* Gets the userAgent String, and splits it into an array, and returns it
 *
 * Elements in the array:
 *     [0] appname/major.minor.xxx    ex: Thunderbird/128.8.0
 *     [1] appname                    ex: Thunderbird
 *     [2] major.minor.xx             ex: 128.8.0 (.xx is optional)
 *     [3] major                      ex: 128
 *     [4[ minor                      ex: 8
 *     [5] xx (optional)              ex: 0
 *     [?] if there are more '.' characters after xx, we continue for each part...
 */
export function getBrowserAndVersion() {
  var ua = navigator.userAgent;
//var M  = ua.match(/(firefox|thunderbird(?=\/))\/?\s*([^\s]*)\s*/i) || [];
  var M  = ua.match(/(thunderbird(?=\/))\/?\s*([^\s]*)\s*/i) || []; // cannot add "firefox|" in there because Thunderbird has BOTH

  if (M.length > 2) {
    var version = M[2].split('\.');
    if (version.length > 0) M = M.concat(version);
  }

  return M;
}



export function getExtensionInfo() {
  const extInfo = {};

  var manifest = messenger.runtime.getManifest();

  if (manifest) {
    extInfo['manifest_version']     = manifest.manifest_version;
    extInfo['name']                 = manifest.name;
    extInfo['short_name']           = manifest.short_name;
    extInfo['description']          = manifest.description;
    extInfo['author']               = manifest.author;
    extInfo['homepage_url']         = manifest.homepage_url;
    extInfo['version']              = manifest.version;
////extInfo['version_name']         = manifest.version_name; // not supported by Gecko (Thunderbird?)
    extInfo['default_locale']       = manifest.default_locale;
    extInfo['permissions']          = manifest.permissions;
    extInfo['optional_permissions'] = manifest.optional_permissions;

    if (manifest.developer) {
      extInfo['developer_name']     = manifest.developer.name; // if developer.name is present, it overrides author
      extInfo['developer_url']      = manifest.developer.url;  // if developer.url is present, it overrides homepage_url
    }

    if (manifest.browser_specific_settings && manifest.browser_specific_settings.gecko) { // MABXXX applications is deprecated.  Use browser_specific_settings
      const gecko = manifest.browser_specific_settings.gecko;
      extInfo['id']                          = gecko.id                          ? gecko.id                          : '';
      extInfo['strict_min_version']          = gecko.strict_min_version          ? gecko.strict_min_version          : '';
      extInfo['strict_max_version']          = gecko.strict_max_version          ? gecko.strict_max_version          : '';
      extInfo['update_url']                  = gecko.update_url                  ? gecko.update_url                  : '';
      extInfo['data_collection_permissions'] = gecko.data_collection_permissions ? gecko.data_collection_permissions : '';
    } else if (manifest.applications && manifest.applications.gecko) { // MABXXX applications is deprecated.  Use browser_specific_settings
      const gecko = manifest.applications.gecko;
      extInfo['id']                          = gecko.id                          ? gecko.id                          : '';
      extInfo['strict_min_version']          = gecko.strict_min_version          ? gecko.strict_min_version          : '';
      extInfo['strict_max_version']          = gecko.strict_max_version          ? gecko.strict_max_version          : '';
      extInfo['update_url']                  = gecko.update_url                  ? gecko.update_url                  : '';
      extInfo['data_collection_permissions'] = gecko.data_collection_permissions ? gecko.data_collection_permissions : '';
    }
  }

  return extInfo;
}

export function getExtensionId(defaultExtId) {
  var extId = defaultExtId;

  var manifest = messenger.runtime.getManifest();
  if (    manifest
       && manifest.applications
       && manifest.applications.gecko
       && manifest.applications.gecko.id
     )
  {
    extId = manifest.applications.gecko.id;
  }

  return extId;
}

export function getExtensionName(defaultExtName) {
  var extName = getI18nMsg("extensionName", defaultExtName);

  var manifest = messenger.runtime.getManifest(); // MABXXX but this is not localized!!!
  if (manifest && manifest.name) {
    extName = manifest.name;
  }

  return extName;
}

export function getExtensionVersion(defaultExtVersion) {
  var extVersion = defaultExtVersion;

  var manifest = messenger.runtime.getManifest();
  if (manifest && manifest.version) {
    extVersion = manifest.version;
  }

  return extVersion;
}

export function getExtensionAppMinVersion() {
  var minVersion;

  var manifest = messenger.runtime.getManifest();
  if (    manifest
       && manifest.applications // MABXXX applications is deprecated.  Use browser_specific_settings
       && manifest.applications.gecko
       && manifest.applications.gecko.strict_min_version
     )
  {
    minVersion = manifest.applications.gecko.strict_min_version;
  }

  return minVersion;
}

export function getExtensionAppMaxVersion() {
  var maxVersion;

  var manifest = messenger.runtime.getManifest();
  if (    manifest
       && manifest.applications // MABXXX applications is deprecated.  Use browser_specific_settings
       && manifest.applications.gecko
       && manifest.applications.gecko.strict_max_version
     )
  {
    maxVersion = manifest.applications.gecko.strict_max_version;
  }

  return maxVersion;
}



export function getI18nMsg(id, defaultMsg) {
  let i18nMessage = messenger.i18n.getMessage(id);

  if (! i18nMessage) {
    if (defaultMsg) {
      i18nMessage = defaultMsg;
    } else {
      i18nMessage = id;
    }
  }

  return i18nMessage;
}

export function getI18nMsgSubst(id, subst, defaultMsg) {
  let i18nMessage = messenger.i18n.getMessage(id, subst);

  if (! i18nMessage) {
    if (defaultMsg) {
      i18nMessage = defaultMsg;
    } else {
      i18nMessage = id;
    }
  }

  return i18nMessage;
}



export function globToRegExp(glob) {
  const regexp = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${regexp}$`);
}

export function isGlobMatch(string, glob) {
  const regexp = globToRegExp(glob);
  return regexp.test(string);
}



export function parseDocumentLocation(doc) {
  const docLocation = doc.location;

  let hostname;
  let pathname;
  let filename;
  let search;
  let params;

  if (docLocation) {
    hostname = docLocation.hostname;
    hostname = docLocation.hostname;
    pathname = docLocation.pathname;
    filename = docLocation.pathname;
    search   = docLocation.search;

    if (! pathname) {
      //debug(`XXXXXXXXXXXXXXX userChrome.js: parseWindowLocation(): Window Location has no 'pathname' XXXXXXXXXXXXXXX`);
    } else { 
      let lastSlashIndex = pathname.lastIndexOf('/');
      if (lastSlashIndex < 0) {
        //debug(`XXXXXXXXXXXXXXX userChrome.js: parseWindowLocation(): Window Location 'pathname' contains NO '/' character XXXXXXXXXXXXXXX`);
      } else {
        filename = pathname.substr(lastSlashIndex + 1);
      }
    }

    if (search) {
      params = new URLSearchParams(search)
    }
  }

  return { location: docLocation,
           hostname: hostname,
           pathname: pathname,
           filename: filename,
           search:   search,
           params:   params
         };
}



// requires permissions!!!
// - addressBooks
// - sensitiveDataUpload (optional) - to remote server for further processing
export async function makeRecipientEmailList(composeRecipients, logger) {
  // - composeRecipients: messenger.compose.ComposeRecipient or array of messenger.compose.ComposeRecipient/
  //   - messenger.compose.ComposeRecipient: String or { id, type }
  //     - id:    String - the ID of a contact from the contacts API or the ID of a mailing list from the mailingLists API.
  //     - type: 'contact' or 'mailingList'

  let emailList = "";

  if (typeof composeRecipients === 'string') {
    emailList = composeRecipients;

  } else if (typeof composeRecipients === 'object') {
    if (Array.isArray(composeRecipients)) {
      for (let recip of composeRecipients) {
        let recipEmail = getRecipientEmail(recip, logger);
        if (recipEmail) {
          if (emailList === "") {
            emailList = recipEmail;
          } else {
            emailList += ", " + recipEmail;
          }
        }
      }

    } else {
      let email = getRecipientEmail(composeRecipient, logger);
      if (email) {
        if (emailList === "") {
          emailList = email;
        } else {
          emailList += ", " + email;
        }
      }
    }
  }

  return emailList;
}

// requires permissions!!!
// - addressBooks
// - sensitiveDataUpload (optional) - to remote server for further processing
export async function getRecipientEmail(composeRecipient, logger) {
  let email = "";

  if (typeof composeRecipient === 'string') {
    debug(logger, `getRecipientEmail -- composeRecipient is a string (email address?): composeRecipient="${composeRecipient}"`);
    email = composeRecipient;

  } else if (typeof composeRecipient === 'object') {
    debug(logger, `getRecipientEmail -- composeRecipient is an Object with id="${composeRecipient.id}" type="${composeRecipient.type}"`);

    if ((typeof composeRecipient.id === 'string') && (typeof composeRecipient.type === 'string')) {
      if (composeRecipient.type === 'contact') {
        debug(logger, "getRecipientEmail -- composeRecipient is a contact");

        let contact = await messenger.contacts.get(composeRecipient.id); // messenger.contacts.ContactNode
        if (contact && contact.properties && contact.properties.vCard) { // { vCard } MABXXX ???
          debug(logger, `getRecipientEmail -- composeRecipient: contact has a vCard`);
          let vCardObj = ICAL.parse(contact.properties.vCard);
          let [ component, jCard ] = vCardObj;
          debug(logger, `getRecipientEmail -- composeRecipient: contact vCardObj component="${component}" jCard="${jCard}"`);

          if (component = 'vcard' ) {
            let emailInfo = jCard.find(e => e[0] == "email");
            debug(logger, `getRecipientEmail -- composeRecipient: contact vCardObj jCard emailInfo="${emailInfo}"`);
            if (emailInfo) {
              debug(logger, `getRecipientEmail -- composeRecipient: contact vCardObj jCard emailInfo[3]="${emailInfo[3]}"`);
              email = emailInfo[3];
            }
          }
        } else {
          debug(logger, `getRecipientEmail -- VALID contact NOT FOUND: id="${composeRecipient.id}"`);
        }

      } else if (composeRecipient.type === 'mailingList') {
        debug(logger, "getRecipientEmail -- composeRecipient is a mailingList");

        let mailingList = await messenger.mailingLists.get(composeRecipient.id); // messenger.mailingLists.MailingListNode
        if (mailingList) {
          // we're not going to get into the contacts or whether it's remote or not
          email = "list {" + mailingList.name + "}";
        } else {
          debug(logger, `getRecipientEmail -- mailingList NOT FOUND: id="${composeRecipient.id}"`);
        }

      } else {
        debug(logger, `getRecipientEmail -- UNKNOWN COMPOSE RECIPIENT TYPE: composeRecipient.type="${composeRecipient.type}"`);
      }

    } else {
      debug(logger, "getRecipientEmail -- INVALID COMPOSE RECIPIENT: MISSING OR INVALID 'id' AND/OR 'type' (expecting 'string')");
    }

  } else {
    debug(logger, `getRecipientEmail -- INVALID COMPOSE RECIPIENT: (typeof composeRecipient)='${(typeof composeRecipient)}' (expecting 'string' or 'object')`);
  }

  return email;
}



export function timeToMS(time) {
  if ((typeof time) === 'string') {
    const hh_mm_ss = time.match(TIME_HH_MM_SS_REGEX);
    if (hh_mm_ss) {
      const hour = Number(hh_mm_ss[1]);
      const min  = Number(hh_mm_ss[2]);
      const sec  = Number(hh_mm_ss[3]);
      return (hour * HOUR_MS) + (min * MINUTE_MS) + (sec * SECOND_MS);
    }

    const hh_mm = time.match(TIME_HH_MM_REGEX);
    if (hh_mm) {
      const hour = Number(hh_mm[1]);
      const min  = Number(hh_mm[2]);
      return (hour * HOUR_MS) + (min * MINUTE_MS);
    }
  }

  return 0;
}

export function msToObject(ms) {
  const absMS   = Math.abs(ms);
  const millis  = absMS % SECOND_MS;                  // MS_IN_SECOND
  const seconds = Math.floor(absMS / SECOND_MS) % 60; // SECONDS_IN_MINUTE
  const minutes = Math.floor(absMS / MINUTE_MS) % 60; // MINUTES_IN_HOUR
  const hours   = Math.floor(absMS / HOUR_MS)   % 24; // HOURS_IN_DAY
  const days    = Math.floor(absMS / DAY_MS);

  return {
    'millis':  millis,
    'seconds': seconds,
    'minutes': minutes,
    'hours':   hours,
    'days':    days,
  };
}

export function formatMsToTimePeriod(ms) {
  const p = msToObject(ms);

  var fmt = '';
  if (p.days)    fmt += p.days    + "d ";
  if (p.hours)   fmt += p.hours   + "h ";
  if (p.minutes) fmt += p.minutes + "m ";
  if (p.seconds) fmt += p.seconds + "s ";
  if (p.millis)  fmt += p.millis  + "ms ";

  return fmt ? fmt.trimEnd() : "0ms";
}

export function formatMsToElapsed(ms) {
  const p = msToObject(ms);

  var fmt = '';
  if (p.days)    fmt += p.days + "d ";
                 fmt += String(p.hours).padStart(2,'0') + ":" + String(p.minutes).padStart(2,'0')
  if (p.seconds) fmt += ":" + String(p.seconds).padStart(2,'0');
  if (p.millis)  fmt += " " + p.millis + "ms";

  return fmt ? fmt.trim() : "0ms";
}



export function formatNowToTime() {
  return formatMsToTime(Date.now());
}

export function formatMsToTime(ms) {
  const date = new Date(ms);

  const hours   = String(date.getHours()).padStart(   2, '0' );
  const minutes = String(date.getMinutes()).padStart( 2, '0' );
  const seconds = String(date.getSeconds()).padStart( 2, '0' );

  return `${hours}:${minutes}:${seconds}`;
}



export function formatNowToTimeForFilename() {
  return formatMsToTimeForFilename(Date.now());
}

export function formatMsToTimeForFilename(ms) {
  const date = new Date(ms);

  const hours   = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${hours}-${minutes}-${seconds}`;
}



export function formatNowToDateForFilename() {
  return formatMsToDateForFilename(Date.now());
}

export function formatMsToDateForFilename(ms) {
  const date = new Date(ms);

  const year    = date.getFullYear();
  const month   = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day     = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}



export function formatNowToDateTimeForFilename() {
  return formatMsToDateTimeForFilename(Date.now());
}

export function formatMsToDateTimeForFilename(ms) {
  const date = new Date(ms);

  const year    = date.getFullYear();
  const month   = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day     = String(date.getDate()).padStart(2, '0');
  const hours   = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

export function formatNowToDate() {
  return formatMsToDate(Date.now());
}

export function formatMsToDate(ms) {
  const date = new Date(ms);

  const year    = date.getFullYear();
  const month   = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day     = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatNowToDateTime24HR() {
  return formatMsToDateTime24HR(Date.now());
}

export function formatMsToDateTime24HR(ms) {
  const date = new Date(ms);

  const year    = date.getFullYear();
  const month   = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day     = String(date.getDate()).padStart(2, '0');
  const hours   = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function formatNowToDateTime12HR() {
  return formatMsToDateTime12HR(Date.now());
}

export function formatMsToDateTime12HR(ms) {
  const date = new Date(ms);

  let hrs = date.getHours();
  const ampm = hrs >= 12 ? "pm" : "am";
  hrs = hrs % 12;
  hrs = hrs ? hrs : 12; // 0 -> 12

  const year    = date.getFullYear();
  const month   = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day     = String(date.getDate()).padStart(2, '0');
  const hours   = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}${ampm}`;
}



export function getNextMidnightDelayMS() {
  const nowMS = Date.now();
  return getMidnightDelayMS(nowMS);
}

// get the time in MS at the END of the Day
export function getNextMidnightMS(timeMS) {
  const nextMidnightDate = getNextMidnightDate(timeMS);
  return nextMidnightDate.getTime();
}

// get the Date at the END of the Day
export function getNextMidnightDate(timeMS) {
  return getMidnightDate(timeMS, 0);
}

export function getMidnightDelayMS(timeMS) {
  const nextMidNightMS = getNextMidnightMS(timeMS);
  return nextMidNightMS - timeMS;
}

// get the time in MS at the BEGINNING of the Current Day
export function getCurrentDayMS() {
  return getMidnightMS(Date.now(), -1);
}

// get the time in MS at the BEGINNING of the Day (0 for today)
export function getDayMS(timeMS, numDays) { // NOTE: NOT the same as getMidnightMS()
  const midnightDate = getMidnightDate(timeMS, numDays - 1);
  return midnightDate.getTime();
}

// get the time in MS at the END of the Day (-1 for the BEGINNING of the day)
export function getMidnightMS(timeMS, numDays) {
  const midnightDate = getMidnightDate(timeMS, numDays);
  return midnightDate.getTime();
}

// get the Date at the END of the Day (-1 for the BEGINNING of the day)
export function getMidnightDate(timeMS, numDays) {
  const nextMidnightDate = new Date(timeMS + ((numDays + 1) * DAY_MS)); // <------------ adds 1 to numDays to get the midnight at the END of the day
  nextMidnightDate.setMilliseconds(0);
  nextMidnightDate.setSeconds(0);
  nextMidnightDate.setMinutes(0);
  nextMidnightDate.setHours(0);
  return nextMidnightDate;
}




export function getCurrentHourMS() {
  return getHourMS(Date.now(), 0);
}

export function getHourMS(timeMS, numHours) {
  const hourDate = getHourDate(timeMS, numHours);
  return hourDate.getTime();
}

export function getHourDate(timeMS, numHours) {
  const nextHourDate = new Date(timeMS + (numHours * HOUR_MS));
  nextHourDate.setMilliseconds(0);
  nextHourDate.setSeconds(0);
  nextHourDate.setMinutes(0);
  return nextHourDate;
}



export function getCurrentMinuteMS() {
  return getMinuteMS(Date.now(), 0);
}

export function getMinuteMS(timeMS, numMinutes) {
  const minuteDate = getMinuteDate(timeMS, numMinutes);
  return minuteDate.getTime();
}

export function getMinuteDate(timeMS, numMinutes) {
  const nextMinuteDate = new Date(timeMS + (numMinutes * MINUTE_MS));
  nextMinuteDate.setMilliseconds(0);
  nextMinuteDate.setSeconds(0);
  return nextMinuteDate;
}



export function getCurrentSecondMS() {
  return getSecondMS(Date.now(), 0);
}

export function getSecondMS(timeMS, numSeconds) {
  const secondDate = getSecondDate(timeMS, numSeconds);
  return secondDate.getTime();
}

export function getSecondDate(timeMS, numSeconds) {
  const nextSecondDate = new Date(timeMS + (numSeconds * SECOND_MS));
  nextSecondDate.setMilliseconds(0);
  return nextSecondDate;
}



export function addDays(timeMS, numDays) {
  return timeNS + (numDays * DAY_MS);
}

export function addHours(timeMS, numHours) {
  return timeNS + (numHours * HOUR_MS);
}

export function addMinutes(timeMS, numMinutes) {
  return timeNS + (numMinutes * MINUTE_MS);
}

export function addSeconds(timeMS, numSeconds) {
  return timeNS + (numSeconds * SECOND_MS);
}




/* Must be a String with at least 1 character and <= 255 characters. */
function isValidPathname(pathname) {
  return ((typeof pathname === 'string') && pathname.length >= 1 && pathname.length <= 255);
}



/* Must be a String with at least one character. 
 *
 * ILLEGAL CHARS:
 *   <
 *   >
 *   :
 *   "
 *   /
 *   \
 *   |
 *   ?
 *   *
 *   x00-x1F (control characters)
 *
 * RESERVED NAMES:
 * - con
 * - prn
 * - aux
 * - nul
 * - com0 - com9
 * - lpt0 - lpt9
 *
 * NO MORE THAN *64* CHARACTERS
 */
export function isValidFileName(filename) {
  if (typeof filename !== 'string' || filename.length < 1) return false;

  const ILLEGAL_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;
  if (ILLEGAL_CHARS.test(filename)) return false;

  const RESERVED_NAMES = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
  if (RESERVED_NAMES.test(filename)) return false;
  
  return (filename.length <= 64);
}



export function isValidEmail(email) {  // MABXXX this allows an email with a TLD like just "c" ??? I suppose you'd need some list of valid TLD's
  if (typeof email !== 'string' || email.length < 1) return false;

//const EMAIL_REGEX = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
//const EMAIL_REGEX = /^(?=[a-z0-9][a-z0-9@._%+-]{5,253}+$)[a-z0-9._%+-]{1,64}+@(?:(?=[a-z0-9-]{1,63}+\.)[a-z0-9]++(?:-[a-z0-9]++)*+\.){1,8}+[a-z]{2,63}+$/i;
  const EMAIL_REGEX = /\A(?=[a-z0-9@.!#$%&'*+/=?^_`{|}~-]{6,254}\z)(?=[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@)[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:(?=[a-z0-9-]{1,63}\.)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?=[a-z0-9-]{1,63}\z)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\z/i;
  return EMAIL_REGEX.test(email);
}



export function isValidGUID(guid) {
  if (typeof guid !== 'string' || guid.length < 1) return false;

  const ENCLOSED_GUID_REGEX   = /^\{[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\}$/;
  const UNENCLOSED_GUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  if (guid[0] === '{') return ENCLOSED_GUID_REGEX.test(guid);

  return UNENCLOSED_GUID_REGEX.test(guid);
  
}



export function isValidExtensionId(extensionId) {
  if ((typeof extensionId !== 'string') || extensionId.length < 1 || extensionId.length > 80) return false;
  const regex = /^(\{[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}|[a-z0-9]+[a-z0-9-._]*@[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,6})$/i;
  return regex.test(extensionId);
}



export function eventHasValidInputEditOrMoveKey(e) {
  const ALLOWED_CTRL_COMBO_KEYS = [ 'c', 'v', 'a', 'x' ];
  const OTHER_ALLOWED_KEYS      = [ 'Backspace', 'Insert', 'Delete', 'Tab', 'Escape', 'Enter', // Standard editing keys
                                    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',         // Arrow keys - these increment or decrement
                                    'PageUp', 'PageDown',                                      // PageUp & PageDown keys - these increment or decrement as well (???)
                                    'Home', 'End',                                             // Navigation keys
                                  ];

  const hasCtrlOrMetaKey        = e.ctrlKey || e.metaKey;

  const isAllowedSingleKey      = OTHER_ALLOWED_KEYS.includes(e.key);

  const isAllowedKey            = isAllowedSingleKey || ( hasCtrlOrMetaKey && ALLOWED_CTRL_COMBO_KEYS.includes(e.key) );

  return isAllowedKey;
}

export function eventHasValidNumberInputKey(e) {
  const DIGIT_ONLY_REGEX = /^[0-9]*$/;

  const hasCtrlOrMetaKey = e.ctrlKey || e.metaKey;
  
  const isNumber         = ! hasCtrlOrMetaKey && ! e.shiftKey && DIGIT_ONLY_REGEX.test(e.key);

  const isAllowedKey     = isNumber || eventHasValidInputEditOrMoveKey(e);

  return isAllowedKey;
}

export function eventHasValidNumberInputPasteData(e, limit) {
  const DIGIT_ONLY_REGEX = /^[0-9]*$/;
  const clipboardData    = e.clipboardData || window.clipboardData;
  const pastedData       = clipboardData.getData('Text');

  if (Number.isInteger(limit) && limit > 0 && pastedData.length > limit) return false;

  return DIGIT_ONLY_REGEX.test(pastedData);
}
