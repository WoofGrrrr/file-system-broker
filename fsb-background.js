import { FsbOptions               } from '../modules/options.js';
import { Logger                   } from '../modules/logger.js';
import { FsbEventLogger           } from '../modules/event_logger.js';
import { FileSystemBrokerCommands } from '../modules/commands.js';
import { QuotaManager             } from '../modules/quotas.js';
import * as utils from './modules/utilities.js';


/********
 * NOTE: The FileSystemBroker API CANNOT be used here.
 * That would result in sending a message to ourself, which the Web Extensions API apparently does not allow.
 */
class FileSystemBroker {
  #CLASS_NAME                        = this.constructor.name;
  #EXT_ID                            = utils.getExtensionId();
  #EXT_NAME                          = utils.getExtensionName();

  #INFO                              = false;
  #LOG                               = false;
  #DEBUG                             = false;
  #WARN                              = false;

  #LOG_MIDNIGHT_EVENTS               = true;
  #LOG_PURGE_OLD_LOG_FILES           = true;
  #LOG_REMOVE_UNINSTALLED_EXTENSIONS = true;

  #logger                            = new Logger();
  #fsbOptionsApi                     = new FsbOptions(this.#logger);
  #fsbCommandsApi                    = new FileSystemBrokerCommands(this.#logger, this.#fsbOptionsApi);
  #fsbEventLogger                    = new FsbEventLogger(this.#logger, this.#fsbOptionsApi, this.#fsbCommandsApi);
  #quotaManager                      = new QuotaManager(this.#logger, this.#fsbOptionsApi, this.#fsbCommandsApi, this.#fsbEventLogger);


  #midnightTimeout;
  #firstMidnightTimeout              = true;
  #midnightEventDispatcher           = new EventTarget();



  constructor() {
    this.#fsbOptionsApi.setEventLogger(this.#fsbEventLogger);
    this.#fsbCommandsApi.setEventLogger(this.#fsbEventLogger);
    this.#midnightEventDispatcher.addEventListener('midnight', (e) => this.#onMidnight(e));
  }



