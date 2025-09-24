import { FsbOptions               } from '../modules/options.js';
import { Logger                   } from '../modules/logger.js';
import { FsbEventLogger           } from '../modules/event_logger.js';
import { FileSystemBrokerCommands } from '../modules/commands.js';
import { logProps, getExtensionId, getExtensionName, getI18nMsg, formatMsToDateForFilename, formatMsToDateTime24HR, getMidnightDelayMS, getNextMidnightDelayMS, getMidnightMS, formatNowToDateTime24HR } from './utilities.js';


class FileSystemBroker {
  constructor() {
    this.CLASS_NAME                        = this.constructor.name;
    this.extId                             = getExtensionId();
    this.extName                           = getExtensionName();

    this.LOG                               = false;
    this.DEBUG                             = false;

    this.LOG_MIDNIGHT_EVENTS               = true;
    this.LOG_PURGE_OLD_LOG_FILES           = true;
    this.LOG_REMOVE_UNINSTALLED_EXTENSIONS = true;

    this.logger                            = new Logger();
    this.fsbCommandsApi                    = new FileSystemBrokerCommands(this.logger);
    this.fsbOptionsApi                     = new FsbOptions(this.logger);
    this.fsbEventLogger                    = new FsbEventLogger(this.fsbOptionsApi, this.logger);

    this.fsbOptionsApi.setEventLogger(this.fsbEventLogger);

    this.midnightTimeout;
  }



  log(...info) {
    if (! this.LOG) return;
    const msg = info.shift();
    this.logger.log(this.CLASS_NAME + '#' + msg, ...info);
  }

  logAlways(...info) {
    const msg = info.shift();
    this.logger.logAlways(this.CLASS_NAME + '#' + msg, ...info);
  }

  debug(...info) {
    if (! this.DEBUG) return;
    const msg = info.shift();
    this.logger.debug(this.CLASS_NAME + '#' + msg, ...info);
  }

  debugAlways(...info) {
    const msg = info.shift();
    this.logger.debugAlways(this.CLASS_NAME + '#' + msg, ...info);
  }

  error(...info) {
    // always log errors
    const msg = info.shift();
    this.logger.error(this.CLASS_NAME + '#' + msg, ...info);
  }

  caught(e, ...info) {
    // always log errors
    const msg = info.shift();
    this.logger.error( this.CLASS_NAME + '#' + msg,
                       "\n- error.name:    " + e.name,
                       "\n- error.message: " + e.message,
                       "\n- error.stack:   " + e.stack,
                       "\n",
                       ...info
                     );
  }



  async run() {
    this.logAlways("run", `=== EXTENSION ${this.extName} STARTED ===`);
    await this.fsbEventLogger.logInternalEvent("startup", "success", null, "");


    const MAX_ATTEMPTS = 3;
    let   attempts     = 0;

    try {
      ++attempts;
      await this.fsbOptionsApi.setupDefaultOptions();
    } catch (error) {

      if (attempts >= MAX_ATTEMPTS) {
        this.caught(error, `run -- Caught error while reading settings from local storage. Attempt #${attempts} >= ${MAX_ATTEMPTS}. Giving up.`);
        return;
      }

      this.caught(error, `run -- Caught error while reading settings from local storage. Attempt #${attempts} of ${MAX_ATTEMPTS}. Retrying.`);
    }

    await this.setupMidnightTimeoutListener();

    messenger.runtime.onMessage.addListener(         (message)         => this.onMessageReceivedInternal(message)         );
    messenger.runtime.onMessageExternal.addListener( (message, sender) => this.onMessageReceivedExternal(message, sender) );
    messenger.management.onInstalled.addListener(    (extensionInfo)   => this.onExtensionInstalled(extensionInfo)        );
    messenger.management.onUninstalled.addListener(  (extensionInfo)   => this.onExtensionUninstalled(extensionInfo)      );



    const showOptionsWindowOnStartupEnabled = await this.fsbOptionsApi.isEnabledOption("fsbShowOptionsWindowOnStartup", false);
    if (showOptionsWindowOnStartupEnabled) {
      this.showOptionsWindow();
    }

////await this.showGrantExtensionAccessConfirmDialog("xxx@xxx.com"); // MABXXX  <----------------------------------------------------------------<<<<<
  }



