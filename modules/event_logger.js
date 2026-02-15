import { FileSystemBrokerAPI      } from '../modules/FileSystemBroker/filesystem_broker_api.js';
import { FileSystemBrokerCommands } from '../modules/commands.js';
import { getExtensionId, getExtensionName, formatMsToDateForFilename, formatMsToDateTime24HR, getMidnightMS, isValidFileName } from './utilities.js';


export class FsbEventLogger {
  constructor(logger, fsbOptionsApi, fsbCommandsApi) {
    this.CLASS_NAME                      = this.constructor.name;
    this.extId                           = getExtensionId();
    this.extName                         = getExtensionName();

    this.INFO                            = false;
    this.LOG                             = false;
    this.DEBUG                           = false;
    this.WARN                            = false;

    this.LOG_DELETE_OLD_EVENT_LOGS       = true; // create event log entries when deleting old event logs?

    this.LOG_FILENAME_MATCH_GLOB         = "*.log";
    this.LOG_FILENAME_EXTENSION          = ".log";
    this.LOG_ARCHIVE_FILENAME_MATCH_GLOB = "*.alog";
    this.LOG_ARCHIVE_FILENAME_EXTENSION  = ".alog";

    this.logger                          = logger;
    this.fsbOptionsApi                   = fsbOptionsApi;
    this.fsbCommandsApi                  = fsbCommandsApi;
    this.fsBrokerApi                     = new FileSystemBrokerAPI();
  }



  log(...info) {
    if (this.LOG) this.logger.log(this.CLASS_NAME, ...info);
  }

  logAlways(...info) {
    this.logger.logAlways(this.CLASS_NAME, ...info);
  }

  debug(...info) {
    if (this.DEBUG) this.logger.debug(this.CLASS_NAME, ...info);
  }

  debugAlways(...info) {
    this.logger.debugAlways(this.CLASS_NAME, ...info);
  }

  error(...info) {
    // always log errors
    this.logger.error(this.CLASS_NAME, ...info);
  }

  caught(e, msg, ...info) {
    // always log errors
    this.logger.error( this.CLASS_NAME,
                       msg,
                       "\n- error.name:    " + e.name,
                       "\n- error.message: " + e.message,
                       "\n- error.stack:   " + e.stack,
                       "\n",
                       ...info
                     );
  }



  async logInternalEvent(eventType, stat, parameters, description) {
    if (await this.fsbOptionsApi.isEnabledInternalEventLogging()) {
      await this.logEvent("INTERNAL", eventType, stat, parameters, description);
    }
  }



  async logEvent(senderId, eventType, stat, parameters, description) {
    const timeMS        = Date.now();
    const logFileName   = formatMsToDateForFilename(timeMS) + this.LOG_FILENAME_EXTENSION;
    const formattedTime = formatMsToDateTime24HR(timeMS);

    const logMsg = {
      "timeMS":     timeMS,
      "time":       formattedTime,
      "sender":     senderId,
      "type":       "event",
      "command":    eventType,
      "status":     stat,
      "result":     description
    };
    if (parameters != null) {
      if (typeof parameters === 'object') {
        this.fsbCommandsApi.addCommandToObject(parameters, logMsg);
      } else if (typeof parameters === 'string') {
        logMsg.parameters = parameters;
      }
    }

    // We cannot use writeObjectToJSONFile because it does not support APPEND modes
    const json         = JSON.stringify(logMsg) + "\n";
    const bytesWritten = messenger.BrokerFileSystem.writeFile(this.extId, logFileName, json, "appendOrCreate" );
  }



  async logCommand(timeMS, senderId, command) {
    const logFileName   = formatMsToDateForFilename(timeMS) + this.LOG_FILENAME_EXTENSION;
    const formattedTime = formatMsToDateTime24HR(timeMS);

    const logMsg = {
      "timeMS": timeMS,
      "time":   formattedTime,
      "sender": senderId,
      "type":   "command",
      "status": "request"
    };
    this.fsbCommandsApi.addCommandToObject(command, logMsg);

    // We cannot use writeObjectToJSONFile because it does not support APPEND modes
    const json         = JSON.stringify(logMsg) + "\n";
    const bytesWritten = messenger.BrokerFileSystem.writeFile(this.extId, logFileName, json, "appendOrCreate" );
  }



  async logCommandResult(timeMS, senderId, command, result) {
    const logFileName     = formatMsToDateForFilename(timeMS) + this.LOG_FILENAME_EXTENSION;
    const formattedTime   = formatMsToDateTime24HR(timeMS);
    const formattedResult = (typeof result === 'object') ? this.fsbCommandsApi.formatCommandResult(command, result) : result; // MABXXX handle string vs object inside the function

    const logMsg = {
      "timeMS": timeMS,
      "time":   formattedTime,
      "sender": senderId,
      "type":   "result",
      "status": result.error ? "error" : result.invalid ? "invalid" : "success"
    };
    this.fsbCommandsApi.addCommandToObject(command, logMsg);
    logMsg["result"] = formattedResult;

    // We cannot use writeObjectToJSONFile because it does not support APPEND modes
    const json         = JSON.stringify(logMsg) + "\n";
    const bytesWritten = messenger.BrokerFileSystem.writeFile(this.extId, logFileName, json, "appendOrCreate" );
  }



