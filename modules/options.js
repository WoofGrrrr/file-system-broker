import { FileSystemBrokerAPI } from '../modules/FileSystemBroker/filesystem_broker_api.js';

import { logProps, getExtensionId, getExtensionName, getI18nMsg, formatNowToDateTimeForFilename, formatMsToDateTime24HR, getMidnightMS } from '../utilities.js';

export class FsbOptions {
  constructor(logger, fsbEventLogger) {
    this.className      = this.constructor.name;
    this.extId          = getExtensionId();
    this.extName        = getExtensionName();

    this.LOG            = false;
    this.DEBUG          = false;

    this.logger         = logger;
    this.fsbEventLogger = fsbEventLogger;
    this.fsBrokerApi    = new FileSystemBrokerAPI();

    this.BACKUP_FILENAME_EXTENSION  = ".fsbbackup";
    this.BACKUP_FILENAME_MATCH_GLOB = "*.fsbbackup";

    this.settingDefaultOptions = false;

    this.defaultOptionKeys = [
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
      'fsbShowEventLogManagerInstructions'
    ];

    this.defaultOptionValues = {
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
      'fsbShowEventLogManagerInstructions':     true
    };
  }


  
  log(...info) {
    if (! this.LOG) return;
    const msg = info.shift();
    if (this.logger) {
      this.logger.log(this.className + "#" + msg, ...info); // this adds the extension ID and Caller Info
    } else {
      console.log(this.extId + "." + this.className + "#" + msg, ...info);
    }
  }
  
  logAlways(...info) {
    const msg = info.shift();
    if (this.logger) {
      this.logger.logAlways(this.className + "#" + msg, ...info); // this adds the extension ID and Caller Info
    } else {
      console.log(this.extId + "." + this.className + "#" + msg, ...info);
    }
  }

  debug(...info) {
    if (! this.DEBUG) return;
    const msg = info.shift();
    if (this.logger) {
      this.logger.debug(this.className + "#" + msg, ...info); // this adds the extension ID and Caller Info
    } else {
      console.debug(this.extId + "." + this.className + "#" + msg, ...info);
    }
  }

  debugAlways(...info) {
    const msg = info.shift();
    if (this.logger) {
      this.logger.debugAlways(this.className + "#" + msg, ...info); // this adds the extension ID and Caller Info
    } else {
      console.debug(this.extId + "." + this.className + "#" + msg, ...info);
    }
  }

  error(...info) {
    const msg = info.shift();
    if (this.logger) {
      this.logger.error(this.className + "#" + msg, ...info); // this adds the extension ID and Caller Info
    } else {
      console.error(this.extId + "." + this.className + "#" + msg, ...info);
    }
  }

  caught(e, ...info) {
    // always log exceptions
    const msg = info.shift();
    if (this.logger) {
      this.logger.error( this.className + "#" + msg,
                         "\n- name:    " + e.name,
                         "\n- message: " + e.message,
                         "\n- stack:   " + e.stack,
                         ...info
                   );
    } else {
      console.error( this.extId + "." + this.className + "#" + msg,
                     "\n- name:    " + e.name,
                     "\n- message: " + e.message,
                     "\n- stack:   " + e.stack,
                     ...info
                   );
    }
  }



  setEventLogger(fsbEventLogger) {
    this.fsbEventLogger = fsbEventLogger;
  }




  async resetOptions() {
    await messenger.storage.local.clear();
    await this.setupDefaultOptions();
  }