  async setupMidnightTimeoutListener() {
    const nowMS        = Date.now();
    const midnightMS   = getMidnightMS(nowMS, 0);
    const midnightTime = formatMsToDateTime24HR(midnightMS);
    const delayMS      = midnightMS - nowMS;
////const parameters   = { 'delayMS': delayMS, 'midnightMS': midnightMS, 'midnightTime': midnightTime }; 
    const parameters   = { 'delayMS': delayMS, 'midnightTime': midnightTime }; 
    const result       = `Setting Midnight Timeout: delayMS=${delayMS} midnightMS=${midnightMS} midnightTime="${midnightTime}"`;

    this.logAlways(`setupMidnightTimeoutListener -- Setting up next Midnight Timeout -- ${result}`);

    this.midnightTimeout = setTimeout( () => this.midnightTimerTimedOut(delayMS, nowMs), delayMS);

    if (this.LOG_MIDNIGHT_EVENTS) await this.fsbEventLogger.logInternalEvent("setupMidnightTimeoutListener", "success", parameters, "");
  }

  async midnightTimerTimedOut(delayMS, thenMS) {
    const timer = this.midnightTimeout;
    this.midnightTimeout = null;
    if (timer) {
      clearTimeout(timer);
    }

    const result = `Timed out after ${delayMS} ms -- Set at "${formatMsToDateTime24HR(thenMS)}"`;
    this.logAlways(`midnightTimerTimedOut -- ${result}`);
    if (this.LOG_MIDNIGHT_EVENTS) await this.fsbEventLogger.logInternalEvent("midnightTimerTimedOut", "success", null, result);

    await this.processMidnightTasks();

    await this.setupMidnightTimeoutListener();
  }

  async processMidnightTasks() {
    this.logAlways("processMidnightTasks - start");

    try {
      if (this.LOG_MIDNIGHT_EVENTS) await this.fsbEventLogger.logInternalEvent("processMidnightTasks", "request", null, "");


      await this.autoRemoveUninstalledExtensions(); // this event is already logged inside call

      await this.autoPurgeOldLogFiles(); // this event is already logged inside call

      if (this.LOG_MIDNIGHT_EVENTS) await this.fsbEventLogger.logInternalEvent("processMidnightTasks", "success", null, "");
    } catch (error) {
      this.caught(error, "processMidnightTasks");
    }

    this.logAlways("processMidnightTasks - end");
  }

  async autoPurgeOldLogFiles() {
    const numDays    = this.fsbOptionsApi.getAutoLogPurgeDays(14);
    const parameters = { 'numDays': numDays };
    if (this.LOG_PURGE_OLD_LOG_FILES) await this.fsbEventLogger.logInternalEvent("autoPurgeOldLogFiles", "request", parameters, "");

    if (numDays > 0) {
      await this.fsbEventLogger.deleteOldLogFiles(numDays); // this event is already logged inside call
    }

    if (this.LOG_PURGE_OLD_LOG_FILES) await this.fsbEventLogger.logInternalEvent("autoPurgeOldLogFiles", "success", parameters, "");
  }

  async autoRemoveUninstalledExtensions() {
    const numDays    = this.fsbOptionsApi.getAutoRemoveUninstalledExtensionsDays(2);
    const parameters = { 'numDays': numDays };
    if (this.LOG_REMOVE_UNINSTALLED_EXTENSIONS) await this.fsbEventLogger.logInternalEvent("autoRemoveUninstalledExtensions", "request", parameters, "");

    await this.fsbOptionsApi.autoRemoveUninstalledExtensions(numDays); // this event is already logged inside call

    if (this.LOG_REMOVE_UNINSTALLED_EXTENSIONS) await this.fsbEventLogger.logInternalEvent("autoRemoveUninstalledExtensions", "success", parameters, "");
  }



  async showOptionsWindow() { // COPIED FROM OptionsUI in ./optionsUI/optionsUI.js
    let   popupLeft   = 100;
    let   popupTop    = 100;
    let   popupHeight = 900;
    let   popupWidth  = 700;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.error("run -- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");
    } else {
      this.debug( "run -- Got the Current (Main, mail:3pane) Window:"
                  + `\n- mainWindow.top=${mainWindow.top}`
                  + `\n- mainWindow.left=${mainWindow.left}`
                  + `\n- mainWindow.height=${mainWindow.height}`
                  + `\n- mainWindow.width=${mainWindow.width}`
                );
      popupTop  = mainWindow.top  + 100;
      popupLeft = mainWindow.left + 100;
      if (mainWindow.height - 200 > popupHeight) popupHeight = mainWindow.Height - 200;   // make it higher, but not shorter
//////if (mainWindow.Width  - 200 > popupWidth)  popupWidth  = mainWindow.Width  - 200;   // make it wider,  but not narrower --- eh, don't need it wider
    }