  // if numDays == 0 just delete them all, regardless
  // if optional archives parameter is true, delete archived log files */
  //
  // Does NOT use the FileSystemBroker API, so this MAY be called from background.js,
  // where the message listeners are defined.
  async deleteOldEventLogs(numDays, archives) {
    this.logAlways(`-- begin -- numDays=${numDays} archives=${archives}`);

    const deleteArchives               = (typeof archives === 'boolean') ? archives : false;
    const deleteFilesOlderThanMS       = (numDays == 0) ? 0  : getMidnightMS(Date.now(), -numDays);
    const deleteFilesOlderThanDateTime = (numDays == 0) ? "" : formatMsToDateTime24HR(deleteFilesOlderThanMS);

    const parameters = (numDays == 0) ? { 'numDays': numDays, 'archives': deleteArchives }
                                      : { 'numDays': numDays, 'olderThanMS': deleteFilesOlderThanMS, 'olderThanDateTime': deleteFilesOlderThanDateTime, 'archives': deleteArchives };
    await this.logInternalEvent("deleteOldEventLogs", "request", parameters, "");

    var   numFiles        = 0;
    var   numDeleted      = 0;
    var   numDeleteFailed = 0;
    var   numNotDeleted   = 0;
    const deletedFileNames = [];
    const fileInfo         = await this.getLogFileInfo(archives);

    if (! fileInfo) {
      // errors should already have been recorded in getLogFileInfo()
      await this.logInternalEvent("deleteOldEventLogs", "error", parameters, "Failed to get Log File Info");

    } else if (fileInfo.length < 1) {
      await this.logInternalEvent("deleteOldEventLogs", "success", parameters, "No Log Files");

    } else {
      numFiles = fileInfo.length;

      this.debug(`-- Delete ${deleteArchives? "Archived " : ""}Log Files older than days=${numDays} ms=${deleteFilesOlderThanMS} date+time="${deleteFilesOlderThanDateTime}"`);

      for (const info of fileInfo) {
        // MABXXX using last modified time instead of creation time
        // Windows doesn't seem to set creation time as I would expect
////////const willDelete               = (numDays === 0) || (info.creationTime < deleteFilesOlderThanMS);
        const willDelete               = (numDays === 0) || (info.lastModified < deleteFilesOlderThanMS);
        const fileLastModifiedDateTime = formatMsToDateTime24HR(info.lastModified);

        if (this.DEBUG) {
          if (numDays === 0) {
            this.debugAlways(`-- file "${info.fileName}" numDays==0 willDelete? ${willDelete}`);
          } else {
            const fileCreationDateTime = formatMsToDateTime24HR(info.creationTime);
            this.debugAlways(
                                `\n-- numDays ................ ${numDays}`
                              + `\n-- fileName ............... "${info.fileName}"`
                              + `\n-- deleteFilesOlderThan ... (${deleteFilesOlderThanMS}ms) "${deleteFilesOlderThanDateTime}"`
                              + `\n-- creationTime ........... (${info.creationTime}ms) "${fileCreationDateTime}"`
                              + `\n-- lastModified ........... (${info.lastModified}ms) "${fileLastModifiedDateTime}"`
                              + `\n-- willDelete? ............ ${willDelete}`
                            );
          }
        }

        if (this.LOG_DELETE_OLD_EVENT_LOGS) {
          const data = { 
            "step":                         "1",
            "numDays":                      numDays,
            "fileName":                     info.fileName,
            "deleteFilesOlderThanMS":       deleteFilesOlderThanMS,
            "lastModifiedMS":               info.lastModified,
            "deleteFilesOlderThanDateTime": deleteFilesOlderThanDateTime,
            "fileLastModifiedDateTime":     fileLastModifiedDateTime,
            "willDelete":                   willDelete
          };
          await this.logInternalEvent("deleteOldEventLogs", "DEBUG", data, "INFO");
        }

        if (willDelete) {
          this.debug(`-- Deleting file "${info.fileName}"`);

          if (this.LOG_DELETE_OLD_EVENT_LOGS) {
            const data = { 
              "step":                         "2",
              "numDays":                      numDays,
              "fileName":                     info.fileName,
              "deleteFilesOlderThanMS":       deleteFilesOlderThanMS,
              "lastModifiedMS":               info.lastModified,
              "deleteFilesOlderThanDateTime": deleteFilesOlderThanDateTime,
              "fileLastModifiedDateTime":     fileLastModifiedDateTime,
              "willDelete":                   willDelete
            };
            await this.logInternalEvent("deleteOldEventLogs", "DEBUG", data, "DELETING");
          }

          const response = await this.deleteLogFile(info.fileName);
          // errors should already have been recorded in deleteLogFile()
          if (response && response.deleted) {
            numDeleted++;
            deletedFileNames.push(info.fileName);

            if (this.LOG_DELETE_OLD_EVENT_LOGS) {
              const data = { 
                "step":                         "3",
                "numDays":                      numDays,
                "fileName":                     info.fileName,
                "deleteFilesOlderThanMS":       deleteFilesOlderThanMS,
                "lastModifiedMS":               info.lastModified,
                "deleteFilesOlderThanDateTime": deleteFilesOlderThanDateTime,
                "fileLastModifiedDateTime":     fileLastModifiedDateTime,
                "willDelete":                   willDelete
              };
              await this.logInternalEvent("deleteOldEventLogs", "DEBUG", data, "DELETE SUCCEEDED");
            }
          } else {
            // !response || response.error || response.invalid || !response.fileName || !response.deleted
            if (this.LOG_DELETE_OLD_EVENT_LOGS) {
              const data = { 
                "step":                         "4",
                "numDays":                      numDays,
                "fileName":                     info.fileName,
                "deleteFilesOlderThanMS":       deleteFilesOlderThanMS,
                "lastModifiedMS":               info.lastModified,
                "deleteFilesOlderThanDateTime": deleteFilesOlderThanDateTime,
                "fileLastModifiedDateTime":     fileLastModifiedDateTime,
                "willDelete":                   willDelete
              };

              var reason;
              if (! response) {
                reason = "No response from deleteFileCommand";
              } else if (reponse.error) {
                reason = `error: ${response.error}`;
              } else if (reponse.invalid) {
                reason = `invalid: ${response.invalid}`;
              } else if (! reponse.fileName) {
                reason = "No fileName returned from deleteFileCommand";
              } else if (! reponse.deleted) {
                reason = "deleteFileCommand did not return 'deleted===true'";
              } else {
                reason = "reason unknown";
              }

              await this.logInternalEvent("deleteOldEventLogs", "DEBUG", data, `DELETE FAILED: ${reason}`);
            }

            numDeleteFailed++;
          }
        } else {
          if (this.LOG_DELETE_OLD_EVENT_LOGS) {
            const data = { 
              "step":                         "5",
              "numDays":                      numDays,
              "fileName":                     info.fileName,
              "deleteFilesOlderThanMS":       deleteFilesOlderThanMS,
              "lastModifiedMS":               info.lastModified,
              "deleteFilesOlderThanDateTime": deleteFilesOlderThanDateTime,
              "fileLastModifiedDateTime":     fileLastModifiedDateTime,
              "willDelete":                   willDelete
            };
            await this.logInternalEvent("deleteOldEventLogs", "DEBUG", data, "WILL NOT DELETE");
            numNotDeleted++;
          }
        }
      }

      await this.logInternalEvent( "deleteOldEventLogs",
                                   "success",
                                   parameters,
                                   `Deleted: ${numDeleted}, Delete Failed: ${numDeleteFailed}, Not Deleted ${numNotDeleted}, Total: ${numFiles}`
                                 );
    }

    this.logAlways(`-- end -- Deleted: ${numDeleted}, Delete Failed: ${numDeleteFailed}, Not Deleted ${numNotDeleted}, Total: ${numFiles}`);

    return deletedFileNames;
  }