  log(...info) {
    if (this.#LOG) this.#logger.log(this.#CLASS_NAME, ...info);
  }

  logAlways(...info) {
    this.#logger.logAlways(this.#CLASS_NAME, ...info);
  }

  debug(...info) {
    if (this.#DEBUG) this.#logger.debug(this.#CLASS_NAME, ...info);
  }

  debugAlways(...info) {
    this.#logger.debugAlways(this.#CLASS_NAME, ...info);
  }

  error(...info) {
    // always log errors
    this.#logger.error(this.#CLASS_NAME, ...info);
  }

  caught(e, msg, ...info) {
    // always log errors
    this.#logger.error( this.#CLASS_NAME,
                       msg,
                       "\n- error.name:    " + e.name,
                       "\n- error.message: " + e.message,
                       "\n- error.stack:   " + e.stack,
                       "\n",
                       ...info
                     );
  }



  async run() {
    this.logAlways(`=== EXTENSION ${this.#EXT_NAME} STARTED ===`);
    await this.#fsbEventLogger.logInternalEvent("startup", "success", null, "");


    var   defaultOptionsSetup = false;
    var   attempts            = 0;
    const MAX_ATTEMPTS        = 3;

    while (! defaultOptionsSetup && attempts < MAX_ATTEMPTS) {
      ++attempts;
      try {
        await this.#fsbOptionsApi.setupDefaultOptions();
        defaultOptionsSetup = true;
      } catch (error) {
        // Workaround. Several users report issues with accessing the
        // messenger.local store
        //
        //    20:30:33.873 TransactionInactiveError: A request was placed
        //    against a transaction which is currently not active, or which
        //    is finished. IndexedDB.jsm:101:46
        //
        // Assuming that this error is caused by a timing issue while
        // accessing the store concurrently, we simply try to circumvent this by
        // reloading

        if (attempts >= MAX_ATTEMPTS) {
          this.caught(error, `-- Caught error while reading settings from local storage. Attempt #${attempts} >= ${MAX_ATTEMPTS}. Giving up.`);
          return;
        }

        this.caught(error, `-- Caught error while reading settings from local storage. Attempt #${attempts} of ${MAX_ATTEMPTS}. Retrying.`);
      }
    }

    messenger.runtime.onMessage.addListener(         async (message)         => this.#onMessageReceivedInternal(message)         );
    messenger.runtime.onMessageExternal.addListener( async (message, sender) => this.#onMessageReceivedExternal(message, sender) );
    messenger.management.onInstalled.addListener(    async (extensionInfo)   => this.#onExtensionInstalled(extensionInfo)        );
    messenger.management.onUninstalled.addListener(  async (extensionInfo)   => this.#onExtensionUninstalled(extensionInfo)      );

    await this.#setupMidnightTimeout();

    await this.#quotaManager.runScheduledQuotaChecks(); // MABXXX Do we really need to wait for this???

    const showOptionsWindowOnStartupEnabled = await this.#fsbOptionsApi.isEnabledOption("fsbShowOptionsWindowOnStartup", false);
    if (showOptionsWindowOnStartupEnabled) {
      this.#showOptionsWindow();
    }

////await this.#showGrantExtensionAccessConfirmDialog("xxx@xxx.com"); // MABXXX  <----------------------------------------------------------------<<<<<
  }



  async #setupMidnightTimeout() {
    const nowMS        = Date.now();
    const midnightMS   = utils.getMidnightMS(nowMS, 0);
    const midnightTime = utils.formatMsToDateTime24HR(midnightMS);
    const delayMS      = midnightMS - nowMS;
////const parameters   = { 'delayMS': delayMS, 'midnightMS': midnightMS, 'midnightTime': midnightTime }; 
    const parameters   = { 'delayMS': delayMS, 'midnightTime': midnightTime }; 
    const result       = `Setting Midnight Timeout: delayMS=${delayMS} midnightMS=${midnightMS} midnightTime="${midnightTime}"`;

    if (! midnightMS) {
      this.error(`\n\n\n++++++++++ PANIC!!! midnightMS=${midnightMS} ++++++++++\n\n\n`);
      return;
    }

    this.logAlways(`-- Setting up next Midnight Timeout -- ${result}`);

    this.#midnightTimeout = setTimeout( () => this.#midnightTimerTimedOut(delayMS, nowMS), delayMS);
    if (this.#LOG_MIDNIGHT_EVENTS) await this.#fsbEventLogger.logInternalEvent("setupMidnightTimeout", "success", parameters, "");

//  if (this.#firstMidnightTimeout) {
//    this.firstMidnightTimeout = false;
//    this.#midnightTimeout = setTimeout( () => this.#midnightTimerTimedOut(10000, nowMS), 10000);
//    if (this.#LOG_MIDNIGHT_EVENTS) await this.#fsbEventLogger.logInternalEvent("setupMidnightTimeout", "success", { 'delay': 10000 }, "TEST 10000");
//  }
  }

  async #midnightTimerTimedOut(delayMS, timerSetAtMS) {
    const timer = this.#midnightTimeout;
    this.#midnightTimeout = null;
    if (timer) {
      clearTimeout(timer);
    }

    const timerSetAtTime = utils.formatMsToDateTime24HR(timerSetAtMS);
    const result         = `Timed out after ${delayMS} ms -- Set at "${timerSetAtTime}"`;
    this.logAlways(`-- ${result}`);

    if (this.#LOG_MIDNIGHT_EVENTS) {
      const parameters = { 'delayMs': delayMS, 'timerSetAt': timerSetAtTime };
      await this.#fsbEventLogger.logInternalEvent("midnightTimerTimedOut", "success", parameters, result);
    }

    this.#dispatchMidnightEvent();

    await this.#setupMidnightTimeout();
  }

  #dispatchMidnightEvent() {
    this.logAlways("-- begin");
    const midnightEvent = new Event('midnight');
    this.#midnightEventDispatcher.dispatchEvent(midnightEvent);
    this.logAlways("-- end");
  }

  async #onMidnight(e) {
    this.logAlways("-- begin");
    await this.#processMidnightTasks();
    this.logAlways("-- end");
  }


  async #processMidnightTasks() {
    this.logAlways("-- begin");

    try {
      if (this.#LOG_MIDNIGHT_EVENTS) await this.#fsbEventLogger.logInternalEvent("processMidnightTasks", "request", null, "");

      await this.#autoRemoveUninstalledExtensions(); // this event is already logged inside call
      await this.#autoPurgeOldLogFiles(); // this event is already logged inside call

      if (this.#LOG_MIDNIGHT_EVENTS) await this.#fsbEventLogger.logInternalEvent("processMidnightTasks", "success", null, "");
    } catch (error) {
      this.caught(error, "Error Processing Midnight Tasks");
    }

    this.logAlways("-- end");
  }

  async #autoPurgeOldLogFiles() {
    const numDays = await this.#fsbOptionsApi.getAutoLogPurgeDays(14);
    this.debug("-- numDays: ", numDays);

    const parameters = { 'numDays': numDays };
    if (this.#LOG_PURGE_OLD_LOG_FILES) await this.#fsbEventLogger.logInternalEvent("autoPurgeOldLogFiles", "request", parameters, "");

    var result = "";
    if (numDays < 1) {
      result = "Auto Log Purge Disabled";
    } else {
      const response = await this.#fsbEventLogger.deleteOldEventLogs(numDays); // this event is already logged inside call
      if (! response) {
        result = "NO RESPONSE from deleteOldEventLogs";
      } else {
        result =     `deleted=${response.count_deleted}`
                 + `, failed=${response.count_failed}`
                 + `, notDeleted=${response.count_notDeleted}`
                 + `, files=${response.count_files}`;
      }
    }

    if (this.#LOG_PURGE_OLD_LOG_FILES) await this.#fsbEventLogger.logInternalEvent("autoPurgeOldLogFiles", "success", parameters, result);
  }



  async #autoRemoveUninstalledExtensions() {
    const numDays                    = await this.#fsbOptionsApi.getAutoRemoveUninstalledExtensionsDays(2);
    const deleteExtensionDirectories = await this.#fsbOptionsApi.isEnabledOnRemoveExtensionDeleteDirectory();
    this.debug(`-- numDays=${ numDays}, deleteExtensionDirectories=${deleteExtensionDirectories}`);

    const parameters = {
      'numDays':                    numDays,
      'deleteExtensionDirectories': deleteExtensionDirectories,
    };
    if (this.#LOG_REMOVE_UNINSTALLED_EXTENSIONS) await this.#fsbEventLogger.logInternalEvent("autoRemoveUninstalledExtensions", "request", parameters, "");

    // this all does NOT remove SPECIAL or LOCKED Extesnions, so no need to check for those here
    const removedExtensionIds = await this.#fsbOptionsApi.autoRemoveUninstalledExtensions(numDays); // this event is already logged inside call
    this.debug(`-- Extensions removed: ${removedExtensionIds ? removedExtensionIds.length : 0}`);

    // MABXXX perhaps delete the directories inside the call to #fsbOptionsApi.autoRemoveUninstalledExtensions() ???
    // MABXXX In fact, EVERYTHING could be done in there...
    if (! deleteExtensionDirectories) {
      this.debug("-- NOT Deleting Extension Directories");
    } else {

      if (! removedExtensionIds || removedExtensionIds.length < 1) {
        this.debug("-- NO Extension Directories to delete");
      } else {

        this.debug("-- Extension Directories to delete: ${removedExtensions.length}\n", removedExtensionIds);
        const deleteParams = { 'count': removedExtensionIds.length };
        if (this.#LOG_REMOVE_UNINSTALLED_EXTENSIONS) await this.#fsbEventLogger.logInternalEvent("deleteExtensionDirectories", "request", deleteParams, "");

        for (const removedExtId of removedExtensionIds) {
          const result = await this.#fsbCommandsApi.deleteExtensionDirectory(removedExtId);// a shortcut to just calling fsbCommandsApi.processInternalCommand()
          // do we care about the result?
        }

        if (this.#LOG_REMOVE_UNINSTALLED_EXTENSIONS) await this.#fsbEventLogger.logInternalEvent("deleteExtensionDirectories", "success", deleteParams, "");
      }
    }

    if (this.#LOG_REMOVE_UNINSTALLED_EXTENSIONS) await this.#fsbEventLogger.logInternalEvent("autoRemoveUninstalledExtensions", "success", parameters, "");
  }



  async #showOptionsWindow() { // COPIED FROM OptionsUI in ./optionsUI/optionsUI.js
    let   popupLeft   = 100;
    let   popupTop    = 100;
    let   popupHeight = 900;
    let   popupWidth  = 700;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.error("-- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");
    } else {
      this.debug( "-- Got the Current (Main, mail:3pane) Window:"
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

    const bounds = await this.#fsbOptionsApi.getWindowBounds("optionsWindowBounds");
    if (! bounds) {
      this.debug("-- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`-- PREVIOUS WINDOW BOUNDS "optionsWindowBounds" IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "-- restoring previous window bounds:"
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
                                                 + `&requestedBy=${encodeURIComponent(this.#EXT_NAME)}`;
    const optionsWindow = await messenger.windows.create({
      url:                 optionsUrl,
      type:                "popup",
      titlePreface:        utils.getI18nMsg("options_fsbOptionsTitle", "Options") + " - ",
      top:                 popupTop,
      left:                popupLeft,
      height:              popupHeight,
      width:               popupWidth,
      allowScriptsToClose: true,
    });

    this.debug(`-- OptionsUI Popup Window Created -- windowId="${optionsWindow.id}" URL="${optionsUrl}"`);
  }




  // message: { 'Command': 'command': string (command name), parameters... }
  //
  // Very unfortunate naming, but very quickly added the outer Object with
  // unique 'Command' key to make command messages distinct from messages
  // from other senders -- mainly internal messages between different pages,
  // i.e. responses with results back to page opener -- and a royal pain to
  // change it now
  //
  // We receive an event with each and every message sent by anything for
  // any reason, and we use 'Command' to know it's a Command that's meant
  // for this code to process. But this is just how events work for the
  // Web Extensions API.
  //
  // There out to be a way to specify from what you want to receive messages,
  // but the API is what it is, and it's a standard that can't be changed
  // just for Thunderbird or even Firefox. There's no way to prevent
  // anything from sending messages.
  //                 
  async #onMessageReceivedInternal(message) {
    const nowMS = Date.now();

    if (this.DEBUG) {
      this.debugAlways("-- Received Internal Message:");
      utils.logProps("", "onMessageReceivedInternal.message", message);
    }

    if (! message.hasOwnProperty('Command')) {
      //this.logAlways( "-- Received Unknown Internal Message --", message);
//    return { "error": "Invalid Request: Message has no Command Object",
//             "code": "400"
//           };
      return false;
    }

    return await this.#fsbCommandsApi.processInternalCommand(nowMS, message.Command, this.#EXT_ID);
  }




  // I tried to move all this into the Commands API but I couldn't do it
  // because of Access Control and the need to open up a window to ask
  // if the user wants to grant or deny access.
  //
  // message: { 'Command': 'command': string (command name), parameters... }
  //
  // Very unfortunate naming, but very quickly added the outer Object with
  // unique 'Command' key to make command messages distinct from messages
  // from other senders -- mainly internal messages between different pages,
  // i.e. responses with results back to page opener -- and a royal pain to
  // change it now
  //
  // We receive an event with each and every message sent by anything for
  // any reason, and we use 'Command' to know it's a Command that's meant
  // for this code to process. But this is just how events work for the
  // Web Extensions API.isValidFileName
  //
  // There out to be a way to specify from what you want to receive messages,
  // but the API is what it is, and it's a standard that can't be changed
  // just for Thunderbird or even Firefox. There's no way to prevent
  // anything from sending messages.
  //                 
  async #onMessageReceivedExternal(message, sender) {
    const nowMS            = Date.now();
    const Command          = message?.Command;
    const commandName      = (Command && Command.command && (typeof Command.command) === 'string') ? Command.command : "NONE";
    const senderId         = (sender && sender.id && (typeof sender.id) === 'string') ? sender.id : "UNKNOWN";
    const logCommand       = await this.#fsbOptionsApi.isEnabledExternalMessageLogging();
    const logResult        = await this.#fsbOptionsApi.isEnabledExternalMessageResultLogging();
    const accessControl    = await this.#fsbOptionsApi.isEnabledExtensionAccessControl();
    const logAccessControl = await this.#fsbOptionsApi.isEnabledAccessLogging();

    if (this.#LOG) {
      const formattedParameters = this.#fsbCommandsApi.formatParameters(Command);
      this.logAlways( "-- Received External Message --",
                      `\n- senderId="${senderId}"`,
                      `\n- commandName="${commandName}"`,
                      `\n- parameters: ${formattedParameters}`,
                      "\n- Command: ", Command,
                      "\n- message: ", message,
                      "\n- sender: ", sender,
                    );
    }

    const cmdIsAccess = (commandName === 'access');
    if (cmdIsAccess) this.debug("--- Command is 'access'");


    if (logCommand || (cmdIsAccess && logAccessControl)) {
      this.#fsbEventLogger.logCommand(nowMS, senderId, Command);
    }

    if (! message || ! Object.hasOwn(message, 'Command')) {
      this.logAlways( "-- Received Unknown External Message --", message);
      var error = "Invalid Request: Message has no Command Object - ";
      if (sender && sender.id && (typeof sender.id) === 'string') {
        error += `Sender ID: ${senderId}`;
        this.#fsbEventLogger.logError(nowMS, senderId, "NO COMMAND", null, "error: " + error);
      } else {
        error += "NO SENDER ID AVAILABLE";
        this.#fsbEventLogger.logError(nowMS, "UNKNOWN", "NO COMMAND", null, "error: " + error);
      }
      this.error(`-- ${error}`);
      return { "error": error, "code": "400" };
    }

    if (! sender || ! sender.id) {
      const error = "Message has no Sender ID";
      this.error(`-- ${error}`);
      this.#fsbEventLogger.logError(nowMS, "UNKNOWN", commandName, Command, "error: " + error);
      return { "error": error, "code":  "400" };
    }

    if ((typeof sender.id) !== 'string') {
      const error = `Message Sender ID type must be 'string' - type='${typeof sender.id}'`;
      this.error(`-- ${error}`);
      this.#fsbEventLogger.logError(nowMS, "UNKNOWN", Command, Command, "error: " + error);
      return { "error": error, "code":  "400" };
    }

    if (! utils.isValidExtensionId(senderId)) {
      const error = `Message Sender ID is invalid: "${sender.id}"`;
      this.debug(`-- ${error}"`);
      this.#fsbEventLogger.logError(nowMS, senderId, Command, Command, "error: " + error);
      return { "error": error, "code":  "400" };
    }



    // Access Control CANNOT be handled by the Command Processor, so do it here
    if (! accessControl) {
      this.debug("-- Access Control is NOT enabled");

      const extProps = await this.#fsbOptionsApi.getExtensionPropsById(senderId);

      if (cmdIsAccess) {

        // if Access Control is not enabled then access is ALWAYS granted
        if (logAccessControl) {
          const accessGrantedMsg = `Access is Granted: "${senderId}"`;
          this.#fsbEventLogger.logCommandResult(nowMS, sender.id, Command, accessGrantedMsg, "access granted");
        }

        return { "access": "granted", 'readOnly': (extProps && (typeof extProps.readOnly) === 'boolean') ? extProps.readOnly : false };
      }

    } else {
      this.debug("-- ACCESS CONTROL IS ENABLED");

      try {
        // Check to see if Extension has NOT been configured or has been EXPLICITLY denied already
        // If it *HAS* been EXPLICITLY denied, do we really want to do anything???
        var accessDenied = false;

        var extProps = await this.#fsbOptionsApi.getExtensionPropsById(senderId);

        if (! extProps) {
          // Extension is not configured, so not Explicitly Denied.
          //
          // If asking if the user if they want to configure and EXPLICITLY allow/disallow access is configured, then ask.
          // Otherwise it's just IMPLICITLY denined
          if (await this.#fsbOptionsApi.isEnabledShowGrantExtensionAccessDialog()) {
            // #showGrantExtensionAccessConfirmDialog() returns true if they say YES, and false if they say NOT or if they CANCEL.
            // It will actually configure the extension if they say YES or NO, but not if they CANCEL or just CLOSE the dialog.
            // This is so they will NOT be asked again (EXPLICIT DENIAL) if they say YES no NO.
            const accessGranted = await this.#showGrantExtensionAccessConfirmDialog(senderId);
            extProps = await this.#fsbOptionsApi.getExtensionPropsById(senderId);

            if (accessGranted) {
              // MABXXX TELL OptionsUI to add the extension to the List!!!  Need OptionsUI to listen to changes in options, not implemented yet
            } else {
              accessDenied = true;
            }
          }
        }

        if (accessDenied || ! extProps || ! extProps.allowAccess) {
          this.logAlways(`-- ACCESS IS DENIED FOR MESSAGE SENDER ID: "${senderId}"`);

          const logAccessDenied  = await this.#fsbOptionsApi.isEnabledAccessDeniedLogging();
          if (logResult || logAccessControl || logAccessDenied) {
            const accessDeniedMsg = `Access is Denied for: "${senderId}"`;
            this.#fsbEventLogger.logCommandResult(nowMS, senderId, Command, accessDeniedMsg, "access denied");
          }

          if (cmdIsAccess) {
            return { "access": "denied" };
          } else {
            return { "error": `Access to ${this.#EXT_NAME} has not been granted to ${senderId}`, "code":  "403" };
          }
        }

        if (cmdIsAccess) {
          const accessType = (! extProps || (typeof extProps.readOnly) !== 'boolean' || ! extProps.readonly) ? "Read/Write": "Read-Only"

          this.logAlways(`-- commandName='access' - ${accessType} ACCESS GRANTED FOR MESSAGE SENDER ID: "${senderId}"`);
          if (logResult || logAccessControl) {
            const accessGrantedMsg = `Access is Granted: "${senderId}"`;
            this.#fsbEventLogger.logCommandResult(nowMS, sender.id, Command, accessGrantedMsg, "access granted");
          }

          const response = {
            'access':   "granted",
            'readOnly': (extProps && (typeof extProps.readOnly) === 'boolean') ? extProps.readOnly : false,
          };

          return response;
        }

      } catch (error) {
        this.caught(error, "Error processing External Message - Code 500");
        this.#fsbEventLogger.logCaughtError(commandName, Command, error); // Does NOT log Syntax Errors
        return { "error": "Internal Error", "code":  "500" };
      }
    }


    return this.#fsbCommandsApi.processExternalCommand(nowMS, Command, senderId);
  }



  async #onExtensionInstalled(extensionInfo) {
    if (extensionInfo.type === 'extension') {
      this.debugAlways(`-- Extension has been Installed: id="${extensionInfo.id}"`);

      try {
        const extensionProps = await this.#fsbOptionsApi.getExtensionPropsById(extensionInfo.id);
        if (! extensionProps) {
          this.debugAlways(`-- Installed Extension is NOT Configured: id="${extensionInfo.id}"`);

        } else {
          this.debugAlways(`-- Installed Extension IS Configured, Un-marking as Uninstalled: id="${extensionInfo.id}"`);
          extensionProps.uninstalled = false;
          delete extensionProps['uninstalledTimeMS'];
          extensionProps['uninstalledType'];
          await this.#fsbOptionsApi.storeExtensionPropsById(extensionProps.id, extensionProps);
        }
      } catch (error) {
        this.caught(error, "Error Processing Extension Installed Notification");
      }
    }
  }

  async #onExtensionUninstalled(extensionInfo) {
    if (extensionInfo.type === 'extension') {
      this.debugAlways(`-- Extension has been Uninstalled: id="${extensionInfo.id}"`);

      try {
        const extensionProps = await this.#fsbOptionsApi.getExtensionPropsById(extensionInfo.id);
        if (! extensionProps) {
          this.debugAlways(`-- Uninstalled Extension is NOT Configured: id="${extensionInfo.id}"`);

        } else {
          const autoRemoveNumDays = await this.#fsbOptionsApi.getDeletedExtensionAutoRemoveDays(2);
          this.debugAlways(`-- Uninstalled Extension IS Configured: id="${extensionInfo.id}", autoRemoveNumDays=${autoRemoveNumDays}`);

          if (autoRemoveNumDays == 0) {
            this.debugAlways(`-- Uninstalled Extension IS Configured, Immediately Removing: id="${extensionInfo.id}"`);
            await this.#fsbOptionsApi.removeExtension(extensionInfo.id);

          } else {
            this.debugAlways(`-- Uninstalled Extension IS Configured, Marking as Uninstalled: id="${extensionInfo.id}"`);
            extensionProps.uninstalled       = true;
            extensionProps.uninstalledTimeMS = Date.now();
            extensionProps.uninstalledType   = 'onExtensionUninstalled';
            await this.#fsbOptionsApi.storeExtensionPropsById(extensionProps.id, extensionProps);
          }
        }
      } catch (error) {
        this.caught(error, "Error Processing Extension Uninstalled Notification");
      }
    }
  }




  async #showGrantExtensionAccessConfirmDialog(extensionId) {
    this.debug("-- begin");

    var   popupLeft   = 100;
    var   popupTop    = 100;
    var   popupHeight = 250;
    var   popupWidth  = 500;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.debug("-- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");

    } else {
      this.debug( "-- Got the Current (Main, mail:3pane) Window:"
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

    const bounds = await this.#fsbOptionsApi.getWindowBounds("confirmDialogWindowBounds"); // MABXXX PERHAPS THIS SHOULD ALWAYS BE CENTERED??????

    if (! bounds) {
      this.debug("-- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`-- PREVIOUS WINDOW BOUNDS IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "-- restoring previous window bounds:"
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
      this.debug("-- messenger.tabs.getCurrent() didn't return a Tab");
    } else {
      this.debug(`-- currentTab.id="${currentTab.id}" currentTab.windowId="${currentTab.windowId}"`);
      ourTabId    = currentTab.id;
      ourWindowId = currentTab.windowId;
    }

    const title            = utils.getI18nMsg("fsbConfirmDialogGrantExtensionTitle");
    const message1         = utils.getI18nMsg("fsbConfirmDialogGrantExtensionMessage1");
    const message2         = utils.getI18nMsg("fsbConfirmDialogGrantExtensionMessage2");
    const message3         = utils.getI18nMsg("fsbConfirmDialogGrantExtensionMessage3");
    const button1MsgId     = "fsbConfirmDialog_grantButton.label";
    const button2MsgId     = "fsbConfirmDialog_denyButton.label";
    const button3MsgId     = "fsbConfirmDialog_cancelButton.label";
    const confirmDialogUrl = messenger.runtime.getURL("../dialogs/confirm.html")
                             + `?t=${encodeURIComponent(title)}`
                             + "&m=5"
                             + `&m1=${encodeURIComponent(message1)}`
                             + `&m2=${encodeURIComponent(extensionId)}`
                             + `&m3=${encodeURIComponent(message2)}`
                             + `&m4=${encodeURIComponent(' ')}` // a blank line
                             + `&m5=${encodeURIComponent(message3)}`
                             + "&b=3"
                             + `&bm1=${encodeURIComponent(button1MsgId)}`
                             + `&bm2=${encodeURIComponent(button2MsgId)}`
                             + `&bm3=${encodeURIComponent(button3MsgId)}`;
    // MABXXX DAMN!!! THERE'S NO WAY TO MAKE THIS MODAL!!! MUST USE action "default_popup".  But how to get Extension ID, etc?
    // The window.confirm() function doesn't give a way to specify button text.
    // Which is worse? Ugly ugly UGLY!!!
    this.debug( "-- window bounds:"
                + `\n- popupTop=${popupTop}`
                + `\n- popupLeft=${popupLeft}`
                + `\n- popupWidth=${popupWidth}`
                + `\n- popupHeight=${popupHeight}`
              );
    const confirmDialogWindow = await messenger.windows.create(
      {
        url:                 confirmDialogUrl,
        type:                "popup",
        titlePreface:        utils.getI18nMsg("extensionName") + " - ",
        top:                 popupTop,
        left:                popupLeft,
        height:              popupHeight,
        width:               popupWidth,
        allowScriptsToClose: true,
      }
    );

    this.debug( "-- Grant Extension Access Confirmation Popup Window Created --"
                + `\n-from ourTabId="${ourTabId}"`
                + `\n-from ourWindowId="${ourWindowId}"`
                + `\n-confirmDialogWindow.id="${confirmDialogWindow.id}"`
                + `\n-URL="${confirmDialogUrl}"`
              );

    // Re-focus on the confirmDialog window when our window gets focus
    // MABXXX PERHAPS THIS SHOULD BE DONE INSIDE #confirmDialogPrompt() ???
//  const focusListener = async (windowId) => this.windowFocusChanged(windowId, ourTabId, ourWindowId, confirmDialogWindow.id);
    const focusListener = null;
//  messenger.windows.onFocusChanged.addListener(focusListener); // MABXXX async ???

    // ConfirmDialogResponse - expected:
    // - null     - the user closed the popup window        (set by our own windows.onRemoved listener - the defaultResponse sent to #confirmDialogPrompt)
    // - CLOSED   - the user closed the popup window        (sent by the ConfirmDialog window's window.onRemoved listener -- NOT REALLY - we use our own onRemoved listener)
    // - BUTTON_1 - the user clicked button 1               (sent by the ConfirmDialog window's button listener)
    // - BUTTON_2 - the user clicked button 2               (sent by the ConfirmDialog window's button listener)
    // - BUTTON_3 - the user clicked button 3               (sent by the ConfirmDialog window's button listener)

    const confirmDialogResponse = await this.#confirmDialogPrompt(confirmDialogWindow.id, focusListener, null);
this.debugAlways(`-- ConfirmDialog confirmDialogResponse="${confirmDialogResponse}"`);

    switch (confirmDialogResponse) {
      case 'BUTTON_1': // 'Yes' button
        await this.#grantAccessToExtension(extensionId); // Add NEW Extension and Grant -vs- Grant existing Extension???
        return true;
      case 'BUTTON_2': // 'No' button
        await this.#denyAccessToExtension(extensionId); // Add NEW Extension and Deny -vs- Deny existing Extension???
        return false;
      case 'BUTTON_3': // 'Cancel' button
        this.debug("-- ConfirmDialog canceled");
      case 'CLOSED':   // this never happens - see comments in ConfirmDialog regarding conduit failure
      case null:       // closed using the window close button
        return false;
      default:
        this.error(`-- UNKNOWN ConfirmDialog Response - NOT A KNOWN KEYWORD: "${confirmDialogResponse}"`);
    }
  }

  async #grantAccessToExtension(extensionId) {
    this.debugAlways(`-- begin - extensionId="${extensionId}"`);

    const granted = await this.#fsbOptionsApi.allowAccess(extensionId);
    this.debugAlways(`-- granted=${granted}`);
    // NOW UPDATE THE UI!!! Did it get added or just altered?

    this.debugAlways("-- end");
  }

  async #denyAccessToExtension(extensionId) {
    this.debugAlways(`-- begin -- extensionId="${extensionId}"`);

    const denied = await this.#fsbOptionsApi.disallowAccess(extensionId);
    this.debugAlways(`-- denied=${denied}`);
    // NOW UPDATE THE UI!!! Did it get added or just altered?

    this.debugAlways("-- end");
  }

  async #confirmDialogPrompt(confirmDialogWindowId, focusListener, defaultResponse) {
    try {
      await messenger.windows.get(confirmDialogWindowId);
    } catch (error) {
      // Window does not exist, assume closed.
      this.caught(error, "-- PERHAPS WINDOW CLOSED???");
      return defaultResponse;
    }

    return new Promise(resolve => {
      var response = defaultResponse;

      function windowRemovedListener(windowId) {
        if (windowId == confirmDialogWindowId) {
//////////messenger.runtime.onMessage.removeListener(messageListener);
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
      function messageListener(request, sender) {   // MABXXX async ???
        if (sender.tab && sender.tab.windowId == confirmDialogWindowId && request && request.hasOwnProperty("ConfirmDialogResponse")) {
          response = request.ConfirmDialogResponse;
        }

        return false; // we're not replying
      }

      messenger.runtime.onMessage.addListener(messageListener);
      messenger.windows.onRemoved.addListener(windowRemovedListener);
    });
  }
}



messenger.management.onEnabled.addListener( async (extensionInfo) => #onExtensionEnabled(extensionInfo) );
async function #onExtensionEnabled(extensionInfo) { // management.ExtensionInfo
  if (extensionInfo.id === utils.getExtensionId("file-system-broker@localmotive.com")) {
    console.log(`===== Extension Enabled: id="${extensionInfo.id}" name="${extensionInfo.name}" version="${extensionInfo.version}"`);
  }
}

messenger.runtime.onInstalled.addListener( async ( { reason, previousVersion } ) => #onInstalled(reason, previousVersion) );
messenger.runtime.onStartup.addListener(   async ()                              => #onStartup()                          );
messenger.runtime.onSuspend.addListener(   async ()                              => #onSuspend()                          );

async function #onInstalled(reason, previousVersion) {
  const EXT_ID      = utils.getExtensionId("file-system-broker@localmotive.com");
  const EXT_NAME    = utils.getExtensionName("FileSystemBroker");
  const EXT_VERSION = utils.getExtensionVersion();

//const options = new FsbOptions();
//const isSkipOnboarding = await options.isEnabledSkipOnboarding(); // this call just goes to the local storage to get this option, no logging needed

  if (reason === "update") {
    console.log(`${EXT_ID} === EXTENSION ${EXT_NAME} UPDATED: "${previousVersion}" --> "${EXT_VERSION}" ===`); 
  } else if (reason === "install") {
    console.log(`${EXT_ID} === EXTENSION ${EXT_NAME} ${EXT_VERSION} INSTALLED ===`); 
  } else { // last option is "browser_update"
    console.log(`${EXT_ID} === EXTENSION ${EXT_NAME} ${EXT_VERSION} INSTALLED (browser update) ===`); 
  }

//if (! isSkipOnboarding) {
//  if (reason === "update" /* && previousVersion?.startsWith("3.") */) {
//    messenger.tabs.create({ url: "/onboarding/onboarding.html" });
//    messenger.tabs.create({ url: "/onboarding/changes.html" });
//  } else if (reason === "install") {
//    messenger.tabs.create({ url: "/onboarding/onboarding.html" });
//  }
//}
}

async function #onStartup() {
  const EXT_ID   = utils.getExtensionId("file-system-broker@localmotive.com");
  const EXT_NAME = utils.getExtensionName("FileSystemBroker");
  console.log(`${EXT_ID} === EXTENSION ${EXT_NAME} STARTED ===`); 
}

async function #onSuspend() {
  const EXT_ID   = utils.getExtensionId("file-system-broker@localmotive.com");
  const EXT_NAME = utils.getExtensionName("FileSystemBroker");
  console.log(`${EXT_ID} === EXTENSION ${EXT_NAME} SUSPENDED ===`); 
}



// self-executing async "main" function
(async () => {
  const fileSystemBroker = new FileSystemBroker();
  fileSystemBroker.run();
})()