    const bounds = await this.fsbOptionsApi.getWindowBounds("optionsWindowBounds");
    if (! bounds) {
      this.debug("run -- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`run -- PREVIOUS WINDOW BOUNDS "optionsWindowBounds" IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "run -- restoring previous window bounds:"
                  + `\n- bounds.top=${bounds.top}`
                  + `\n- bounds.left=${bounds.left}`
                  + `\n- bounds.width=${bounds.width}`
                  + `\n- bounds.height=${bounds.height}`
                );
      popupTop    = bounds.top;
      popupLeft   = bounds.left;
      popupWidth  = bounds.width;
      popupHeight = bounds.height;
    }

    const optionsUrl = messenger.runtime.getURL( "optionsUI/optionsUI.html")
                                                 + "?windowMode=true"
                                                 + `&requestedBy=${encodeURIComponent(this.extName)}`;
    const optionsWindow = await messenger.windows.create({
      url:                 optionsUrl,
      type:                "popup",
      titlePreface:        getI18nMsg("options_fsbOptionsTitle", "Options") + " - ",
      top:                 popupTop,
      left:                popupLeft,
      height:              popupHeight,
      width:               popupWidth,
      allowScriptsToClose: true,
    });
    this.debug(`run -- OptionsUI Popup Window Created -- windowId="${optionsWindow.id}" URL="${optionsUrl}"`);
  }




  async onMessageReceivedInternal(message) {
    const nowMS = Date.now();

    if (this.DEBUG) {
      this.debugAlways("onMessageReceivedInternal -- Received Internal Message:");
      logProps("", "onMessageReceivedInternal.message", message);
    }

    try {
      // These are INTERNAL Messages:
//    if (message.hasOwnProperty('ExtensionChooserResponse')) return false; // This is a response message that the ExtensionChooser sends back to OptionsUI
//    if (message.hasOwnProperty('ConfirmDialogResponse'))    return false; // This is a response message that the ConfirmDialog sends back
//    if (message.hasOwnProperty('BackupManagerResponse'))    return false; // This is a response message that the BackupManager sends back to OptionsUI
//    if (message.hasOwnProperty('EventLogManagerResponse'))  return false; // This is a response message that the EventLogManager sends back to OptionsUI
//    if (message.hasOwnProperty('EventLogViewerResponse'))   return false; // This is a response message that the EventLogViewer sends back to EventLogManager
//
//    BUT... now that we have the 'Command' key for commands, we don't need to deal with this anymore

      if (! message.hasOwnProperty('Command')) {
        //this.logAlways( "onMessageReceivedInternal -- Received Unknown Internal Message --", message);
        return { "error": "Invalid Request: Message has no Command Object",
                 "code": "400"
               };
      }

      const formattedParameters = this.fsbCommandsApi.formatParameters(message.Command);

      if (await this.fsbOptionsApi.isEnabledInternalMessageLogging()) {
        this.logAlways( "onMessageReceivedInternal -- Received Internal Message --" // MABXXX do this in logCommand???
                        + `\n- message.command="${message.Command.command}"`
////////////////////////+ `\n- message.Command.fileName="${message.Command.fileName}"`
                        + `\n- parameters: ${formattedParameters}`
                      );
        this.fsbEventLogger.logCommand(nowMS, "INTERNAL", message.Command);
      }

      const result = await this.fsbCommandsApi.processCommand(message.Command, this.extId);

      if (! result) {
        this.error("onMessageReceivedInternal -- NO COMMAND RESULT", message);
        return { "error": "Failed to get a Command Result",
                 "code":  "500"
               };
      } else {
        if (await this.fsbOptionsApi.isEnabledInternalMessageResultLogging()) {
          const formattedResult = this.fsbCommandsApi.formatCommandResult(message.Command, result);
          this.logAlways( "onMessageReceivedInternal --"
                          + "\n- INTERNAL"
                          + `\n- Command="${message.Command.command}"`
//////////////////////////+ `\n- FileName="${message.Command.fileName}"`
                          + `\n- parameters: ${formattedParameters}`
                          + `\n- result: ${formattedResult}`
                        );
          this.fsbEventLogger.logCommandResult(nowMS, "INTERNAL", message.Command, result);
        }
      }

      return result;

    } catch (error) {
      this.caught(error, "onMessageReceivedInternal");
      return { "error": "Internal Error", "code":  "500" };
    }
  }




  async onMessageReceivedExternal(message, sender) {
    const nowMS = Date.now();

    if (this.DEBUG) {
      this.debugAlways("onMessageReceivedExternal -- Received External Message:");
      logProps("", "onMessageReceivedExternal.message", message);
    }

    try {
      if (! message.hasOwnProperty('Command')) {
        this.logAlways( "onMessageReceivedExternal -- Received Unknown External Message --", message);
        return { "error": "Invalid Request: Message has no Command Object",
                 "code": "400"
               };
      }

      const formattedParameters = this.fsbCommandsApi.formatParameters(message.Command);
      const logCommand          = await this.fsbOptionsApi.isEnabledExternalMessageLogging();
      const logResult           = await this.fsbOptionsApi.isEnabledExternalMessageResultLogging();

      if (logCommand) {
        this.logAlways( "onMessageReceivedExternal -- Received External Message --"
                        + `\n- sender.id="${sender.id}"`
                        + `\n- message.Command.command="${message.Command.command}"`
////////////////////////+ `\n- message.Command.fileName="${message.Command.fileName}"`
                        + `\n- parameters: ${formattedParameters}`
                      );
        this.fsbEventLogger.logCommand(nowMS, sender.id, message.Command);
      }

      if (! sender || ! sender.id) {
        const error = "Message has no Sender ID";
        this.error(`onMessageReceivedExternal -- ${error}`);
        if (logResult) {
          this.fsbEventLogger.logCommandResult(nowMS, "UNKNOWN", message.Command, "error: " + error);
        }
        return { "error": error, "code":  "400" };
      }

      if ((typeof sender.id) !== 'string') {
        const error = "Message Sender ID type must be 'string'";
        this.error(`onMessageReceivedExternal -- ${error}`);
        if (logResult) {
          this.fsbEventLogger.logCommandResult(nowMS, sender.id, message.Command, "error: " + error);
        }
        return { "error": error, "code":  "400" };
      }

      if (! this.checkValidFileName(sender.id)) { // MABXXX should be checkValidExtensionId
        const error = `Message Sender ID is invalid: "${sender.id}"`;
        this.debug(`onMessageReceivedExternal -- ${error}"`);
        if (logResult) {
          this.fsbEventLogger.logCommandResult(nowMS, sender.id, message.Command, "error: " + error);
        }
        return { "error": error, "code":  "400" };
      }

      const cmdIsAccess = message.Command.command === 'access';
      if (cmdIsAccess) this.debug("onMessageReceivedExternal -- command='access'");

      if (! await this.fsbOptionsApi.isEnabledExtensionAccessControl()) {
        this.debug("onMessageReceivedExternal -- Access Control is not enabled");

      } else {
        this.debug("onMessageReceivedExternal -- ACCESS CONTROL IS ENABLED");

        // MABXXX Check to see if Extension has NOT been added and is IMPLICITLY denied vs whether it's been EXPLICITITY denied
        // If it *HAS* been EXPLICITLY denied, do we really want to do anything???
        var   accessGranted = false;
        const extensionProps = await this.fsbOptionsApi.getExtensionPropsById(sender.id);
        if (! extensionProps) {
          if (await this.fsbOptionsApi.isEnabledShowGrantExtensionAccessDialog()) {
            accessGranted = await this.showGrantExtensionAccessConfirmDialog(sender.id);
          }
          if (accessGranted) {
            // MABXXX TELL OptionsUI to add the extension to the List!!!
          }
        }

        if (! accessGranted && ! await this.fsbOptionsApi.isAllowAccess(sender.id)) {
          const accessDeniedMsg = `Access is Denied for: "${sender.id}"`;

          if (logResult || await this.fsbOptionsApi.isEnabledAccessDeniedLogging()) {
            this.logAlways(`onMessageReceivedExternal -- ACCESS DENIED FOR MESSAGE SENDER ID: "${sender.id}"`);
            this.fsbEventLogger.logCommandResult(nowMS, sender.id, message.Command, accessDeniedMsg);
          }

          if (cmdIsAccess) {
            this.debug(`onMessageReceivedExternal -- command='access' -- ACCESS DENIED FOR MESSAGE SENDER ID: "${sender.id}"`);
            return { "access": "denied" };
          } else {
            return { "error": `Access to ${this.extName} has not been granted`, "code":  "403" };
          }
        }

        if (! cmdIsAccess && await this.fsbOptionsApi.isEnabledAccessLogging()) {
          this.logAlways(`onMessageReceivedExternal -- Access Granted for Message Sender ID: "${sender.id}"`);
        }
      }

      if (cmdIsAccess) {
        if (logResult || await this.fsbOptionsApi.isEnabledAccessLogging()) {
          const accessGrantedMsg = `Access is Granted: "${sender.id}"`;
          this.logAlways(`onMessageReceivedExternal -- command='access' - ACCESS GRANTED FOR MESSAGE SENDER ID: "${sender.id}"`);
          this.fsbEventLogger.logCommandResult(nowMS, sender.id, message.Command, accessGrantedMsg);
        }
        return { "access": "granted" };
      }

      const result = await this.fsbCommandsApi.processCommand(message.Command, sender.id);

      if (! result) {
        this.error("onMessageReceivedExternal -- NO COMMAND RESULT");
        return { "error": "Failed to get a Command Result",
                 "code":  "500"
               };
      } else {
        if (logResult) {
          const formattedResult = this.fsbCommandsApi.formatCommandResult(message.Command, result);
          this.logAlways( "onMessageReceivedExternal --"
                          + `\n- From="${sender.id}"`
                          + `\n- Command="${message.Command.command}"`
//////////////////////////+ `\n- FileName="${message.Command.fileName}"`
                          + `\n- parameters: ${formattedParameters}`
                          + `\n- result: ${formattedResult}`
                        );
          this.fsbEventLogger.logCommandResult(nowMS, sender.id, message.Command, result);
        }
      }

      return result;

    } catch (error) {
      this.caught(error, "onMessageReceivedExternal");
      return { "error": "Internal Error", "code":  "500" };
    }
  }



  async onExtensionInstalled(extensionInfo) {
    if (extensionInfo.type === 'extension') {
      this.debugAlways(`onExtensionInstalled -- Extension has been Installed: id="${extensionInfo.id}"`);

      try {
        const extensionProps = await this.fsbOptionsApi.getExtensionPropsById(extensionInfo.id);
        if (! extensionProps) {
          this.debugAlways(`onExtensionInstalled -- Installed Extension is NOT Configured: id="${extensionInfo.id}"`);

        } else {
          this.debugAlways(`onExtensionInstalled -- Installed Extension IS Configured, Un-marking as Uninstalled: id="${extensionInfo.id}"`);
          extensionProps.uninstalled = false;
          delete extensionProps['uninstalledTimeMS'];
          extensionProps['uninstalledType'];
          await this.fsbOptionsApi.storeExtensionPropsById(extensionProps.id, extensionProps);
        }
      } catch (error) {
        this.caught(error, "onExtensionInstalled");
      }
    }
  }

  async onExtensionUninstalled(extensionInfo) {
    if (extensionInfo.type === 'extension') {
      this.debugAlways(`onExtensionUninstalled -- Extension has been Uninstalled: id="${extensionInfo.id}"`);

      try {
        const extensionProps = await this.fsbOptionsApi.getExtensionPropsById(extensionInfo.id);
        if (! extensionProps) {
          this.debugAlways(`onExtensionUninstalled -- Uninstalled Extension is NOT Configured: id="${extensionInfo.id}"`);

        } else {
          const autoRemoveNumDays = await this.fsbOptionsApi.getDeletedExtensionAutoRemoveDays(2);
          this.debugAlways(`onExtensionUninstalled -- Uninstalled Extension IS Configured: id="${extensionInfo.id}", autoRemoveNumDays=${autoRemoveNumDays}`);

          if (autoRemoveNumDays == 0) {
            this.debugAlways(`onExtensionUninstalled -- Uninstalled Extension IS Configured, Removing: id="${extensionInfo.id}"`);
            await this.fsbOptionsApi.deleteExtension(extensionInfo.id);

          } else {
            this.debugAlways(`onExtensionUninstalled -- Uninstalled Extension IS Configured, Marking as Uninstalled: id="${extensionInfo.id}"`);
            extensionProps.uninstalled       = true;
            extensionProps.uninstalledTimeMS = Date.now();
            extensionProps.uninstalledType   = 'onExtensionUninstalled';
            await this.fsbOptionsApi.storeExtensionPropsById(extensionProps.id, extensionProps);
          }
        }
      } catch (error) {
        this.caught(error, "onExtensionUninstalled");
      }
    }
  }




  async showGrantExtensionAccessConfirmDialog(extensionId) {
    this.debug("showGrantExtensionAccessConfirmDialog -- begin");

    var   popupLeft   = 100;
    var   popupTop    = 100;
    var   popupHeight = 250;
    var   popupWidth  = 500;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.debug("showGrantExtensionAccessConfirmDialog -- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");

    } else {
      this.debug( "showGrantExtensionAccessConfirmDialog -- Got the Current (Main, mail:3pane) Window:"
                  + `\n- mainWindow.top=${mainWindow.top}`
                  + `\n- mainWindow.left=${mainWindow.left}`
                  + `\n- mainWindow.height=${mainWindow.height}`
                  + `\n- mainWindow.width=${mainWindow.width}`
                );
//////popupTop  = mainWindow.top  + mainWindow. / 2;
      popupTop  = mainWindow.top  + Math.round( (mainWindow.height - popupHeight) / 2 );
//////popupLeft = mainWindow.left + 100;
      popupLeft = mainWindow.left + Math.round( (mainWindow.width  - popupWidth)  / 2 );
      if (mainWindow.height - 200 > popupHeight) popupHeight - mainWindow.Height - 200;   // make it higher, but not shorter
////////if (mainWindow.Width  - 200 > popupWidth)  popupWidth  = mainWindow.Width  - 200;   // make it wider,  but not narrower --- eh, don't need it wider
    }

    const bounds = await this.fsbOptionsApi.getWindowBounds("confirmDialogWindowBounds"); // MABXXX PERHAPS THIS SHOULD ALWAYS BE CENTERED??????

    if (! bounds) {
      this.debug("showGrantExtensionAccessConfirmDialog -- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`showGrantExtensionAccessConfirmDialog -- PREVIOUS WINDOW BOUNDS IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "showGrantExtensionAccessConfirmDialog -- restoring previous window bounds:"
                  + `\n- bounds.top=${bounds.top}`
                  + `\n- bounds.left=${bounds.left}`
                  + `\n- bounds.width=${bounds.width}`
                  + `\n- bounds.height=${bounds.height}`
                );
//    popupTop    = bounds.top;
      popupTop    = mainWindow ? mainWindow.top  + Math.round( (mainWindow.height - bounds.height) / 2 ) : bounds.top; // CENTER ON THE MAIN WINDOW!!!
//    popupLeft   = bounds.left;
      popupLeft   = mainWindow ? mainWindow.left + Math.round( (mainWindow.width  - bounds.width)  / 2 )  : bounds.left; // CENTER ON THE MAIN WINDOW!!!
      popupWidth  = bounds.width;
      popupHeight = bounds.height;
    }



    // window.id does not exist.  how do we get our own window id???
    var   ourTabId;
    var   ourWindowId;
    const currentTab = await messenger.tabs.getCurrent();
    if (! currentTab) {
      this.debug("showGrantExtensionAccessConfirmDialog -- messenger.tabs.getCurrent() didn't return a Tab");
    } else {
      this.debug(`showGrantExtensionAccessConfirmDialog -- currentTab.id="${currentTab.id}" currentTab.windowId="${currentTab.windowId}"`);
      ourTabId    = currentTab.id;
      ourWindowId = currentTab.windowId;
    }

    const title            = getI18nMsg("fsbConfirmDialogGrantExtensionTitle");
    const message1         = getI18nMsg("fsbConfirmDialogGrantExtensionMessage1");
    const message2         = getI18nMsg("fsbConfirmDialogGrantExtensionMessage2");
    const message3         = getI18nMsg("fsbConfirmDialogGrantExtensionMessage3");
    const button1MsgId     = "fsbConfirmDialog_grantButton.label";
    const button2MsgId     = "fsbConfirmDialog_denyButton.label";
    const button3MsgId     = "fsbConfirmDialog_cancelButton.label";
    const confirmDialogUrl = messenger.runtime.getURL("../dialogs/confirm.html")
                             + "?buttons_3=true"
                             + `&title=${encodeURIComponent(title)}`
                             + `&message1=${encodeURIComponent(message1)}`
                             + `&message2=${encodeURIComponent(extensionId)}`
                             + `&message3=${encodeURIComponent(message2)}`
                             + `&message4=${encodeURIComponent(' ')}` // a blank line
                             + `&message5=${encodeURIComponent(message3)}`
                             + `&button1MsgId=${encodeURIComponent(button1MsgId)}`
                             + `&button2MsgId=${encodeURIComponent(button2MsgId)}`
                             + `&button3MsgId=${encodeURIComponent(button3MsgId)}`;
    // MABXXX DAMN!!! THERE'S NO WAY TO MAKE THIS MODAL!!! MUST USE action "default_popup".  But how to get Extension ID, etc?
    // The window.confirm() function doesn't give a way to specify button text.
    // Which is worse? Ugly ugly UGLY!!!
    this.debug( "showGrantExtensionAccessConfirmDialog -- window bounds:"
                + `\n- popupTop=${popupTop}`
                + `\n- popupLeft=${popupLeft}`
                + `\n- popupWidth=${popupWidth}`
                + `\n- popupHeight=${popupHeight}`
              );
    const confirmDialogWindow = await messenger.windows.create(
      {
        url:                 confirmDialogUrl,
        type:                "popup",
        titlePreface:        getI18nMsg("extensionName") + " - ",
        top:                 popupTop,
        left:                popupLeft,
        height:              popupHeight,
        width:               popupWidth,
        allowScriptsToClose: true,
      }
    );

    this.debug( "showGrantExtensionAccessConfirmDialog -- Grant Extension Access Confirmation Popup Window Created --"
                + `\n-from ourTabId="${ourTabId}"`
                + `\n-from ourWindowId="${ourWindowId}"`
                + `\n-confirmDialogWindow.id="${confirmDialogWindow.id}"`
                + `\n-URL="${confirmDialogUrl}"`
              );

    // Re-focus on the confirmDialog window when our window gets focus
    // MABXXX PERHAPS THIS SHOULD BE DONE INSIDE confirmDialogPrompt() ???