  // if optional archives parameter is true, get archived log FileInfo
  //
  // Does NOT use the FileSystemBroker API, so this MAY be called from background.js,
  // where the message listeners are defined.
  async getLogFileInfo(archives) {
    const deleteArchives = (typeof archives === 'boolean') ? archives : false;
    const matchGLOB      = deleteArchives ? this.LOG_ARCHIVE_FILENAME_MATCH_GLOB : this.LOG_FILENAME_MATCH_GLOB;
    const parameters     = {  'archives': deleteArchives, 'matchGLOB': matchGLOB};

    this.debug(`-- archives=${archives} matchGLOB="${matchGLOB}"`);
    await this.logInternalEvent("getLogFileInfo", "request", parameters, "");

    var logFileInfo;
    try {
      logFileInfo = await messenger.BrokerFileSystem.listFileInfo(this.extId, matchGLOB);
      if (! logFileInfo) {
        await this.logInternalEvent("getLogFileInfo", "error", parameters, "No Log FileInfo");
      } else {
        await this.logInternalEvent("getLogFileInfo", "success", parameters, `Got ${logFileInfo.length} Log Files`);
      }
    } catch (error) {
      this.caught(error, "Failed to get log file info");
      await this.logInternalEvent("getLogFileInfo", "error", parameters, `EXCEPTION -- ${error.name}: ${error.message}`);
    }

    return logFileInfo;
  }



