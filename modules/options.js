import { FileSystemBrokerAPI } from '../modules/FileSystemBroker/filesystem_broker_api.js';

import { logProps, getExtensionId, getExtensionName, getI18nMsg, formatNowToDateTimeForFilename, formatMsToDateTime24HR, getMidnightMS } from './utilities.js';

export class FsbOptions {
  static #CLASS_NAME = this.constructor.name;

  static #OUR_EXTENSION_INFO;  // initialized in setupDefaultOptions()
  static #OUR_EXTENSION_PROPS; // initialized in setupDefaultOptions()
  static #EXT_ID;              // initialized in setupDefaultOptions()
  static #EXT_NAME;            // initialized in setupDefaultOptions()

  static #INFO  = false;
  static #LOG   = false;
  static #DEBUG = false;
  static #WARN  = false;

  static #BACKUP_FILENAME_EXTENSION  = ".fsbbackup"; // should be static
  static #BACKUP_FILENAME_MATCH_GLOB = "*.fsbbackup"; // should be static

  static #DEFAULT_OPTION_KEYS = [ // should be static
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
    'fsbShowStatsManagerInstructions',
    'fsbOnRemoveExtensionDeleteDirectory',
  ];

  static #DEFAULT_OPTION_VALUES = { // should be static
    'fsbExtensionAccessControlEnabled':       true,
    'fsbShowGrantExtensionAccessDialog':      false,
    'fsbShowOptionsWindowOnStartup':          false,
    'fsbSkipOnboardingEnabled':               false,
    'fsbEnableConsoleLog':                    false,
    'fsbEnableConsoleDebug':                  false,
    'fsbEnableConsoleDebugTrace':             false,
    'fsbEnableConsoleWarn':                   false,
    'fsbEnableConsoleErrorTrace':             false,
    'fsbEnableAccessLogging':                 false,
    'fsbEnableAccessDeniedLogging':           true,
    'fsbEnableInternalMessageLogging':        false,
    'fsbEnableInternalMessageResultLogging':  true,
    'fsbEnableExternalMessageLogging':        false,
    'fsbEnableExternalMessageResultLogging':  true,
    'fsbEnableInternalEventLogging':          true,
    'fsbShowLoggingOptions':                  true,
    'fsbAutoLogPurgeDays':                    14,
    'fsbAutoRemoveUninstalledExtensionsDays': 2,
    'fsbShowOptionsHints':                    true,
    'fsbShowOptionsActions':                  true,
    'fsbShowExtensionChooserInstructions':    true,
    'fsbShowBackupManagerInstructions':       true,
    'fsbShowEventLogManagerInstructions':     true,
    'fsbShowStatsManagerInstructions':        true,
    'fsbOnRemoveExtensionDeleteDirectory':    true,
  };

  static {
    Object.freeze(FsbOptions.#DEFAULT_OPTION_KEYS);
    Object.freeze(FsbOptions.#DEFAULT_OPTION_VALUES);
  }



  #logger;
  #fsbEventLogger;
  #fsBrokerApi;

  #settingDefaultOptions = false;





  static #optionChangeListeners = [];

  static {
    messenger.storage.onChanged.addListener( async ( storageChanges, areaName ) => { this.#storageChanged(storageChanges, areaName); } );
  }

  static async #storageChanged(storageChanges, areaName) {
////console.debug("storageChanged", `\n- areaName="${areaName}"\n- storageChanges:`, storageChanges);

    if (areaName === 'local') {
      this.#callOptionChangedListeners(storageChanges);
    }
  }

  static addOptionChangeListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error("listener is not a function");
    }

    this.#optionChangeListeners.push(listener);
  }

  static removeOptionChangeListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error("listener is not a function");
    }

    const idx = this.#optionChangeListeners.indexOf(listener);
    if (idx < 0) {
      throw new Error("listener is not in the list of listeners");
    }

    this.#optionChangeListeners.splice(idx, 1);
  }

  static #callOptionChangedListeners(storageChanges) {
    for (const [key, change] of Object.entries(storageChanges)) {
      for (const listener of this.#optionChangeListeners) {
        try {
          listener(key, change.newValue, change.oldValue);
        } catch (ignore) { }
      }
    }
  }





  constructor(logger, fsbEventLogger) {
    this.#logger         = logger;
    this.#fsbEventLogger = fsbEventLogger;
    this.#fsBrokerApi    = new FileSystemBrokerAPI();
  }


  
  info(...info) {
    if (FsbOptions.#INFO)  {
      if (this.#logger) {
        this.#logger.info(FsbOptions.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
      } else {
        console.info(FsbOptions.#EXT_ID + "." + FsbOptions.#CLASS_NAME, ...info);
      }
    }
  }
  
  infoAlways(...info) {
    if (this.#logger) {
      this.#logger.infoAlways(FsbOptions.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
    } else {
      console.info(FsbOptions.#EXT_ID + "." + FsbOptions.#CLASS_NAME, ...info);
    }
  }

  
  log(...info) {
    if (FsbOptions.#LOG)  {
      if (this.#logger) {
        this.#logger.log(FsbOptions.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
      } else {
        console.log(FsbOptions.#EXT_ID + "." + FsbOptions.#CLASS_NAME, ...info);
      }
    }
  }
  
  logAlways(...info) {
    if (this.#logger) {
      this.#logger.logAlways(FsbOptions.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
    } else {
      console.log(FsbOptions.#EXT_ID + "." + FsbOptions.#CLASS_NAME, ...info);
    }
  }

  debug(...info) {
    if (FsbOptions.#DEBUG) {
      if (this.#logger) {
        this.#logger.debug(FsbOptions.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
      } else {
        console.debug(FsbOptions.#EXT_ID + "." + FsbOptions.#CLASS_NAME, ...info);
      }
    }
  }

  debugAlways(...info) {
    if (this.#logger) {
      this.#logger.debugAlways(FsbOptions.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
    } else {
      console.debug(FsbOptions.#EXT_ID + "." + FsbOptions.#CLASS_NAME, ...info);
    }
  }

  warn(...info) {
    if (FsbOptions.#WARN) {
      if (this.#logger) {
        this.#logger.warn(FsbOptions.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
      } else {
        console.warn(FsbOptions.#EXT_ID + "." + FsbOptions.#CLASS_NAME, ...info);
      }
    }
  }

  warnAlways(...info) {
    if (this.#logger) {
      this.#logger.warnAlways(FsbOptions.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
    } else {
      console.warn(FsbOptions.#EXT_ID + "." + FsbOptions.#CLASS_NAME, ...info);
    }
  }

  error(...info) {
    if (this.#logger) {
      this.#logger.error(FsbOptions.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
    } else {
      console.error(FsbOptions.#EXT_ID + "." + FsbOptions.#CLASS_NAME, ...info);
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
      console.error( FsbOptions.#EXT_ID,
                     msg,
                     "\n- name:    " + e.name,
                     "\n- message: " + e.message,
                     "\n- stack:   " + e.stack,
                     ...info
                   );
    }
  }



  setEventLogger(fsbEventLogger) {
    this.#fsbEventLogger = fsbEventLogger;
  }




  async resetOptions() {
    await messenger.storage.local.clear();
    await this.setupDefaultOptions();
  }



  async setupDefaultOptions() {
    if (! FsbOptions.#OUR_EXTENSION_INFO) {
      FsbOptions.#OUR_EXTENSION_INFO = await messenger.management.getSelf();
      FsbOptions.#OUR_EXTENSION_PROPS = {
            'id':           FsbOptions.#OUR_EXTENSION_INFO.id,
            'shortName':    FsbOptions.#OUR_EXTENSION_INFO.shortName,
            'name':         FsbOptions.#OUR_EXTENSION_INFO.name,
            'description':  FsbOptions.#OUR_EXTENSION_INFO.description,
            'version':      FsbOptions.#OUR_EXTENSION_INFO.version,
            'versionName':  FsbOptions.#OUR_EXTENSION_INFO.versionName,
            'disabled':     false, // ! ourExtensionInfo.enabled
            'special':      true, // at this time this is the only way an Extension can be 'special'
            'locked':       true,
            'dirProtected': true,
            'allowAccess':  true,
          };
      FsbOptions.#EXT_ID   = FsbOptions.#OUR_EXTENSION_INFO.id;
      FsbOptions.#EXT_NAME = FsbOptions.#OUR_EXTENSION_INFO.name;
    }

    this.log("-- begin"); // MUST be done AFTER init steap just above - requires #EXT_ID

    const optionKeys = await messenger.storage.local.get(FsbOptions.#DEFAULT_OPTION_KEYS);
    this.log('locally stored options:',  optionKeys);

    for (const [optionKey, defaultValue] of Object.entries(FsbOptions.#DEFAULT_OPTION_VALUES)) {
      if (! (optionKey in optionKeys)) { // id it's not already in local storage
        messenger.storage.local.set(
          { [optionKey] : defaultValue}
        );
        this.log(`new option: [${optionKey}]: ${defaultValue}`);
      }
    }


    
    // ===== MAKE SURE THAT OUR EXTENSION EXTENDED PROPS ARE ALWAYS CORRECT ===== */
    this.#settingDefaultOptions = true;
    const allExtensionsProps = await this.getExtensionsProps();
    this.#settingDefaultOptions = false;

    if (FsbOptions.#LOG) {
      this.logAlways("Replacing our Own ExtensionProps");
      logProps("", "setupDefaultOptions FsbOptions.#OUR_EXTENSION_PROPS:", FsbOptions.#OUR_EXTENSION_PROPS);
    }
    allExtensionsProps[FsbOptions.#EXT_ID] = FsbOptions.#OUR_EXTENSION_PROPS;

    if (FsbOptions.#LOG) {
      logProps("", `setupDefaultOptions.allExtensionsProps["${FsbOptions.#EXT_ID}"]`, allExtensionsProps[FsbOptions.#EXT_ID]);
      this.logAlways(`and storing them -- length=${Object.keys(allExtensionsProps).length}`);
      logProps("", "setupDefaultOptions.extensionProps", allExtensionsProps);
    }
    await this.storeExtensionsProps(allExtensionsProps);

    
    if (FsbOptions.#DEBUG) {
      const props = await this.getExtensionsProps();
      this.debugAlways("\n\nEXTENSIONS PROPS:\n\n", props, "\n\n");
    }

    this.log("-- end");
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



  async isEnabledExtensionAccessControl() {
    return this.isEnabledOption('fsbExtensionAccessControlEnabled', false);
  }

  async isEnabledShowGrantExtensionAccessDialog() {
    return this.isEnabledOption('fsbShowGrantExtensionAccessDialog', false);
  }

  async isEnabledShowOptionsWindowOnStartup() {
    return this.isEnabledOption('fsbShowOptionsWindowOnStartup', false);
  }

  async isEnabledSkipOnboarding() {
    return this.isEnabledOption('fsbSkipOnboardingEnabled', false);
  }

  async isEnabledConsoleLog() {
    return this.isEnabledOption('fsbEnableConsoleLog', false);
  }

  async isEnabledConsoleDebug() {
    return this.isEnabledOption('fsbEnableConsoleDebug', false);
  }

  async isEnabledConsoleDebugTrace() {
    return this.isEnabledOption('fsbEnableConsoleDebugTrace', false);
  }

  async isEnabledConsoleWarn() {
    return this.isEnabledOption('fsbEnableConsoleWarn', false);
  }

  async isEnabledConsoleErrorTrace() {
    return this.isEnabledOption(' fsbEnableConsoleErrorTrace', false);
  }

  async isEnabledAccessLogging() {
    return this.isEnabledOption('fsbEnableAccessLogging', false);
  }

  async isEnabledAccessDeniedLogging() {
    return this.isEnabledOption('fsbEnableAccessDeniedLogging', true);
  }

  async isEnabledInternalMessageLogging() {
    return this.isEnabledOption('fsbEnableInternalMessageLogging', false);
  }

  async isEnabledInternalMessageResultLogging() {
    return this.isEnabledOption('fsbEnableInternalMessageResultLogging', true);
  }

  async isEnabledExternalMessageLogging() {
    return this.isEnabledOption('fsbEnableExternalMessageLogging', false);
  }

  async isEnabledInternalEventLogging() {
    return this.isEnabledOption('fsbEnableInternalEventLogging', true);
  }

  async isEnabledExternalMessageResultLogging() {
    return this.isEnabledOption('fsbEnableExternalMessageResultLogging', true);
  }

  async isEnabledShowLoggingOptions() {
    return this.isEnabledOption('fsbShowLoggingOptions', true);
  }

  async isEnabledShowOptionsHints() {
    return this.isEnabledOption('fsbShowOptionsHints', true);
  }

  async isEnabledShowOptionsActions() {
    return this.isEnabledOption('fsbShowOptionsActions', true);
  }

  async isEnabledShowExtensionChooserInstructions() {
    return this.isEnabledOption('fsbShowExtensionChooserInstructions', true);
  }

  async isEnabledShowBackupManagerInstructions() {
    return this.isEnabledOption('fsbShowBackupManagerInstructions', true);
  }

  async isEnabledShowEventLogManagerInstructions() {
    return this.isEnabledOption('fsbShowEventLogManagerInstructions', true);
  }

  async isEnabledShowStatsManagerInstructions() {
    return this.isEnabledOption('fsbShowStatsManagerInstructions', true);
  }

  async isEnabledOnRemoveExtensionDeleteDirectory() {
    const KEY = 'fsbOnRemoveExtensionDeleteDirectory';
    return this.isEnabledOption(KEY, true); // MABXXX get the default from #DEFAULT_OPTION_VALUES
  }

  async isEnabledOption(key, defaultValue) {
    const options = await messenger.storage.local.get(key); // returns a Promise of an Object with a key-value pair for every key found

    var value = defaultValue;
    if (key in options) {
      value = options[key]; // get the value for the specific key
    }

    return value;
  }



  async getAutoLogPurgeDays(defaultValue) {
    const options = await messenger.storage.local.get('fsbAutoLogPurgeDays'); // returns a Promise of an Object with a key-value pair for every key found

    var value = defaultValue;
    if ('fsbAutoLogPurgeDays' in options) {
      value = options['fsbAutoLogPurgeDays']; // get the value for the specific key
      if (typeof value === 'string') {
        value = +value;
        if (Number.isNaN(value)) value = defaultValue;
      }
    }

    return value;
  }

  async getAutoRemoveUninstalledExtensionsDays(defaultValue) {
    const options = await messenger.storage.local.get('fsbAutoRemoveUninstalledExtensionsDays'); // returns a Promise of an Object with a key-value pair for every key found

    var value = defaultValue;
    if ('fsbAutoRemoveUninstalledExtensionsDays' in options) {
      value = options['fsbAutoRemoveUninstalledExtensionsDays']; // get the value for the specific key
      if (typeof value === 'string') {
        value = +value;
        if (Number.isNaN(value)) value = defaultValue;
      }
    }

    return value;
  }



  async getAllOptions() {
    return messenger.storage.local.get(); // returns a Promise of an array of Object with a key-value pair for every key found
  }

  async getOption(key, defaultValue) {
    const options = await messenger.storage.local.get(key); // returns a Promise of an Object with a key-value pair for every key found

    var value = defaultValue;
    if (key in options) {
      value = options[key]; // get the value for the specific key
    }

    return value;
  }



  // obj must be object like: {[key], value}
  async storeOption(obj) {
    return messenger.storage.local.set(obj);
  }

  // build object {[key], value} and store it
  async saveOption(key, value) {
    const obj = {[key]: value};
    return await this.storeOption(obj);
  }



  async getExtensionsProps() {
    const nowMS               = Date.now();
    const installedExtensions = await messenger.management.getAll();
    const props               = await messenger.storage.local.get('extensionsProps'); // return Object with key-value pair for every key found
    let   extensionsProps;

    if (FsbOptions.#DEBUG) {
      this.debugAlways(`-- installedExtensions.length=${installedExtensions.length}`);
      logProps("", "FSBOptions.getExtensionsProps.installedExtensions", installedExtensions);
    }

    if (! props) {
      // this is not an error if we're setting defaults
      if (! this.#settingDefaultOptions) this.error("-- failed to get 'extensionsProps' from local storage");

    } else {
      extensionsProps = props['extensionsProps'];
      if (! extensionsProps) {
        if (! this.#settingDefaultOptions) this.error("-- failed to get props['extensionsProps'] (extensionsProps) from local storage");

      } else if (typeof extensionsProps !== 'object') {
        if (! this.#settingDefaultOptions) this.error("-- props['extensionsProps'] (extensionsProps) is not a object");

      } else {
        if (FsbOptions.#DEBUG) {
          this.debugAlways(`-- Object.keys(extensionsProps).length=${Object.keys(extensionsProps).length}`);
          logProps("", "FSBOptions.getExtensionsProps.extensionsProps", extensionsProps);
        }

        if (installedExtensions && installedExtensions.length > 0) {
          // Update extensionsProps with data from the currently-installed extensions
          for (const installedExtension of installedExtensions) { // an array of managament.ExtensionInfo
            if (installedExtension.type === 'extension') {
              const installedExtensionIsConfigured = extensionsProps.hasOwnProperty(installedExtension.id);
              if (! installedExtensionIsConfigured) {
                this.debug(`-- Extension NOT configured - not found in extensionsProps: ID="${installedExtension.id}`);
              } else {
                this.debug(`-- Extension IS configured - found in extensionsProps: ID="${installedExtension.id}`);

                const extensionProps       = extensionsProps[installedExtension.id];
                extensionProps.installed   = true; // this should have been 'configured'
                extensionProps.uninstalled = false;
                extensionProps.id          = installedExtension.id;                       // redundant - should already be there
                extensionProps.description = installedExtension.description;              // remove this line if we ever store this locally so we can edit/replace
                extensionProps.disabled    = ! installedExtension.enabled;                // remove this line if we ever store this locally so we can edit/replace
////////////////extensionProps.name        = installedExtension.name;                     // we store this locally so we can edit/replace MABXXX WHY?
                extensionProps.shortName   = installedExtension.shortName;                // remove this line if we ever store this locally so we can edit/replace
                extensionProps.version     = installedExtension.version;
                extensionProps.versionName = installedExtension.versionName;
              }
            }
          }

          // If the extension is NOT in installedExtensions, then mark it as uninstalled
          for (const [extensionId, extensionProps] of Object.entries(extensionsProps)) {
            const foundInstalledExtension = installedExtensions.find(extension => extension.id === extensionId);
            if (foundInstalledExtension) {
              extensionProps.uninstalled = false; // <--- Redudant with code just above, but WTF? 
              delete extensionProps['uninstalledTimeMS'];
            } else {
              extensionProps.uninstalled       = true;
              extensionProps.uninstalledTimeMS = Date.now(); // MABXXX uninstalledTimeMS
            }
          }
        } else {
          // NO installedExtensions, so mark them all as uninstalled
          for (const [extensionId, extensionProps] of Object.entries(extensionsProps)) {
            extensionProps.uninstalled       = true;
            extensionProps.uninstalledTimeMS = Date.now(); // MABXXX uninstalledTimeMS
          }
        }

        //MABXXX SHOULD WE UPDATE STORAGE???

        if (FsbOptions.#DEBUG) {
          this.debugAlways(`-- RETURNING Object.keys(extensionsProps).length=${Object.keys(extensionsProps).length}`);
          logProps("", "FSBOptions.getExtensionsProps.extensionsProps", extensionsProps);
        }
      }
    }

    return extensionsProps;
  }

  async getExtensionsPropsSortedById() {
    const extensionsProps = await this.getExtensionsProps();

    if (! extensionsProps) {
      this.error("-- getExtensionsProps() DIDN'T RETURN ANYTHING");
    } else {
      if (FsbOptions.#LOG) {
        this.log("-- extensionsProps:");
        logProps("", "FSBOptions.getExtensionsPropsSortedById.extensionsProps", extensionsProps);
      }

      const sorted = sortExtensionsPropsById(extensionsProps, true);

      if (FsbOptions.#LOG) {
        this.log("-- sorted:");
        logProps("", "FSBOptions.getExtensionsPropsSortedById.sorted", sorted);
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
        logProps("", "FSBOptions.getExtensionsPropsSortedByName.extensionsProps", extensionsProps);
      }

      const sorted =  sortExtensionsPropsByName(extensionsProps, true);

      if (FsbOptions.#LOG) {
        this.log("-- sorted:");
        logProps("", "FSBOptions.getExtensionsPropsSortedByName.sorted", sorted);
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

  async getExtensionPropsById(extensionId) {
    if ((typeof extensionId === 'string') && extensionId.length > 0) {
      const extensionsProps = await this.getExtensionsProps();
      return extensionsProps[extensionId];
    }
  }

  async isSpecial(extensionId) {
    if ((typeof extensionId === 'string') && extensionId.length > 0) {
      const extensionsProps = await this.getExtensionsProps();
      const props = extensionsProps[extensionId];
      if (props) {
        return props.special;
      }
    }

    return false;
  }

  async isLocked(extensionId) {
    if ((typeof extensionId === 'string') && extensionId.length > 0) {
      const extensionsProps = await this.getExtensionsProps();
      const props = extensionsProps[extensionId];
      if (props) {
        return props.locked;
      }
    }

    return false;
  }

  async isDirProtected(extensionId) {
    if ((typeof extensionId === 'string') && extensionId.length > 0) {
      const extensionsProps = await this.getExtensionsProps();
      const props = extensionsProps[extensionId];
      if (props) {
        return props.dirProtected;
      }
    }

    return false;
  }

  async isAllowAccess(extensionId) {
    if ((typeof extensionId === 'string') && extensionId.length > 0) {
      const extensionsProps = await this.getExtensionsProps();
      const props = extensionsProps[extensionId];
      if (props) {
        return props.allowAccess;
      }
    }

    return false;
  }



  async storeExtensionsProps(props) { // MABXXX an array???
    // MABXXX SHOULD WE REMOVE ALL THE STUFF THAT WE DON'T ALLOW THE USER TO CHANGE - and thus we should always be getting from messenger.management.getAll() ???
    //        - id
    //        - description
    //        - disabled
    //        - shortName
    //        - version
    //        - versionName
    // MABXXX IF AN EXTENSION GETS UNINSTALLED, THUS IT WON'T BE RETURNED FROM messenger.management.getAll(), THESE WILL BE THE LAST-KNOWN VALUES
    //        But uninstalled should be true.
    return messenger.storage.local.set(
      { 'extensionsProps': props }
    );
  }

  async storeExtensionPropsById(extensionId, props) {
    if ((typeof extensionId === 'string') && extensionId.length > 0 && (typeof props === 'object')) {
      // MABXXX SHOULD WE REMOVE ALL THE STUFF THAT WE DON'T ALLOW THE USER TO CHANGE - and thus we should always be getting from messenger.management.getAll???
      //        - id
      //        - description
      //        - disabled
      //        - shortName
      //        - version
      //        - versionName
      // MABXXX IF AN EXTENSION GETS UNINSTALLED, THUS IT WON'T BE RETURNED FROM messenger.management.getAll(), THESE WILL BE THE LAST-KNOWN VALUES
      //        But uninstalled should be true.
      const extensionsProps = await this.getExtensionsProps();
      extensionsProps[extensionId] = props; // MABXXX DANGER!!! THIS COULD CHANGE THE extensionId!!!
      await this.storeExtensionsProps(extensionsProps);
      return extensionsProps[extensionId];
    }
  }



  // Create/Update an extensionProps and return it.
  async addOrUpdateExtension(oldExtensionId, newExtensionId, newExtensionName, newAllowAccess, newLocked, newDirProtected) {
    if (    (! oldExtensionId || ((typeof oldExtensionId   === 'string') && oldExtensionId.length   > 0))
         && (newExtensionId   && ((typeof newExtensionId   === 'string') && newExtensionId.length   > 0))
         && (newExtensionName && ((typeof newExtensionName === 'string') && newExtensionName.length > 0))
       )
    {
      const allExtensionsProps = await this.getExtensionsProps();

      if (oldExtensionId && oldExtensionId !== newExtensionId) { // changing the ID????
        delete allExtensionsProps[oldExtensionId];
      }

      const locked       = (typeof newLocked       === 'boolean') ? newLocked       : false;
      const dirProtected = (typeof newDirProtected === 'boolean') ? newDirProtected : false;
      const allowAccess  = (typeof newAllowAccess  === 'boolean') ? newAllowAccess  : false;

      const newProps = {
        'id':           newExtensionId,
        'name':         newExtensionName,
        'allowAccess':  allowAccess,
        'locked':       locked,
        'dirProtected': dirProtected,
      };
      allExtensionsProps[newExtensionId] = newProps;

      await this.storeExtensionsProps(allExtensionsProps);
      return newProps;
    }
  }



  // Remove the extensionProps for the Extension (not the Extension istself)
  // with the given extensionId and return it.
  //
  // THIS DOES NOT DELETE EXTENSION DIRECTORIES
  async removeExtension(extensionId, ignoreLocks) {
    const removeLocked = (typeof ignoreLocks) === 'boolean' ? ignoreLocks : false;

    this.log(`-- begin extensionId="${extensionId}", removeLocked=${removeLocked}`);

    let deletedProps;
    if (extensionId && (typeof extensionId === 'string') && extensionId.length > 0) {
      const allExtensionsProps = await this.getExtensionsProps();
      if (allExtensionsProps) {
        const props = allExtensionsProps[extensionId];
        if (! props) {
          this.error(`Failed to get ExtensionProps for Extension "${extensionId}"`);
        } else if (props.special) {
          this.error(`Extension "${extensionId}" is SPECIAL and will NOT be removed`);
        } else if (props.locked && ! removeLocked) {
          this.error(`Extension "${extensionId}" is LOCKED and will NOT be removed`);
        } else{
          this.log(`-- deleting extensionId="${extensionId}"`);
          delete allExtensionsProps[extensionId];
          deletedProps = props;
          await this.storeExtensionsProps(allExtensionsProps);
        }
      }
    }

    this.log(`-- end extensionId="${extensionId}"`);
    return deletedProps;
  }

  // Remove the extensionProps for the Extensions with the given extensionIds
  // and return the props of those that were actually removed
  //
  // THIS DOES NOT DELETE EXTENSION DIRECTORIES
  async removeExtensions(extensionIds, ignoreLocks) {
    const removeLocked          = (typeof ignoreLocks) === 'boolean' ? ignoreLocks : false;
    const removedExtensionProps = [];
    var   count                 = 0;

    if (extensionIds && extensionIds.length > 0) {
      const allExtensionsProps = await this.getExtensionsProps();
      if (allExtensionsProps) {
        for (const extensionId of extensionIds) {
          if (extensionId && (typeof extensionId === 'string') && extensionId.length > 0) {
            const props = allExtensionsProps[extensionId];
            if (! props) {
              this.error(`Failed to get ExtensionProps for Extension "${extensionId}"`);
            } else if (props.special) {
              this.error(`Extension "${extensionId}" is SPECIAL and will NOT be removed`);
            } else if (props.locked && ! removedLocked) {
              this.error(`Extension "${extensionId}" is LOCKED and will NOT be removed`);
            } else {
              removedExtensionProps.push(props);
              count++;
              delete allExtensionsProps[extensionId];
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
    const removeBeforeMS   = getMidnightMS(nowMS, -numDays - 1);
    const removeBeforeTime = formatMsToDateTime24HR(removeBeforeMS);
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
      for (const [extensionId, extProps] of Object.entries(allExtensionsProps)) {
        if (extProps.special) {
          this.debug(`Extension "${extensionId}" is SPECIAL and will NOT be Auto-Removed`);
        } else if (extProps.locked) {
          this.debug(`Extension "${extensionId}" is LOCKED and will NOT be Auto-Removed`);
        } else {
          var notInstalled      = false;
          var alreadyRecorded   = false;
          var uninstalledTimeMS = nowMS;

          if (extProps.uninstalled) { // already marked as uninstalled?
            var installedExtension = installedExtensionById[extensionId];
            if (installedExtension) {
              this.debugAlways(`-- Extension is recorded as Uninstalled IS Installed (again?,) ID="${extensionId}"`);
              extProps.uninstalled = false;
              delete extProps['uninstalledType'];
              delete extProps['uninstalledTimeMS'];
              this.debugAlways(`-- Recording Extension as NOT UNinstalled, ID="${extensionId}"`);
              await this.storeExtensionPropsById(extensionId, extProps);
            } else {
              this.debugAlways(`-- Extension is already recorded as Uninstalled, ID="${extensionId}"`);
              notInstalled      = true;
              alreadyRecorded   = true;
              uninstalledTimeMS = extProps.uninstalledTimeMS;
            }

          } else {
            var installedExtension = installedExtensionById[extensionId];
            if (installedExtension) {
              this.debugAlways(`-- Extension is still Installed, ID="${extensionId}"`);
            } else {
              this.debugAlways(`-- Extension is no longer Installed, ID="${extensionId}"`);
              notInstalled               = true;
              extProps.uninstalled       = true;
              extProps.uninstalledTimeMS = nowMS;
              extProps.uninstalledType   = 'autoRemoveUninstalledExtensions';
            }
          }

          if (notInstalled) {
            if (numDays == 0 || uninstalledTimeMS < removeBeforeMS) {
              if (numDays == 0) {
                this.debugAlways(`-- Immediately Auto-Removing Extension, ID="${extensionId}"`);
              } else {
                this.debugAlways(`-- uninstalledTimeMS=${uninstalledTimeMS} removeBeforeMS=${removeBeforeMS} -- Auto-Removing Extension, ID="${extensionId}"`);
              }

              await this.removeExtension(extensionId);
              removedExtensionIds.push(extensionId);
              ++removedCount;

            } else if (alreadyRecorded) {
              this.debugAlways(`-- Extension already recorded as Uninstalled, ID="${extensionId}"`);
            } else {
              this.debugAlways(`-- Recording Extension as Uninstalled, ID="${extensionId}"`);
              await this.storeExtensionPropsById(extensionId, extProps);
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
      for (const [extensionId, props] of Object.entries(allExtensionsProps)) {
        if (props.special) {
          //
        } else if (props.locked) {
          //
        } else if (props.allowAccess) { // already allowed
          //
        } else {
          count++;
          props.allowAccess = true;
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
    let count = 0;
    const allExtensionsProps = await this.getExtensionsProps();
    if (allExtensionsProps) {
      for (const [extensionId, props] of Object.entries(allExtensionsProps)) {
        if (props.special) {
          //
        } else if (props.locked) {
          //
        } else if (! props.allowAccess) { // already disallowed
          //
        } else {
          count++;
          props.allowAccess = false;
        }
      }
      if (count > 0) await this.storeExtensionsProps(allExtensionsProps);
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
        for (const extensionId of extensionIds) {
          if (extensionId && (typeof extensionId === 'string') && extensionId.length > 0) {
            const props = allExtensionsProps[extensionId];
            if (! props) {
              //
            } else if (props.special) {
              //
            } else if (props.locked) {
              //
            } else if (props.allowAccess) { // already allowed
              //
            } else {
              count++;
              props.allowAccess = true;
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
    let count = 0;
    if (extensionIds && extensionIds.length > 0) {
      const allExtensionsProps = await this.getExtensionsProps();
      if (allExtensionsProps) {
        for (const extensionId of extensionIds) {
          if (extensionId && (typeof extensionId === 'string') && extensionId.length > 0) {
            const props = allExtensionsProps[extensionId];
            if (! props) {
              //
            } else if (props.special) {
              //
            } else if (props.locked) {
              //
            } else if (! props.allowAccess) { // already disallowed
              //
            } else {
              count++;
              props.allowAccess = false;
            }
          }
        }
        if (count > 0) await this.storeExtensionsProps(allExtensionsProps);
      }
    }
    return count;
  }

  // (except where extensionProps.special or extensionProps.locked)
  async allowAccess(extensionId) {
    this.debug(`-- extensionId="${extensionId}"`);

    if ((typeof extensionId === 'string') && extensionId.length > 0) {
      var installedExtension;
      try {
        installedExtension = await messenger.management.get(extensionId);
      } catch (error) {
        if (! error.message.startsWith("No such Extension")) {
          this.caught(error, `Error getting Extension "${extensionId}"`);
        }
      }

      if (! installedExtension) {
        this.error(`-- Extension is not installed, ID="${extensionId}"`);

      } else {
        const props = await this.getExtensionPropsById(extensionId);

        if (props) {
          if (props.special) {
            this.debug(`-- extensionId="${extensionId}" already has ExtensionProps, but it is SPECIAL`);
            return false;
          }
          if (props.locked) {
            this.debug(`-- extensionId="${extensionId}" already has ExtensionProps, but it is LOCKED`);
            return false;
          }
          if (props.allowAccess) {
            this.debug(`-- extensionId="${extensionId}" already has ExtensionProps, but it is already allowed Access`);
            return true;
          }

          this.debug(`-- extensionId="${extensionId}" already has ExtensionProps, just change allowAccess and store`);
          props.allowAccess = true;
          await this.storeExtensionPropsById(extensionId, props);
          return true;

        } else {
          this.debug(`-- extensionId="${extensionId}" does not already have ExtensionProps, create new ExtensionProps and store`);

          const newProps = {
            'allowAccess': true,
            'installed':   true,
            'id':          installedExtension.id,
            'description': installedExtension.description,
            'disabled':    ! installedExtension.enabled,
            'name':        installedExtension.name,
            'shortName':   installedExtension.shortName,
            'version':     installedExtension.version,
            'versionName': installedExtension.versionName
          }
          this.debug(`-- extensionId="${extensionId}" New Props:`, newProps);

          await this.storeExtensionPropsById(extensionId, newProps);
          return true;
        }
      }
    }

    return false;
  }

  // (except where extensionProps.special or extensionProps.locked)
  async disallowAccess(extensionId) {
    this.debug(`-- extensionId="${extensionId}"`);

    if ((typeof extensionId === 'string') && extensionId.length > 0) {
      var installedExtension;
      try {
        installedExtension = await messenger.management.get(extensionId);
      } catch (error) {
        if (! error.message.startsWith("No such addon")) {
          this.caught(error, `Error getting Extension "${extensionId}"`);
        }
      }

      if (! installedExtension) {
        this.error(`-- Extension is not installed, ID="${extensionId}"`);

      } else {
        const props = await this.getExtensionPropsById(extensionId);

        if (props) {
          if (props.special) {
            this.debug(`-- extensionId="${extensionId}" already has ExtensionProps, but it is SPECIAL`);
            return false;
          }
          if (props.locked) {
            this.debug(`-- extensionId="${extensionId}" already has ExtensionProps, but it is LOCKED`);
            return false;
          }
          if (! props.allowAccess) {
            this.debug(`-- extensionId="${extensionId}" already has ExtensionProps, but it is already disallowed Access`);
            return true;
          }

          this.debug(`-- extensionId="${extensionId}" already has ExtensionProps, just change allowAccess to false and store`);
          props.allowAccess = false;
          await this.storeExtensionPropsById(extensionId, props);
          return true;

        } else {
          this.debug(`-- extensionId="${extensionId}" does not already have ExtensionProps, create new ExtensionProps and store`);

          const newProps = {
            'allowAccess': false,
            'installed':   true,
            'id':          installedExtension.id,
            'description': installedExtension.description,
            'disabled':    ! installedExtension.enabled,
            'name':        installedExtension.name,
            'shortName':   installedExtension.shortName,
            'version':     installedExtension.version,
            'versionName': installedExtension.versionName
          }
          this.debug(`-- extensionId="${extensionId}" New Props:`, newProps);

          await this.storeExtensionPropsById(extensionId, newProps);
          return true;
        }
      }
    }

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
    const fileName = formatNowToDateTimeForFilename() + FsbOptions.#BACKUP_FILENAME_EXTENSION;

    try {
      const allOptions = await this.getAllOptions();

      if (FsbOptions.#DEBUG) {
        this.debugAlways(`-- Backing up all options to file "${fileName}"`);
        this.debugAlways("-- Backing up", allOptions);
        logProps("", "allOptions", allOptions);
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
      this.debug(`-- Getting list of options backup files with matchGlob "${FsbOptions.#BACKUP_FILENAME_MATCH_GLOB}"`);
      const response = await this.#fsBrokerApi.listFiles(FsbOptions.#BACKUP_FILENAME_MATCH_GLOB);
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
      this.debug(`-- Getting list of options backup files with matchGlob "${FsbOptions.#BACKUP_FILENAME_MATCH_GLOB}"`);
      const response = await this.#fsBrokerApi.listFileInfo(FsbOptions.#BACKUP_FILENAME_MATCH_GLOB);
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
        logProps("", "readOptionsFromBackupAndRestore", response.object);
      }

      // MABXXX sanity checks on the data?

      try {
        await messenger.storage.local.set(response.object);
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
      this.debugAlways(`-- readBackupFile "${fileName}" -- DATA RETURNED:`);
      logProps("", "getOptionsFromBackupAndRestore", response.object);
    }

    // MABXXX sanity checks on the data?

    try {
      await messenger.storage.local.set(response.object);
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