  async setupDefaultOptions() {
    this.log("setupDefaultOptions -- begin");

    const optionKeys = await messenger.storage.local.get(this.defaultOptionKeys);
    this.log('setupDefaultOptions: locally stored options:',  optionKeys);

    for(const [optionKey, defaultValue] of Object.entries(this.defaultOptionValues)) {
      if (!(optionKey in optionKeys)) {
        messenger.storage.local.set(
          { [optionKey] : defaultValue}
        );
        this.log(`setupDefaultOptions: new option: [${optionKey}]: ${defaultValue}`);
      }
    }
    
    this.settingDefaultOptions = true;
    let extensionsProps = await this.getExtensionsProps();
    this.settingDefaultOptions = false;

    let defaultExtensionProps;
    if (! extensionsProps) {
      this.logAlways("setupDefaultOptions: creating initial extensions properties");
      extensionsProps = {};
    } else {
      this.log("setupDefaultOptions: got extensions properties");
      defaultExtensionProps = extensionsProps[this.extId];
    }

    if (! defaultExtensionProps) {
      const ourExtensionInfo = await messenger.management.getSelf();
      defaultExtensionProps = {
        'id':          ourExtensionInfo.id, // should be same as this.extId
        'shortName':   ourExtensionInfo.shortName,
        'name':        ourExtensionInfo.name,
        'description': ourExtensionInfo.description,
        'version':     ourExtensionInfo.version,
        'versionName': ourExtensionInfo.versionName,
        'disabled':    false, // ! ourExtensionInfo.enabled
        'allowAccess': true,
        'locked':      true
      };

      if (this.LOG) {
        this.logAlways("setupDefaultOptions: creating default extension properties");
        logProps("", "setupDefaultOptions.defaultExtensionProps", defaultExtensionProps);
      }
      extensionsProps[this.extId] = defaultExtensionProps;

      if (this.LOG) {
        logProps("", `setupDefaultOptions.extensionsProps["${this.extId}"]`, extensionsProps[this.extId]);
        this.logAlways(`setupDefaultOptions: and storing them -- length=${Object.keys(extensionsProps).length}`);
        logProps("", "setupDefaultOptions.extensionProps", extensionsProps);
      }
      await this.storeExtensionsProps(extensionsProps);
    }

    this.log("setupDefaultOptions -- end");
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
    if (key in options) {
      value = options['fsbAutoLogPurgeDays']; // get the value for the specific key
    }

    return value;
  }