  /* if optional archives parameter is true, list archived log FileInfo
   *
   * returns { "fileInfo": [],    "length": number } array of FileInfo - see the FileSystemBroker API README file
   *         { "error":    string                  } If there was some error getting the file info. The returned string gives the reason.
   *
   * Uses the FileSystemBroker API, so this may NOT be called from background.js,
   * where the listeners are defined.
   */
  async listLogFileInfo(archives) {
    const deleteArchives = (typeof archives === 'boolean') ? archives : false;
    const matchGLOB      = deleteArchives ? this.LOG_ARCHIVE_FILENAME_MATCH_GLOB : this.LOG_FILENAME_MATCH_GLOB;

    try {
      this.debug(`-- Getting list of log files with matchGLOB "${matchGLOB}"`);
      const response = await this.fsBrokerApi.listFileInfo(matchGLOB);
      this.debug(`--response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, "Failed to list log file info");
      return { "error": error.name + ": " + error.message };
    }
  }



  // Does NOT use the FileSystemBroker API, so this MAY be called from background.js,
  // where the message listeners are defined.
  async deleteLogFile(fileName) {
    try {
      this.debug(`-- Deleting log file "${fileName}"`);
//////const response = await this.fsBrokerApi.deleteFile(fileName); // "Could not establish connection. Receiving end does not exist." if called from background.js
      const response = await this.deleteFileCommand(fileName);
      this.debug("--response:", response);

      if (! response) {
        this.error(`-- FAILED TO DELETE LOG FILE -- NO RESPONSE RETURNED -- fileName="${fileName}"`);
      } else if (response.invalid) {
        this.error(`-- FAILED TO DELETE LOG FILE -- INVALID RETURNED -- fileName="${fileName}" -- response.invalid="${response.invalid}"`);
      } else if (response.error) {
        this.error(`-- FAILED TO DELETE LOG FILE -- ERROR RETURNED -- fileName="${fileName}" -- response.error="${response.error}"`);
      } else if (! response.fileName) {
        this.error(`-- FAILED TO DELETE LOG FILE -- NO FILENAME RETURNED -- fileName="${fileName} response.fileName="${response.fileName}"`);
      } else if (! response.deleted) {
        this.error(`-- FAILED TO DELETE LOG FILE -- fileName="${fileName}" not deleted`);
      } else {
        this.log(`-- Log File Deleted -- fileName="${fileName}" response.fileName="${response.fileName}"`);
      }

      return response;

    } catch (error) {
      this.caught(error, `Failed to delete log file "${fileName}"`);
      return { "error": error.name + ": " + error.message };
    }
  }



  // Does NOT use the FileSystemBroker API, so this MAY be called from background.js,
  // where the message listeners are defined.
  async deleteFileCommand(fileName) { // copied from modules/commands.js and slightly modified
    this.debug(`~~~~~~~~~~~~~~~~~~~~ fileName="${fileName}"`);

    if (! fileName) {
      this.error("-- No 'fileName' parameter");
      return ( { "invalid": "deleteFile Command: no 'fileName' parameter" } );
    }
    if ((typeof fileName) !== 'string') {
      this.error("-- 'fileName' parameter type is not 'string'");
      return ( { "invalid": "deleteFile Command: 'fileName' parameter type must be 'string'" } );
    }
    if (! isValidFileName(fileName)) {
      this.error(`-- 'fileName' parameter is invalid: "${fileName}"`);
      return ( { "invalid": `deleteFile Command: 'fileName' parameter is invalid: "${fileName}"` } );
    }

    try {
      const exists = await messenger.BrokerFileSystem.exists(this.extId, fileName);
      if (! exists) {
        this.error(`-- File does not exist: "${fileName}"`);
        return ( { "invalid": `deleteFile Command: File does not exist: "${fileName}"` } );
      }

      const isRegularFile = await messenger.BrokerFileSystem.isRegularFile(this.extId, fileName);
      if (! isRegularFile) {
        this.error(`-- File is not a Regular File: "${fileName}"`);
        return ( { "invalid": `deleteFile Command: File is not a Regular File: "${fileName}"` } );
      }

      this.debug(`-- deleting file "${fileName}" for extension "${this.extId}"`);
      const deleted = await messenger.BrokerFileSystem.deleteFile(this.extId, fileName);
      this.debug(`-- deleted=${deleted}`);
      return ( { "fileName": fileName, "deleted": deleted } );

    } catch (error) {
      this.caught(error, `-- Caught error while deleting file "${fileName}":`);
      return ( { "error": `Error Processing deleteFile Command: ${error.name}: ${error.message}`, "code": "500" } );
    }

    return false; // this should never happen
  }
}