//  const focusListener = async (windowId) => this.windowFocusChanged(windowId, ourTabId, ourWindowId, confirmDialogWindow.id);
    const focusListener = null;
//  messenger.windows.onFocusChanged.addListener(focusListener);

    // ConfirmDialogResponse - expected:
    // - null     - the user closed the popup window        (set by our own windows.onRemoved listener - the defaultResponse sent to confirmDialogPrompt)
    // - CLOSED   - the user closed the popup window        (sent by the ConfirmDialog window's window.onRemoved listener -- NOT REALLY - we use our own onRemoved listener)
    // - BUTTON_1 - the user clicked button 1               (sent by the ConfirmDialog window's button listener)
    // - BUTTON_2 - the user clicked button 2               (sent by the ConfirmDialog window's button listener)
    // - BUTTON_3 - the user clicked button 3               (sent by the ConfirmDialog window's button listener)

    const confirmDialogResponse = await this.confirmDialogPrompt(confirmDialogWindow.id, focusListener, null);
    this.debug(`showGrantExtensionConfirmDialog -- ConfirmDialog confirmDialogResponse="${confirmDialogResponse}"`);

    switch (confirmDialogResponse) {
      case 'BUTTON_1': // 'Yes' button
        await this.grantAccessToExtension(extensionId); // MABXXX Add NEW Extension vs Grant existing Extension???
        return true;
      case 'BUTTON_2': // 'No' button
        await this.denyAccessToExtension(extensionId); // MABXXX Add NEW Extension and Deny vs Deny existing Extension???
        return false;
      case 'BUTTON_3': // 'Cancel' button
        this.debug("showGrantExtensionConfirmDialog -- ConfirmDialog canceled");
      case 'CLOSED':   // this never happens - see comments in ConfirmDialog regarding conduit failure
      case null:       // closed using the window close button
        return false;
      default:
        this.error(`showGrantExtensionAccessConfirmDialog -- UNKNOWN ConfirmDialog Response - NOT A KNOWN KEYWORD: "${confirmDialogResponse}"`);
    }
  }

  async grantAccessToExtension(extensionId) {
    this.debugAlways(`grantAccessToExtension -- begin - extensionId="${extensionId}"`);

    const granted = await this.fsbOptionsApi.allowAccess(extensionId);
    this.debugAlways(`grantAccessToExtension -- granted=${granted}`);
    // NOW UPDATE THE UI!!! Did it get added or just altered?

    this.debugAlways("grantAccessToExtension -- end");
  }

  async denyAccessToExtension(extensionId) {
    this.debugAlways(`denyAccessToExtension -- begin -- extensionId="${extensionId}"`);

    const denied = await this.fsbOptionsApi.disallowAccess(extensionId);
    this.debugAlways(`denyAccessToExtension -- denied=${denied}`);
    // NOW UPDATE THE UI!!! Did it get added or just altered?

    this.debugAlways("denyAccessToExtension -- end");
  }



  async confirmDialogPrompt(confirmDialogWindowId, focusListener, defaultResponse) {
    try {
      await messenger.windows.get(confirmDialogWindowId);
    } catch (error) {
      // Window does not exist, assume closed.
      this.caught(error, "confirmDialogPrompt -- PERHAPS WINDOW CLOSED???");
      return defaultResponse;
    }

    return new Promise(resolve => {
      var response = defaultResponse;

      function windowRemovedListener(windowId) {
        if (windowId == confirmDialogWindowId) {

          messenger.runtime.onMessage.removeListener(messageListener);
          messenger.windows.onRemoved.removeListener(windowRemovedListener);
//////////messenger.windows.onFocusChanged.removeListener(focusListener);

          resolve(response);
        }
      }

      /* The ConfirmDialog sends a message as ConfirmDialogResponse:
       * - CLOSED   - the user closed the popup window   (sent by the ConfirmDialog window's window.onRemoved listener -- NOT REALLY -- using OUR onRemoved instead)
       * - BUTTON_1 - the user clicked button 1          (sent by the ConfirmDialog window's button listener)
       * - BUTTON_2 - the user clicked button 2          (sent by the ConfirmDialog window's button listener)
       * - BUTTON_3 - the user clicked button 3          (sent by the ConfirmDialog window's button listener)
       * Save this ConfirmDialogResponse into response for resolve()
       */
      function messageListener(request, sender, sendResponse) {
        if (sender.tab.windowId == confirmDialogWindowId && request && request.ConfirmDialogResponse) {
          response = request.ConfirmDialogResponse;
        }

        return false; // we're not sending any more messages
      }

      messenger.runtime.onMessage.addListener(messageListener);
      messenger.windows.onRemoved.addListener(windowRemovedListener);
    });
  }








  /* Must be a String with at least one character.
   *
   * ILLEGAL CHARS:
   *
   *   < (less-than)
   *   > (greater-than)
   *   : "colon)
   *   " (double-quote)
   *   / (forward slash(
   *   \ (backward slash(
   *   | (vertical bar)
   *   ? (question mark)
   *   * (asterisk)
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
  checkValidFileName(fileName) {
    if (typeof fileName !== 'string' || fileName.length < 1 || fileName.length > 64) return false;

    const ILLEGAL_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;
    if (ILLEGAL_CHARS.test(fileName)) return false;

    const RESERVED_NAMES = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
    if (RESERVED_NAMES.test(fileName)) return false;

    return true;
  }
}



messenger.runtime.onInstalled.addListener(async ( { reason, previousVersion } ) => onInstalled(reason, previousVersion));

async function onInstalled(reason, previousVersion) {
  const extId   = getExtensionId("");
  const extName = getExtensionName("File System Broker");

  if (reason === "update") {
    console.log(`${extId} === EXTENSION ${extName} UPDATED ===`); 
  } else if (reason === "install") {
    console.log(`${extId} === EXTENSION ${extName} INSTALLED ===`); 
  } else { // last option is "browser_update"
    console.log(`${extId} === EXTENSION ${extName} INSTALLED (browser update) ===`); 
  }
}



messenger.runtime.onStartup.addListener(async () => {
  const extId   = getExtensionId("");
  const extName = getExtensionName("File System Broker");
  console.log(`${extId} === EXTENSION ${extName} STARTED === `); 
} );



messenger.runtime.onSuspend.addListener(async () => {
  const extId   = getExtensionId("");
  const extName = getExtensionName("File System Broker");
  console.log(`${extId} === EXTENSION ${extName} SUSPENDED === `); 
} );



async function waitForLoad() {
  const onCreate = new Promise(function(resolve, reject) {
    function listener() {
      messenger.windows.onCreated.removeListener(listener);
      resolve(true);
    }
    messenger.windows.onCreated.addListener(listener);
  } );

  const windows = await messenger.windows.getAll( {windowTypes:["normal"]} );
  if (windows.length > 0) {
    return false;
  } else {
    return onCreate;
  }
}



// self-executing async "main" function
(async () => {
  await waitForLoad();

  const fileSystemBroker = new FileSystemBroker();
  waitForLoad().then((isAppStartup) => fileSystemBroker.run());
})()
