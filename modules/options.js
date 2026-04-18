import { FileSystemBrokerAPI } from '../modules/FileSystemBroker/filesystem_broker_api.js';
import * as utils              from './utilities.js';



//const TIME_HH_MM_SS_REGEX = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
//const TIME_HH_MM_REGEX    = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
//const HOUR_MS             = 3600000;
//const MIN_MS              = 60000;
//const SEC_MS              = 1000;

const BACKUP_FILENAME_EXTENSION  = ".fsbbackup";
const BACKUP_FILENAME_MATCH_GLOB = "*.fsbbackup";



/*************************************************************************************************************************************************/
/*************************************************************************************************************************************************/
/********************* YOU MUST CALL setupDefaultOptions() BEFORE DOING ANYTHING ELSE WITH THIS CLASS ********************************************/
/*************************************************************************************************************************************************/
/*************************************************************************************************************************************************/

export class FsbOptions {
  static #CLASS_NAME = this.constructor.name;

  static #OUR_EXTENSION_INFO;  // initialized in setupDefaultOptions()
  static #OUR_EXTENSION_PROPS; // initialized in setupDefaultOptions()
  static #EXTENSION_ID;        // initialized in setupDefaultOptions()
  static #EXTENSION_NAME;      // initialized in setupDefaultOptions()

  static #INFO  = false;
  static #LOG   = false;
  static #DEBUG = false;
  static #WARN  = false;