  async getAutoRemoveUninstalledExtensionsDays(defaultValue) {
    const options = await messenger.storage.local.get('fsbAutoRemoveUninstalledExtensionsDays'); // returns a Promise of an Object with a key-value pair for every key found

    var value = defaultValue;
    if (key in options) {
      value = options['fsbAutoRemoveUninstalledExtensionsDays']; // get the value for the specific key
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

    if (this.DEBUG) {
      this.debugAlways(`getExtensionsProps -- installedExtensions.length=${installedExtensions.length}`);
      logProps("", "FSBOptions.getExtensionsProps.installedExtensions", installedExtensions);
    }

    if (! props) {
      // this is not an error if we're setting defaults
      if (! this.settingDefaultOptions) this.error("getExtensionsProps -- failed to get 'extensionsProps' from local storage");

    } else {
      extensionsProps = props['extensionsProps'];
      if (! extensionsProps) {
        if (! this.settingDefaultOptions) this.error("getExtensionsProps -- failed to get props['extensionsProps'] (extensionsProps) from local storage");

      } else if (typeof extensionsProps !== 'object') {
        if (! this.settingDefaultOptions) this.error("getExtensionsProps -- props['extensionsProps'](extensionsProps) is not a object");

      } else {
        if (this.DEBUG) {
          this.debugAlways(`getExtensionsProps -- Object.keys(extensionsProps).length=${Object.keys(extensionsProps).length}`);
          logProps("", "FSBOptions.getExtensionsProps.extensionsProps", extensionsProps);
        }

        for (const installedExtension of installedExtensions) {
          if (installedExtension.type === 'extension') {
            const configured = extensionsProps.hasOwnProperty(installedExtension.id);
            if (! configured) {
              this.debug(`getExtensionsProps -- Extension NOT configured - not found in extensionsProps: ID="${installedExtension.id}`);
            } else {
              this.debug(`getExtensionsProps -- Extension IS configured - found in extensionsProps: ID="${installedExtension.id}`);

              const extensionProps       = extensionsProps[installedExtension.id];
              extensionProps.installed   = true; // this should have been 'configured'
              extensionProps.uninstalled = false;
              extensionProps.id          = installedExtension.id;                       // redundant - should already be there
              extensionProps.description = installedExtension.description;              // remove this line if we ever store this locally so we can edit/replace
              extensionProps.disabled    = ! installedExtension.enabled;                // remove this line if we ever store this locally so we can edit/replace
//////////////extensionProps.name        = installedExtension.name;                     // we store this locally so we can edit/replace MABXXX WHY?
              extensionProps.shortName   = installedExtension.shortName;                // remove this line if we ever store this locally so we can edit/replace
              extensionProps.version     = installedExtension.version;
              extensionProps.versionName = installedExtension.versionName;
            }
          }
        }

        if (this.DEBUG) {
          this.debugAlways(`getExtensionsProps -- RETURNING Object.keys(extensionsProps).length=${Object.keys(extensionsProps).length}`);
          logProps("", "FSBOptions.getExtensionsProps.extensionsProps", extensionsProps);
        }
      }
    }

    return extensionsProps;
  }

  async getExtensionsPropsSortedById() {
    const extensionsProps = await this.getExtensionsProps();

    if (! extensionsProps) {
      this.error("getExtensionsPropsSortedById -- getExtensionsProps() DIDN'T RETURN ANYTHING");
    } else {
      if (this.LOG) {
        this.log("getExtensionsPropsSortedById -- extensionsProps:");
        logProps("", "FSBOptions.getExtensionsPropsSortedById.extensionsProps", extensionsProps);
      }

      const sorted = sortExtensionsPropsById(extensionsProps, true);

      if (this.LOG) {
        this.log("getExtensionsPropsSortedById -- sorted:");
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
      this.error("getExtensionsPropsSortedByName -- getExtensionsProps() DIDN'T RETURN ANYTHING");
    } else {
      if (this.LOG) {
        this.log("getExtensionsPropsSortedByName -- extensionsProps:");
        logProps("", "FSBOptions.getExtensionsPropsSortedByName.extensionsProps", extensionsProps);
      }

      const sorted =  sortExtensionsPropsByName(extensionsProps, true);

      if (this.LOG) {
        this.log("getExtensionsPropsSortedByName -- sorted:");
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

  async storeExtensionsProps(props) {
    // MABXXX SHOULD WE REMOVE ALL THE STUFF THAT WE DON'T ALLOW THE USER TO CHANGE - and thus we should always be getting from messenger.management.getAll???
    //        - id
    //        - description
    //        - disabled
    //        - shortName
    //        - version
    //        - versionName
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
      const extensionsProps = await this.getExtensionsProps();
      extensionsProps[extensionId] = props;
      await this.storeExtensionsProps(extensionsProps);
      return extensionsProps[extensionId];
    }
  }



  // Create/Update an extensionProps and return it.
  async addOrUpdateExtension(oldExtensionId, newExtensionId, newExtensionName, newAllowAccess) {
    if (    (! oldExtensionId || (typeof oldExtensionId   === 'string'))
         && (newExtensionId   && (typeof newExtensionId   === 'string') && newExtensionId.length   > 0)
         && (newExtensionName && (typeof newExtensionName === 'string') && newExtensionName.length > 0)
       )
    {
      const allExtensionsProps = await this.getExtensionsProps();

      if (oldExtensionId && oldExtensionId !== newExtensionId) {
        delete allExtensionsProps[oldExtensionId];
      }

      const allowAccess = (typeof newAllowAccess === 'boolean') ? newAllowAccess : true;
      const newProps = {
        'id':          newExtensionId,
        'name':        newExtensionName,
        'allowAccess': allowAccess
      };
      allExtensionsProps[newExtensionId] = newProps;

      await this.storeExtensionsProps(allExtensionsProps);
      return newProps;
    }
  }



  // Delete the extensionProps for the Extension (not the Extension istself)
  // with the given extensionId and return it.
  async deleteExtension(extensionId) {
    this.log(`deleteExtension -- begin extensionId="${extensionId}"`);

    let deleted;
    if (extensionId && (typeof extensionId === 'string') && extensionId.length > 0) {
      const allExtensionsProps = await this.getExtensionsProps();
      if (allExtensionsProps) {
        const props = allExtensionsProps[extensionId];
        if (! props) {
        } else {
          this.log(`deleteExtension -- deleting extensionId="${extensionId}"`);
          delete allExtensionsProps[extensionId];
          deleted = props;
          await this.storeExtensionsProps(allExtensionsProps);
        }
      }
    }

    this.log(`deleteExtension -- end extensionId="${extensionId}"`);
    return deleted;
  }

  // Delete the extensionProps for the Extensions
  // with the given extensionIds
  // and return a count of how many were actually deleted
  async deleteSelectedExtensions(extensionIds) {
    let count = 0;
    if (extensionIds && extensionIds.length > 0) {
      const allExtensionsProps = await this.getExtensionsProps();
      if (allExtensionsProps) {
        for (const extensionId of extensionIds) {
          if (extensionId && (typeof extensionId === 'string') && extensionId.length > 0) {
            const props = allExtensionsProps[extensionId];
            if (props) {
              count++;
              delete allExtensionsProps[extensionId];
            }
          }
        }
        if (count > 0) await this.storeExtensionsProps(allExtensionsProps);
      }
    }
    return count;
  }



  async autoRemoveUninstalledExtensions(numDays) {
    const nowMS            = Date.now();
    const removeBeforeMS   = getMidnightMS(nowMS, -numDays - 1);
    const removeBeforeTime = formatMsToDateTime24HR(removeBeforeMS);
    const parameters       = { 'numDays': numDays, "removeBeforeTime": removeBeforeTime };

    this.debugAlways(`autoRemoveUninstalledExtensions -- begin -- numDays=${numDays}, removeBeforeMS=${removeBeforeMS}, removeBeforeTime="${removeBeforeTime}"`);

    if (this.fsbEventLogger) {
      await this.fsbEventLogger.logInternalEvent("autoRemoveUninstalledExtensions", "request", parameters, "");
    }

    if (numDays < 0) { // -1: auto-remove is disabled, 0: remove immediately
      this.debugAlways("autoRemoveUninstalledExtensions -- Auto-Remove is Disabled");
      if (this.fsbEventLogger) {
        await this.fsbEventLogger.logInternalEvent("autoRemoveUninstalledExtensions", "success", parameters, "Auto-Remove is Disabled");
      }

    } else {
      var   removedCount           = 0;
      const installedExtensionById = [];
      const installedExtensions    = await messenger.management.getAll();
      for (const ext of installedExtensions) {
        installedExtensionById[ext.id] = ext;
      }

      const allExtensionsProps = await this.getExtensionsProps();
      for (const [extensionId, extProps] of Object.entries(allExtensionsProps)) {
        var notInstalled      = false;
        var alreadyRecorded   = false;
        var uninstalledTimeMS = nowMS;

        if (extProps.uninstalled) {
          var installedExtension = installedExtensionById[extensionId];
          if (installedExtension) {
            this.debugAlways(`autoRemoveUninstalledExtensions -- Extension recorded as Uninstalled IS Installed (again?,) ID="${extensionId}"`);
            extProps.uninstalled = false;
            delete extProps['uninstalledTimeMS'];
            delete extProps['uninstalledType'];
            this.debugAlways(`autoRemoveUninstalledExtensions -- Recording Extension as NOT Uninstalled, ID="${extensionId}"`);
            await this.storeExtensionPropsById(extensionId, extProps);
          } else {
            this.debugAlways(`autoRemoveUninstalledExtensions -- Extension already recorded as Uninstalled, ID="${extensionId}"`);
            notInstalled      = true;
            alreadyRecorded   = true;
            uninstalledTimeMS = extProps.uninstalledTimeMS;
          }

        } else {
          var installedExtension = installedExtensionById[extensionId];
          if (installedExtension) {
            this.debugAlways(`autoRemoveUninstalledExtensions -- Extension is still Installed, ID="${extensionId}"`);
          } else {
            this.debugAlways(`autoRemoveUninstalledExtensions -- Extension is no longer Installed, ID="${extensionId}"`);
            notInstalled               = true;
            extProps.uninstalled       = true;
            extProps.uninstalledTimeMS = nowMS;
            extProps.uninstalledType   = 'autoRemoveUninstalledExtensions';
          }
        }

        if (notInstalled) {
          if (numDays == 0 || uninstalledTimeMS < removeBeforeMS) {
            if (numDays == 0) {
              this.debugAlways(`autoRemoveUninstalledExtensions -- Immediately Removing Extension, ID="${extensionId}"`);
            } else {
              this.debugAlways(`autoRemoveUninstalledExtensions -- uninstalledTimeMS=${uninstalledTimeMS} removeBeforeMS=${removeBeforeMS} -- Removing Extension, ID="${extensionId}"`);
            }
            await this.deleteExtension(extensionId);
            ++removedCount;

          } else if (alreadyRecorded) {
            this.debugAlways(`autoRemoveUninstalledExtensions -- Extension already recorded as Uninstalled, ID="${extensionId}"`);
          } else {
            this.debugAlways(`autoRemoveUninstalledExtensions -- Recording Extension as Uninstalled, ID="${extensionId}"`);
            await this.storeExtensionPropsById(extensionId, extProps);
          }
        }
      }

      this.debugAlways(`autoRemoveUninstalledExtensions -- removedCount=${removedCount}`);
      if (this.fsbEventLogger) {
        await this.fsbEventLogger.logInternalEvent("autoRemoveUninstalledExtensions", "success", parameters, `removedCount=${removedCount}`);
      }
    }

    this.debugAlways("autoRemoveUninstalledExtensions -- end");
  }



  // Set allowAccess=true for the extensionProps for ALL Extensions
  // and return a count of how many were actually changed
  async allowAccessAllExtensions() {
    let count = 0;
    const allExtensionsProps = await this.getExtensionsProps();
    if (allExtensionsProps) {
      for (const [extensionId, props] of Object.entries(allExtensionsProps)) {
        if (props && ! props.allowAccess) {
          count++;
          props.allowAccess = true;
        }
      }
      if (count > 0) await this.storeExtensionsProps(allExtensionsProps);
    }
    return count;
  }

  // Set allowAccess=false for the extensionProps for ALL Extensions
  // and return a count of how many were actually changed
  async disallowAccessAllExtensions() {
    let count = 0;
    const allExtensionsProps = await this.getExtensionsProps();
    if (allExtensionsProps) {
      for (const [extensionId, props] of Object.entries(allExtensionsProps)) {
        if (props && props.allowAccess) {
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
  // and return a count of how many were actually changed
  async allowAccessSelectedExtensions(extensionIds) {
    let count = 0;
    if (extensionIds && extensionIds.length > 0) {
      const allExtensionsProps = await this.getExtensionsProps();
      if (allExtensionsProps) {
        for (const extensionId of extensionIds) {
          if (extensionId && (typeof extensionId === 'string') && extensionId.length > 0) {
            const props = allExtensionsProps[extensionId];
            if (props && ! props.allowAccess) {
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
  // and return a count of how many were actually changed
  async disallowAccessSelectedExtensions(extensionIds) {
    let count = 0;
    if (extensionIds && extensionIds.length > 0) {
      const allExtensionsProps = await this.getExtensionsProps();
      if (allExtensionsProps) {
        for (const extensionId of extensionIds) {
          if (extensionId && (typeof extensionId === 'string') && extensionId.length > 0) {
            const props = allExtensionsProps[extensionId];
            if (props && props.allowAccess) {
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

  async allowAccess(extensionId) {
    this.debug(`allowAccess -- extensionId="${extensionId}"`);

    if ((typeof extensionId === 'string') && extensionId.length > 0) {
      var installedExtension;
      try {
        installedExtension = await messenger.management.get(extensionId);
      } catch (error) {
        if (! error.message.startsWith("No such addon")) {
          this.caught(error, "allowAccess");
        }
      }

      if (! installedExtension) {
        this.error(`allowAccess -- Extension is not installed, ID="${extensionId}"`);

      } else {
        const props = await this.getExtensionPropsById(extensionId);

        if (props) {
          this.debug(`allowAccess -- extensionId="${extensionId}" already has props, just change allowAccess and store`);
          props.allowAccess = true;
          await this.storeExtensionPropsById(extensionId, props);
          return true;

        } else {
          this.debug(`allowAccess -- extensionId="${extensionId}" does not already have props, create new props and store`);

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
          this.debug(`allowAccess -- extensionId="${extensionId}" New Props:`, newProps);

          await this.storeExtensionPropsById(extensionId, newProps);
          return true;
        }
      }
    }

    return false;
  }

  async disallowAccess(extensionId) {
    this.debug(`disallowAccess -- extensionId="${extensionId}"`);

    if ((typeof extensionId === 'string') && extensionId.length > 0) {
      var installedExtension;
      try {
        installedExtension = await messenger.management.get(extensionId);
      } catch (error) {
        if (! error.message.startsWith("No such addon")) {
          this.caught(error, "disallowAccess");
        }
      }

      if (! installedExtension) {
        this.error(`allowAccess -- Extension is not installed, ID="${extensionId}"`);

      } else {
        const props = await this.getExtensionPropsById(extensionId);

        if (props) {
          this.debug(`disallowAccess -- extensionId="${extensionId}" already has props, just change allowAccess and store`);
          props.allowAccess = false;
          await this.storeExtensionPropsById(extensionId, props);
          return true;

        } else {
          this.debug(`disallowAccess -- extensionId="${extensionId}" does not already have props, create new props and store`);

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
          this.debug(`disallowAccess -- extensionId="${extensionId}" New Props:`, newProps);

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
    try {
      const fileName    = formatNowToDateTimeForFilename() + this.BACKUP_FILENAME_EXTENSION;
      const allOptions  = await this.getAllOptions();

      if (this.DEBUG) {
        this.debugAlways(`backupToFile -- Backing up all options to file "${fileName}"`);
        this.debugAlways("backupToFile -- Backing up", allOptions);
        logProps("", "allOptions", allOptions);
      }
      const response = await this.fsBrokerApi.writeObjectToJSONFile(fileName, allOptions);
      this.debug(`backupToFile --response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, "backupToFile -- Unexpected Error");
      return { "error": error.name + ": " + error.message };
    }
  }

  /* returns { "fileNames": [],    "length": number }
   *         { "error":     string                   } If there was some error writing the file. The returned string gives the reason.
   */
  async listBackupFiles() {
    try {
      this.debug(`listBackupFiles -- Getting list of options backup files with matchGlob "${this.BACKUP_FILENAME_MATCH_GLOB}"`);
      const response = await this.fsBrokerApi.listFiles(this.BACKUP_FILENAME_MATCH_GLOB);
      this.debug(`listBackupFiles --response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, "listBackupFiles -- Unexpected Error");
      return { "error": error.name + ": " + error.message };
    }
  }

  /* returns { "fileInfo": [],    "length": number } array of IOUtils.FileInfo - see the FileSystemBroker API README file
   *         { "error":    string                  } If there was some error writing the file. The returned string gives the reason.
   */
  async listBackupFileInfo() {
    try {
      this.debug(`listBackupFileInfo -- Getting list of options backup files with matchGlob "${this.BACKUP_FILENAME_MATCH_GLOB}"`);
      const response = await this.fsBrokerApi.listFileInfo(this.BACKUP_FILENAME_MATCH_GLOB);
      this.debug(`listBackupFileInfo --response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, "listBackupFileInfo -- Unexpected Error");
      return { "error": error.name + ": " + error.message };
    }
  }

  /* returns { "fileName": string, "data": object } javascript object
   *         { "invalid":  string                 } If the fileName is invalid or the full pathName for the file became too long. The returned string gives the reason.
   *         { "error":    string                 } If there was some error reading the file. The returned string gives the reason.
   */
  async readBackupFile(fileName) {
    try {
      this.debug(`readBackupFile -- Reading options backup file "${fileName}"`);
      const response = await this.fsBrokerApi.readObjectFromJSONFile(fileName);
      this.debug(`readBackupFile --response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, "readBackupFile -- Unexpected Error");
      return { "error": error.name + ": " + error.message };
    }
  }

  /* returns { "fileName": string, "object": object } (all options)
   *         { "invalid":  string                   } If the fileName is invalid or the full pathName for the file became too long. The returned string gives the reason.
   *         { "error":    string                   } If there was some error reading the file or restoring options. The returned string gives the reason.
   */
  async readOptionsFromBackupAndRestore(fileName) {
    this.debug(`readOptionsFromBackupAndRestore -- Reading options backup file "${fileName}"`);

    const response = await this.readBackupFile(fileName);

    if (response && response.object) {
      if (this.DEBUG) {
        this.debug(`readOptionsFromBackupAndRestore -- readBackupFile "${fileName}" -- DATA RETURNED:`);
        logProps("", "readOptionsFromBackupAndRestore", response.object);
      }

      // sanity checks on the data?

      try {
        await messenger.storage.local.set(response.object);
      } catch (error) {
        this.caught(`readOptionsFromBackupAndRestore -- Failed to restore options from file "${fileName}" -- messenger.storage.local.set() failed`);
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
    this.debug(`getOptionsFromBackupAndRestore -- Reading options backup file "${fileName}"`);

    const response = await this.readBackupFile(fileName);

    if (! response) {
      this.error(`getOptionsFromBackupAndRestore -- readBackupFile "${fileName}" -- READ FILE ERROR: NO RESPONSE FROM FileSystemBroker`);
      throw new Error(`readBackupFile "${fileName}" -- READ FILE ERROR: NO RESPONSE FROM FileSystemBroker`);
    } else if (response.invalid) {
      this.error(`getOptionsFromBackupAndRestore -- readBackupFile "${fileName}" -- READ FILE ERROR: ${response.invalid}`);
      throw new Error(`readBackupFile "${fileName}" -- READ FILE ERROR: ${response.invalid}`);
    } else if (response.error) {
      this.error(`getOptionsFromBackupAndRestore -- readBackupFile "${fileName}" -- READ FILE ERROR: ${response.error}`);
      throw new Error(`readBackupFile "${fileName}" -- READ FILE ERROR: ${response.error}`);
    } else if (! response.fileName) {
      this.error(`getOptionsFromBackupAndRestore -- readBackupFile "${fileName}" -- NO FILENAME RETURNED`);
      throw new Error(`readBackupFile "${fileName}" -- NO FILENAME RETURNED`);
    } else if (! response.object) {
      this.error(`getOptionsFromBackupAndRestore -- readBackupFile "${fileName}" -- NO DATA RETURNED`);
      throw new Error(`readBackupFile "${fileName}" -- NO DATA RETURNED`);
    }

    if (this.DEBUG) {
      this.debugAlways(`getOptionsFromBackupAndRestore -- readBackupFile "${fileName}" -- DATA RETURNED:`);
      logProps("", "getOptionsFromBackupAndRestore", response.object);
    }

    // sanity checks on the data?

    try {
      await messenger.storage.local.set(response.object);
    } catch (error) {
      this.caught(`getOptionsFromBackupAndRestore -- Failed to restore options from file "${fileName}" -- messenger.storage.local.set() failed`);
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
      this.debug(`deleteBackupFile -- Deleting options backup file "${fileName}"`);
      const response = await this.fsBrokerApi.deleteFile(fileName);
      this.debug(`deleteBackupFile --response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, `deleteBackupFile --  Failed to delete options backup file "${fileName}"`);
      return { "error": error.name + ": " + error.message };
    }
  }
}