  static #DEFAULT_OPTION_KEYS = [
    'fsbExtensionAccessControlEnabled',
    'fsbShowGrantExtensionAccessDialog',
    'fsbShowOptionsWindowOnStartup', 
    'fsbSkipOnboardingEnabled',
    'fsbEnableConsoleLog',
    'fsbEnableConsoleDebug',
    'fsbEnableConsoleDebugTrace',
    'fsbEnableConsoleWarn',
    'fsbEnableConsoleErrorTrace',
    'fsbEnableAccessLogging',
    'fsbEnableAccessDeniedLogging',
    'fsbEnableInternalMessageLogging',
    'fsbEnableInternalMessageResultLogging',
    'fsbEnableExternalMessageLogging',
    'fsbEnableExternalMessageResultLogging',
    'fsbEnableInternalEventLogging',
    'fsbShowLoggingOptions',
    'fsbAutoLogPurgeDays',
    'fsbAutoRemoveUninstalledExtensionsDays',
    'fsbShowOptionsHints',
    'fsbShowOptionsActions',
    'fsbShowExtensionChooserInstructions',
    'fsbShowBackupManagerInstructions',
    'fsbShowEventLogManagerInstructions',
    'fsbShowStorageManagerInstructions',
    'fsbOnRemoveExtensionDeleteDirectory',
    'fsbStorageQuotaEnabled',
    'fsbStorageQuota',
    'fsbStorageQuotaUnit',
    'fsbFileSizeQuotaEnabled',
    'fsbFileSizeQuota',
    'fsbFileSizeQuotaUnit',
    'fsbFileCountQuotaEnabled',
    'fsbFileCountQuota',
    'fsbFileCountQuotaUnit',
    'fsbQuotaCheckSchedulingBlocked',         // if you change this name you must also change it in the QuotaManager (modules/quotas.js)
    'fsbQuotaCheckEnabled',                   // if you change this name you must also change it in the QuotaManager (modules/quotas.js)
    'fsbQuotaCheckUnit',                      // if you change this name you must also change it in the QuotaManager (modules/quotas.js)
    'fsbQuotaCheckDays',                      // if you change this name you must also change it in the QuotaManager (modules/quotas.js)
    'fsbQuotaCheckDaysTimeOffset',            // if you change this name you must also change it in the QuotaManager (modules/quotas.js)
    'fsbQuotaCheckHours',                     // if you change this name you must also change it in the QuotaManager (modules/quotas.js)
    'fsbQuotaCheckHoursMinuteOffset',         // if you change this name you must also change it in the QuotaManager (modules/quotas.js)
    'fsbQuotaCheckMinutes',                   // if you change this name you must also change it in the QuotaManager (modules/quotas.js)
    'fsbQuotaCheckMinutesMinuteOffset',       // if you change this name you must also change it in the QuotaManager (modules/quotas.js)
  ];

  static #DEFAULT_OPTION_VALUES = {
    'fsbExtensionAccessControlEnabled':       true,        // boolean
    'fsbShowGrantExtensionAccessDialog':      false,       // boolean
    'fsbShowOptionsWindowOnStartup':          false,       // boolean
    'fsbSkipOnboardingEnabled':               false,       // boolean
    'fsbEnableConsoleLog':                    false,       // boolean
    'fsbEnableConsoleDebug':                  false,       // boolean
    'fsbEnableConsoleDebugTrace':             false,       // boolean
    'fsbEnableConsoleWarn':                   false,       // boolean
    'fsbEnableConsoleErrorTrace':             false,       // boolean
    'fsbEnableAccessLogging':                 false,       // boolean
    'fsbEnableAccessDeniedLogging':           true,        // boolean
    'fsbEnableInternalMessageLogging':        false,       // boolean
    'fsbEnableInternalMessageResultLogging':  true,        // boolean
    'fsbEnableExternalMessageLogging':        false,       // boolean
    'fsbEnableExternalMessageResultLogging':  true,        // boolean
    'fsbEnableInternalEventLogging':          true,        // boolean
    'fsbShowLoggingOptions':                  true,        // boolean
    'fsbAutoLogPurgeDays':                    14,          // integer
    'fsbAutoRemoveUninstalledExtensionsDays': 2,           // integer
    'fsbShowOptionsHints':                    true,        // boolean
    'fsbShowOptionsActions':                  true,        // boolean
    'fsbShowExtensionChooserInstructions':    true,        // boolean
    'fsbShowBackupManagerInstructions':       true,        // boolean
    'fsbShowEventLogManagerInstructions':     true,        // boolean
    'fsbShowStorageManagerInstructions':      true,        // boolean
    'fsbOnRemoveExtensionDeleteDirectory':    true,        // boolean
    'fsbStorageQuotaEnabled':                 false,       // boolean
    'fsbStorageQuota':                        1,           // integer
    'fsbStorageQuotaUnit':                    'MB',        // string
    'fsbFileSizeQuotaEnabled':                false,       // boolean
    'fsbFileSizeQuota':                       1,           // integer
    'fsbFileSizeQuotaUnit':                   'KB',        // string
    'fsbFileCountQuotaEnabled':               false,       // boolean
    'fsbFileCountQuota':                      1,           // integer
    'fsbFileCountQuotaUnit':                  '1',         // string
    'fsbQuotaCheckSchedulingBlocked':         true,        // boolean
    'fsbQuotaCheckEnabled':                   true,        // boolean
    'fsbQuotaCheckUnit':                      'daily',     // string:    'daily', 'hourly', 'minutely'
    'fsbQuotaCheckDays':                      1,           // integer:   1 - 7 days
    'fsbQuotaCheckDaysTimeOffset':           '00:00:00',   // string:    00:00:00 - 23:59:59
    'fsbQuotaCheckHours':                     4,           // integer:   1 - 23 hours
    'fsbQuotaCheckHoursMinuteOffset':         0,           // integer:   0 - 59 minutes after the hour
    'fsbQuotaCheckMinutes':                   15,          // integer:   5, 10, 25, 20, 25, 30, 35, 40, 45 minutes
    'fsbQuotaCheckMinutesMinuteOffset':       0,           // integer:   0 - 59 ??? (depends on fsbQuotaCheckMinutes ??? perhaps 0 - fsbQuotaCheckMinutes-1 ???)
  };

  static {
    Object.freeze(FsbOptions.#DEFAULT_OPTION_KEYS);
    Object.freeze(FsbOptions.#DEFAULT_OPTION_VALUES);
  }



  #logger;
  #fsbEventLogger;
  #fsBrokerApi;

  #settingDefaultOptions = false;

  #optionChangeListeners = new Map();





  constructor(logger, fsbEventLogger) {
    this.#logger         = logger;
    this.#fsbEventLogger = fsbEventLogger;
    this.#fsBrokerApi    = new FileSystemBrokerAPI();

    messenger.storage.onChanged.addListener( async ( storageChanges, areaName ) => this.#storageChanged(storageChanges, areaName) );
  }

  setEventLogger(fsbEventLogger) {
    this.#fsbEventLogger = fsbEventLogger;
  }


  
  info(...info) {
    if (FsbOptions.#INFO)  {
      if (this.#logger) {
        this.#logger.info(FsbOptions.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
      } else {
        console.info(FsbOptions.#EXTENSION_ID + "." + FsbOptions.#CLASS_NAME, ...info);
      }
    }
  }
  
  infoAlways(...info) {
    if (this.#logger) {
      this.#logger.infoAlways(FsbOptions.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
    } else {
      console.info(FsbOptions.#EXTENSION_ID + "." + FsbOptions.#CLASS_NAME, ...info);
    }
  }

  
  log(...info) {
    if (FsbOptions.#LOG)  {
      if (this.#logger) {
        this.#logger.log(FsbOptions.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
      } else {
        console.log(FsbOptions.#EXTENSION_ID + "." + FsbOptions.#CLASS_NAME, ...info);
      }
    }
  }
  
  logAlways(...info) {
    if (this.#logger) {
      this.#logger.logAlways(FsbOptions.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
    } else {
      console.log(FsbOptions.#EXTENSION_ID + "." + FsbOptions.#CLASS_NAME, ...info);
    }
  }

  debug(...info) {
    if (FsbOptions.#DEBUG) {
      if (this.#logger) {
        this.#logger.debug(FsbOptions.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
      } else {
        console.debug(FsbOptions.#EXTENSION_ID + "." + FsbOptions.#CLASS_NAME, ...info);
      }
    }
  }

  debugAlways(...info) {
    if (this.#logger) {
      this.#logger.debugAlways(FsbOptions.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
    } else {
      console.debug(FsbOptions.#EXTENSION_ID + "." + FsbOptions.#CLASS_NAME, ...info);
    }
  }

  warn(...info) {
    if (FsbOptions.#WARN) {
      if (this.#logger) {
        this.#logger.warn(FsbOptions.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
      } else {
        console.warn(FsbOptions.#EXTENSION_ID + "." + FsbOptions.#CLASS_NAME, ...info);
      }
    }
  }

  warnAlways(...info) {
    if (this.#logger) {
      this.#logger.warnAlways(FsbOptions.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
    } else {
      console.warn(FsbOptions.#EXTENSION_ID + "." + FsbOptions.#CLASS_NAME, ...info);
    }
  }

  error(...info) {
    if (this.#logger) {
      this.#logger.error(FsbOptions.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
    } else {
      console.error(FsbOptions.#EXTENSION_ID + "." + FsbOptions.#CLASS_NAME, ...info);
    }
  }

  caught(e, msg, ...info) {
    // always log exceptions
    if (this.#logger) {
      this.#logger.error( FsbOptions.#CLASS_NAME,
                         msg,
                         "\n- name:    " + e.name,
                         "\n- message: " + e.message,
                         "\n- stack:   " + e.stack,
                         ...info
                   );
    } else {
      console.error( FsbOptions.#EXTENSION_ID,
                     msg,
                     "\n- name:    " + e.name,
                     "\n- message: " + e.message,
                     "\n- stack:   " + e.stack,
                     ...info
                   );
    }
  }



  async #storageChanged(storageChanges, areaName) {
    if (areaName === 'local') {
      await this.#callOptionChangedListeners(storageChanges);
    }
  }

  async addOptionChangeListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error("listener is not a function");
    }

    this.#optionChangeListeners.set(listener, new WeakRef(listener));
  }

  async removeOptionChangeListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error("listener is not a function");
    }

    if (! this.#optionChangeListeners.has(listener)) {
      throw new Error("listener is not in the list of listeners");
    }

    this.#optionChangeListeners.delete(listener);
  }

  async #callOptionChangedListeners(storageChanges) {
    // storageChanges is an object:
    // - the key:   a string, the name of the property that changed
    // - the value: an object, messenger.storage.StorageChange: { 'oldValue': old value (optional), 'newValue': new value (optional) }

    // handle internal 'listener' first
    for (const [key, change] of Object.entries(storageChanges)) {
      await this.#optionChanged(key, change.newValue, change.oldValue);
    }

    for (const [key, change] of Object.entries(storageChanges)) {
      for (const [listener, weakRef] of this.#optionChangeListeners) {
        const listenerRef = weakRef.deref();
        if (! listenerRef) {
          this.#optionChangeListeners.delete(listener);
        } else {
          try {
            setTimeout( () => listenerRef(key, change.newValue, change.oldValue), 0 );
          } catch (ignore) { }
        }
      }
    }
  }

  async #optionChanged(key, newValue, oldValue) {
////this.debug("\n\n------ #optionChanged:", `\n --- key="${key}":  newValue="${newValue}" oldValue="${oldValue}"`, "\n\n");
  }



  getDefaultOptionNames() {
    return FsbOptions.#DEFAULT_OPTION_KEYS;
  }

  getDefaultOptions() {
    return FsbOptions.#DEFAULT_OPTION_VALUES;
  }

  isDefaultOption(optionName) {
    return FsbOptions.#DEFAULT_OPTION_KEYS.includes(optionName);
  }

  getDefaultOptionValue(optionName) {
    return FsbOptions.#DEFAULT_OPTION_VALUES[optionName];
  }



  async resetOptions() {
    await messenger.storage.local.clear();
    await this.setupDefaultOptions();
  }



  async setupDefaultOptions() {
    if (! FsbOptions.#OUR_EXTENSION_INFO) {
      // we must do this all here because you cannot use await in a static block
      FsbOptions.#OUR_EXTENSION_INFO = await messenger.management.getSelf();
      FsbOptions.#OUR_EXTENSION_PROPS = {
            'id':                 FsbOptions.#OUR_EXTENSION_INFO.id,
            'shortName':          FsbOptions.#OUR_EXTENSION_INFO.shortName,
            'name':               FsbOptions.#OUR_EXTENSION_INFO.name,
            'description':        FsbOptions.#OUR_EXTENSION_INFO.description,
            'version':            FsbOptions.#OUR_EXTENSION_INFO.version,
            'versionName':        FsbOptions.#OUR_EXTENSION_INFO.versionName,
            'disabled':           false, // ! ourExtensionInfo.enabled, but how could we be disabled?  We're running!
            'special':            true,  // at this time this is the only way an Extension can be 'SPECIAL'
            'locked':             true,  // 'SPECIAL' extensions are ALWAYS Locked              and cannot be Unlocked
            'noQuota':            true,  // 'SPECIAL' extensions are ALWAYS No-Quota            and cannot have Quotas
            'dirProtect':         true,  // 'SPECIAL' extensions are ALWAYS Directory-Protected and cannot be Unprotected
            'allowAccess':        true,  // 'SPECIAL' extensions are ALWAYS Allowed Access      and cannot be Disallowed Access
            'readOnly':           false, // 'SPECIAL' extensions are NEVER  Read-Only           and cannot have readOnly access
            'overStorageQuota':   false, // 'SPECIAL' extensions are ALWAYS No-Quota            and cannot be Over Quotas
            'overFileSizeQuota':  false, // 'SPECIAL' extensions are ALWAYS No-Quota            and cannot be Over Quotas
            'overFileCountQuota': false, // 'SPECIAL' extensions are ALWAYS No-Quota            and cannot be Over Quotas
          };
      FsbOptions.#EXTENSION_ID   = FsbOptions.#OUR_EXTENSION_INFO.id;
      FsbOptions.#EXTENSION_NAME = FsbOptions.#OUR_EXTENSION_INFO.name;
    }

    this.log("-- begin"); // MUST be done AFTER the code just above - this.log() requires #EXTENSION_ID

    const options = await messenger.storage.local.get(FsbOptions.#DEFAULT_OPTION_KEYS); // but only the default options???
    this.log('locally stored options:',  options);

    for (const [optionKey, defaultValue] of Object.entries(FsbOptions.#DEFAULT_OPTION_VALUES)) {
      if (! Object.hasOwn(options, optionKey)) { // if it's not already in local storage
        messenger.storage.local.set(
          { [optionKey] : defaultValue}
        );
        this.log(`new option: [${optionKey}]: ${defaultValue}`);
      }
    }


    
    // ===== MAKE SURE THAT OUR EXTENSION EXTENDED PROPS ARE ALWAYS CORRECT ===== */
    //
    this.#settingDefaultOptions = true; // this will prevent some error messages when there aren't any existing EXTENSION EXTENDED PROPS 
    var allExtensionsProps = await this.getExtensionsProps();
    if (! allExtensionsProps) allExtensionsProps = []; // MABXXX Maybe getExtensionsProps should return the empty Array instead???
    this.#settingDefaultOptions = false;

    if (FsbOptions.#LOG) {
      this.logAlways("Replacing our Own ExtensionProps");
      utils.logProps("", "setupDefaultOptions FsbOptions.#OUR_EXTENSION_PROPS:", FsbOptions.#OUR_EXTENSION_PROPS);
    }

    allExtensionsProps[FsbOptions.#EXTENSION_ID] = FsbOptions.#OUR_EXTENSION_PROPS;



    if (FsbOptions.#LOG) {
      utils.logProps("", `setupDefaultOptions.allExtensionsProps["${FsbOptions.#EXTENSION_ID}"]`, allExtensionsProps[FsbOptions.#EXTENSION_ID]);
      this.logAlways(`and storing them -- length=${Object.keys(allExtensionsProps).length}`);
      utils.logProps("", "setupDefaultOptions.extensionProps", allExtensionsProps);
    }

    await this.storeExtensionsProps(allExtensionsProps);
    
    if (FsbOptions.#DEBUG) {
      const props = await this.getExtensionsProps();
      this.debugAlways("\n\nEXTENSIONS PROPS:\n\n", props, "\n\n");
    }

    this.log("-- end");
  }



  async isEnabledExtensionAccessControl() {
    const KEY = 'fsbExtensionAccessControlEnabled';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledShowGrantExtensionAccessDialog() {
    const KEY = 'fsbShowGrantExtensionAccessDialog';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledShowOptionsWindowOnStartup() {
    const KEY = 'fsbShowOptionsWindowOnStartup';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledSkipOnboarding() {
    const KEY = 'fsbSkipOnboardingEnabled';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledConsoleLog() {
    const KEY = 'fsbEnableConsoleLog';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledConsoleDebug() {
    const KEY = 'fsbEnableConsoleDebug';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledConsoleDebugTrace() {
    const KEY = 'fsbEnableConsoleDebugTrace';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledConsoleWarn() {
    const KEY = 'fsbEnableConsoleWarn';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledConsoleErrorTrace() {
    const KEY = ' fsbEnableConsoleErrorTrace';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledAccessLogging() {
    const KEY = 'fsbEnableAccessLogging';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledAccessDeniedLogging() {
    const KEY = 'fsbEnableAccessDeniedLogging';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledInternalMessageLogging() {
    const KEY = 'fsbEnableInternalMessageLogging';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledInternalMessageResultLogging() {
    const KEY = 'fsbEnableInternalMessageResultLogging';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledExternalMessageLogging() {
    const KEY = 'fsbEnableExternalMessageLogging';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledInternalEventLogging() {
    const KEY = 'fsbEnableInternalEventLogging';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledExternalMessageResultLogging() {
    const KEY = 'fsbEnableExternalMessageResultLogging';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledShowLoggingOptions() {
    const KEY = 'fsbShowLoggingOptions';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledShowOptionsHints() {
    const KEY = 'fsbShowOptionsHints';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledShowOptionsActions() {
    const KEY = 'fsbShowOptionsActions';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledShowExtensionChooserInstructions() {
    const KEY = 'fsbShowExtensionChooserInstructions';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledShowBackupManagerInstructions() {
    const KEY = 'fsbShowBackupManagerInstructions';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledShowEventLogManagerInstructions() {
    const KEY = 'fsbShowEventLogManagerInstructions';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledShowStorageManagerInstructions() {
    const KEY = 'fsbShowStorageManagerInstructions';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledOnRemoveExtensionDeleteDirectory() {
    const KEY = 'fsbOnRemoveExtensionDeleteDirectory';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledOption(key, defaultValue) {
    const options = await messenger.storage.local.get(key); // returns a Promise of an Object with a key-value pair for every key found

    var value = defaultValue;
    if (Object.hasOwn(options, key)) {
      value = options[key]; // get the value for the specific key
      // make sure it's boolean???
    }

    return value;
  }



  async getAutoLogPurgeDays(defaultValue) {
    const KEY = 'fsbAutoLogPurgeDays';
    return await this.getNumberOption(KEY, defaultValue);
  }

  async getAutoRemoveUninstalledExtensionsDays(defaultValue) {
    const KEY = 'fsbAutoRemoveUninstalledExtensionsDays';
    return await this.getNumberOption(KEY, defaultValue);
  }



  async isEnabledStorageQuota() {
    const KEY = 'fsbStorageQuotaEnabled';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }
  async getStorageQuota() {
    const KEY = 'fsbStorageQuota';
    return await this.getNumberOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }
  async getStorageQuotaUnit() {
    const KEY = 'fsbStorageQuotaUnit';
    return await this.getStringOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledFileSizeQuota() {
    const KEY = 'fsbFileSizeQuotaEnabled';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }
  async getFileSizeQuota() {
    const KEY = 'fsbFileSizeQuota';
    return await this.getNumberOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }
  async getFileSizeQuotaUnit() {
    const KEY = 'fsbFileSizeQuotaUnit';
    return await this.getStringOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledFileCountQuota() {
    const KEY = 'fsbFileCountQuotaEnabled';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }
  async getFileCountQuota() {
    const KEY = 'fsbFileCountQuota';
    return await this.getNumberOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }
  async getFileCountQuotaUnit() {
    const KEY = 'fsbFileCountQuotaUnit';
    return await this.getStringOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }



  async isQuotaCheckSchedulingBlocked() {
    const KEY = 'fsbQuotaCheckSchedulingBlocked';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async isEnabledQuotaCheck() {
    const KEY = 'fsbQuotaCheckEnabled';
    return this.isEnabledOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async getQuotaCheckUnit() {
    const KEY = 'fsbQuotaCheckUnit';
    const value = await this.getStringOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);

    switch (value) {
      case 'daily':
      case 'hourly':
      case 'minutely':
        return value;
    }

    return FsbOptions.#DEFAULT_OPTION_KEYS[KEY];
  }

  async getQuotaCheckDays() {
    const KEY = 'fsbQuotaCheckDays';
    // validate allowed value?
    return await this.getNumberOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async getQuotaCheckDaysTimeOffset() {
    const KEY = 'fsbQuotaCheckDaysTimeOffset';
    // getTimeOption() validates time format. If it's not valid, the passed in default is returned
    return await this.getTimeOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async getQuotaCheckDaysTimeOffsetMS() {
    const time = await this.getQuotaCheckDaysTimeOffset();
    return utils.timeToMS(time);
  }

  async getQuotaCheckHours() {
    const KEY = 'fsbQuotaCheckHours';
    // validate allowed value?
    return await this.getNumberOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async getQuotaCheckHoursMinuteOffset() {
    const KEY = 'fsbQuotaCheckHoursMinuteOffset';
    // validate allowed value?
    return await this.getNumberOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async getQuotaCheckMinutes() {
    const KEY = 'fsbQuotaCheckMinutes';
    // validate allowed value?
    return await this.getNumberOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }

  async getQuotaCheckMinutesMinuteOffset() {
    const KEY = 'fsbQuotaCheckMinutesMinuteOffset';
    // validate allowed value?
    return await this.getNumberOption(KEY, FsbOptions.#DEFAULT_OPTION_KEYS[KEY]);
  }



  async getNumberOption(key, defaultValue) {
    const options = await messenger.storage.local.get(key); // returns a Promise of an Object with a key-value pair for every key found

    var value = defaultValue;
    if (Object.hasOwn(options, key)) {
      value = options[key]; // get the value for the specific key
      if (typeof value === 'string') {
        value = Number(value);
        if (Number.isNaN(value)) value = defaultValue;
      } else if (typeof value === 'boolean') {
        value = value ? 1 : 0;
      }
    }

    return value;
  }



  async getTimeOption(key, defaultValue) {
    var   value   = defaultValue;
    const options = await messenger.storage.local.get(key); // returns a Promise of an Object with a key-value pair for every key found

    if (Object.hasOwn(options, key)) {
      const time = options[key]; // get the value for the specific key
      if (typeof time === 'string') {
        if      ( time.match( utils.TIME_HH_MM_SS_REGEX ) ) value = time;
        else if ( time.match( utils.TIME_HH_MM_REGEX    ) ) value = time;
      }
    }

    return value;
  }



  async getStringOption(key, defaultValue) {
    const options = await messenger.storage.local.get(key); // returns a Promise of an Object with a key-value pair for every key found

    var value = defaultValue;
    if (Object.hasOwn(options, key)) {
      value = options[key]; // get the value for the specific key
      if (typeof value === 'number') {
        value = String(value);
      } else if (typeof value === 'boolean') {
        value = value ? 'true' : 'false';
      }
    }

    return value;
  }

  async getOption(key, defaultValue) {
    const options = await messenger.storage.local.get(key); // returns a Promise of an Object with a key-value pair for every key found

    var value = defaultValue;
    if (Object.hasOwn(options, key)) {
      value = options[key]; // get the value for the specific key
    }

    return value;
  }



  async getAllOptions() {
    return messenger.storage.local.get(); // returns a Promise of an array of Object with a key-value pair for every key found
  }



  // obj must be object like: {[key], value}
  async storeOption(obj) {
    const x = await messenger.storage.local.set(obj); // ???returns Promise with no arguments
    return x;
  }

  // build object {[key], value} and store it // doesn't return anything
  async saveOption(key, value) {
    const obj = {[key]: value};
    await this.storeOption(obj); // doesn't return anything
  }

  // remove option from storage // returns Promise with no arguments
  async removeOption(key) {
    messenger.storage.local.remove(key); // returns Promise with no arguments
  }


  /*
   * KEYS: for an ExtensionProps:
   * - id                 - the Extenion ID (also the name of the Extension's Directory MABXXX BUT WHAT IF THEY EDIT IT??? MABXXX)
   * - name               - INITIALLY from messenger.management.ExtensionInfo.name if the extension was installed at the time it was created (but can be edited)
   * - installed          - if a matching messenger.management.ExtensionInfo exists (see uninstalled)
   * - disabled           - from messenger.management.ExtensionInfo.enabled (we get this from the API each time if the extension is installed at the time)
   * - description        - from messenger.management.ExtensionInfo         (we get this from the API each time if the extension is installed at the time)
   * - shortName          - from messenger.management.ExtensionInfo         (we get this from the API each time if the extension is installed at the time)
   * - version            - from messenger.management.ExtensionInfo         (we get this from the API each time if the extension is installed at the time)
   * - versionName        - from messenger.management.ExtensionInfo         (we get this from the API each time if the extension is installed at the time)
   * - uninstalled        - if Extension WAS INSTALLED at some point but has since been uninstalled but not (yet) removed
   * - special            - Extension is ALWAYS locked, dirProtect, noQuota, allowAccess, & NOT readOnly and cannot be changed or removed
   * - locked             - while locked, Extension cannot be changed or removed (either auto-removed or manual)
   * - dirProtect         - while dirProtect, Extension Directory will NOT be automatically deleted if the Extension is removed (either auto-removed or manual)
   * - noQuota            - while true, Extension is EXEMPT from Quotas (if they are enabled)
   * - allowAccess        - while true, Extension is Allowed/Granted Access to use FileSystemBroker
   * - readOnly           - Extension has Read-Only Access (allowAccess must also be true)
   * - overStorageQuota   - Extension is currently over its Storage Quota
   * - overFileSizeQuota  - Extension is currently over its File Size Quota
   * - overFileCountQuota - Extension is currently over its File Count Quota
   *
   * --- ideas---
   *
   * - quotaS             - Individual Storage Quota
   * - quotaFS            - Individual File Size Quota
   * - quotaFC            - Individual File Count Quota
  */
  async getExtensionsProps() {
    const KEY = 'extensionsProps';
    const installedExtensions = await messenger.management.getAll();
    const props               = await messenger.storage.local.get(KEY); // returns Object with key-value pair for every key found
    var   allExtensionsProps;

    if (FsbOptions.#DEBUG) {
      this.debugAlways(`-- installedExtensions.length=${installedExtensions.length}`);
      utils.logProps("", "FSBOptions.getExtensionsProps.installedExtensions", installedExtensions);
    }

    if (! props) {
      // this is not an error if we're setting defaults
      if (! this.#settingDefaultOptions) this.error("-- failed to get 'extensionsProps' from local storage");
      // MABXXX return an empty Array???

    } else {
      allExtensionsProps = props[KEY];

      if (! allExtensionsProps) {
        if (! this.#settingDefaultOptions) this.error(`-- failed to get props['${KEY}'] (allExtensionsProps) from local storage`);
        // MABXXX return an empty Array???

      } else if (typeof allExtensionsProps !== 'object') {
        // MABXXX Maybe this should ALWAYS be an error???
        if (! this.#settingDefaultOptions) this.error("-- props['extensionsProps'] (allExtensionsProps) is not a object");
        // MABXXX return an empty Array???

      } else {
        if (FsbOptions.#DEBUG) {
          this.debugAlways(`-- Object.keys(allExtensionsProps).length=${Object.keys(extensionsProps).length}`);
          logProps("", "FSBOptions.getExtensionsProps.allExtensionsProps", allExtensionsProps);
        }

        if (installedExtensions && installedExtensions.length > 0) {
          // Update allExtensionsProps with data from the currently-installed extensions
          for (const installedExtension of installedExtensions) { // an array of managament.ExtensionInfo
            if (installedExtension.type === 'extension') {

              const installedExtensionIsConfigured = allExtensionsProps.hasOwnProperty(installedExtension.id);

              if (! installedExtensionIsConfigured) {
                this.debug(`-- Extension NOT configured - not found in allExtensionsProps: ID="${installedExtension.id}`);
              } else {
                this.debug(`-- Extension IS configured - found in allExtensionsProps: ID="${installedExtension.id}`);

                const extProps       = allExtensionsProps[installedExtension.id];
                extProps.installed   = true;
                extProps.uninstalled = false;
                extProps.id          = installedExtension.id;                       // redundant - should already be there
                extProps.description = installedExtension.description;              // remove this line if we ever store this locally so we can edit/replace
                extProps.disabled    = ! installedExtension.enabled;                // remove this line if we ever store this locally so we can edit/replace
////////////////extProps.name        = installedExtension.name;                     // we store this locally so we can edit/replace MABXXX WHY?
                extProps.shortName   = installedExtension.shortName;                // remove this line if we ever store this locally so we can edit/replace
                extProps.version     = installedExtension.version;
                extProps.versionName = installedExtension.versionName;
              }
            }
          }

          // If the extension is NOT in installedExtensions, then mark it as uninstalled
          for (const [extId, extProps] of Object.entries(allExtensionsProps)) {
            this.debug(`\n\n===== extId="${extId}", extProps:\n`, extProps, "\n\n");
            const foundInstalledExtension = installedExtensions.find(extension => extension.id === extId);

            if (foundInstalledExtension) {
              extProps.uninstalled = false; // <--- Redudant with code just above, but WTF? 
              delete extProps['uninstalledTimeMS'];
            } else {
              extProps.uninstalled       = true;
              extProps.uninstalledTimeMS = Date.now();
            }

            // sanity checks

            if (extProps.special            === undefined) extProps.special            = false;
            if (extProps.locked             === undefined) extProps.locked             = false;
            if (extProps.noQuota            === undefined) extProps.noQuota            = false;
            if (extProps.dirProtect         === undefined) extProps.dirProtect       = false;
            if (extProps.allowAccess        === undefined) extProps.allowAccess        = false;
            if (extProps.readOnly           === undefined) extProps.readOnly           = false;
            if (extProps.overStorageQuota   === undefined) extProps.overStorageQuota   = false;
            if (extProps.overFileSizeQuota  === undefined) extProps.overFileSizeQuota  = false;
            if (extProps.overFileCountQuota === undefined) extProps.overFileCountQuota = false;

            if (extProps.special) {
              extProps.locked             = true;
              extProps.noQuota            = true;
              extProps.dirProtect         = true;
              extProps.allowAccess        = true;
              extProps.readOnly           = false;
              extProps.overStorageQuota   = false;
              extProps.overFileSizeQuota  = false;
              extProps.overFileCountQuota = false;
            } else {
              if (extProps.readOnly && ! extProps.allowAccess) {
                this.debugAlways(`\n\n===== INSTALLED Extension "${extId}" is (readOnly && ! allowAccess), setting readOnly=false:\n\n`, extProps, "\n\n");
                extProps.readOnly = false;
              }
              if (extProps.noQuota) {
                extProps.overStorageQuota   = false;
                extProps.overFileSizeQuota  = false;
                extProps.overFileCountQuota = false;
              }
            }
          }
        } else {
          // NO installedExtensions, so mark them all as uninstalled
          for (const [extId, extProps] of Object.entries(allExtensionsProps)) {
            extProps.uninstalled       = true;
            extProps.uninstalledTimeMS = Date.now();

            // sanity checks
            if (extProps.special) {
              extProps.locked      = true;
              extProps.noQuota     = true;
              extProps.dirProtect  = true;
              extProps.allowAccess = true;
              extProps.readOnly    = false;
            } else {
              if (extProps.readOnly && ! extProps.allowAccess) {
                this.debugAlways(`\n\n===== UNINSTALLED Extension "${extId}" is (readOnly && ! allowAccess), setting readOnly=false:\n\n`, extProps, "\n\n");
                extProps.readOnly = false;
              }
              if (extProps.noQuota) {
                extProps.overStorageQuota   = false;
                extProps.overFileSizeQuota  = false;
                extProps.overFileCountQuota = false;
              }
            }
          }
        }

        // SHOULD WE UPDATE STORAGE TO REFLECT ANY CHANGES WE MADE???
        // setupDefaultOptions(), which calls us, does store, so that's probably good enough, no?

        if (FsbOptions.#DEBUG) {
          this.debugAlways(`-- RETURNING Object.keys(allExtensionsProps).length=${Object.keys(allExtensionsProps).length}`);
          utils.logProps("", "FSBOptions.getExtensionsProps.allExtensionsProps", allExtensionsProps);
        }
      }
    }

    return allExtensionsProps;
  }

  async getExtensionsPropsSortedById() {
    const extensionsProps = await this.getExtensionsProps();

    if (! extensionsProps) {
      this.error("-- getExtensionsProps() DIDN'T RETURN ANYTHING");
    } else {
      if (FsbOptions.#LOG) {
        this.log("-- extensionsProps:");
        utils.logProps("", "FSBOptions.getExtensionsPropsSortedById.extensionsProps", extensionsProps);
      }

      const sorted = sortExtensionsPropsById(extensionsProps, true);

      if (FsbOptions.#LOG) {
        this.log("-- sorted:");
        utils.logProps("", "FSBOptions.getExtensionsPropsSortedById.sorted", sorted);
      }


      return sorted;
    }

    function sortExtensionsPropsById(extensionsProps, ascending = true) {
      const sortedEntries = Object.entries(extensionsProps).sort(([, a], [, b]) => {
        return ascending ? a.id.localeCompare(b.id, { 'sensitity': 'base' } )
                         : a.id.localeCompare(b.id, { 'sensitity': 'base' } ) * -1;
      });
      return Object.fromEntries(sortedEntries);
    }
  }

  async getExtensionsPropsSortedByName() {
    const extensionsProps = await this.getExtensionsProps();

    if (! extensionsProps) {
      this.error("-- getExtensionsProps() DIDN'T RETURN ANYTHING");
    } else {
      if (FsbOptions.#LOG) {
        this.log("-- extensionsProps:");
        utils.logProps("", "FSBOptions.getExtensionsPropsSortedByName.extensionsProps", extensionsProps);
      }

      const sorted =  sortExtensionsPropsByName(extensionsProps, true);

      if (FsbOptions.#LOG) {
        this.log("-- sorted:");
        utils.logProps("", "FSBOptions.getExtensionsPropsSortedByName.sorted", sorted);
      }

      return sorted;
    }

    function sortExtensionsPropsByName(extensionsProps, ascending = true) {
      const sortedEntries = Object.entries(extensionsProps).sort(([, a], [, b]) => {
        return ascending ? a.name.localeCompare(b.name, { 'sensitity': 'base' } )
                         : a.name.localeCompare(b.name, { 'sensitity': 'base' } ) * -1;
      });
      return Object.fromEntries(sortedEntries);
    }
  }

  async getExtensionPropsById(extId) {
    if ((typeof extId === 'string') && extId.length > 0) {
      const allExtensionsProps = await this.getExtensionsProps(); // MABXXX IT IS ***INSANE*** TO GET THIS WHOLE OBJECT JUST TO GET THE VALUE FOR ONE KEY!!!
      return allExtensionsProps[extId];
    }
  }

  async isSpecial(exiId) {
    if ((typeof exiId === 'string') && exiId.length > 0) {
      const extProps = await this.getExtensionPropsById(extId);
      if (extProps) {
        return extProps.special;
      }
    }

    return false;
  }

  async isLocked(extId) {
    if ((typeof extId === 'string') && extId.length > 0) {
      const extProps = await this.getExtensionPropsById(extId);
      if (extProps) {
        return extProps.locked;
      }
    }

    return false;
  }

  async isNoQuota(extId) {
    if ((typeof extId === 'string') && eextId.length > 0) {
      const extProps = await this.getExtensionPropsById(extId);
      if (extProps) {
        return extProps.noQuota;
      }
    }

    return false;
  }

  async isDirProtect(extId) {
    if ((typeof extId === 'string') && extId.length > 0) {
      const extProps = await this.getExtensionPropsById(extId);
      if (extProps) {
        return extProps.dirProtect;
      }
    }

    return false;
  }

  async isAllowAccess(extId) {
    if ((typeof extId === 'string') && extId.length > 0) {
      const extProps = await this.getExtensionPropsById(extId);
      if (extProps) {
        return extProps.allowAccess;
      }
    }

    return false;
  }

  async isReadOnly(extId) {
    if ((typeof extId === 'string') && extId.length > 0) {
      const extProps = await this.getExtensionPropsById(extId);
      if (extProps) {
        return extProps.allowAccess && extProps.readOnly; // <-------------------------------------------------------------------------------<<<<<
      }
    }

    return false;
  }

  async isOverQuota(extId) {
    if ((typeof extId === 'string') && extId.length > 0) {
      const extProps = await this.getExtensionPropsById(extId);
      if (extProps) {
        return ! extProps.special && ! extrops.noQuota && (extProps.overStorageQuota || extProps.overFileSizeQuota || extProps.overFileCountQuota);
      }
    }

    return false;
  }



  async storeExtensionsProps(allExtensionsProps) {
    if (allExtensionsProps === undefined) {
      this.error("Missing 'allExtensionsProps' parameter");
      return;
    } else if (allExtensionsProps === null || (typeof allExtensionsProps) !== 'object') {
      this.error(`'allExtensionsProps' parameter is not an 'object': '${typeof allExtensionsProps}'`);
      return;
    }

    // IF AN EXTENSION GETS UNINSTALLED, THUS IT WON'T BE RETURNED FROM messenger.management.getAll(), THESE WILL BE THE LAST-KNOWN VALUES
    // But uninstalled should be true in this case.

    // sanity checks
    for (const [extId, extProps] of Object.entries(allExtensionsProps)) {
      if (! extProps.id) {
        this.error(`(Object Key) "${extId}" Value extProps has no 'id':`, extProps);
      } else if ((typeof extProps.id) !== 'string') {
        this.error(`(Object Key) "${extId}" Value extProps.id is not a 'string': type='${typeof extProps.id}'`);
      } else if (extId !== extProps.id) {
        this.error(`(Object KEY) extId !== (Object VALUE) extProps.id: "${extId}" !== "${extProps.id}"`);
      }

      if (! extProps.name) {
        this.error(`(Object Key) "${extId}" extProps has no 'name':`, extProps);
      } else if ((typeof extProps.name) !== 'string') {
        this.error(`(Object Key) "${extId}" extProps.name is not a 'string': type='${typeof extProps.name}'`);
      }

      if (extProps.special            === undefined) extProps.special            = false;
      if (extProps.locked             === undefined) extProps.locked             = false;
      if (extProps.noQuota            === undefined) extProps.noQuota            = false;
      if (extProps.dirProtect         === undefined) extProps.dirProtect       = false;
      if (extProps.allowAccess        === undefined) extProps.allowAccess        = false;
      if (extProps.readOnly           === undefined) extProps.readOnly           = false;
      if (extProps.overStorageQuota   === undefined) extProps.overStorageQuota   = false;
      if (extProps.overFileSizeQuota  === undefined) extProps.overFileSizeQuota  = false;
      if (extProps.overFileCountQuota === undefined) extProps.overFileCountQuota = false;

      if (extProps.special) {
        // MABXXX but how do prevent Name and ID change??
        extProps.locked             = true;
        extProps.noQuota            = true;
        extProps.dirProtect         = true;
        extProps.allowAccess        = true;
        extProps.readOnly           = false;
        extProps.overStorageQuota   = false;
        extProps.overFileSizeQuota  = false;
        extProps.overFileCountQuota = false;
      } else {
        if (extProps.readOnly && ! extProps.allowAccess) {
          this.debugAlways(`\n\n---Extension "${extId}" is (readOnly && ! allowAccess), setting readOnly=false\n\n`);
          extProps.readOnly = false;
        }
        if (extProps.noQuota) {
          extProps.overStorageQuota   = false;
          extProps.overFileSizeQuota  = false;
          extProps.overFileCountQuota = false;
        }
      }
    }

    return messenger.storage.local.set(
      { 'extensionsProps': allExtensionsProps }
    );
  }

  async storeExtensionPropsById(extId, extProps) {
    if ((typeof extId === 'string') && extId.length > 0 && (typeof extProps === 'object')) {
      // IF AN EXTENSION GETS UNINSTALLED, THUS IT WON'T BE RETURNED FROM messenger.management.getAll(), THESE WILL BE THE LAST-KNOWN VALUES
      // But uninstalled should be true anyways.

      this.debug(`\n\n---extId="${extId}" extProps.allowAccess="${extProps.allowAccess} extProps:\n`, extProps, "\n\n");

      const allExtensionsProps = await this.getExtensionsProps(); // MABXXX IT IS ***INSANE*** TO GET THIS WHOLE OBJECT JUST TO GET THE VALUE FOR ONE KEY!!!

      if (extProps.special) {
        // attempt to change special extension
        // the UI should NEVER be allowing us to change a SPECIAL Extension
        this.error(`ATTEMPT TO STORE 'SPECIAL' Extension: extId="${extId}", extProps:\n`, extProps, "\n\n");

        // return what???

      } else {
        // sanity checks
        if (extId !== extProps.id) {
          this.error(`extId !== extProps.id: "${extId}" !== "${extProps.id}"`);
        } else {
          if (extProps.readOnly && ! extProps.allowAccess) {
            this.debugAlways(`\n\n---Extension "${extId}" is (readOnly && ! allowAccess), setting readOnly=false\n\n`);
            extProps.readOnly = false;
          }
          if (extProps.noQuota) {
            extProps.overStorageQuota   = false;
            extProps.overFileSizeQuota  = false;
            extProps.overFileCountQuota = false;
          }

          allExtensionsProps[extId] = extProps;

          await this.storeExtensionsProps(allExtensionsProps); // this also does sanity checks
          return extProps;
        }
      }
    }
  }



  // Create/Update an extensionProps and return it.
  async addOrUpdateExtension(oldExtensionId, newExtensionId, newExtensionName, newAllowAccess, newLocked, newDirProtect, newNoQuota, newReadOnly) {
    if (    (! oldExtensionId || ((typeof oldExtensionId   === 'string') && oldExtensionId.length   > 0))
         && (newExtensionId   && ((typeof newExtensionId   === 'string') && newExtensionId.length   > 0))
         && (newExtensionName && ((typeof newExtensionName === 'string') && newExtensionName.length > 0))
       )
    {
      // MABXXX WHAT IF newExtensionId already exists???

      const allExtensionsProps = await this.getExtensionsProps();

      var extProps = oldExtensionId ? allExtensionsProps[oldExtensionId] : undefined;
      if (extProps && extProps.special) {
        // attempt to change special extension
        this.error(`ATTEMPT TO UPDATE 'SPECIAL' Extension: extId="${extProps.id}", extProps:\n`, extProps, "\n\n");

        // return what???

      } else {
        if (oldExtensionId && oldExtensionId !== newExtensionId) { // changing the ID???? // MABXXX WE NEED TO STOP THIS - THE DIRECTORY NAME!!!
          delete allExtensionsProps[oldExtensionId];
        }

        const locked      =                (typeof newLocked      === 'boolean') ? newLocked      : false;
        const noQuota     =                (typeof newNoQuota     === 'boolean') ? newNoQuota     : false;
        const dirProtect  =                (typeof newDirProtect  === 'boolean') ? newDirProtect  : false;
        const allowAccess =                (typeof newAllowAccess === 'boolean') ? newAllowAccess : false;
        const readOnly    = allowAccess && (typeof newReadOnly    === 'boolean') ? newReadOnly    : false; // <------------------------------------------------<<<<<

        if (extProps) { // are we  updating an already-configured Extension
          extProps.id          = newExtensionId;   // !!! MABXXX SHOULD NOT ALLOW THIS!!!
          extProps.name        = newExtensionName;
          extProps.allowAccess = allowAccess;
          extProps.locked      = locked;
          extProps.dirProtect  = dirProtect;
          extProps.noQuota     = noQuota;
          extProps.readOnly    = readOnly;

        } else { // no, we're configuring a NEW extension

          // Check to see if it's installed and set installed, description, etc from that???
          var installedExtension;
          try {
            installedExtension = await messenger.management.get(newExtensionId);
          } catch (error) {
            if (! error.message.startsWith("No such addon")) {
              this.caught(error, `Error getting Extension "${newExtensionId}"`);
            }
          }

          if (installedExtension) {
            extProps = {
              'id':                 installedExtension.id,
              'description':        installedExtension.description,              // remove this line if we ever store this locally so we can edit/replace
              'disabled':           ! installedExtension.enabled,                // remove this line if we ever store this locally so we can edit/replace
              'shortName':          installedExtension.shortName,                // remove this line if we ever store this locally so we can edit/replace
              'version':            installedExtension.version,
              'versionName':        installedExtension.versionName,
              'name':               newExtensionName,                            // we are ignoring installedExtension.name
              'allowAccess':        allowAccess,
              'locked':             locked,
              'dirProtect':         dirProtect,
              'noQuota':            noQuota,
              'readOnly':           readOnly,
              'overStorageQuota':   false,
              'overFileSizeQuota':  false,
              'overFileCountQuota': false,
            };
          } else {
            extProps = {
              'id':                 newExtensionId,
              'name':               newExtensionName,
              'allowAccess':        allowAccess,
              'locked':             locked,
              'dirProtect':         dirProtect,
              'noQuota':            noQuota,
              'readOnly':           readOnly,
              'overStorageQuota':   false,
              'overFileSizeQuota':  false,
              'overFileCountQuota': false,
            };
          }
        }

        if (extProps.noQuota) {
          extProps.overStorageQuota   = false;
          extProps.overFileSizeQuota  = false;
          extProps.overFileCountQuota = false;
        }

        allExtensionsProps[newExtensionId] = extProps;

        await this.storeExtensionsProps(allExtensionsProps); // this also does sanity checks

        return extProps;
      }
    }
  }



  // Remove the extensionProps for the Extension (not the Extension istself)
  // with the given extId and return it.
  //
  // THIS DOES NOT DELETE EXTENSION DIRECTORIES
  // (NOR DOES IT UN-INSTALL THE EXTENSION - we can't delete them anyways)
  async removeExtension(extId, ignoreLocks) {
    const removeLocked = (typeof ignoreLocks) === 'boolean' ? ignoreLocks : false;

    this.log(`-- begin extId="${extId}", removeLocked=${removeLocked}`);

    var deletedProps;
    if (extId && (typeof extId === 'string') && extId.length > 0) {
      const extProps = await this.getExtensionPropsById(extId);
      if (! extProps) {
        this.error(`Failed to get ExtensionProps for Extension "${extId}"`);
      } else if (extProps.special) {
        this.error(`Extension "${extId}" is SPECIAL and will NOT be removed`);
      } else if (extProps.locked && ! removeLocked) {
        this.error(`Extension "${extId}" is LOCKED and will NOT be removed`);
      } else{
        this.log(`-- deleting extId="${extId}"`);
        delete allExtensionsProps[extId];
        deletedProps = extProps;
        await this.storeExtensionsProps(allExtensionsProps);
      }
    }

    this.log(`-- end extId="${extId}"`);
    return deletedProps;
  }

  // Remove the extensionProps for the Extensions with the given extensionIds
  // and return the extProps of those that were actually removed
  //
  // THIS DOES NOT DELETE EXTENSION DIRECTORIES
  async removeExtensions(extensionIds, ignoreLocks) {
    const removeLocked          = (typeof ignoreLocks) === 'boolean' ? ignoreLocks : false;
    const removedExtensionProps = [];
    var   count                 = 0;

    if (extensionIds && extensionIds.length > 0) {
      const allExtensionsProps = await this.getExtensionsProps(); // MABXXX IT IS ***INSANE*** TO GET THIS WHOLE OBJECT JUST TO GET THE VALUE FOR ONE KEY!!!
      if (allExtensionsProps) {
        for (const extId of extensionIds) {
          if (extId && (typeof extId === 'string') && extId.length > 0) {
            const extProps = allExtensionsProps[extId];
            if (! extProps) {
              this.error(`Failed to get ExtensionProps for Extension "${extId}"`);
            } else if (extProps.special) {
              this.error(`Extension "${extId}" is SPECIAL and will NOT be removed`);
            } else if (extProps.locked && ! removedLocked) {
              this.error(`Extension "${extId}" is LOCKED and will NOT be removed`);
            } else {
              removedExtensionProps.push(extProps);
              count++;
              delete allExtensionsProps[extId];
            }
          }
        }

        if (count > 0) await this.storeExtensionsProps(allExtensionsProps);
      }
    }

    return removedExtensionProps;
  }




  // THIS DOES NOT DELETE EXTENSION DIRECTORIES
  async autoRemoveUninstalledExtensions(numDays) {
    const nowMS            = Date.now();
    const removeBeforeMS   = utils.getMidnightMS(nowMS, -numDays - 1);
    const removeBeforeTime = utils.formatMsToDateTime24HR(removeBeforeMS);
    const parameters       = { 'numDays': numDays, "removeBeforeTime": removeBeforeTime };

    const removedExtensionIds = [];
    var   removedCount        = 0;

    this.debugAlways(`-- begin -- numDays=${numDays}, removeBeforeMS=${removeBeforeMS}, removeBeforeTime="${removeBeforeTime}"`);

    if (this.#fsbEventLogger) {
      await this.#fsbEventLogger.logInternalEvent("autoRemoveUninstalledExtensions", "request", parameters, "");
    }

    if (numDays < 0) { // -1: auto-remove is disabled, 0: remove immediately
      this.debugAlways("-- Auto-Remove is Disabled");
      if (this.#fsbEventLogger) {
        await this.#fsbEventLogger.logInternalEvent("autoRemoveUninstalledExtensions", "success", parameters, "Auto-Remove is Disabled");
      }

    } else {
      const installedExtensionById = [];
      const installedExtensions    = await messenger.management.getAll();
      for (const ext of installedExtensions) {
        installedExtensionById[ext.id] = ext;
      }

      const allExtensionsProps = await this.getExtensionsProps();
      for (const [extId, extProps] of Object.entries(allExtensionsProps)) {
        if (extProps.special) {
          this.debug(`Extension "${extId}" is SPECIAL and will NOT be Auto-Removed`);
        } else if (extProps.locked) {
          this.debug(`Extension "${extId}" is LOCKED and will NOT be Auto-Removed`);
        } else {
          var notInstalled      = false;
          var alreadyRecorded   = false;
          var uninstalledTimeMS = nowMS;

          if (extProps.uninstalled) { // already marked as uninstalled?
            var installedExtension = installedExtensionById[extId];
            if (installedExtension) {
              this.debugAlways(`-- Extension currently recorded as Uninstalled IS Installed (again?,) ID="${extId}"`);
              extProps.uninstalled = false;
              delete extProps['uninstalledType'];
              delete extProps['uninstalledTimeMS'];
              this.debugAlways(`-- Recording Extension as NOT Uninstalled, ID="${extId}"`);
              await this.storeExtensionPropsById(extId, extProps);
            } else {
              this.debugAlways(`-- Extension is already recorded as Uninstalled, ID="${extId}"`);
              notInstalled      = true;
              alreadyRecorded   = true;
              uninstalledTimeMS = extProps.uninstalledTimeMS;
            }

          } else {
            var installedExtension = installedExtensionById[extId];
            if (installedExtension) {
              this.debugAlways(`-- Extension is still Installed, ID="${extId}"`);
            } else {
              this.debugAlways(`-- Extension is no longer Installed, ID="${extId}"`);
              notInstalled               = true;
              extProps.uninstalled       = true;
              extProps.uninstalledTimeMS = nowMS;
              extProps.uninstalledType   = 'autoRemoveUninstalledExtensions';
            }
          }

          if (notInstalled) {
            if (numDays === 0 || uninstalledTimeMS < removeBeforeMS) {
              if (numDays === 0) {
                this.debugAlways(`-- Immediately Auto-Removing Extension, ID="${extId}"`);
              } else {
                this.debugAlways(`-- uninstalledTimeMS=${uninstalledTimeMS} removeBeforeMS=${removeBeforeMS} -- Auto-Removing Extension, ID="${extId}"`);
              }

              await this.removeExtension(extId);
              removedExtensionIds.push(extId);
              ++removedCount;

            } else if (alreadyRecorded) {
              this.debugAlways(`-- Extension already recorded as Uninstalled, ID="${extId}"`);
            } else {
              this.debugAlways(`-- Recording Extension as Uninstalled, ID="${extId}"`);
              await this.storeExtensionPropsById(extId, extProps);
            }
          }
        }
      }
    }

    this.debugAlways(`-- removedCount=${removedCount}`);
    if (this.#fsbEventLogger) {
      await this.#fsbEventLogger.logInternalEvent("autoRemoveUninstalledExtensions", "success", parameters, `removedCount=${removedCount}`);
    }

    this.debugAlways("-- end");

    return removedExtensionIds;
  }



  // Set allowAccess=true for the extensionProps for ALL Extensions
  // (except where extensionProps.special or extensionProps.locked)
  // and return a count of how many were actually changed
  async allowAccessAllExtensions() {
    let count = 0;
    const allExtensionsProps = await this.getExtensionsProps();
    if (allExtensionsProps) {
      for (const [extId, extProps] of Object.entries(allExtensionsProps)) {
        if (extProps.special) {
          // should already be allowed
        } else if (extProps.locked) {
          //
        } else if (extProps.allowAccess) { // already allowed
          //
        } else {
          count++;
          extProps.allowAccess = true;
        }
      }

      if (count > 0) await this.storeExtensionsProps(allExtensionsProps);
    }

    return count;
  }

  // Set allowAccess=false for the extensionProps for ALL Extensions
  // (except where extensionProps.special or extensionProps.locked)
  // and return a count of how many were actually changed
  async disallowAccessAllExtensions() {
    var count   = 0;
    var doStore = false
    const allExtensionsProps = await this.getExtensionsProps();
    if (allExtensionsProps) {
      for (const [extId, extProps] of Object.entries(allExtensionsProps)) {
        if (extProps.special) {
          //
        } else if (extProps.locked) {
          //
        } else if (! extProps.allowAccess) { // already disallowed
          if (extProps.readOnly) { // already disallowed
            extProps.Readonly = false;
            doStore           = true;
          }
        } else {
          count++;
          extProps.allowAccess = false;
          extProps.Readonly    = false;
          doStore              = true;
        }
      }

      if (doStore) await this.storeExtensionsProps(allExtensionsProps);
    }

    return count;
  }



  // Set allowAccess=true for the extensionProps
  // for the Extensions with the given extensionIds
  // (except where extensionProps.special or extensionProps.locked)
  // and return a count of how many were actually changed
  async allowAccessSelectedExtensions(extensionIds) {
    let count = 0;
    if (extensionIds && extensionIds.length > 0) {
      const allExtensionsProps = await this.getExtensionsProps();
      if (allExtensionsProps) {
        for (const extId of extensionIds) {
          if (extId && (typeof extId === 'string') && extId.length > 0) {
            const extProps = allExtensionsProps[extId];
            if (! extProps) {
              //
            } else if (extProps.special) {
              // should already be allowed
            } else if (extProps.locked) {
              //
            } else if (extProps.allowAccess) { // already allowed
              //
            } else {
              count++;
              extProps.allowAccess = true;
            }
          }
        }

        if (count > 0) await this.storeExtensionsProps(allExtensionsProps);
      }
    }

    return count;
  }

  // Set allowAccess=false for the extensionProps
  // for the Extensions with the given extensionIds
  // (except where extensionProps.special or extensionProps.locked)
  // and return a count of how many were actually changed
  async disallowAccessSelectedExtensions(extensionIds) {
    var doSaave = false;
    let count   = 0;

    if (extensionIds && extensionIds.length > 0) {
      const allExtensionsProps = await this.getExtensionsProps();
      if (allExtensionsProps) {
        for (const extId of extensionIds) {
          if (extId && (typeof extId === 'string') && extId.length > 0) {
            const extProps = allExtensionsProps[extId];
            if (! extProps) {
              //
            } else if (extProps.special) {
              //
            } else if (extProps.locked) {
              //
            } else if (! extProps.allowAccess) { // already disallowed
              if (extProps.readOnly) {
                extProps.readOnly = false;
                doSave            = true;
              }
            } else {
              count++;
              extProps.allowAccess = false;
              extProps.readOnly    = false;
              doSave               = true;
            }
          }
        }

        if (doSave) await this.storeExtensionsProps(allExtensionsProps);
      }
    }

    return count;
  }

  // (except where extensionProps.special or extensionProps.locked)
  async allowAccess(extId) {
    this.debug(`-- extId="${extId}"`);

    if ((typeof extId === 'string') && extId.length > 0) {
      const extProps = await this.getExtensionPropsById(extId);

      if (extProps) {
        if (extProps.special) {
          this.debug(`-- extId="${extId}" already has ExtensionProps, but it is SPECIAL`);
          return false;
        }
        if (extProps.locked) {
          this.debug(`-- extId="${extId}" already has ExtensionProps, but it is LOCKED`);
          return false;
        }
        if (extProps.allowAccess) {
          this.debug(`-- extId="${extId}" already has ExtensionProps, but it is already allowed Access`);
          return true;
        }

        this.debug(`-- extId="${extId}" already has ExtensionProps, just change allowAccess and store`);
        extProps.allowAccess = true;
        await this.storeExtensionPropsById(extId, extProps);
        return true;

      } else {
        this.debug(`-- extId="${extId}" does not already have ExtensionProps, create new ExtensionProps and store`);

        var installedExtension;
        try {
          installedExtension = await messenger.management.get(extId);
        } catch (error) {
          if (! error.message.startsWith("No such Extension")) {
            this.caught(error, `Error getting Extension "${extId}"`);
          }
        }

        if (installedExtension) {
          const newExtProps = {
            'special':            false,
            'allowAccess':        true,
            'locked':             false,
            'noQuota':            false,
            'dirProtect':         false,
            'readOnly':           false,
            'installed':          true,
            'id':                 installedExtension.id,
            'description':        installedExtension.description,
            'disabled':           ! installedExtension.enabled,
            'name':               installedExtension.name,
            'shortName':          installedExtension.shortName,
            'version':            installedExtension.version,
            'versionName':        installedExtension.versionName,
            'overStorageQuota':   false,
            'overFileSizeQuota':  false,
            'overFileCountQuota': false,
          }
          this.debug(`-- extId="${extId}" New Props:`, newExtProps);

          await this.storeExtensionPropsById(extId, newExtProps);
          return true;

        } else {
          // this should be reported as an error
        }
      }
    }

    // this should be reported as an error - unknown extId
    return false;
  }

  // (except where extensionProps.special or extensionProps.locked)
  async disallowAccess(extId) {
    this.debug(`-- extId="${extId}"`);

    if ((typeof extId === 'string') && extId.length > 0) {
      const extProps = await this.getExtensionPropsById(extId);

      if (extProps) {
        if (extProps.special) {
          this.debug(`-- extId="${extId}" already has ExtensionProps, but it is SPECIAL`);
          return false;
        }
        if (extProps.locked) {
          this.debug(`-- extId="${extId}" already has ExtensionProps, but it is LOCKED`);
          return false;
        }
        if (! extProps.allowAccess) {
          this.debug(`-- extId="${extId}" already has ExtensionProps, but it is already disallowed Access`);
          extProps.readOnly = false;
          return true;
        }

        this.debug(`-- extId="${extId}" already has ExtensionProps, just change allowAccess to false and store`);
        extProps.allowAccess = false;
        extProps.readOnly    = false;
        await this.storeExtensionPropsById(extId, extProps);
        return true;

      } else {
        var installedExtension;
        try {
          installedExtension = await messenger.management.get(extId);
        } catch (error) {
          if (! error.message.startsWith("No such addon")) {
            this.caught(error, `Error getting Extension "${extId}"`);
          }
        }

        if (installedExtension) {
          this.debug(`-- extId="${extId}" does not already have ExtensionProps, create new ExtensionProps and store`);

          const newExtProps = {
            'special':            false,
            'allowAccess':        false,
            'locked':             false,
            'noQuota':            false,
            'dirProtect':         false,
            'readOnly':           false,
            'installed':          true,
            'id':                 installedExtension.id,
            'description':        installedExtension.description,
            'disabled':           ! installedExtension.enabled,
            'name':               installedExtension.name,
            'shortName':          installedExtension.shortName,
            'version':            installedExtension.version,
            'versionName':        installedExtension.versionName,
            'overStorageQuota':   false,
            'overFileSizeQuota':  false,
            'overFileCountQuota': false,
          }
          this.debug(`-- extId="${extId}" New Props:`, newExtProps);

          await this.storeExtensionPropsById(extId, newExtProps);
          return true;

        } else {
          // this should be reported as an error
        }
      }
    }

    // this should be reported as an error - unknown extensionId
    return false;
  }



  async getWindowBounds(windowName) {
    if (windowName && windowName.length > 0) {
      const allWindowBounds = await this.getOption('windowBounds');
      if (allWindowBounds) return allWindowBounds[windowName];
    }
  }

  async storeWindowBounds(windowName, theWindow) {
    if (windowName && windowName.length > 0 && theWindow) {
      let allWindowBounds = await this.getOption('windowBounds');
      if (! allWindowBounds) allWindowBounds = {};

      const bounds = {
        "top":    theWindow.screenTop,
        "left":   theWindow.screenLeft,
        "width":  theWindow.outerWidth,
        "height": theWindow.outerHeight
      }

      allWindowBounds[windowName] = bounds;

      await this.saveOption('windowBounds', allWindowBounds);

      return bounds;
    }
  }



  /* returns { "fileName": string, "bytesWritten":  number }
   *         { "invalid":  string                          } If the fileName or the full pathName for the file became too long. The returned string gives the reason.
   *         { "error":    string                          } If there was some error writing the file. The returned string gives the reason.
   */
  async backupToFile() {
    const fileName = utils.formatNowToDateTimeForFilename() + BACKUP_FILENAME_EXTENSION;

    try {
      const allOptions = await this.getAllOptions();

      if (FsbOptions.#DEBUG) {
        this.debug(`-- Backing up all options to file "${fileName}"`);
        this.debug("-- Backing up", allOptions);
        utils.logProps("", "allOptions", allOptions);
      }

      const response = await this.#fsBrokerApi.writeObjectToJSONFile(fileName, allOptions);
      this.debug(`--response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, `-- Failed to write options backup file "${fileName}"`);
      return { "error": error.name + ": " + error.message };
    }
  }

  /* returns { "fileNames": [],    "length": number }
   *         { "error":     string                  } If there was some error writing the file. The returned string gives the reason.
   */
  async listBackupFiles() {
    try {
      this.debug(`-- Getting list of options backup files with matchGlob "${BACKUP_FILENAME_MATCH_GLOB}"`);
      const response = await this.#fsBrokerApi.listFiles(BACKUP_FILENAME_MATCH_GLOB);
      this.debug(`--response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, "-- Failed to get list of options backup files");
      return { "error": error.name + ": " + error.message };
    }
  }

  /* returns { "fileInfo": [],    "length": number } array of IOUtils.FileInfo - see the FileSystemBroker API README file
   *         { "error":    string                  } If there was some error writing the file. The returned string gives the reason.
   */
  async listBackupFileInfo() {
    try {
      this.debug(`-- Getting list of options backup files with matchGlob "${BACKUP_FILENAME_MATCH_GLOB}"`);
      const response = await this.#fsBrokerApi.listFileInfo(BACKUP_FILENAME_MATCH_GLOB);
      this.debug(`--response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, "-- Failed to get list info for options backup files");
      return { "error": error.name + ": " + error.message };
    }
  }

  /* returns { "fileName": string, "data": object } javascript object
   *         { "invalid":  string                 } If the fileName is invalid or the full pathName for the file became too long. The returned string gives the reason.
   *         { "error":    string                 } If there was some error reading the file. The returned string gives the reason.
   */
  async readBackupFile(fileName) {
    try {
      this.debug(`-- Reading options backup file "${fileName}"`);
      const response = await this.#fsBrokerApi.readObjectFromJSONFile(fileName);
      this.debug(`--response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, `-- Failed to read options backup file "${fileName}"`);
      return { "error": error.name + ": " + error.message };
    }
  }

  /* returns { "fileName": string, "object": object } (all options)
   *         { "invalid":  string                   } If the fileName is invalid or the full pathName for the file became too long. The returned string gives the reason.
   *         { "error":    string                   } If there was some error reading the file or restoring options. The returned string gives the reason.
   */
  async readOptionsFromBackupAndRestore(fileName) {
    this.debug(`-- Reading options backup file "${fileName}"`);

    const response = await this.readBackupFile(fileName);

    if (response && response.object) {
      if (FsbOptions.#DEBUG) {
        this.debug(`-- readBackupFile "${fileName}" -- DATA RETURNED:`);
        utils.logProps("", "readOptionsFromBackupAndRestore", response.object);
      }

      // MABXXX sanity checks on the data?
      const blocked = await this.isQuotaCheckSchedulingBlocked();

      try {
        await messenger.storage.local.set(response.object);
        if (blocked) {
          const KEY = 'fsbQuotaCheckSchedulingBlocked';
          await this.saveOption(KEY, true); // MABXXX might be better to manipulate the object before storing
        }
      } catch (error) {
        this.caught(`-- Failed to restore options from file "${fileName}" -- messenger.storage.local.set() failed`);
        return { "error": `Failed to restore options from file "${fileName}" --  messenger.storage.local.set() failed` };
      }
    }

    return response;
  }

  /* returns object (all options)
   *
   * throws if unable to read backup file
   * or if unable to restore the options into local storage
   */
  async getOptionsFromBackupAndRestore(fileName) {
    this.debug(`-- Reading options backup file "${fileName}"`);

    const response = await this.readBackupFile(fileName);

    if (! response) {
      this.error(`-- readBackupFile "${fileName}" -- READ FILE ERROR: NO RESPONSE FROM FileSystemBroker`);
      throw new Error(`readBackupFile "${fileName}" -- READ FILE ERROR: NO RESPONSE FROM FileSystemBroker`);
    } else if (response.invalid) {
      this.error(`-- readBackupFile "${fileName}" -- READ FILE ERROR: ${response.invalid}`);
      throw new Error(`readBackupFile "${fileName}" -- READ FILE ERROR: ${response.invalid}`);
    } else if (response.error) {
      this.error(`-- readBackupFile "${fileName}" -- READ FILE ERROR: ${response.error}`);
      throw new Error(`readBackupFile "${fileName}" -- READ FILE ERROR: ${response.error}`);
    } else if (! response.fileName) {
      this.error(`-- readBackupFile "${fileName}" -- NO FILENAME RETURNED`);
      throw new Error(`readBackupFile "${fileName}" -- NO FILENAME RETURNED`);
    } else if (! response.object) {
      this.error(`-- readBackupFile "${fileName}" -- NO DATA RETURNED`);
      throw new Error(`readBackupFile "${fileName}" -- NO DATA RETURNED`);
    }

    if (FsbOptions.#DEBUG) {
      this.debug(`-- readBackupFile "${fileName}" -- DATA RETURNED:`);
      utils.logProps("", "getOptionsFromBackupAndRestore", response.object);
    }

    // MABXXX sanity checks on the data?
    const blocked = await isQuotaCheckSchedulingBlocked();

    try {
      await messenger.storage.local.set(response.object);
      if (blocked) {
        const KEY = 'fsbQuotaCheckSchedulingBlocked';
        await this.saveOption(KEY, true); // MABXXX might be better to manipulate the object before storing
      }
    } catch (error) {
      this.caught(`-- Failed to restore options from file "${fileName}" -- messenger.storage.local.set() failed`);
      throw new Error(`Failed to restore options from file "${fileName}" --  messenger.storage.local.set() failed`);
    }

    return response.object;
  }

  /* returns { "fileName": string, "deleted": boolean }
   *         { "invalid":  string                     } If the fileName is invalid or the full pathName for the file became too long. The returned string gives the reason.
   *         { "error":    string                     } If there was some error deleting the file. The returned string gives the reason.
   */
  async deleteBackupFile(fileName) {
    try {
      this.debug(`-- Deleting options backup file "${fileName}"`);
      const response = await this.#fsBrokerApi.deleteFile(fileName);
      this.debug(`--response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, `--  Failed to delete options backup file "${fileName}"`);
      return { "error": error.name + ": " + error.message };
    }
  }
}
